import axios from 'axios';

const resolvedApiUrl = (import.meta.env.VITE_API_URL || '').trim();

const emitApiStatus = (offline, reason = null) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('api:status', {
    detail: {
      offline,
      reason,
      at: Date.now(),
    },
  }));
};

const api = axios.create({
  baseURL: resolvedApiUrl || 'http://localhost:3001/api',
  withCredentials: true,
});

const isAuthRoute = (url = '') => (
  url.includes('/auth/login')
  || url.includes('/auth/register')
  || url.includes('/auth/refresh')
  || url.includes('/auth/logout')
);

const redirectToLogin = () => {
  if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
    window.location.href = '/login';
  }
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${name}=`));

  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
};

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  const requiresCsrf = ['post', 'put', 'patch', 'delete'].includes(method);

  if (requiresCsrf) {
    // Prefer localStorage (works cross-origin), fall back to cookie (same-origin)
    const csrfToken = localStorage.getItem('helpdesk_csrf_token') || getCookie('helpdesk_csrf_token');
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  emitApiStatus(false, null);
  return response;
}, (error) => {
  const originalRequest = error.config || {};
  const status = error.response?.status;
  const isNetworkError = !error.response;
  const isServiceUnavailable = [502, 503, 504].includes(status);

  if (isNetworkError || isServiceUnavailable) {
    emitApiStatus(true, isNetworkError ? 'NETWORK_ERROR' : `HTTP_${status}`);
  }

  if (status === 401) {
    const requestUrl = originalRequest.url || '';
    const retried = Boolean(originalRequest._retry);

    if (!retried && !isAuthRoute(requestUrl)) {
      originalRequest._retry = true;

      return api.post('/auth/refresh', {})
        .then((refreshRes) => {
          const newCsrfToken = refreshRes.data?.data?.csrfToken;
          if (newCsrfToken) {
            localStorage.setItem('helpdesk_csrf_token', newCsrfToken);
          }
          emitApiStatus(false, null);
          return api(originalRequest);
        })
        .catch((refreshError) => {
          redirectToLogin();
          return Promise.reject(refreshError);
        });
    }

    redirectToLogin();
  }

  return Promise.reject(error);
});

export default api;
