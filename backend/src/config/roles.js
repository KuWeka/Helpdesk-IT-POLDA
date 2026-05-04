/**
 * Canonical role name constants.
 *
 * All role strings in the application MUST reference these constants instead of
 * using string literals. This prevents silent typo bugs where a misspelled role
 * bypasses an authorization check, and makes global role renames a one-line change.
 *
 * Usage:
 *   const { ROLES } = require('../config/roles');
 *   if (req.user.role !== ROLES.SUBTEKINFO) return res.status(403)...
 */

const ROLES = Object.freeze({
  /** IT admin / dispatcher — full system access */
  SUBTEKINFO: 'Subtekinfo',

  /** Field technician (Padal) — handles assigned tickets */
  PADAL: 'Padal',

  /** Read-only technician — can view but not modify tickets */
  TEKNISI: 'Teknisi',

  /** End-user / requester (Satker) — can only see their own tickets */
  SATKER: 'Satker',
});

/**
 * All valid role values as an array — useful for Joi enums and DB seed validation.
 */
const ALL_ROLES = Object.values(ROLES);

/**
 * Normalize legacy/aliased role names coming from old JWTs or external sources
 * to the canonical values defined in ROLES.
 *
 * @param {string} role
 * @returns {string} canonical role
 */
const normalizeRole = (role) => {
  if (!role) return ROLES.SATKER;
  switch (role.toLowerCase()) {
    case 'admin':        return ROLES.SUBTEKINFO;
    case 'subtekinfo':   return ROLES.SUBTEKINFO;
    case 'padal':        return ROLES.PADAL;
    case 'teknisi':      return ROLES.TEKNISI;
    case 'user':         return ROLES.SATKER;
    case 'satker':       return ROLES.SATKER;
    default:             return ROLES.SATKER;
  }
};

module.exports = { ROLES, ALL_ROLES, normalizeRole };
