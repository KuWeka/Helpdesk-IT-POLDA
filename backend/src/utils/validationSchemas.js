const Joi = require('joi');

/**
 * Validation Schemas for API Endpoints
 * Using Joi for comprehensive input validation
 */

// Common validation patterns
const patterns = {
  uuid: Joi.string().uuid(),
  email: Joi.string().email().lowercase().trim(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/)
    .messages({
      'string.pattern.base': 'Password harus mengandung huruf besar, huruf kecil, angka, dan minimal 1 karakter spesial'
    }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('').optional(),
  name: Joi.string().min(2).max(100).trim(),
  description: Joi.string().max(1000).allow('').optional(),
  // Keep both legacy and current domain values for backward compatibility.
  status: Joi.string().valid(
    'Pending', 'Proses', 'Selesai', 'Dibatalkan', 'Ditolak',
    'Open', 'In Progress', 'Resolved', 'Closed'
  ),
  role: Joi.string().valid('Subtekinfo', 'Padal', 'Teknisi', 'Satker'),
  theme: Joi.string().valid('light', 'dark'),
  language: Joi.string().valid('ID', 'EN')
};

// Auth schemas
const authSchemas = {
  login: Joi.object({
    identifier: Joi.alternatives().try(
      patterns.email,
      Joi.string().min(3).max(100).trim()
    ).required(),
    password: Joi.string().min(1).max(100).required()
  }),

  register: Joi.object({
    name: patterns.name.required(),
    email: patterns.email.required(),
    password: patterns.password.required(),
    phone: patterns.phone,
    role: Joi.string().valid('Satker').default('Satker')
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required()
  })
};

// User schemas
const userSchemas = {
  create: Joi.object({
    name: patterns.name.required(),
    email: patterns.email.required(),
    username: Joi.string().min(3).max(50).trim().allow(null).optional(),
    password: patterns.password,
    phone: patterns.phone,
    role: patterns.role.required(),
    language: patterns.language.default('ID'),
    theme: patterns.theme.default('light'),
    is_active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: patterns.name,
    email: patterns.email,
    username: Joi.string().min(3).max(50).trim().allow(null),
    phone: patterns.phone,
    language: patterns.language,
    theme: patterns.theme,
    is_active: Joi.boolean()
  }).min(1),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(100).default(20),
    role: patterns.role,
    is_active: Joi.boolean(),
    search: Joi.string().min(1).max(100).trim(),
    sort: Joi.string().valid('name', 'email', 'created_at', 'role').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Schemas baru Sesi 2
const ratingSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required()
});

const assignSchema = Joi.object({
  padal_id: Joi.string().uuid().required()
});

const rejectSchema = Joi.object({
  reason: Joi.string().min(5).max(1000).trim().required()
});

// Ticket schemas
const ticketSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).trim().required(),
    description: patterns.description.required(),
    location: Joi.string().max(255).allow('').optional(),
    category: Joi.string().min(2).max(50).trim().default('Umum'),
    user_id: patterns.uuid.optional()
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).trim(),
    description: patterns.description,
    category: Joi.string().min(2).max(50).trim(),
    status: patterns.status,
    assigned_technician_id: patterns.uuid.allow(null),
    solution: Joi.string().max(2000).allow('').optional(),
    closed_at: Joi.date().allow(null)
  }).min(1),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(100).default(20),
    status: patterns.status,
    user_id: patterns.uuid,
    assigned_technician_id: patterns.uuid.allow(null),
    unassigned: Joi.boolean(),
    from: Joi.date().iso(),
    to: Joi.date().iso(),
    search: Joi.string().min(1).max(100).trim(),
    sort: Joi.string().valid('created_at', 'updated_at', 'status').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Chat schemas
const chatSchemas = {
  create: Joi.object({
    ticket_id: patterns.uuid.allow(null).optional(),
    technician_id: patterns.uuid.required(),
    title: Joi.string().min(5).max(200).trim().required(),
    description: patterns.description
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).trim(),
    description: patterns.description,
    status: Joi.string().valid('Active', 'Closed')
  }).min(1),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(100).default(20),
    user_id: patterns.uuid,
    technician_id: patterns.uuid,
    ticket_id: patterns.uuid,
    status: Joi.string().valid('Active', 'Closed'),
    search: Joi.string().min(1).max(100).trim()
  })
};

// Message schemas
const messageSchemas = {
  create: Joi.object({
    chat_id: patterns.uuid.required(),
    content: Joi.string().min(1).max(2000).trim().required(),
    message_type: Joi.string().valid('text', 'image', 'file').default('text'),
    attachment_url: Joi.string().uri().allow(null).optional()
  }),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(100).default(50),
    chat_id: patterns.uuid.required()
  })
};

// Technician schemas
const technicianSchemas = {
  update: Joi.object({
    name: patterns.name,
    email: patterns.email,
    phone: patterns.phone,
    division_id: patterns.uuid.allow(null),
    is_available: Joi.boolean(),
    skills: Joi.array().items(Joi.string().min(2).max(50)).max(20)
  }).min(1),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(100).default(20),
    is_available: Joi.boolean(),
    division_id: patterns.uuid,
    search: Joi.string().min(1).max(100).trim()
  })
};

// Upload schemas
const uploadSchemas = {
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().valid(
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).required(),
    size: Joi.number().max(5 * 1024 * 1024).required(), // 5MB
    buffer: Joi.binary().required()
  })
};

module.exports = {
  authSchemas,
  userSchemas,
  ticketSchemas,
  chatSchemas,
  messageSchemas,
  technicianSchemas,
  uploadSchemas,
  patterns,
  ratingSchema,
  assignSchema,
  rejectSchema
};