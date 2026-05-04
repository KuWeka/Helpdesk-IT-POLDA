/**
 * Role Middleware Tests
 *
 * Covers:
 * - User with correct role → next() called
 * - User with wrong role → 403
 * - Multiple allowed roles — each allowed role passes
 * - req.user missing → 403 (not authenticated or middleware ordering issue)
 */

process.env.NODE_ENV = 'test';

const role = require('../../src/middleware/role');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

function makeReqWithRole(userRole) {
  return { user: userRole ? { id: 'u1', role: userRole } : undefined };
}

// ──────────────────────────────────────────────────────────────
describe('role middleware', () => {
  test('allows user with the correct single role', () => {
    const mw   = role('Subtekinfo');
    const req  = makeReqWithRole('Subtekinfo');
    const res  = makeRes();
    const next = jest.fn();

    mw(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('blocks user with the wrong role (403)', () => {
    const mw   = role('Subtekinfo');
    const req  = makeReqWithRole('Satker');
    const res  = makeRes();
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks request when req.user is missing (403)', () => {
    const mw   = role('Subtekinfo');
    const req  = makeReqWithRole(null);
    const res  = makeRes();
    const next = jest.fn();

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  describe('multiple allowed roles', () => {
    const mw = role('Subtekinfo', 'Padal');

    test.each([
      ['Subtekinfo'],
      ['Padal'],
    ])('allows role %s', (userRole) => {
      const req  = makeReqWithRole(userRole);
      const res  = makeRes();
      const next = jest.fn();

      mw(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    test.each([
      ['Satker'],
      ['Teknisi'],
    ])('blocks role %s', (userRole) => {
      const req  = makeReqWithRole(userRole);
      const res  = makeRes();
      const next = jest.fn();

      mw(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
