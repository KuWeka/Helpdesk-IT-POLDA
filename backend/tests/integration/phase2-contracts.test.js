const request = require('supertest');
const bcrypt = require('bcryptjs');
const pool = require('../../src/config/db');
const { cache } = require('../../src/utils/cache');

let server;
let agent;
const TEST_USER_ID = 'phase2-contract-user';
const TEST_IDENTIFIER = 'phase2.contract@test.local';
const TEST_PASSWORD = 'Phase2Test123!';

const extractCookieValue = (cookies, name) => {
  const found = (cookies || []).find((cookie) => cookie.startsWith(`${name}=`));
  if (!found) return null;
  return found.split(';')[0].split('=')[1];
};

describe('Phase 2 API Contract Tests', () => {
  beforeAll(async () => {
    server = require('../../src/server');
    agent = request.agent(server);

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    await pool.query(
      `
      INSERT INTO users (id, name, email, username, password_hash, role, is_active, language, theme)
      VALUES (?, ?, ?, ?, ?, 'User', 1, 'ID', 'light')
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        username = VALUES(username),
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        is_active = VALUES(is_active)
      `,
      [
        TEST_USER_ID,
        'Phase 2 Contract User',
        TEST_IDENTIFIER,
        'phase2contractuser',
        passwordHash,
      ]
    );
  });

  test('GET /api/health/live should return alive status', async () => {
    const res = await agent.get('/api/health/live');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'alive');
  });

  test('POST /api/auth/login should return user object and csrfToken', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({
        identifier: TEST_IDENTIFIER,
        password: TEST_PASSWORD,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.user');
    expect(res.body).toHaveProperty('data.csrfToken');

    const setCookie = res.headers['set-cookie'] || [];
    expect(extractCookieValue(setCookie, process.env.ACCESS_TOKEN_COOKIE_NAME || 'helpdesk_access_token')).toBeTruthy();
    expect(extractCookieValue(setCookie, process.env.REFRESH_TOKEN_COOKIE_NAME || 'helpdesk_refresh_token')).toBeTruthy();
    expect(extractCookieValue(setCookie, process.env.CSRF_COOKIE_NAME || 'helpdesk_csrf_token')).toBeTruthy();
  });

  test('GET /api/auth/me should return current authenticated user', async () => {
    const loginRes = await agent
      .post('/api/auth/login')
      .send({
        identifier: TEST_IDENTIFIER,
        password: TEST_PASSWORD,
      });

    expect(loginRes.status).toBe(200);

    const meRes = await agent.get('/api/auth/me');

    expect(meRes.status).toBe(200);
    expect(meRes.body).toHaveProperty('success', true);
    expect(meRes.body).toHaveProperty('data.user');
    expect(meRes.body.data.user).toHaveProperty('role');
  });
  let csrfToken;
  let cookies;
  let cookieHeader;
  let ticketId;
  let chatId;

  beforeAll(async () => {
    // Login and store cookies/csrfToken
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ identifier: TEST_IDENTIFIER, password: TEST_PASSWORD });
    cookies = loginRes.headers['set-cookie'];
    csrfToken = loginRes.body.data.csrfToken;
    // Gabungkan cookies array menjadi string
    cookieHeader = Array.isArray(cookies) ? cookies.map(c => c.split(';')[0]).join('; ') : cookies;
  });

  test('TICKETS: POST /api/tickets create ticket', async () => {
    const res = await agent
      .post('/api/tickets')
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Contract Test Ticket',
        description: 'Test ticket for contract',
        location: 'Test Location',
        urgency: 'Sedang',
        category: 'General'
      });
    expect(res.status).toBe(201);
    expect(res.body.data.ticket).toHaveProperty('id');
    ticketId = res.body.data.ticket.id;
  });

  test('TICKETS: GET /api/tickets/:id fetch ticket', async () => {
    const res = await agent
      .get(`/api/tickets/${ticketId}`)
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', ticketId);
  });

  test('CHATS: POST /api/chats create chat', async () => {
    // Find a technician user
    const [techs] = await pool.query("SELECT id FROM users WHERE role = 'Teknisi' LIMIT 1");
    if (!techs.length) return;
    const technician_id = techs[0].id;
    const res = await agent
      .post('/api/chats')
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken)
      .send({ technician_id, ticket_id: ticketId });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    chatId = res.body.id;
  });

  test('CHATS: GET /api/chats/:id fetch chat', async () => {
    if (!chatId) return;
    const res = await agent
      .get(`/api/chats/${chatId}`)
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.chat).toHaveProperty('id', chatId);
  });

  test('MESSAGES: POST /api/messages send message', async () => {
    if (!chatId) return;
    const res = await agent
      .post('/api/messages')
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken)
      .send({ chat_id: chatId, message_content: 'Hello from contract test' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('chat_id', chatId);
  });

  test('MESSAGES: GET /api/messages?chat_id=... fetch messages', async () => {
    if (!chatId) return;
    const res = await agent
      .get(`/api/messages?chat_id=${chatId}`)
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('UPLOADS: POST /api/uploads/ticket/:ticketId upload file', async () => {
    if (!ticketId) return;
    const res = await agent
      .post(`/api/uploads/ticket/${ticketId}`)
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken)
      .attach('files', Buffer.from('contract test file'), 'testfile.txt');
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.uploadedFiles)).toBe(true);
  });

  test('UPLOADS: GET /api/uploads/ticket/:ticketId fetch attachments', async () => {
    if (!ticketId) return;
    const res = await agent
      .get(`/api/uploads/ticket/${ticketId}`)
      .set('Cookie', cookieHeader)
      .set('x-csrf-token', csrfToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.attachments)).toBe(true);
  });

  // Clean up created ticket (cascade deletes chat/messages/uploads)
  afterAll(async () => {
    if (ticketId && pool && typeof pool.query === 'function') {
      await pool.query('DELETE FROM tickets WHERE id = ?', [ticketId]);
    }

    if (pool && typeof pool.query === 'function') {
      await pool.query('DELETE FROM users WHERE id = ?', [TEST_USER_ID]);
    }

    if (cache && typeof cache.disconnect === 'function') {
      await cache.disconnect();
    }

    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  });
});
