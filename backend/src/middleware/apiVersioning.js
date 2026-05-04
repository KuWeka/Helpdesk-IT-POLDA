/**
 * API Versioning Middleware
 * Supports version negotiation via Accept header or URL path
 */

const apiVersioning = (req, res, next) => {
  // Default version
  let version = 'v1';

  // Check Accept header: Accept: application/vnd.api.v2+json
  const acceptHeader = req.get('Accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.api\.v(\d+)\+json/);
    if (versionMatch) {
      version = `v${versionMatch[1]}`;
    }
  }

  // Check URL path: /api/v2/endpoint
  // Note: this middleware is mounted at /api, so req.path is already relative:
  //   /api/v1/auth/login → req.path = /v1/auth/login
  const urlVersionMatch = req.path.match(/^\/v(\d+)\//);  // Fixed: was /^\/api\/v...
  if (urlVersionMatch) {
    version = `v${urlVersionMatch[1]}`;
    // Strip version segment so downstream routes see /auth/login instead of /v1/auth/login
    req.url = req.url.replace(/^\/v\d+/, '');
  }

  req.apiVersion = version;
  res.set('X-API-Version', version);

  next();
};

module.exports = apiVersioning;