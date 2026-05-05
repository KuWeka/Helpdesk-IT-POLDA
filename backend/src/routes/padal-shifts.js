const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { asyncHandler } = require('../middleware/errorHandler');
const { ApiResponse } = require('../utils/apiResponse');
const pool = require('../config/db');

async function ensurePadalMembersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS padal_members (
      id VARCHAR(36) PRIMARY KEY,
      padal_id VARCHAR(36) NOT NULL,
      teknisi_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_padal_member (teknisi_id),
      KEY idx_pm_padal (padal_id),
      KEY idx_pm_teknisi (teknisi_id)
    )
  `);
}

/**
 * GET /api/padal-shifts
 * List semua Padal beserta data shift dan status is_active.
 * Hanya Subtekinfo.
 */
router.get('/', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.is_active AS user_is_active,
      ps.id          AS shift_id,
      ps.shift_start,
      ps.shift_end,
      CASE
        WHEN ps.shift_start IS NOT NULL AND ps.shift_end IS NOT NULL
             AND CURDATE() BETWEEN ps.shift_start AND ps.shift_end
        THEN 1 ELSE 0
      END AS is_shift_active,
      ps.notes,
      ps.updated_at  AS shift_updated_at
    FROM users u
    LEFT JOIN padal_shifts ps ON ps.padal_id = u.id
    WHERE u.role = 'Padal'
    ORDER BY is_shift_active DESC, u.name ASC
  `);

  res.json(ApiResponse.success({ padal_list: rows }));
}));

/**
 * PUT /api/padal-shifts/:padal_id
 * Upsert data shift untuk Padal tertentu.
 * Body: { shift_start, shift_end, notes? }
 * Hanya Subtekinfo.
 */
router.put('/:padal_id', auth, role('Subtekinfo'), asyncHandler(async (req, res) => {
  const { padal_id } = req.params;
  const { shift_start, shift_end, notes } = req.body;

  if (!shift_start || !shift_end) {
    return res.status(400).json(ApiResponse.error('shift_start dan shift_end wajib diisi', null, 400));
  }

  if (new Date(shift_end) < new Date(shift_start)) {
    return res.status(400).json(ApiResponse.error('shift_end tidak boleh lebih awal dari shift_start', null, 400));
  }

  // Pastikan padal_id adalah Padal yang valid
  const [[user]] = await pool.query(
    `SELECT id FROM users WHERE id = ? AND role = 'Padal'`,
    [padal_id]
  );
  if (!user) {
    return res.status(404).json(ApiResponse.error('Padal tidak ditemukan', null, 404));
  }

  // Cek apakah sudah ada shift
  const [[existing]] = await pool.query(
    `SELECT id FROM padal_shifts WHERE padal_id = ?`,
    [padal_id]
  );

  if (existing) {
    await pool.query(
      `UPDATE padal_shifts SET shift_start = ?, shift_end = ?, notes = ?, updated_at = NOW() WHERE padal_id = ?`,
      [shift_start, shift_end, notes || null, padal_id]
    );
  } else {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO padal_shifts (id, padal_id, shift_start, shift_end, notes) VALUES (?, ?, ?, ?, ?)`,
      [id, padal_id, shift_start, shift_end, notes || null]
    );
  }

  // Ambil data terbaru
  const [[updated]] = await pool.query(
    `SELECT ps.*,
            CASE
              WHEN CURDATE() BETWEEN ps.shift_start AND ps.shift_end THEN 1
              ELSE 0
            END AS is_shift_active
     FROM padal_shifts ps
     WHERE ps.padal_id = ?`,
    [padal_id]
  );

  res.json(ApiResponse.success({ shift: updated }, 'Shift berhasil diperbarui'));
}));

/**
 * GET /api/padal-shifts/:padal_id/members
 * Ambil daftar anggota (Teknisi) dari Padal tertentu.
 */
router.get('/:padal_id/members', auth, role('Subtekinfo', 'Padal'), asyncHandler(async (req, res) => {
  const { padal_id } = req.params;

  if (req.user.role === 'Padal' && req.user.id !== padal_id) {
    return res.status(403).json(ApiResponse.error('Tidak memiliki izin untuk melihat anggota Padal lain', null, 403));
  }

  const [[padal]] = await pool.query(`SELECT id, name FROM users WHERE id = ? AND role IN ('Padal', 'Teknisi')`, [padal_id]);
  if (!padal) return res.status(404).json(ApiResponse.error('Padal tidak ditemukan', null, 404));

  await ensurePadalMembersTable();

  const [members] = await pool.query(`
    SELECT u.id, u.name, u.email, u.phone, u.is_active, pm.created_at AS joined_at
    FROM padal_members pm
    JOIN users u ON u.id = pm.teknisi_id
    WHERE pm.padal_id = ?
    ORDER BY u.name ASC
  `, [padal_id]);

  res.json(ApiResponse.success({ padal, members }));
}));

/**
 * POST /api/padal-shifts/:padal_id/members
 * Tambah anggota Teknisi ke Padal.
 * Body: { teknisi_id }
 */
router.post('/:padal_id/members', auth, role('Subtekinfo', 'Padal'), asyncHandler(async (req, res) => {
  const { padal_id } = req.params;
  const { teknisi_id } = req.body;

  if (req.user.role === 'Padal' && req.user.id !== padal_id) {
    return res.status(403).json(ApiResponse.error('Tidak memiliki izin untuk mengubah anggota Padal lain', null, 403));
  }

  if (!teknisi_id) return res.status(400).json(ApiResponse.error('teknisi_id wajib diisi', null, 400));

  const [[padal]] = await pool.query(`SELECT id FROM users WHERE id = ? AND role IN ('Padal', 'Teknisi')`, [padal_id]);
  if (!padal) return res.status(404).json(ApiResponse.error('Padal tidak ditemukan', null, 404));

  const [[teknisi]] = await pool.query(`SELECT id, name FROM users WHERE id = ? AND role = 'Teknisi' AND is_active = 1`, [teknisi_id]);
  if (!teknisi) return res.status(404).json(ApiResponse.error('Teknisi tidak ditemukan', null, 404));

  await ensurePadalMembersTable();

  await pool.query(
    `INSERT IGNORE INTO padal_members (id, padal_id, teknisi_id) VALUES (?, ?, ?)`,
    [uuidv4(), padal_id, teknisi_id]
  );

  res.status(201).json(ApiResponse.success(null, `${teknisi.name} berhasil ditambahkan ke Padal`));
}));

/**
 * DELETE /api/padal-shifts/:padal_id/members/:teknisi_id
 * Hapus anggota Teknisi dari Padal.
 */
router.delete('/:padal_id/members/:teknisi_id', auth, role('Subtekinfo', 'Padal'), asyncHandler(async (req, res) => {
  const { padal_id, teknisi_id } = req.params;

  if (req.user.role === 'Padal' && req.user.id !== padal_id) {
    return res.status(403).json(ApiResponse.error('Tidak memiliki izin untuk mengubah anggota Padal lain', null, 403));
  }

  await ensurePadalMembersTable();

  await pool.query(`DELETE FROM padal_members WHERE padal_id = ? AND teknisi_id = ?`, [padal_id, teknisi_id]);

  res.json(ApiResponse.success(null, 'Anggota berhasil dihapus dari Padal'));
}));

module.exports = router;

