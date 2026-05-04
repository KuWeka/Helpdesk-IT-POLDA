const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { ApiResponse } = require('../utils/apiResponse');
const pool = require('../config/db');

// Rate limiter: max 20 report exports per user per hour (heavy DB + file generation)
const reportExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || rateLimit.ipKeyGenerator(req.ip),
  message: 'Terlalu banyak permintaan export laporan. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Helper ──────────────────────────────────────────────────────────────────

function validateMonthYear(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  // Restrict to reasonable range: 2020 through current year + 1 (to allow advance planning)
  if (!m || !y || m < 1 || m > 12 || y < 2020 || y > currentYear + 1) return null;
  return { month: m, year: y };
}

function padStart2(n) {
  return String(n).padStart(2, '0');
}

// ─── Query helpers per role ───────────────────────────────────────────────────

async function reportSatker(userId, month, year) {
  const prefix = `${year}-${padStart2(month)}`;

  const [summary] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Selesai') AS selesai,
      SUM(status = 'Proses') AS proses,
      SUM(status = 'Pending') AS pending,
      SUM(status = 'Ditolak') AS ditolak,
      SUM(status = 'Dibatalkan') AS dibatalkan
    FROM tickets
    WHERE user_id = ? AND deleted_at IS NULL AND DATE_FORMAT(created_at, '%Y-%m') = ?
  `, [userId, prefix]);

  const [tickets] = await pool.query(`
    SELECT t.ticket_number, t.title, t.status,
           DATE_FORMAT(t.created_at, '%d/%m/%Y') AS tanggal_buat,
           DATE_FORMAT(t.updated_at, '%d/%m/%Y') AS tanggal_update,
           u.name AS nama_padal,
           tr.rating
    FROM tickets t
    LEFT JOIN users u ON u.id = t.padal_id
    LEFT JOIN ticket_ratings tr ON tr.ticket_id = t.id
    WHERE t.user_id = ? AND t.deleted_at IS NULL AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
    ORDER BY t.created_at DESC
  `, [userId, prefix]);

  return { summary: summary[0], tickets };
}

async function reportPadal(userId, month, year) {
  const prefix = `${year}-${padStart2(month)}`;

  const [summary] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Selesai') AS selesai,
      SUM(status = 'Proses') AS proses,
      ROUND(AVG(tr.rating), 2) AS rata_rating
    FROM tickets t
    LEFT JOIN ticket_ratings tr ON tr.ticket_id = t.id
    WHERE t.padal_id = ? AND t.deleted_at IS NULL AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
  `, [userId, prefix]);

  const [tickets] = await pool.query(`
    SELECT t.ticket_number, t.title, t.status,
           DATE_FORMAT(t.created_at, '%d/%m/%Y') AS tanggal_buat,
           DATE_FORMAT(t.updated_at, '%d/%m/%Y') AS tanggal_update,
           u.name AS nama_satker,
           tr.rating
    FROM tickets t
    LEFT JOIN users u ON u.id = t.user_id
    LEFT JOIN ticket_ratings tr ON tr.ticket_id = t.id
    WHERE t.padal_id = ? AND t.deleted_at IS NULL AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
    ORDER BY t.created_at DESC
  `, [userId, prefix]);

  return { summary: summary[0], tickets };
}

