/**
 * Security validators for input validation and password strength
 */

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (optional but recommended)
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 karakter spesial (!@#$%^&*...)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  // RFC 5322-compliant basic check: local@domain.tld, rejects double-@, IP literals,
  // excessively long parts, and other malformed forms.
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
};

/**
 * Validate input length and type
 */
const validateInputLength = (input, minLength = 1, maxLength = 255) => {
  if (!input || input.length < minLength) {
    return { isValid: false, error: `Input minimal ${minLength} karakter` };
  }
  if (input.length > maxLength) {
    return { isValid: false, error: `Input maksimal ${maxLength} karakter` };
  }
  return { isValid: true };
};

/**
 * Sanitize user input (basic XSS prevention)
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validate allowed file types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'txt', 'csv'
];

const validateFileType = (mimetype, filename) => {
  // Check mimetype
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return {
      isValid: false,
      error: `Tipe file tidak diizinkan. Format yang diizinkan: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Reject double extension attacks (e.g., evil.php.jpg)
  const parts = filename.split('.');
  if (parts.length > 2) {
    return {
      isValid: false,
      error: 'Nama file tidak boleh mengandung lebih dari satu ekstensi'
    };
  }

  // Check file extension
  const extension = parts.pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Ekstensi file tidak diizinkan. Format yang diizinkan: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  return { isValid: true };
};

/**
 * Magic bytes signatures for allowed file types.
 * Checked against the actual binary content of the file, not the declared MIME type.
 * This prevents attackers from renaming malicious files with safe extensions.
 */
const MAGIC_BYTES_SIGNATURES = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  // GIF: 47 49 46 38 37 61 OR 47 49 46 38 39 61
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50 (RIFF....WEBP)
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, extraCheck: (buf) => buf.slice(8, 12).toString('ascii') === 'WEBP' },
  // PDF: 25 50 44 46 (%PDF)
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  // ZIP-based (docx, xlsx): 50 4B 03 04
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: [0x50, 0x4B, 0x03, 0x04] },
  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes: [0x50, 0x4B, 0x03, 0x04] },
  // OLE2 compound (doc, xls): D0 CF 11 E0 A1 B1 1A E1
  { mime: 'application/msword', bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] },
  { mime: 'application/vnd.ms-excel', bytes: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] },
  // Plain text and CSV have no reliable magic bytes — skip signature check for these
  { mime: 'text/plain', bytes: null },
  { mime: 'text/csv', bytes: null }
];

/**
 * Validate file content by checking magic bytes (file signature).
 * Prevents attackers from bypassing extension/MIME checks by renaming malicious files.
 * @param {Buffer} buffer - First bytes of the uploaded file
 * @param {string} declaredMime - MIME type declared by the client / multer
 * @returns {{ isValid: boolean, error?: string }}
 */
const validateFileMagicBytes = (buffer, declaredMime) => {
  const signature = MAGIC_BYTES_SIGNATURES.find(s => s.mime === declaredMime);

  // Unknown MIME type — not in our list
  if (!signature) {
    return { isValid: false, error: 'Tipe file tidak dikenali' };
  }

  // Types with no magic bytes (text, csv) — skip binary check
  if (signature.bytes === null) {
    return { isValid: true };
  }

  // Check that the file starts with the expected bytes
  for (let i = 0; i < signature.bytes.length; i++) {
    if (buffer[i] !== signature.bytes[i]) {
      return {
        isValid: false,
        error: 'Konten file tidak sesuai dengan tipe file yang dideklarasikan'
      };
    }
  }

  // Extra check for WebP (bytes 8–11 must be 'WEBP')
  if (signature.extraCheck && !signature.extraCheck(buffer)) {
    return {
      isValid: false,
      error: 'Konten file tidak sesuai dengan tipe file yang dideklarasikan'
    };
  }

  return { isValid: true };
};

/**
 * Validate file size
 * @param {number} fileSize - Size in bytes
 * @param {number} maxSizeInMB - Maximum size in MB (default 5)
 */
const validateFileSize = (fileSize, maxSizeInMB = 5) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (fileSize > maxSizeInBytes) {
    return {
      isValid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeInMB}MB`
    };
  }
  return { isValid: true };
};

module.exports = {
  validatePasswordStrength,
  validateEmail,
  validateInputLength,
  sanitizeInput,
  validateFileType,
  validateFileSize,
  validateFileMagicBytes,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
