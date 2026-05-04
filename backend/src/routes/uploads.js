const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const {
  validateFileType,
  validateFileSize,
  validateFileMagicBytes
} = require('../utils/validators');

// Rate limiter: max 30 file uploads per user per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || rateLimit.ipKeyGenerator(req.ip),
  message: 'Terlalu banyak upload file. Silakan coba lagi dalam 1 jam.',
  standardHeaders: true,
  legacyHeaders: false,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * File filter for multer - validates file type and size
 */
const fileFilter = (req, file, cb) => {
  // Validate MIME type
  const validation = validateFileType(file.mimetype, file.originalname);
  if (!validation.isValid) {
    return cb(new Error(validation.error));
  }
  
  cb(null, true);
};

/**
 * Multer configuration with security improvements
 * - File size limit: 5MB (configurable via env)
 * - Max files: 5 per request
 * - File type whitelist enforced
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880), // 5MB default
    files: 5 // Maximum 5 files per request
  }
});

/**
 * POST /api/uploads/ticket/:ticketId
 * Upload files untuk ticket attachment
 * Params: ticketId
 * Files: form-data dengan key 'files' (max 5 files)
 */
router.post('/ticket/:ticketId', auth, uploadLimiter, upload.array('files', 5), asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const files = req.files;
  
  // Check if ticket exists AND verify requester is authorized
  const [[ticket]] = await pool.query('SELECT id, user_id, padal_id FROM tickets WHERE id = ? AND deleted_at IS NULL', [ticketId]);
  if (!ticket) {
    if (files) files.forEach(f => fs.unlink(f.path, () => {}));
    return res.status(404).json({ success: false, message: 'Ticket tidak ditemukan' });
  }

  // Fetch real role from DB to prevent stale JWT exploitation
  const [[dbUser]] = await pool.query('SELECT role FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1', [req.user.id]);
  if (!dbUser) {
    if (files) files.forEach(f => fs.unlink(f.path, () => {}));
    return res.status(401).json({ success: false, message: 'Akses ditolak.' });
  }
  const actualRole = dbUser.role;

  // Satker hanya bisa upload ke tiket miliknya
  if (actualRole === 'Satker' && ticket.user_id !== req.user.id) {
    if (files) files.forEach(f => fs.unlink(f.path, () => {}));
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  // Padal hanya bisa upload ke tiket yang di-assign ke mereka
  if (actualRole === 'Padal' && ticket.padal_id !== req.user.id) {
    if (files) files.forEach(f => fs.unlink(f.path, () => {}));
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  // Teknisi tidak diizinkan upload attachment
  if (actualRole === 'Teknisi') {
    if (files) files.forEach(f => fs.unlink(f.path, () => {}));
    return res.status(403).json({ success: false, message: 'Teknisi tidak diizinkan upload attachment' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Tidak ada file yang di-upload' 
    });
  }

  try {
    // Validate each file: size + magic bytes (content integrity check)
    for (const file of files) {
      const sizeValidation = validateFileSize(file.size);
      if (!sizeValidation.isValid) {
        // Clean up uploaded files on validation failure
        files.forEach(f => {
          fs.unlink(f.path, (err) => {
            if (err) logger.error('Error deleting file after upload validation failure', { error: err.message, filePath: f.path });
          });
        });
        return res.status(400).json({ 
          success: false,
          message: sizeValidation.error 
        });
      }

      // Read first 12 bytes to check magic bytes (no new dependency needed)
      let headerBuffer;
      try {
        const fd = fs.openSync(file.path, 'r');
        headerBuffer = Buffer.alloc(12);
        fs.readSync(fd, headerBuffer, 0, 12, 0);
        fs.closeSync(fd);
      } catch (readErr) {
        logger.error('Error reading file header for magic bytes check', { error: readErr.message, filePath: file.path });
        files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(500).json({ success: false, message: 'Gagal memvalidasi file' });
      }

      const magicBytesValidation = validateFileMagicBytes(headerBuffer, file.mimetype);
      if (!magicBytesValidation.isValid) {
        logger.warn('File rejected: magic bytes mismatch', {
          filename: file.originalname,
          declaredMime: file.mimetype,
          reason: magicBytesValidation.error
        });
        files.forEach(f => fs.unlink(f.path, () => {}));
        return res.status(400).json({ 
          success: false,
          message: magicBytesValidation.error 
        });
      }
    }

    // Prepare bulk insert
    // Use path.basename() to strip any path separators — prevents directory traversal
    // in the stored path that is later served back to clients
    const values = files.map(file => [
      ticketId,
      path.basename(file.originalname), // strip any directory components from original name
      `/${path.basename(file.path)}`,    // only the generated filename, never the full disk path
      file.size,
      file.mimetype
    ]);

    await pool.query(
      'INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_size, mime_type) VALUES ?',
      [values]
    );

    res.status(201).json({ 
      success: true,
      message: 'File berhasil di-upload',
      uploadedFiles: files.map(f => ({
        originalName: f.originalname,
        size: f.size,
        filename: path.basename(f.path)
      }))
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (files) {
      files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) logger.error('Error deleting file after upload failure', { error: err.message, filePath: file.path });
        });
      });
    }
    throw error;
  }
}));

/**
 * GET /api/uploads/ticket/:ticketId
 * Get attachment list untuk ticket
 */
router.get('/ticket/:ticketId', auth, asyncHandler(async (req, res) => {
  const { ticketId } = req.params;

  // Verify ticket exists and requester is authorized to view it
  const [[ticket]] = await pool.query('SELECT id, user_id, padal_id FROM tickets WHERE id = ? AND deleted_at IS NULL', [ticketId]);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket tidak ditemukan' });

  const [[dbUser]] = await pool.query('SELECT role FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1', [req.user.id]);
  if (!dbUser) return res.status(401).json({ success: false, message: 'Akses ditolak.' });
  const actualRole = dbUser.role;

  if (actualRole === 'Satker' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  if (actualRole === 'Padal' && ticket.padal_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const [rows] = await pool.query('SELECT * FROM ticket_attachments WHERE ticket_id = ?', [ticketId]);
  res.json({ success: true, attachments: rows });
}));

// Error handling untuk multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ 
        success: false,
        message: 'File terlalu besar' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Maksimal 5 file dapat di-upload sekaligus' 
      });
    }
  }
  
  if (err.message && err.message.includes('Tipe file tidak diizinkan')) {
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }

  next(err);
});

module.exports = router;