async function reportSubtekinfo(month, year) {
  const prefix = `${year}-${padStart2(month)}`;

  const [summary] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Selesai') AS selesai,
      SUM(status = 'Ditolak') AS ditolak,
      SUM(status = 'Dibatalkan') AS dibatalkan,
      SUM(status IN ('Pending','Proses')) AS aktif,
      ROUND(AVG(TIMESTAMPDIFF(MINUTE, t.created_at,
        CASE WHEN t.status = 'Selesai' THEN t.updated_at END)), 0) AS avg_menit_selesai
    FROM tickets t
    WHERE t.deleted_at IS NULL AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
  `, [prefix]);

  const [perPadal] = await pool.query(`
    SELECT u.name AS nama_padal,
           COUNT(t.id) AS total_tiket,
           SUM(t.status = 'Selesai') AS selesai,
           ROUND(AVG(tr.rating), 2) AS rata_rating
    FROM tickets t
    JOIN users u ON u.id = t.padal_id
    LEFT JOIN ticket_ratings tr ON tr.ticket_id = t.id
    WHERE t.padal_id IS NOT NULL AND t.deleted_at IS NULL AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
    GROUP BY t.padal_id, u.name
    ORDER BY selesai DESC
  `, [prefix]);

  const [ditolak] = await pool.query(`
    SELECT t.ticket_number, t.title, t.rejection_reason,
           u.name AS nama_satker,
           DATE_FORMAT(t.updated_at, '%d/%m/%Y') AS tanggal_tolak
    FROM tickets t
    JOIN users u ON u.id = t.user_id
    WHERE t.status = 'Ditolak' AND t.deleted_at IS NULL AND DATE_FORMAT(t.updated_at, '%Y-%m') = ?
    ORDER BY t.updated_at DESC
  `, [prefix]);

  const [rankingSatker] = await pool.query(`
    SELECT u.name AS nama_satker, COUNT(t.id) AS total_tiket
    FROM tickets t
    JOIN users u ON u.id = t.user_id
    WHERE t.deleted_at IS NULL AND DATE_FORMAT(t.created_at, '%Y-%m') = ?
    GROUP BY t.user_id, u.name
    ORDER BY total_tiket DESC
    LIMIT 10
  `, [prefix]);

  return { summary: summary[0], perPadal, ditolak, rankingSatker };
}

// ─── GET /api/reports/monthly ─────────────────────────────────────────────────

router.get('/monthly', auth, asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const period = validateMonthYear(month, year);
  if (!period) {
    return res.status(400).json(ApiResponse.error('Parameter month dan year tidak valid', null, 400));
  }

  const role = req.user.role;
  let data;

  if (role === 'Satker' || role === 'Teknisi') {
    data = await reportSatker(req.user.id, period.month, period.year);
  } else if (role === 'Padal') {
    data = await reportPadal(req.user.id, period.month, period.year);
  } else if (role === 'Subtekinfo') {
    data = await reportSubtekinfo(period.month, period.year);
  } else {
    return res.status(403).json(ApiResponse.error('Tidak memiliki akses laporan', null, 403));
  }

  res.json(ApiResponse.success({ role, month: period.month, year: period.year, ...data }));
}));

// ─── GET /api/reports/monthly/export ─────────────────────────────────────────

router.get('/monthly/export', auth, reportExportLimiter, asyncHandler(async (req, res) => {
  const { month, year, format } = req.query;
  const period = validateMonthYear(month, year);
  if (!period) {
    return res.status(400).json(ApiResponse.error('Parameter month dan year tidak valid', null, 400));
  }
  if (!['xlsx', 'pdf'].includes(format)) {
    return res.status(400).json(ApiResponse.error('Format harus xlsx atau pdf', null, 400));
  }

  const userRole = req.user.role;
  let reportData;
  let reportTitle;
  const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const periodLabel = `${BULAN[period.month]} ${period.year}`;

  if (userRole === 'Satker' || userRole === 'Teknisi') {
    reportData = await reportSatker(req.user.id, period.month, period.year);
    reportTitle = `Laporan Tiket Satker — ${periodLabel}`;
  } else if (userRole === 'Padal') {
    reportData = await reportPadal(req.user.id, period.month, period.year);
    reportTitle = `Laporan Kinerja Padal — ${periodLabel}`;
  } else if (userRole === 'Subtekinfo') {
    reportData = await reportSubtekinfo(period.month, period.year);
    reportTitle = `Laporan Bulanan Sistem — ${periodLabel}`;
  } else {
    return res.status(403).json(ApiResponse.error('Tidak memiliki akses ekspor', null, 403));
  }

  const filename = `laporan_${period.year}_${padStart2(period.month)}_${userRole.toLowerCase()}`;

  // ── Excel ──
  if (format === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'ProjectPolda Helpdesk';
    wb.created = new Date();

    const ws = wb.addWorksheet('Laporan');

    // Judul
    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = reportTitle;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
    ws.addRow([]);

    // Ringkasan
    const s = reportData.summary;
    if (userRole === 'Satker' || userRole === 'Teknisi') {
      ws.addRow(['Ringkasan', '', '', '', '', '', '']);
      ws.addRow(['Total Tiket', s.total, '', 'Selesai', s.selesai, '', '']);
      ws.addRow(['Proses', s.proses, '', 'Ditolak', s.ditolak, '', '']);
      ws.addRow(['Pending', s.pending, '', 'Dibatalkan', s.dibatalkan, '', '']);
    } else if (userRole === 'Padal') {
      ws.addRow(['Ringkasan', '', '', '', '', '', '']);
      ws.addRow(['Total Tiket', s.total, '', 'Selesai', s.selesai, '', '']);
      ws.addRow(['Sedang Proses', s.proses, '', 'Rata-rata Rating', s.rata_rating || '-', '', '']);
    } else {
      ws.addRow(['Ringkasan', '', '', '', '', '', '']);
      ws.addRow(['Total Tiket Masuk', s.total, '', 'Selesai', s.selesai, '', '']);
      ws.addRow(['Ditolak', s.ditolak, '', 'Dibatalkan', s.dibatalkan, '', '']);
      ws.addRow(['Masih Aktif', s.aktif, '', 'Rata-rata Penyelesaian', s.avg_menit_selesai ? `${s.avg_menit_selesai} menit` : '-', '', '']);
    }

    ws.addRow([]);

    // Tabel tiket utama
    if (reportData.tickets) {
      const headers = userRole === 'Subtekinfo'
        ? [] // subtekinfo tidak punya array tickets di level ini
        : ['No. Tiket', 'Judul', 'Status', 'Tanggal Buat', 'Tanggal Update',
            userRole === 'Padal' ? 'Satker' : 'Padal', 'Rating'];
      if (headers.length) {
        const headerRow = ws.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
        reportData.tickets.forEach((t) => {
          ws.addRow([
            t.ticket_number, t.title, t.status,
            t.tanggal_buat, t.tanggal_update,
            userRole === 'Padal' ? t.nama_satker : t.nama_padal,
            t.rating || '-',
          ]);
        });
      }
    }

    // Subtekinfo: per Padal + ranking
    if (userRole === 'Subtekinfo') {
      ws.addRow([]);
      const pHeaderRow = ws.addRow(['Nama Padal', 'Total Tiket', 'Selesai', 'Rata-rata Rating']);
      pHeaderRow.font = { bold: true };
      pHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
      reportData.perPadal.forEach((p) => ws.addRow([p.nama_padal, p.total_tiket, p.selesai, p.rata_rating || '-']));

      ws.addRow([]);
      const dHeaderRow = ws.addRow(['Tiket Ditolak', '', '', '']);
      dHeaderRow.font = { bold: true };
      ws.addRow(['No. Tiket', 'Judul', 'Alasan', 'Tanggal Tolak']);
      reportData.ditolak.forEach((d) => ws.addRow([d.ticket_number, d.title, d.rejection_reason, d.tanggal_tolak]));

      ws.addRow([]);
      const rHeaderRow = ws.addRow(['Ranking Satker', '', '']);
      rHeaderRow.font = { bold: true };
      ws.addRow(['Satker', 'Total Tiket']);
      reportData.rankingSatker.forEach((r) => ws.addRow([r.nama_satker, r.total_tiket]));
    }

    ws.columns.forEach((col) => { col.width = 20; });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await wb.xlsx.write(res);
    return res.end();
  }

  // ── PDF ──
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // Header
  doc.fontSize(16).font('Helvetica-Bold').text(reportTitle, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, { align: 'center' });
  doc.moveDown(1);

  // Ringkasan
  doc.fontSize(12).font('Helvetica-Bold').text('Ringkasan');
  doc.moveDown(0.3);
  const s = reportData.summary;
  const summaryLines = userRole === 'Satker' || userRole === 'Teknisi'
    ? [`Total: ${s.total}`, `Selesai: ${s.selesai}`, `Proses: ${s.proses}`, `Pending: ${s.pending}`, `Ditolak: ${s.ditolak}`, `Dibatalkan: ${s.dibatalkan}`]
    : userRole === 'Padal'
      ? [`Total: ${s.total}`, `Selesai: ${s.selesai}`, `Sedang Proses: ${s.proses}`, `Rata-rata Rating: ${s.rata_rating || '-'}`]
      : [`Total Masuk: ${s.total}`, `Selesai: ${s.selesai}`, `Ditolak: ${s.ditolak}`, `Dibatalkan: ${s.dibatalkan}`, `Masih Aktif: ${s.aktif}`, `Rata-rata Penyelesaian: ${s.avg_menit_selesai ? s.avg_menit_selesai + ' menit' : '-'}`];
  doc.fontSize(10).font('Helvetica');
  summaryLines.forEach((line) => doc.text(`• ${line}`));
  doc.moveDown(1);

  // Tabel tiket
  if (reportData.tickets && reportData.tickets.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('Daftar Tiket');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    reportData.tickets.forEach((t, i) => {
      const assignee = userRole === 'Padal' ? t.nama_satker : (t.nama_padal || '-');
      doc.text(`${i + 1}. [${t.ticket_number}] ${t.title} — ${t.status} — ${t.tanggal_buat} — ${assignee}${t.rating ? ` — Rating: ${t.rating}` : ''}`);
    });
    doc.moveDown(1);
  }

  // Subtekinfo extra
  if (userRole === 'Subtekinfo') {
    if (reportData.perPadal.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Performa Padal');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      reportData.perPadal.forEach((p) => {
        doc.text(`• ${p.nama_padal}: ${p.total_tiket} tiket, ${p.selesai} selesai, rating ${p.rata_rating || '-'}`);
      });
      doc.moveDown(1);
    }

    if (reportData.ditolak.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Tiket Ditolak');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      reportData.ditolak.forEach((d) => {
        doc.text(`• [${d.ticket_number}] ${d.title} — ${d.tanggal_tolak}`);
        if (d.rejection_reason) doc.text(`  Alasan: ${d.rejection_reason}`, { indent: 10 });
      });
      doc.moveDown(1);
    }

    if (reportData.rankingSatker.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Ranking Satker');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      reportData.rankingSatker.forEach((r, i) => {
        doc.text(`${i + 1}. ${r.nama_satker}: ${r.total_tiket} tiket`);
      });
    }
  }

  doc.end();
}));

module.exports = router;
