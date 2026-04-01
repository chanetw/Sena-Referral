const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const config = require('./src/config/config');
const openapiSpec = require('./src/docs/openapi');
const { initDatabase, testDatabaseConnection, sequelize } = require('./src/config/init-database');

// Email Service
const emailService = require('./src/services/emailService');
const { templates: emailTemplates, isValidTemplate, getAvailableTemplates } = require('./src/templates/referralTemplates');

// Initialize email service with database connection
emailService.setDatabase(sequelize);

// Import models
const User = require('./src/models/User-cjs');
const Agent = require('./src/models/Agent-cjs');
const AgentType = require('./src/models/AgentType-cjs');
const AgentTypeDetail = require('./src/models/AgentTypeDetail-cjs');
const Customer = require('./src/models/Customer-cjs');
const ProductType = require('./src/models/ProductType-cjs');
const CustomerProductType = require('./src/models/CustomerProductType-cjs');
const Project = require('./src/models/Project-cjs');

// Define associations
// User - Agent (One to One)
User.hasOne(Agent, {
  foreignKey: 'userId',
  as: 'agent'
});
Agent.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Agent Type - Agent (One to Many)
AgentType.hasMany(Agent, {
  foreignKey: 'agentTypeId',
  as: 'agents'
});
Agent.belongsTo(AgentType, {
  foreignKey: 'agentTypeId',
  as: 'agentType'
});

// Agent - Customer (One to Many)
Agent.hasMany(Customer, {
  foreignKey: 'agentId',
  as: 'customers'
});
Customer.belongsTo(Agent, {
  foreignKey: 'agentId',
  as: 'agent'
});

// Project - Customer (One to Many)
Project.hasMany(Customer, {
  foreignKey: 'projectId',
  as: 'customers'
});
Customer.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

Customer.belongsToMany(ProductType, {
  through: CustomerProductType,
  foreignKey: 'customerId',
  otherKey: 'productTypeId',
  as: 'productTypes'
});
ProductType.belongsToMany(Customer, {
  through: CustomerProductType,
  foreignKey: 'productTypeId',
  otherKey: 'customerId',
  as: 'customers'
});

// Agent - AgentTypeDetail (One to One)
Agent.hasOne(AgentTypeDetail, {
  foreignKey: 'agentId',
  as: 'typeDetail'
});
AgentTypeDetail.belongsTo(Agent, {
  foreignKey: 'agentId'
});
AgentTypeDetail.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'residenceProject'
});

const getCustomerInclude = () => ([
  {
    model: Agent,
    as: 'agent',
    attributes: ['id', 'agentCode', 'firstName', 'lastName', 'email'],
    required: false
  },
  {
    model: Project,
    as: 'project',
    attributes: ['id', 'projectName', 'passEmailEnabled', 'passEmailRecipients'],
    required: false
  },
  {
    model: ProductType,
    as: 'productTypes',
    attributes: ['id', 'code', 'name', 'isActive', 'sortOrder'],
    through: { attributes: [] },
    required: false
  }
]);

const normalizeProductTypeIds = (productTypeIds) => {
  if (!Array.isArray(productTypeIds)) {
    return [];
  }

  return [...new Set(
    productTypeIds
      .map((id) => parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];
};

const validateProductTypeIds = async (productTypeIds, transaction) => {
  if (productTypeIds.length === 0) {
    return true;
  }

  const existingProductTypes = await ProductType.findAll({
    where: { id: productTypeIds },
    attributes: ['id'],
    transaction
  });

  return existingProductTypes.length === productTypeIds.length;
};

const syncCustomerProductTypes = async (customerId, productTypeIds, transaction) => {
  await CustomerProductType.destroy({
    where: { customerId },
    transaction
  });

  if (productTypeIds.length === 0) {
    return;
  }

  await CustomerProductType.bulkCreate(
    productTypeIds.map((productTypeId) => ({
      customerId,
      productTypeId
    })),
    { transaction }
  );
};

const NOTIFICATION_ACTION_TYPES = [
  'customer_created',
  'agent_registered',
  'customer_approved',
  'customer_rejected'
];
const NOTIFICATION_ACTION_SET = new Set(NOTIFICATION_ACTION_TYPES);
const NOTIFICATION_SUBJECTS = {
  customer_created: 'แจ้งเตือน: มีลูกค้าใหม่ในระบบ',
  agent_registered: 'แจ้งเตือน: มีเอเจนต์ลงทะเบียนใหม่',
  customer_approved: 'แจ้งเตือน: ลูกค้าผ่านการพิจารณา',
  customer_rejected: 'แจ้งเตือน: ลูกค้าไม่ผ่านการพิจารณา'
};

const normalizeRecipientEmails = (recipientEmails) => {
  let values = [];

  if (Array.isArray(recipientEmails)) {
    values = recipientEmails;
  } else if (typeof recipientEmails === 'string') {
    const trimmed = recipientEmails.trim();
    if (!trimmed) {
      values = [];
    } else {
      try {
        const parsed = JSON.parse(trimmed);
        values = Array.isArray(parsed) ? parsed : [trimmed];
      } catch (_) {
        values = trimmed.split(',');
      }
    }
  }

  return [...new Set(
    values
      .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
      .filter((value) => value && isValidEmail(value))
  )];
};

  const normalizeProjectPassEmailRecipients = (recipientEmails) => {
    return normalizeRecipientEmails(recipientEmails);
  };

  const buildProjectPassEmailSettings = ({ passEmailEnabled, passEmailRecipients }) => {
    const recipients = normalizeProjectPassEmailRecipients(passEmailRecipients);
    const enabled = Boolean(passEmailEnabled);

    return {
      passEmailEnabled: enabled,
      passEmailRecipients: recipients.join(',') || null,
      recipientList: recipients
    };
  };

  const getProjectPassRecipientList = (project) => {
    if (!project || !project.passEmailEnabled) {
      return [];
    }

    return normalizeProjectPassEmailRecipients(project.passEmailRecipients);
  };

  const buildApprovedRecipientList = ({ agentEmail, project }) => {
    return normalizeRecipientEmails([
      agentEmail,
      ...getProjectPassRecipientList(project)
    ]);
  };
// ─── Agent Referral Code helpers ────────────────────────────────────────────
const REF_CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O,I,L,0,1
const REF_CODE_LENGTH = 6;

const generateRefCode = () => {
  let code = '';
  for (let i = 0; i < REF_CODE_LENGTH; i++) {
    code += REF_CODE_CHARSET[Math.floor(Math.random() * REF_CODE_CHARSET.length)];
  }
  return code;
};

const generateUniqueRefCode = async (AgentModel) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRefCode();
    const existing = await AgentModel.findOne({ where: { refCode: code } });
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique referral code after 10 attempts');
};
// ─────────────────────────────────────────────────────────────────────────────

const formatNotificationRule = (ruleRow) => ({
  id: ruleRow.id,
  actionType: ruleRow.actionType,
  recipientEmails: normalizeRecipientEmails(ruleRow.recipientEmails),
  isActive: Boolean(ruleRow.isActive),
  createdBy: ruleRow.createdBy,
  updatedBy: ruleRow.updatedBy,
  createdAt: ruleRow.createdAt,
  updatedAt: ruleRow.updatedAt
});

const getNotificationRuleById = async (id) => {
  const [rows] = await sequelize.query(
    `SELECT
      id,
      action_type AS actionType,
      recipient_emails AS recipientEmails,
      is_active AS isActive,
      created_by AS createdBy,
      updated_by AS updatedBy,
      created_at AS createdAt,
      updated_at AS updatedAt
     FROM notification_rules
     WHERE id = ?
     LIMIT 1`,
    { replacements: [id] }
  );

  return rows[0] || null;
};

const getNotificationRecipientsByAction = async (actionType) => {
  if (!NOTIFICATION_ACTION_SET.has(actionType)) {
    return [];
  }

  const [rows] = await sequelize.query(
    `SELECT recipient_emails AS recipientEmails
     FROM notification_rules
     WHERE action_type = ? AND is_active = 1`,
    { replacements: [actionType] }
  );

  return [...new Set(rows.flatMap((row) => normalizeRecipientEmails(row.recipientEmails)))];
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderNotificationEmailHtml = (actionType, payload = {}) => {
  const adminUrl = process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000/admin/dashboard';
  const generatedAt = payload.generatedAt || new Date().toLocaleString('th-TH', { hour12: false });
  const customerStatus = actionType === 'customer_approved'
    ? 'ผ่าน'
    : actionType === 'customer_rejected'
      ? 'ไม่ผ่าน'
      : payload.status || '-';

  const rows = actionType === 'customer_created' || actionType === 'customer_approved' || actionType === 'customer_rejected'
    ? [
      ['ประเภทเหตุการณ์', actionType === 'customer_created' ? 'ลูกค้าใหม่' : 'ผลการพิจารณาลูกค้า'],
      ['รหัสลูกค้า', payload.customerCode || '-'],
      ['ชื่อลูกค้า', payload.customerName || '-'],
      ['เอเจนต์', payload.agentName || '-'],
      ['โครงการ', payload.projectName || '-'],
      ['สถานะ', customerStatus],
      ['วันที่เวลา', generatedAt]
    ]
    : [
      ['ประเภทเหตุการณ์', 'เอเจนต์ลงทะเบียนใหม่'],
      ['รหัสเอเจนต์', payload.agentCode || '-'],
      ['ชื่อเอเจนต์', payload.agentName || '-'],
      ['อีเมล', payload.email || '-'],
      ['สถานะบัญชี', payload.status || '-'],
      ['วันที่เวลา', generatedAt]
    ];

  const detailRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;font-weight:600;width:160px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#111827;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`).join('');

  return `
    <div style="background:#f7f7f7;padding:20px;font-family:Inter,Tahoma,Sana Serif,sans-serif;color:#333;line-height:1.6;">
      <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.06);">
        <div style="background:#32bcad;background-image:linear-gradient(to right,#fff,#32bcad);padding:24px;">
          <h1 style="margin:0;color:#1f2937;font-size:24px;">SENA HAPPY REFER</h1>
          <p style="margin:4px 0 0;color:#1f2937;font-size:14px;">แจ้งเตือนจากระบบ</p>
        </div>
        <div style="padding:24px 32px;">
          <p style="margin-top:0;"><strong>เรียน ทีมผู้ดูแลระบบ</strong></p>
          <p style="margin-bottom:20px;">ระบบมีรายการใหม่ กรุณาตรวจสอบรายละเอียดด้านล่าง</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${detailRows}</table>
          <a href="${escapeHtml(adminUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#32bcad;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:10px 18px;border-radius:8px;">เปิดหน้าจัดการรายการ</a>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 10px 0;">ขอแสดงความนับถือ</p>
            <p style="margin:0;">บริษัท เสนาดีเวลลอปเม้นท์ จำกัด (มหาชน)</p>
          </div>
        </div>
      </div>
    </div>
  `;
};

const sendActionNotification = async (actionType, payload = {}) => {
  const recipients = await getNotificationRecipientsByAction(actionType);
  return sendNotificationToRecipients(actionType, recipients, payload);
};

const sendNotificationToRecipients = async (actionType, recipients = [], payload = {}) => {
  if (!NOTIFICATION_ACTION_SET.has(actionType)) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const normalizedRecipients = normalizeRecipientEmails(recipients);
  if (!normalizedRecipients.length) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const subject = NOTIFICATION_SUBJECTS[actionType] || 'แจ้งเตือนจากระบบ SENA HAPPY REFER';
  const html = renderNotificationEmailHtml(actionType, payload);

  const results = await Promise.allSettled(
    normalizedRecipients.map((to) => emailService.sendEmail({
      to,
      subject,
      html,
      templateName: `notification_${actionType}`,
      data: payload
    }))
  );

  const failed = results.filter((result) => result.status === 'rejected').length;
  if (failed > 0) {
    console.error(`[Notification] ${actionType} failed to send ${failed}/${results.length} email(s)`);
  }

  return {
    attempted: normalizedRecipients.length,
    sent: normalizedRecipients.length - failed,
    failed
  };
};

  const sendReferralResultToRecipients = async ({ recipients, agentName, customerName, status, reason, isSelfReferral }) => {
    const normalizedRecipients = normalizeRecipientEmails(recipients);
    if (!normalizedRecipients.length) {
      return {
        attempted: 0,
        sent: 0,
        failed: 0,
        results: []
      };
    }

    const settled = await Promise.allSettled(
      normalizedRecipients.map((to) => emailService.sendReferralResult({
        to,
        agentName,
        customerName,
        status,
        reason,
        isSelfReferral
      }))
    );

    const results = settled.map((entry, index) => (
      entry.status === 'fulfilled'
        ? { to: normalizedRecipients[index], success: true, data: entry.value }
        : { to: normalizedRecipients[index], success: false, error: entry.reason?.message || 'ส่งอีเมลไม่สำเร็จ' }
    ));

    const sent = results.filter((result) => result.success).length;

    return {
      attempted: normalizedRecipients.length,
      sent,
      failed: normalizedRecipients.length - sent,
      results
    };
  };
const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors(config.cors));

// Rate limiting (disabled for development)
if (config.server.nodeEnv === 'production') {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      message: 'มีการร้องขอมากเกินไป กรุณาลองใหม่ในภายหลัง'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb', charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set charset middleware
app.use((req, res, next) => {
  const isSwaggerDocsRequest = req.path === '/api/docs' || req.path === '/api/docs/' || req.path.startsWith('/api/docs/');

  if (req.path.startsWith('/api') && !isSwaggerDocsRequest) {
    res.set('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// Compression
app.use(compression());

// Logging
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/openapi.json', (req, res) => {
  res.json(openapiSpec);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'SENA Agent API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv
  });
});

// Basic API routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Agent Referral System API - MySQL Edition',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/api/docs/',
      openapi: '/api/openapi.json',
      auth: '/api/auth/*',
      agentTypes: '/api/agent-types',
      agents: '/api/agents/*',
      customers: '/api/customers/*',
      projects: '/api/projects/*',
      emails: '/api/emails/*'
    }
  });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    if (isConnected) {
      res.json({
        success: true,
        message: 'Database connection successful'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database connection failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// JWT helper functions
const _jwtSecret = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[SECURITY] JWT_SECRET is not set in environment variables. Server will not start.');
    process.exit(1);
  }
  return secret;
})();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    _jwtSecret,
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, _jwtSecret);
};

const activationLimiter = rateLimit({
  windowMs: config.activation.rateLimitWindowMs,
  max: config.activation.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'มีการพยายามเปิดใช้งานมากเกินไป กรุณาลองใหม่ภายหลัง'
  }
});

// Rate limiter สำหรับ /api/auth/register (server-to-server)
const registerApiLimiter = rateLimit({
  windowMs: config.registerApiKey.rateLimit.windowMs,
  max: config.registerApiKey.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'มีการเรียกใช้ API มากเกินไป กรุณาลองใหม่ภายหลัง'
  }
});

// Middleware ตรวจสอบ API Key สำหรับ server-to-server endpoint
// ใช้ timingSafeEqual เพื่อป้องกัน timing attack
const checkRegisterApiKey = (req, res, next) => {
  const configuredKey = config.registerApiKey.key;

  // ถ้าไม่ได้ตั้งค่า API key ใน environment → ปิด endpoint ทันที
  if (!configuredKey) {
    return res.status(503).json({
      success: false,
      message: 'Endpoint นี้ยังไม่ได้เปิดใช้งาน กรุณาตั้งค่า REGISTER_API_KEY ใน environment',
      errorType: 'service_unavailable'
    });
  }

  const providedKey = req.headers['x-api-key'] || '';

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      message: 'ต้องระบุ X-Api-Key header',
      errorType: 'missing_api_key'
    });
  }

  // ใช้ timingSafeEqual เพื่อป้องกัน timing attack
  try {
    const configuredBuf = Buffer.from(configuredKey);
    const providedBuf = Buffer.from(providedKey);

    if (
      configuredBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(configuredBuf, providedBuf)
    ) {
      return res.status(401).json({
        success: false,
        message: 'API Key ไม่ถูกต้อง',
        errorType: 'invalid_api_key'
      });
    }
  } catch {
    return res.status(401).json({
      success: false,
      message: 'API Key ไม่ถูกต้อง',
      errorType: 'invalid_api_key'
    });
  }

  next();
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const AGENT_TYPE_CODE_ALIASES = {
  resident: 'resident',
  livnex: 'livnex_customer',
  livnex_customer: 'livnex_customer',
  rentnex: 'rentnex_customer',
  rentnex_customer: 'rentnex_customer',
  sena_staff: 'sena_staff',
  sena_employee: 'sena_staff',
  partner: 'partner',
  general: 'general',
  legacy_unknown: 'legacy_unknown',
  unknown: 'legacy_unknown'
};

const isValidThaiPhone = (phone) => /^0\d{8,9}$/.test(phone);
const isValidIdCard = (idCard) => /^\d{13}$/.test(idCard);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const resolveAgentTypeCode = (value) => {
  const normalized = normalizeText(value).toLowerCase().replace(/\s+/g, '_');
  return AGENT_TYPE_CODE_ALIASES[normalized] || normalized;
};

const formatAgentType = (agentType) => {
  if (!agentType) {
    return null;
  }

  return {
    id: agentType.id,
    code: agentType.code,
    shortCode: agentType.shortCode,
    nameTh: agentType.nameTh
  };
};

const getAgentTypeByCode = async (agentTypeCode, transaction) => {
  return AgentType.findOne({
    where: {
      code: agentTypeCode,
      isActive: true
    },
    transaction
  });
};

const getDefaultAgentType = async (transaction) => {
  return getAgentTypeByCode('general', transaction);
};

const buildActivationFingerprint = (payload) => {
  const fingerprintSource = [
    normalizeText(payload.email).toLowerCase(),
    normalizeText(payload.idCard),
    normalizeText(payload.firstName),
    normalizeText(payload.lastName),
    normalizeText(payload.phone),
    resolveAgentTypeCode(payload.agentTypeCode),
    normalizeText(payload.refCode)
  ].join('|');

  return crypto.createHash('sha256').update(fingerprintSource).digest('hex');
};

const assertActivationPayloadMatchesClaims = (payload, claims) => {
  const fieldsToCompare = ['email', 'idCard', 'firstName', 'lastName', 'phone', 'refCode'];

  for (const field of fieldsToCompare) {
    const payloadValue = normalizeText(payload[field]);
    const claimValue = normalizeText(claims[field]);

    if (claimValue && payloadValue !== claimValue) {
      return field;
    }
  }

  const payloadAgentTypeCode = resolveAgentTypeCode(payload.agentTypeCode);
  const claimAgentTypeCode = resolveAgentTypeCode(claims.agentTypeCode || claims.userType);
  if (claimAgentTypeCode && payloadAgentTypeCode !== claimAgentTypeCode) {
    return 'agentTypeCode';
  }

  if (typeof claims.consent === 'boolean' && payload.consent !== claims.consent) {
    return 'consent';
  }

  return null;
};

const validateActivationRequest = (payload) => {
  const requiredFields = ['firstName', 'lastName', 'email', 'idCard', 'activationToken', 'agentTypeCode'];

  for (const field of requiredFields) {
    if (!normalizeText(payload[field])) {
      return { message: 'กรุณากรอกข้อมูลให้ครบถ้วน', errorType: field };
    }
  }

  if (!payload.consent) {
    return { message: 'กรุณายอมรับเงื่อนไขก่อนเปิดใช้งานบัญชี', errorType: 'consent' };
  }

  if (!isValidEmail(normalizeText(payload.email).toLowerCase())) {
    return { message: 'รูปแบบอีเมลไม่ถูกต้อง', errorType: 'email' };
  }

  if (!isValidIdCard(normalizeText(payload.idCard))) {
    return { message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก', errorType: 'idCard' };
  }

  if (normalizeText(payload.phone) && !isValidThaiPhone(normalizeText(payload.phone))) {
    return { message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง', errorType: 'phone' };
  }

  if (!AGENT_TYPE_CODE_ALIASES[resolveAgentTypeCode(payload.agentTypeCode)]) {
    return { message: 'ประเภทเอเจนต์ไม่ถูกต้อง', errorType: 'agentTypeCode' };
  }

  return null;
};

const getNextAgentCode = async (agentTypeId, transaction) => {
  // 1. Get short_code from agent_types
  const agentType = await AgentType.findByPk(agentTypeId, {
    attributes: ['shortCode'],
    transaction
  });
  const shortCode = agentType?.shortCode || 'GN';

  // 2. Build prefix: {TYPE}{YY} e.g. "ST26"
  const yearStr = String(new Date().getFullYear()).slice(-2); // ค.ศ. 2 หลัก
  const prefix = `${shortCode}${yearStr}`;

  // 3. Find last agent_code matching this prefix
  const { Op } = require('sequelize');
  const lastAgent = await Agent.findOne({
    where: { agentCode: { [Op.like]: `${prefix}%` } },
    order: [['agentCode', 'DESC']],
    attributes: ['agentCode'],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  // 4. Parse & increment: ST26A001 → alpha='A', num=1
  let alpha = 'A';
  let num = 1;

  if (lastAgent && lastAgent.agentCode) {
    const suffix = lastAgent.agentCode.slice(prefix.length); // e.g. "A001"
    const lastAlpha = suffix.charAt(0);
    const lastNum = parseInt(suffix.slice(1), 10);

    if (!Number.isNaN(lastNum) && lastNum < 999) {
      alpha = lastAlpha;
      num = lastNum + 1;
    } else {
      // 999 reached → next alpha letter
      alpha = String.fromCharCode(lastAlpha.charCodeAt(0) + 1);
      num = 1;
    }
  }

  return `${prefix}${alpha}${String(num).padStart(3, '0')}`;
};

const buildExistingAgentData = (agent) => ({
  agentCode: agent?.agentCode || null,
  firstName: agent?.firstName || null,
  lastName: agent?.lastName || null,
  idCard: agent?.agentIdCard || agent?.idCard || null,
  email: agent?.email || null,
  phone: agent?.phone || null,
  status: agent?.status || null
});

const buildExistingCustomerData = (customer) => ({
  customerCode: customer?.customerCode || null,
  firstName: customer?.firstName || null,
  lastName: customer?.lastName || null,
  idCard: customer?.idCard || null,
  email: customer?.email || null,
  phone: customer?.phone || null,
  status: customer?.status || null
});

const detectCustomerDuplicateReasons = async ({ idCard, transaction }) => {
  const reasons = [];

  if (idCard) {
    // ตรวจซ้ำกับ customers table เท่านั้น โดยใช้เลขบัตรเป็นหลัก
    const existingIdCard = await Customer.findOne({
      where: { idCard },
      order: [['id', 'DESC']],
      transaction
    });

    if (existingIdCard) {
      reasons.push({
        type: 'idCard',
        message: 'เลขบัตรประชาชนซ้ำกับข้อมูลลูกค้าที่มีอยู่ในระบบ',
        existingData: buildExistingCustomerData(existingIdCard)
      });
    }
  }

  return reasons;
};

const findExistingAgentByIdCard = async (idCard, transaction) => Agent.findOne({
  where: {
    [require('sequelize').Op.or]: [
      { idCard },
      { agentIdCard: idCard }
    ]
  },
  attributes: ['id', 'agentCode', 'idCard', 'agentIdCard', 'firstName', 'lastName', 'email', 'phone', 'status'],
  transaction
});

// Auth middleware
const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ Token การเข้าถึงถูกปฏิเสธ'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือผู้ใช้ถูกระงับ'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้อง'
    });
  }
};

// ==================== AUTH ENDPOINTS ====================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาป้อนอีเมลและรหัสผ่าน'
      });
    }

    // Find user in database
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
      });
    }

    // Note: lastLogin field not in current schema

    // Generate token
    const token = generateToken(user);

    // Get additional info if user is agent
    let userData = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    if (user.role === 'agent') {
      const agent = await Agent.findOne({
        where: { userId: user.id },
        include: [{ model: AgentType, as: 'agentType', required: false }]
      });
      if (agent) {
        if (agent.status === 'inactive') {
          return res.status(403).json({
            success: false,
            message: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ กรุณารอการอนุมัติจากผู้ดูแลระบบ'
          });
        }

        userData = {
          ...userData,
          agentId: agent.id,
          agentCode: agent.agentCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          agentType: formatAgentType(agent.agentType)
        };
      }
    }

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', checkAuth, async (req, res) => {
  try {
    const user = req.user;
    let userData = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    if (user.role === 'agent') {
      const agent = await Agent.findOne({
        where: { userId: user.id },
        include: [{ model: AgentType, as: 'agentType', required: false }]
      });
      if (agent) {
        userData = {
          ...userData,
          agentId: agent.id,
          agentCode: agent.agentCode,
          refCode: agent.refCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          phone: agent.phone,
          status: agent.status,
          agentType: formatAgentType(agent.agentType)
        };
      }
    }

    res.json({
      success: true,
      message: 'ดึงข้อมูลผู้ใช้สำเร็จ',
      data: userData
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ'
  });
});

// Register agent endpoint
app.post('/api/auth/register-agent', async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      email,
      phone,
      idCard,
      agentTypeCode,
      referralCode,
      houseNumber,
      projectId,
      department,
      division,
      companyName,
      occupation,
      knowSenaFrom
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !idCard) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    if (!isValidIdCard(idCard)) {
      return res.status(400).json({
        success: false,
        message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',
        errorType: 'idCard'
      });
    }

    if (!isValidEmail(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง',
        errorType: 'email'
      });
    }

    if (phone && !isValidThaiPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)',
        errorType: 'phone'
      });
    }

    // Set password as ID card number
    const password = idCard;

    // idCard is the primary identity key: block before creating user/agent
    const existingAgent = await findExistingAgentByIdCard(idCard);
    if (existingAgent) {
      return res.status(409).json({
        success: false,
        message: 'เลขประจำตัวประชาชนนี้ถูกใช้แล้ว',
        errorType: 'idCard',
        existingData: buildExistingAgentData(existingAgent),
        nextAction: 'contact_admin'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้แล้ว',
        errorType: 'email'
      });
    }

    // Check for duplicate phone (if provided)
    if (phone) {
      const existingPhone = await Agent.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'เบอร์โทรนี้ถูกใช้แล้ว',
          errorType: 'phone'
        });
      }
    }

    const requestedAgentTypeCode = resolveAgentTypeCode(agentTypeCode || 'general');
    const agentType = await getAgentTypeByCode(requestedAgentTypeCode) || await getDefaultAgentType();

    if (!agentType) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบประเภทเอเจนต์ที่ใช้งานได้',
        errorType: 'agentTypeCode'
      });
    }

    // Generate new agent code using type-year format
    const newAgentCode = await getNextAgentCode(agentType.id);

    // Create user first
    const newUser = await User.create({
      email,
      password,
      role: 'agent'
    });

    // Create agent
    const newRefCode = await generateUniqueRefCode(Agent);
    const newAgent = await Agent.create({
      userId: newUser.id,
      agentTypeId: agentType.id,
      agentCode: newAgentCode,
      refCode: newRefCode,
      agentIdCard: idCard,
      email,
      firstName,
      lastName,
      phone: phone || '',
      idCard,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    // Create agent type detail row
    await AgentTypeDetail.create({
      agentId: newAgent.id,
      referralCode: referralCode || null,
      houseNumber: houseNumber || null,
      projectId: projectId || null,
      department: department || null,
      division: division || null,
      companyName: companyName || null,
      occupation: occupation || null,
      knowSenaFrom: knowSenaFrom || null
    });

    await sendActionNotification('agent_registered', {
      agentCode: newAgent.agentCode,
      agentName: `${newAgent.firstName} ${newAgent.lastName}`,
      email: newAgent.email,
      status: newAgent.status,
      requiresAdminReview: false,
      generatedAt: new Date().toLocaleString('th-TH', { hour12: false })
    });

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ เปิดใช้งานบัญชีแล้ว',
      data: {
        agentCode: newAgent.agentCode,
        firstName: newAgent.firstName,
        lastName: newAgent.lastName,
        email: newUser.email,
        status: newAgent.status,
        requiresAdminReview: false,
        agentType: formatAgentType(agentType)
      }
    });

  } catch (error) {
    console.error('Register agent error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน'
    });
  }
});

// ==================== GENERATE ACTIVATION TOKEN (server-to-server) ====================
// POST /api/auth/generate-activation-token — สร้าง activation JWT สำหรับส่งให้ระบบภายนอก
// ป้องกันด้วย X-Api-Key เดียวกับ /api/auth/register
app.post('/api/auth/generate-activation-token', registerApiLimiter, checkRegisterApiKey, (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone = '',
    idCard,
    agentTypeCode = 'general',
    refCode = '',
    consent = true,
    expiresIn = '10y'   // ระบบปิด: default อายุยาว 10 ปี
  } = req.body;

  // Validate required fields
  const missing = ['firstName', 'lastName', 'email', 'idCard'].filter(f => !req.body[f]);
  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `กรุณากรอกข้อมูลให้ครบ: ${missing.join(', ')}`,
      errorType: 'validation'
    });
  }

  if (!isValidEmail(normalizeText(email).toLowerCase())) {
    return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง', errorType: 'email' });
  }

  if (!isValidIdCard(normalizeText(idCard))) {
    return res.status(400).json({ success: false, message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก', errorType: 'idCard' });
  }

  const resolvedAgentTypeCode = resolveAgentTypeCode(agentTypeCode);
  if (!AGENT_TYPE_CODE_ALIASES[resolvedAgentTypeCode]) {
    return res.status(400).json({ success: false, message: 'ประเภทเอเจนต์ไม่ถูกต้อง', errorType: 'agentTypeCode' });
  }

  const payload = {
    firstName: normalizeText(firstName),
    lastName: normalizeText(lastName),
    email: normalizeText(email).toLowerCase(),
    phone: normalizeText(phone),
    idCard: normalizeText(idCard),
    agentTypeCode: resolvedAgentTypeCode,
    refCode: normalizeText(refCode),
    consent: Boolean(consent)
  };

  payload.fingerprint = buildActivationFingerprint(payload);

  const secret = config.activation.secret;
  const token = jwt.sign(payload, secret, {
    issuer: config.activation.issuer,
    audience: config.activation.audience,
    expiresIn
  });

  return res.json({
    success: true,
    message: 'สร้าง activation token สำเร็จ',
    data: {
      activationToken: token,
      expiresIn,
      payload
    }
  });
});

// ==================== UNIFIED REGISTER & ACTIVATE ENDPOINT ====================
// Register and activate agent in one call (server-to-server, requires X-Api-Key)
app.post('/api/auth/register', registerApiLimiter, checkRegisterApiKey, async (req, res) => {
  try {

    const {
      firstName,
      lastName,
      email,
      phone,
      idCard,
      agentTypeCode
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !idCard) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, เลขบัตรประชาชน)',
        errorType: 'validation'
      });
    }

    if (!isValidEmail(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง',
        errorType: 'email'
      });
    }

    if (!isValidIdCard(idCard)) {
      return res.status(400).json({
        success: false,
        message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',
        errorType: 'idCard'
      });
    }

    if (phone && !isValidThaiPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)',
        errorType: 'phone'
      });
    }

    // Set password as ID card number
    const password = idCard;

    // idCard is the primary identity key: block before creating user/agent
    const existingAgent = await findExistingAgentByIdCard(idCard);
    if (existingAgent) {
      return res.status(409).json({
        success: false,
        message: 'เลขประจำตัวประชาชนนี้ถูกใช้แล้ว',
        errorType: 'idCard',
        existingData: buildExistingAgentData(existingAgent),
        nextAction: 'contact_admin'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้แล้ว',
        errorType: 'email'
      });
    }

    // Check for duplicate phone (if provided)
    if (phone) {
      const existingPhone = await Agent.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'เบอร์โทรนี้ถูกใช้แล้ว',
          errorType: 'phone'
        });
      }
    }

    const requestedAgentTypeCode = resolveAgentTypeCode(agentTypeCode || 'general');
    const agentType = await getAgentTypeByCode(requestedAgentTypeCode) || await getDefaultAgentType();

    if (!agentType) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบประเภทเอเจนต์ที่ใช้งานได้',
        errorType: 'agentTypeCode'
      });
    }

    // Generate new agent code using type-year format
    const newAgentCode = await getNextAgentCode(agentType.id);

    // Create user with isActive = true (activated immediately)
    const newUser = await User.create({
      email: email.toLowerCase(),
      password,
      role: 'agent',
      isActive: true  // Mark as active immediately
    });

    // Create agent
    const newAgent = await Agent.create({
      userId: newUser.id,
      agentTypeId: agentType.id,
      agentCode: newAgentCode,
      agentIdCard: idCard,
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone: phone || '',
      idCard,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'active'
    });

    await sendActionNotification('agent_registered', {
      agentCode: newAgent.agentCode,
      agentName: `${newAgent.firstName} ${newAgent.lastName}`,
      email: newAgent.email,
      status: newAgent.status,
      requiresAdminReview: false,
      generatedAt: new Date().toLocaleString('th-TH', { hour12: false })
    });

    console.log('Register and activate success:', {
      agentCode: newAgent.agentCode,
      email: email.toLowerCase(),
      status: newAgent.status
    });

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนและเปิดใช้งานบัญชีสำเร็จ',
      data: {
        agentCode: newAgent.agentCode,
        firstName: newAgent.firstName,
        lastName: newAgent.lastName,
        email: newUser.email,
        userStatus: newUser.isActive ? 'active' : 'inactive',
        agentStatus: newAgent.status,
        requiresAdminReview: false,
        agentType: formatAgentType(agentType),
        loginInfo: {
          email: newUser.email,
          password: 'รหัสประชาชน 13 หลัก'
        }
      }
    });

  } catch (error) {
    console.error('Register and activate error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียนและเปิดใช้งานบัญชี'
    });
  }
});

// Activate registration endpoint for external website flow
app.post('/api/auth/activate-registration', activationLimiter, async (req, res) => {
  const requestPayload = {
    firstName: normalizeText(req.body.firstName),
    lastName: normalizeText(req.body.lastName),
    email: normalizeText(req.body.email).toLowerCase(),
    phone: normalizeText(req.body.phone),
    idCard: normalizeText(req.body.idCard),
    agentTypeCode: resolveAgentTypeCode(req.body.agentTypeCode || req.body.userType),
    refCode: normalizeText(req.body.refCode),
    activationToken: normalizeText(req.body.activationToken),
    consent: Boolean(req.body.consent)
  };

  const validationError = validateActivationRequest(requestPayload);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError.message,
      errorType: validationError.errorType
    });
  }

  let activationClaims;

  // ถ้า activationToken ตรงกับ REGISTER_API_KEY → ระบบปิด: ยอมรับโดยตรงโดยใช้ข้อมูลจาก body เป็น claims
  const configuredApiKey = config.registerApiKey.key;
  const isApiKeyToken = configuredApiKey && (() => {
    try {
      const a = Buffer.from(configuredApiKey);
      const b = Buffer.from(requestPayload.activationToken);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch { return false; }
  })();

  if (isApiKeyToken) {
    // ใช้ข้อมูลจาก request body โดยตรง (ไม่ต้องมี JWT)
    activationClaims = {
      firstName: requestPayload.firstName,
      lastName: requestPayload.lastName,
      email: requestPayload.email,
      phone: requestPayload.phone,
      idCard: requestPayload.idCard,
      agentTypeCode: requestPayload.agentTypeCode,
      refCode: requestPayload.refCode,
      consent: requestPayload.consent
    };
  } else {
    try {
      activationClaims = jwt.verify(requestPayload.activationToken, config.activation.secret, {
        issuer: config.activation.issuer,
        audience: config.activation.audience,
        maxAge: config.activation.maxAge
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'ลิงก์เปิดใช้งานไม่ถูกต้องหรือหมดอายุแล้ว',
        errorType: 'activationToken'
      });
    }
  }

  const mismatchField = assertActivationPayloadMatchesClaims(requestPayload, activationClaims);
  if (mismatchField) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลยืนยันการเปิดใช้งานไม่ตรงกัน',
      errorType: mismatchField
    });
  }

  if (activationClaims.fingerprint) {
    const calculatedFingerprint = buildActivationFingerprint(requestPayload);
    if (activationClaims.fingerprint !== calculatedFingerprint) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลยืนยันการเปิดใช้งานไม่ถูกต้อง',
        errorType: 'fingerprint'
      });
    }
  }

  try {
    const existingAgentByIdCard = await findExistingAgentByIdCard(requestPayload.idCard);
    if (existingAgentByIdCard) {
      return res.status(409).json({
        success: false,
        message: 'เลขประจำตัวประชาชนนี้ถูกใช้แล้ว',
        errorType: 'idCard',
        existingData: buildExistingAgentData(existingAgentByIdCard),
        nextAction: 'contact_admin'
      });
    }

    const existingUser = await User.findOne({ where: { email: requestPayload.email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว',
        errorType: 'email'
      });
    }

    if (requestPayload.phone) {
      const existingAgentByPhone = await Agent.findOne({ where: { phone: requestPayload.phone } });
      if (existingAgentByPhone) {
        return res.status(409).json({
          success: false,
          message: 'เบอร์โทรศัพท์นี้ถูกใช้งานในระบบแล้ว',
          errorType: 'phone'
        });
      }
    }

    const agentType = await getAgentTypeByCode(requestPayload.agentTypeCode);
    if (!agentType) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบประเภทเอเจนต์ที่ใช้งานได้',
        errorType: 'agentTypeCode'
      });
    }

    const createdAgent = await sequelize.transaction(async (transaction) => {
      const user = await User.create({
        email: requestPayload.email,
        password: requestPayload.idCard,
        role: 'agent',
        isActive: true
      }, { transaction });

      const agentCode = await getNextAgentCode(agentType.id, transaction);

      return Agent.create({
        userId: user.id,
        agentTypeId: agentType.id,
        agentCode,
        agentIdCard: requestPayload.idCard,
        email: requestPayload.email,
        idCard: requestPayload.idCard,
        firstName: requestPayload.firstName,
        lastName: requestPayload.lastName,
        phone: requestPayload.phone || '',
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active'
      }, { transaction });
    });

    await sendActionNotification('agent_registered', {
      agentCode: createdAgent.agentCode,
      agentName: `${createdAgent.firstName} ${createdAgent.lastName}`,
      email: createdAgent.email,
      status: createdAgent.status,
      requiresAdminReview: false,
      generatedAt: new Date().toLocaleString('th-TH', { hour12: false })
    });

    console.log('Activation registration success:', {
      email: requestPayload.email,
      agentCode: createdAgent.agentCode,
      agentTypeCode: agentType.code,
      source: activationClaims.iss || 'external-registration-web'
    });

    return res.status(201).json({
      success: true,
      message: 'เปิดใช้งานบัญชีสำเร็จ',
      data: {
        agentCode: createdAgent.agentCode,
        email: requestPayload.email,
        status: createdAgent.status,
        requiresAdminReview: false,
        agentType: formatAgentType(agentType)
      }
    });
  } catch (error) {
    console.error('Activate registration error:', {
      message: error.message,
      email: requestPayload.email,
      code: error.name
    });

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'ข้อมูลนี้ถูกใช้งานในระบบแล้ว',
        errorType: 'duplicate'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปิดใช้งานบัญชี'
    });
  }
});

// ==================== AGENT TYPES ENDPOINTS ====================

// GET /api/agent-types - Get active agent types for dropdowns
app.get('/api/agent-types', async (req, res) => {
  try {
    const includeAll = req.query.all === 'true';
    const whereCondition = includeAll ? {} : { isActive: true };

    const agentTypes = await AgentType.findAll({
      where: whereCondition,
      attributes: ['id', 'code', 'shortCode', 'nameTh', 'isActive', 'sortOrder'],
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      message: 'ดึงประเภทเอเจนต์สำเร็จ',
      data: agentTypes.map((agentType) => ({
        id: agentType.id,
        code: agentType.code,
        shortCode: agentType.shortCode,
        nameTh: agentType.nameTh,
        isActive: agentType.isActive,
        sortOrder: agentType.sortOrder
      }))
    });
  } catch (error) {
    console.error('Get agent types error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประเภทเอเจนต์'
    });
  }
});

// POST /api/agent-types - Create new agent type (admin only)
app.post('/api/agent-types', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });
    }

    const { code, shortCode, nameTh, isActive = true, sortOrder = 0 } = req.body;

    if (!code || !shortCode || !nameTh) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก code, shortCode และ nameTh ให้ครบ'
      });
    }

    if (!/^[A-Z]{2}$/.test(shortCode)) {
      return res.status(400).json({
        success: false,
        message: 'shortCode ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ 2 ตัว (A-Z)'
      });
    }

    const existing = await AgentType.findOne({
      where: { [require('sequelize').Op.or]: [{ code }, { shortCode }] }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.code === code ? 'code นี้มีอยู่แล้ว' : 'shortCode นี้มีอยู่แล้ว'
      });
    }

    const agentType = await AgentType.create({
      code: code.toLowerCase(),
      shortCode: shortCode.toUpperCase(),
      nameTh,
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || 0
    });

    res.status(201).json({
      success: true,
      message: 'สร้างประเภทเอเจนต์สำเร็จ',
      data: {
        id: agentType.id,
        code: agentType.code,
        shortCode: agentType.shortCode,
        nameTh: agentType.nameTh,
        isActive: agentType.isActive,
        sortOrder: agentType.sortOrder
      }
    });
  } catch (error) {
    console.error('Create agent type error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างประเภทเอเจนต์' });
  }
});

// PUT /api/agent-types/:id - Update agent type (admin only)
app.put('/api/agent-types/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });
    }

    const agentType = await AgentType.findByPk(req.params.id);
    if (!agentType) {
      return res.status(404).json({ success: false, message: 'ไม่พบประเภทเอเจนต์' });
    }

    const { code, shortCode, nameTh, isActive, sortOrder } = req.body;
    const payload = {};

    if (code !== undefined) payload.code = code.toLowerCase();
    if (nameTh !== undefined) payload.nameTh = nameTh;
    if (isActive !== undefined) payload.isActive = Boolean(isActive);
    if (sortOrder !== undefined) payload.sortOrder = Number(sortOrder) || 0;

    if (shortCode !== undefined) {
      if (!/^[A-Z]{2}$/.test(shortCode.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'shortCode ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ 2 ตัว (A-Z)'
        });
      }
      // Check uniqueness
      const existing = await AgentType.findOne({
        where: { shortCode: shortCode.toUpperCase(), id: { [require('sequelize').Op.ne]: agentType.id } }
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'shortCode นี้มีอยู่แล้ว' });
      }
      payload.shortCode = shortCode.toUpperCase();
    }

    await agentType.update(payload);

    res.json({
      success: true,
      message: 'อัพเดตประเภทเอเจนต์สำเร็จ',
      data: {
        id: agentType.id,
        code: agentType.code,
        shortCode: agentType.shortCode,
        nameTh: agentType.nameTh,
        isActive: agentType.isActive,
        sortOrder: agentType.sortOrder
      }
    });
  } catch (error) {
    console.error('Update agent type error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัพเดตประเภทเอเจนต์' });
  }
});

// DELETE /api/agent-types/:id - Soft-delete agent type (admin only)
app.delete('/api/agent-types/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งาน' });
    }

    const agentType = await AgentType.findByPk(req.params.id);
    if (!agentType) {
      return res.status(404).json({ success: false, message: 'ไม่พบประเภทเอเจนต์' });
    }

    // Check if any agents use this type
    const agentCount = await Agent.count({ where: { agentTypeId: agentType.id } });
    if (agentCount > 0) {
      // Soft-delete: just deactivate
      await agentType.update({ isActive: false });
      return res.json({
        success: true,
        message: `ปิดใช้งานประเภทเอเจนต์แล้ว (มีเอเจนต์ ${agentCount} คนที่ใช้ประเภทนี้ จึงไม่สามารถลบได้)`
      });
    }

    await agentType.destroy();
    res.json({ success: true, message: 'ลบประเภทเอเจนต์สำเร็จ' });
  } catch (error) {
    console.error('Delete agent type error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบประเภทเอเจนต์' });
  }
});

// ==================== AGENTS ENDPOINTS ====================

// GET /api/agents - Get all agents
app.get('/api/agents', checkAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    let whereCondition = {};

    // Filter by status
    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    // Search by name, agent code, phone, id card, or email
    if (search) {
      const { Op } = require('sequelize');
      whereCondition[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { agentCode: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { idCard: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: agents } = await Agent.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ['email'],
          required: false
        },
        {
          model: AgentType,
          as: 'agentType',
          attributes: ['id', 'code', 'shortCode', 'nameTh'],
          required: false
        },
        {
          model: AgentTypeDetail,
          as: 'typeDetail',
          required: false,
          include: [
            {
              model: Project,
              as: 'residenceProject',
              attributes: ['id', 'projectName'],
              required: false
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      message: 'ดึงข้อมูลเอเจนต์สำเร็จ',
      data: agents,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอเจนต์'
    });
  }
});

// GET /api/agents/list - Get agents list for dropdown
app.get('/api/agents/list', checkAuth, async (req, res) => {
  try {
    const agents = await Agent.findAll({
      where: { status: 'active' },
      attributes: ['id', 'agentCode', 'firstName', 'lastName'],
      order: [['agentCode', 'ASC']]
    });

    const agentsList = agents.map(agent => ({
      id: agent.id,
      agentCode: agent.agentCode,
      firstName: agent.firstName,
      lastName: agent.lastName,
      fullName: `${agent.agentCode} - ${agent.firstName} ${agent.lastName}`
    }));

    res.json({
      success: true,
      message: 'ดึงรายชื่อเอเจนต์สำเร็จ',
      data: agentsList
    });

  } catch (error) {
    console.error('Get agents list error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายชื่อเอเจนต์'
    });
  }
});

// GET /api/agents/next-code - Get next available agent code (public endpoint for registration)
app.get('/api/agents/next-code', async (req, res) => {
  try {
    const { agentTypeCode } = req.query;

    // Resolve agent type
    const resolvedCode = resolveAgentTypeCode(agentTypeCode || 'general');
    const agentType = await getAgentTypeByCode(resolvedCode) || await getDefaultAgentType();

    if (!agentType) {
      return res.status(400).json({ success: false, message: 'ไม่พบประเภทเอเจนต์' });
    }

    const nextCode = await getNextAgentCode(agentType.id);

    res.json({
      success: true,
      data: {
        nextAgentCode: nextCode,
        agentTypeCode: agentType.code,
        shortCode: agentType.shortCode
      }
    });
  } catch (error) {
    console.error('Error getting next agent code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next agent code',
      error: error.message
    });
  }
});

// GET /api/agents/by-ref-code/:code - Lookup agent by referral code (public)
app.get('/api/agents/by-ref-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || !/^[A-Z0-9]{6}$/i.test(code)) {
      return res.status(400).json({ success: false, message: 'รหัสแนะนำไม่ถูกต้อง' });
    }
    const agent = await Agent.findOne({
      where: { refCode: code.toUpperCase() },
      attributes: ['id', 'agentCode', 'refCode', 'firstName', 'lastName', 'status']
    });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'ไม่พบรหัสแนะนำนี้ในระบบ' });
    }
    res.json({
      success: true,
      data: {
        agentId: agent.id,
        agentCode: agent.agentCode,
        refCode: agent.refCode,
        name: `${agent.firstName} ${agent.lastName}`,
        status: agent.status
      }
    });
  } catch (error) {
    console.error('Get agent by ref code error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล' });
  }
});

// POST /api/agents/backfill-ref-codes - Assign refCode to agents that don't have one (admin)
app.post('/api/agents/backfill-ref-codes', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'เฉพาะผู้ดูแลระบบ' });
    }
    const { Op } = require('sequelize');
    const agentsWithoutCode = await Agent.findAll({ where: { refCode: { [Op.is]: null } } });
    let updated = 0;
    for (const ag of agentsWithoutCode) {
      const code = await generateUniqueRefCode(Agent);
      await ag.update({ refCode: code });
      updated++;
    }
    res.json({ success: true, message: `อัพเดทรหัสแนะนำสำเร็จ ${updated} เอเจนต์`, updated });
  } catch (error) {
    console.error('Backfill ref codes error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/agents/:id - Get agent by ID
app.get('/api/agents/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['email'],
          required: false
        },
        {
          model: AgentType,
          as: 'agentType',
          attributes: ['id', 'code', 'shortCode', 'nameTh'],
          required: false
        },
        {
          model: AgentTypeDetail,
          as: 'typeDetail',
          required: false,
          include: [
            {
              model: Project,
              as: 'residenceProject',
              attributes: ['id', 'projectName'],
              required: false
            }
          ]
        }
      ]
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลเอเจนต์'
      });
    }

    res.json({
      success: true,
      message: 'ดึงข้อมูลเอเจนต์สำเร็จ',
      data: agent
    });

  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอเจนต์'
    });
  }
});

// POST /api/agents - Create new agent (for admin use)
app.post('/api/agents', checkAuth, async (req, res) => {
  try {
    const {
      email, firstName, lastName, phone, idCard, agentTypeCode,
      referralCode, houseNumber, projectId, department, division,
      companyName, occupation, knowSenaFrom
    } = req.body;

    if (!email || !firstName || !lastName || !idCard) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, เลขบัตรประชาชน)',
        errorType: 'validation'
      });
    }

    if (!isValidEmail(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง',
        errorType: 'email'
      });
    }

    if (!isValidIdCard(idCard)) {
      return res.status(400).json({
        success: false,
        message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',
        errorType: 'idCard'
      });
    }

    if (phone && !isValidThaiPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)',
        errorType: 'phone'
      });
    }

    // Set password as ID card number if not provided
    const password = idCard;

    // idCard is the primary identity key: block before creating user/agent
    const existingAgent = await findExistingAgentByIdCard(idCard);
    if (existingAgent) {
      return res.status(409).json({
        success: false,
        message: 'เลขบัตรประชาชนนี้ถูกใช้แล้ว',
        errorType: 'idCard',
        existingData: buildExistingAgentData(existingAgent),
        nextAction: 'contact_admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้แล้ว',
        errorType: 'email'
      });
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await Agent.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'เบอร์โทรศัพท์นี้ถูกใช้แล้ว',
          errorType: 'phone'
        });
      }
    }

    // Generate agent code
    const lastAgent = await Agent.findOne({
      order: [['agentCode', 'DESC']]
    });

    let nextNumber = 1;
    if (lastAgent && lastAgent.agentCode) {
      const lastNumber = parseInt(lastAgent.agentCode.replace('AG', ''));
      nextNumber = lastNumber + 1;
    }

    const agentCode = `AG${nextNumber.toString().padStart(3, '0')}`;
    const requestedAgentTypeCode = resolveAgentTypeCode(agentTypeCode || 'general');
    const agentType = await getAgentTypeByCode(requestedAgentTypeCode) || await getDefaultAgentType();

    if (!agentType) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบประเภทเอเจนต์ที่ใช้งานได้',
        errorType: 'agentTypeCode'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role: 'agent'
    });

    // Create agent
    const agentRefCode = await generateUniqueRefCode(Agent);
    const agent = await Agent.create({
      userId: user.id,
      agentTypeId: agentType.id,
      agentCode,
      refCode: agentRefCode,
      agentIdCard: idCard,
      email,
      idCard,
      firstName,
      lastName,
      phone: phone || '',
      registrationDate: new Date(),
      status: 'active'
    });

    // Create agent type detail row
    await AgentTypeDetail.create({
      agentId: agent.id,
      referralCode: referralCode || null,
      houseNumber: houseNumber || null,
      projectId: projectId || null,
      department: department || null,
      division: division || null,
      companyName: companyName || null,
      occupation: occupation || null,
      knowSenaFrom: knowSenaFrom || null
    });

    // Get agent with user info
    const agentWithUser = await Agent.findByPk(agent.id, {
      include: [
        {
          model: User,
          attributes: ['email'],
          required: false
        },
        {
          model: AgentType,
          as: 'agentType',
          attributes: ['id', 'code', 'nameTh'],
          required: false
        },
        {
          model: AgentTypeDetail,
          as: 'typeDetail',
          required: false,
          include: [
            {
              model: Project,
              as: 'residenceProject',
              attributes: ['id', 'projectName'],
              required: false
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'สร้างเอเจนต์ใหม่สำเร็จ',
      data: agentWithUser
    });

  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างเอเจนต์ใหม่'
    });
  }
});

// PUT /api/agents/profile - Update agent's own profile
app.put('/api/agents/profile', checkAuth, async (req, res) => {
  try {
    // Only agents can update their own profile
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะเอเจนต์เท่านั้นที่สามารถแก้ไขข้อมูลส่วนตัวได้'
      });
    }

    const agent = await Agent.findOne({ where: { userId: req.user.id } });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลเอเจนต์'
      });
    }

    const { phone } = req.body;

    // Agents can only update their phone number
    await agent.update({ phone: phone || '' });

    res.json({
      success: true,
      message: 'อัพเดทเบอร์โทรสำเร็จ',
      data: {
        id: req.user.id,
        email: req.user.email,
        role: 'agent',
        agentId: agent.id,
        agentCode: agent.agentCode,
        firstName: agent.firstName,
        lastName: agent.lastName,
        phone: agent.phone,
        status: agent.status
      }
    });

  } catch (error) {
    console.error('Update agent profile error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลส่วนตัว'
    });
  }
});

// PUT /api/agents/:id - Update agent
app.put('/api/agents/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์แก้ไขข้อมูลเอเจนต์'
      });
    }

    const { id } = req.params;
    const {
      agentCode, firstName, lastName, phone, status,
      referralCode, houseNumber, projectId, department, division,
      companyName, occupation, knowSenaFrom
    } = req.body;

    const agent = await Agent.findByPk(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลเอเจนต์'
      });
    }

    // Check for duplicate agentCode (exclude current agent)
    if (agentCode && agentCode !== agent.agentCode) {
      const existingAgentCode = await Agent.findOne({
        where: { agentCode, id: { [require('sequelize').Op.ne]: id } }
      });
      if (existingAgentCode) {
        return res.status(400).json({
          success: false,
          message: 'รหัสเอเจนต์นี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Check for duplicate phone (exclude current agent)
    if (phone && phone !== agent.phone) {
      const existingPhone = await Agent.findOne({
        where: { phone, id: { [require('sequelize').Op.ne]: id } }
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Update agent (assign refCode only if not yet set)
    const assignRefCode = !agent.refCode ? { refCode: await generateUniqueRefCode(Agent) } : {};
    await agent.update({
      ...assignRefCode,
      ...(agentCode && { agentCode }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(status && { status })
    });

    // Upsert agent type detail
    const typeDetailFields = { referralCode, houseNumber, projectId, department, division, companyName, occupation, knowSenaFrom };
    const hasTypeDetail = Object.values(typeDetailFields).some(v => v !== undefined);
    if (hasTypeDetail) {
      await AgentTypeDetail.upsert({
        agentId: parseInt(id),
        referralCode: referralCode !== undefined ? (referralCode || null) : undefined,
        houseNumber: houseNumber !== undefined ? (houseNumber || null) : undefined,
        projectId: projectId !== undefined ? (projectId || null) : undefined,
        department: department !== undefined ? (department || null) : undefined,
        division: division !== undefined ? (division || null) : undefined,
        companyName: companyName !== undefined ? (companyName || null) : undefined,
        occupation: occupation !== undefined ? (occupation || null) : undefined,
        knowSenaFrom: knowSenaFrom !== undefined ? (knowSenaFrom || null) : undefined
      });
    }

    // Get updated agent with user info
    const updatedAgent = await Agent.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['email'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลเอเจนต์สำเร็จ',
      data: updatedAgent
    });

  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลเอเจนต์'
    });
  }
});

// DELETE /api/agents/:id - Delete agent
app.delete('/api/agents/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบเอเจนต์ได้'
      });
    }

    const { id } = req.params;

    const agent = await Agent.findByPk(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลเอเจนต์'
      });
    }

    // Check if agent has customers
    const customerCount = await Customer.count({ where: { agentId: id } });

    if (customerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบเอเจนต์ได้ เนื่องจากมีลูกค้าที่เชื่อมโยงอยู่ ${customerCount} ราย`
      });
    }

    // Delete user account first (will cascade to agent due to foreign key)
    if (agent.userId) {
      await User.destroy({ where: { id: agent.userId } });
    }

    // Delete agent record
    await agent.destroy();

    res.json({
      success: true,
      message: 'ลบเอเจนต์สำเร็จ'
    });

  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบเอเจนต์'
    });
  }
});

// ==================== CUSTOMERS ENDPOINTS ====================

// GET /api/customers - Get all customers
app.get('/api/customers', checkAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, agentId } = req.query;

    let whereCondition = {};

    // Filter by status
    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    // Filter by agent (for agents to see only their customers)
    if (req.user.role === 'agent') {
      const agent = await Agent.findOne({ where: { userId: req.user.id } });
      if (agent) {
        whereCondition.agentId = agent.id;
      }
    } else if (agentId && agentId !== 'all') {
      whereCondition.agentId = agentId;
    }

    // Search by name, code, phone, id card, or email
    if (search) {
      const { Op } = require('sequelize');
      whereCondition[Op.or] = [
        { customerCode: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { idCard: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereCondition,
      include: getCustomerInclude(),
      distinct: true,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      message: 'ดึงข้อมูลลูกค้าสำเร็จ',
      data: customers,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า'
    });
  }
});

// GET /api/product-types - Get product types
app.get('/api/product-types', checkAuth, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user.role === 'admin';
    const where = includeInactive ? {} : { isActive: true };

    const productTypes = await ProductType.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      message: 'ดึงข้อมูลประเภทสินค้าสำเร็จ',
      data: productTypes
    });
  } catch (error) {
    console.error('Get product types error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทสินค้า'
    });
  }
});

// POST /api/product-types - Create product type
app.post('/api/product-types', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการประเภทสินค้าได้'
      });
    }

    const { code, name, sortOrder = 0, isActive = true } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรหัสและชื่อประเภทสินค้า'
      });
    }

    const normalizedCode = code.trim();
    const existingProductType = await ProductType.findOne({ where: { code: normalizedCode } });
    if (existingProductType) {
      return res.status(400).json({
        success: false,
        message: 'รหัสประเภทสินค้านี้มีอยู่ในระบบแล้ว'
      });
    }

    const productType = await ProductType.create({
      code: normalizedCode,
      name: name.trim(),
      sortOrder: parseInt(sortOrder, 10) || 0,
      isActive: Boolean(isActive)
    });

    res.status(201).json({
      success: true,
      message: 'สร้างประเภทสินค้าสำเร็จ',
      data: productType
    });
  } catch (error) {
    console.error('Create product type error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างประเภทสินค้า'
    });
  }
});

// PUT /api/product-types/:id - Update product type
app.put('/api/product-types/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการประเภทสินค้าได้'
      });
    }

    const { id } = req.params;
    const { code, name, sortOrder, isActive } = req.body;
    const productType = await ProductType.findByPk(id);

    if (!productType) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลประเภทสินค้า'
      });
    }

    if (code && code !== productType.code) {
      const existingProductType = await ProductType.findOne({ where: { code } });
      if (existingProductType) {
        return res.status(400).json({
          success: false,
          message: 'รหัสประเภทสินค้านี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    await productType.update({
      ...(code !== undefined && { code: code.trim() }),
      ...(name !== undefined && { name: name.trim() }),
      ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder, 10) || 0 }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) })
    });

    res.json({
      success: true,
      message: 'อัพเดทประเภทสินค้าสำเร็จ',
      data: productType
    });
  } catch (error) {
    console.error('Update product type error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทประเภทสินค้า'
    });
  }
});

// DELETE /api/product-types/:id - Soft delete product type
app.delete('/api/product-types/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการประเภทสินค้าได้'
      });
    }

    const { id } = req.params;
    const productType = await ProductType.findByPk(id);

    if (!productType) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลประเภทสินค้า'
      });
    }

    await productType.update({ isActive: false });

    res.json({
      success: true,
      message: 'ปิดใช้งานประเภทสินค้าสำเร็จ'
    });
  } catch (error) {
    console.error('Delete product type error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปิดใช้งานประเภทสินค้า'
    });
  }
});

// GET /api/notification-rules - List notification rules
app.get('/api/notification-rules', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการ notification rules ได้'
      });
    }

    const [rows] = await sequelize.query(
      `SELECT
        id,
        action_type AS actionType,
        recipient_emails AS recipientEmails,
        is_active AS isActive,
        created_by AS createdBy,
        updated_by AS updatedBy,
        created_at AS createdAt,
        updated_at AS updatedAt
       FROM notification_rules
       ORDER BY action_type ASC, id DESC`
    );

    res.json({
      success: true,
      message: 'ดึงข้อมูล notification rules สำเร็จ',
      data: rows.map(formatNotificationRule)
    });
  } catch (error) {
    console.error('Get notification rules error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึง notification rules'
    });
  }
});

// POST /api/notification-rules - Create notification rule
app.post('/api/notification-rules', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการ notification rules ได้'
      });
    }

    const { actionType, recipientEmails, isActive = true } = req.body;

    if (!NOTIFICATION_ACTION_SET.has(actionType)) {
      return res.status(400).json({
        success: false,
        message: 'ประเภทการแจ้งเตือนไม่ถูกต้อง'
      });
    }

    const normalizedRecipients = normalizeRecipientEmails(recipientEmails);
    if (normalizedRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการ'
      });
    }

    const [insertResult, insertMeta] = await sequelize.query(
      `INSERT INTO notification_rules (action_type, recipient_emails, is_active, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          actionType,
          JSON.stringify(normalizedRecipients),
          Boolean(isActive),
          req.user.id,
          req.user.id
        ]
      }
    );

    const createdRuleId =
      insertResult?.insertId ||
      insertMeta?.insertId ||
      insertMeta;

    let createdRule = null;
    if (createdRuleId) {
      createdRule = await getNotificationRuleById(createdRuleId);
    }

    if (!createdRule) {
      const [fallbackRows] = await sequelize.query(
        `SELECT
          id,
          action_type AS actionType,
          recipient_emails AS recipientEmails,
          is_active AS isActive,
          created_by AS createdBy,
          updated_by AS updatedBy,
          created_at AS createdAt,
          updated_at AS updatedAt
         FROM notification_rules
         WHERE action_type = ? AND created_by = ?
         ORDER BY id DESC
         LIMIT 1`,
        { replacements: [actionType, req.user.id] }
      );
      createdRule = fallbackRows[0] || null;
    }

    res.status(201).json({
      success: true,
      message: 'สร้าง notification rule สำเร็จ',
      data: createdRule ? formatNotificationRule(createdRule) : null
    });
  } catch (error) {
    console.error('Create notification rule error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง notification rule'
    });
  }
});

// PUT /api/notification-rules/:id - Update notification rule
app.put('/api/notification-rules/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการ notification rules ได้'
      });
    }

    const { id } = req.params;
    const existingRule = await getNotificationRuleById(id);
    if (!existingRule) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ notification rule ที่ต้องการแก้ไข'
      });
    }

    const updates = [];
    const replacements = [];

    if (req.body.actionType !== undefined) {
      if (!NOTIFICATION_ACTION_SET.has(req.body.actionType)) {
        return res.status(400).json({
          success: false,
          message: 'ประเภทการแจ้งเตือนไม่ถูกต้อง'
        });
      }
      updates.push('action_type = ?');
      replacements.push(req.body.actionType);
    }

    if (req.body.recipientEmails !== undefined) {
      const normalizedRecipients = normalizeRecipientEmails(req.body.recipientEmails);
      if (normalizedRecipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการ'
        });
      }
      updates.push('recipient_emails = ?');
      replacements.push(JSON.stringify(normalizedRecipients));
    }

    if (req.body.isActive !== undefined) {
      updates.push('is_active = ?');
      replacements.push(Boolean(req.body.isActive));
    }

    if (updates.length === 0) {
      return res.json({
        success: true,
        message: 'ไม่มีข้อมูลเปลี่ยนแปลง',
        data: formatNotificationRule(existingRule)
      });
    }

    updates.push('updated_by = ?');
    replacements.push(req.user.id);
    updates.push('updated_at = NOW()');
    replacements.push(id);

    await sequelize.query(
      `UPDATE notification_rules SET ${updates.join(', ')} WHERE id = ?`,
      { replacements }
    );

    const updatedRule = await getNotificationRuleById(id);

    res.json({
      success: true,
      message: 'อัปเดต notification rule สำเร็จ',
      data: updatedRule ? formatNotificationRule(updatedRule) : null
    });
  } catch (error) {
    console.error('Update notification rule error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดต notification rule'
    });
  }
});

// POST /api/notification-rules/:id/test-send - Test send notification by rule
app.post('/api/notification-rules/:id/test-send', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถทดสอบส่ง notification ได้'
      });
    }

    const { id } = req.params;
    const existingRule = await getNotificationRuleById(id);
    if (!existingRule) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ notification rule ที่ต้องการทดสอบ'
      });
    }

    const recipients = normalizeRecipientEmails(existingRule.recipientEmails);
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบอีเมลผู้รับสำหรับ notification rule นี้'
      });
    }

    const generatedAt = new Date().toLocaleString('th-TH', { hour12: false });
    const defaultPayload = existingRule.actionType === 'customer_created' || existingRule.actionType === 'customer_approved' || existingRule.actionType === 'customer_rejected'
      ? {
        customerCode: 'TEST-CUST-001',
        customerName: 'ลูกค้าทดสอบระบบ',
        agentName: req.user?.name || req.user?.email || 'Admin',
        projectName: 'โครงการทดสอบ',
        status: existingRule.actionType === 'customer_approved'
          ? 'ผ่าน'
          : existingRule.actionType === 'customer_rejected'
            ? 'ไม่ผ่าน'
            : 'pending',
        generatedAt
      }
      : {
        agentCode: 'TEST-AG001',
        agentName: 'เอเจนต์ทดสอบระบบ',
        email: req.user?.email || 'admin@test.com',
        status: existingRule.isActive ? 'active' : 'inactive',
        generatedAt
      };

    const customPayload = (req.body && typeof req.body.payload === 'object' && req.body.payload)
      ? req.body.payload
      : {};

    const payload = {
      ...defaultPayload,
      ...customPayload,
      generatedAt,
      isTest: true
    };

    const result = await sendNotificationToRecipients(existingRule.actionType, recipients, payload);

    res.json({
      success: true,
      message: `ส่งอีเมลทดสอบสำเร็จ ${result.sent}/${result.attempted} รายการ`,
      data: {
        ruleId: existingRule.id,
        actionType: existingRule.actionType,
        ...result
      }
    });
  } catch (error) {
    console.error('Test notification rule send error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการทดสอบส่ง notification'
    });
  }
});

// DELETE /api/notification-rules/:id - Delete notification rule
app.delete('/api/notification-rules/:id', checkAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการ notification rules ได้'
      });
    }

    const { id } = req.params;
    const [deleteResult] = await sequelize.query(
      'DELETE FROM notification_rules WHERE id = ?',
      { replacements: [id] }
    );

    if (!deleteResult.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ notification rule ที่ต้องการลบ'
      });
    }

    res.json({
      success: true,
      message: 'ลบ notification rule สำเร็จ'
    });
  } catch (error) {
    console.error('Delete notification rule error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบ notification rule'
    });
  }
});

// POST /api/customers - Create new customer
app.post('/api/customers', checkAuth, async (req, res) => {
  try {
    const {
      customerCode, firstName, lastName, phone, email, idCard,
      projectId, budgetMin, budgetMax,
      status = 'pending', source = 'referral', notes, referralType, productTypeIds
    } = req.body;

    const normalizedFirstName = normalizeText(firstName);
    const normalizedLastName = normalizeText(lastName);
    const normalizedPhone = normalizeText(phone);
    const normalizedEmail = normalizeText(email).toLowerCase();
    const normalizedIdCard = normalizeText(idCard);
    const normalizedProductTypeIds = normalizeProductTypeIds(productTypeIds);
    const allowedStatuses = ['pending', 'approved', 'duplicate'];
    const requestedStatus = allowedStatuses.includes(status) ? status : 'pending';
    const isAgentCreator = req.user.role === 'agent';

    if (!normalizedFirstName || !normalizedLastName) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อและนามสกุลให้ครบถ้วน'
      });
    }

    if (normalizedIdCard && !isValidIdCard(normalizedIdCard)) {
      return res.status(400).json({
        success: false,
        message: 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก',
        errorType: 'idCard'
      });
    }

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบอีเมลไม่ถูกต้อง',
        errorType: 'email'
      });
    }

    if (normalizedPhone && !isValidThaiPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
        errorType: 'phone'
      });
    }

    // Resolve agentId: agents always use their own record; admin can specify
    let agentId = req.body.agentId;
    if (req.user.role === 'agent') {
      const selfAgent = await Agent.findOne({ where: { userId: req.user.id } });
      if (!selfAgent) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบข้อมูลเอเจนต์สำหรับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ'
        });
      }
      agentId = selfAgent.id;
    }

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเอเจนต์'
      });
    }

    const productTypesAreValid = await validateProductTypeIds(normalizedProductTypeIds);
    if (!productTypesAreValid) {
      return res.status(400).json({
        success: false,
        message: 'พบประเภทสินค้าที่ไม่ถูกต้องในข้อมูลที่ส่งมา'
      });
    }

    // Admin flow keeps strict duplicate checks for core unique-like fields.
    if (!isAgentCreator) {
      if (customerCode) {
        const existingCustomerCode = await Customer.findOne({ where: { customerCode } });
        if (existingCustomerCode) {
          return res.status(400).json({
            success: false,
            message: 'รหัสลูกค้านี้มีอยู่ในระบบแล้ว'
          });
        }
      }

      if (normalizedPhone) {
        const existingPhone = await Customer.findOne({ where: { phone: normalizedPhone } });
        if (existingPhone) {
          return res.status(400).json({
            success: false,
            message: 'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว'
          });
        }
      }

      if (normalizedEmail) {
        const existingEmail = await Customer.findOne({ where: { email: normalizedEmail } });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
          });
        }
      }
    }

    const duplicateReasons = isAgentCreator
      ? await detectCustomerDuplicateReasons({
        idCard: normalizedIdCard
      })
      : [];

    const finalStatus = isAgentCreator
      ? (duplicateReasons.length > 0 ? 'duplicate' : 'approved')
      : requestedStatus;

    let customerId;
    await sequelize.transaction(async (transaction) => {
      const customer = await Customer.create({
        customerCode: customerCode || null,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        phone: normalizedPhone || null,
        email: normalizedEmail || null,
        idCard: normalizedIdCard || null,
        agentId,
        projectId: projectId || null,
        budgetMin: budgetMin !== undefined ? budgetMin : null,
        budgetMax: budgetMax !== undefined ? budgetMax : null,
        status: finalStatus,
        source,
        notes: notes || null,
        referralType: referralType || null,
        createdBy: req.user.id,
        updatedBy: req.user.id
      }, { transaction });

      customerId = customer.id;
      await syncCustomerProductTypes(customer.id, normalizedProductTypeIds, transaction);
    });

    // Get customer with relations
    const customerWithRelations = await Customer.findByPk(customerId, {
      include: getCustomerInclude()
    });

    await sendActionNotification('customer_created', {
      customerCode: customerWithRelations?.customerCode || null,
      customerName: `${customerWithRelations?.firstName || ''} ${customerWithRelations?.lastName || ''}`.trim(),
      agentName: customerWithRelations?.agent
        ? `${customerWithRelations.agent.agentCode || ''} ${customerWithRelations.agent.firstName || ''} ${customerWithRelations.agent.lastName || ''}`.trim()
        : '-',
      projectName: customerWithRelations?.project?.projectName || '-',
      status: customerWithRelations?.status || finalStatus,
      generatedAt: new Date().toLocaleString('th-TH', { hour12: false })
    });

    let emailNotification = null;
    if (customerWithRelations && ['approved', 'duplicate'].includes(finalStatus)) {
      try {
        const agent = customerWithRelations.agent;
        const customerName = `${customerWithRelations.firstName} ${customerWithRelations.lastName}`;
        const agentNameForNotification = customerWithRelations?.agent
          ? `${customerWithRelations.agent.agentCode || ''} ${customerWithRelations.agent.firstName || ''} ${customerWithRelations.agent.lastName || ''}`.trim()
          : '-';
        const projectNameForNotification = customerWithRelations?.project?.projectName || '-';

        const triggerStatusNotification = async (actionType, statusText) => {
          await sendActionNotification(actionType, {
            customerCode: customerWithRelations?.customerCode || null,
            customerName,
            agentName: agentNameForNotification,
            projectName: projectNameForNotification,
            status: statusText,
            generatedAt: new Date().toLocaleString('th-TH', { hour12: false })
          });
        };

        const isSelfReferral = customerWithRelations.referralType === 'self';
        const agentName = agent ? `${agent.firstName} ${agent.lastName}` : '-';

        if (finalStatus === 'approved') {
          const recipients = buildApprovedRecipientList({
            agentEmail: agent?.email,
            project: customerWithRelations.project
          });

          if (recipients.length > 0) {
            emailNotification = await sendReferralResultToRecipients({
              recipients,
              agentName,
              customerName,
              status: 'approved',
              isSelfReferral
            });
            await triggerStatusNotification('customer_approved', 'ผ่าน');
            console.log(`[Email] Approval notifications sent to ${recipients.join(', ')} for customer ${customerName}`);
          } else {
            console.warn(`[Email] Cannot send approval notification: no recipients found for customer ${customerWithRelations?.id || customerId}`);
            await triggerStatusNotification('customer_approved', 'ผ่าน');
          }
        } else {
          if (agent && agent.email) {
            emailNotification = await emailService.sendReferralResult({
              to: agent.email,
              agentName,
              customerName,
              status: 'rejected',
              reason: 'duplicate',
              isSelfReferral
            });
            await triggerStatusNotification('customer_rejected', 'ไม่ผ่าน');
            console.log(`[Email] Rejection notification (duplicate) sent to ${agent.email} for customer ${customerName}`);
          } else {
            console.warn(`[Email] Cannot send notification: Agent email not found for customer ${customerWithRelations?.id || customerId}`);
            await triggerStatusNotification('customer_rejected', 'ไม่ผ่าน');
          }
        }
      } catch (emailError) {
        console.error('[Email] Failed to send create-time customer notification:', emailError.message);
        emailNotification = { error: emailError.message };
      }
    }

    if (emailNotification) {
      customerWithRelations.emailNotification = emailNotification;
    }

    let responseMessage = 'สร้างลูกค้าใหม่สำเร็จ';
    if (finalStatus === 'approved') {
      responseMessage = 'บันทึกข้อมูลลูกค้าแล้ว (ผลตรวจ: ผ่าน)';
    } else if (finalStatus === 'duplicate') {
      responseMessage = 'บันทึกข้อมูลลูกค้าแล้ว (ผลตรวจ: ไม่ผ่าน)';
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: customerWithRelations,
      ...(isAgentCreator
        ? {
          decision: {
            passed: finalStatus === 'approved',
            status: finalStatus,
            reasons: duplicateReasons
          }
        }
        : {})
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างลูกค้าใหม่'
    });
  }
});

// GET /api/customers/next-code - Get next available customer code (public endpoint for customer management)
app.get('/api/customers/next-code', async (req, res) => {
  try {
    // Get the latest customer code
    const latestCustomer = await Customer.findOne({
      order: [['customerCode', 'DESC']],
      attributes: ['customerCode']
    });

    let nextCode = 'CU001'; // Default first code

    if (latestCustomer && latestCustomer.customerCode) {
      // Extract number from customer code (e.g., CU007 -> 7)
      const currentNumber = parseInt(latestCustomer.customerCode.replace('CU', ''), 10);
      const nextNumber = currentNumber + 1;

      // Format next code with leading zeros (e.g., 8 -> CU008)
      nextCode = `CU${nextNumber.toString().padStart(3, '0')}`;
    }

    res.json({
      success: true,
      data: {
        nextCustomerCode: nextCode
      }
    });
  } catch (error) {
    console.error('Error getting next customer code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next customer code',
      error: error.message
    });
  }
});

// GET /api/customers/:id - Get customer by ID
app.get('/api/customers/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: getCustomerInclude()
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }

    res.json({
      success: true,
      message: 'ดึงข้อมูลลูกค้าสำเร็จ',
      data: customer
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า'
    });
  }
});

// PUT /api/customers/:id - Update customer
app.put('/api/customers/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerCode, firstName, lastName, phone, email, idCard,
      agentId, projectId, budgetMin, budgetMax,
      status, source, notes, referralType, productTypeIds
    } = req.body;
    const normalizedProductTypeIds = normalizeProductTypeIds(productTypeIds);
    const hasProductTypeIds = Object.prototype.hasOwnProperty.call(req.body, 'productTypeIds');

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }

    if (hasProductTypeIds) {
      const productTypesAreValid = await validateProductTypeIds(normalizedProductTypeIds);
      if (!productTypesAreValid) {
        return res.status(400).json({
          success: false,
          message: 'พบประเภทสินค้าที่ไม่ถูกต้องในข้อมูลที่ส่งมา'
        });
      }
    }

    // Check for duplicate customerCode (exclude current customer)
    if (customerCode && customerCode !== customer.customerCode) {
      const existingCustomerCode = await Customer.findOne({
        where: { customerCode, id: { [require('sequelize').Op.ne]: id } }
      });
      if (existingCustomerCode) {
        return res.status(400).json({
          success: false,
          message: 'รหัสลูกค้านี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Check for duplicate phone (exclude current customer)
    if (phone && phone !== customer.phone) {
      const existingPhone = await Customer.findOne({
        where: { phone, id: { [require('sequelize').Op.ne]: id } }
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Check for duplicate email (exclude current customer)
    if (email && email !== customer.email) {
      const existingEmail = await Customer.findOne({
        where: { email, id: { [require('sequelize').Op.ne]: id } }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Check for duplicate ID card (exclude current customer)
    if (idCard && idCard !== customer.idCard) {
      const existingIdCard = await Customer.findOne({
        where: { idCard, id: { [require('sequelize').Op.ne]: id } }
      });
      if (existingIdCard) {
        return res.status(400).json({
          success: false,
          message: 'เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Store old status for email trigger check
    const oldStatus = customer.status;
    
    await sequelize.transaction(async (transaction) => {
      await customer.update({
        ...(customerCode !== undefined && { customerCode: customerCode || null }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(idCard !== undefined && { idCard: idCard || null }),
        ...(agentId !== undefined && { agentId: agentId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        ...(budgetMin !== undefined && { budgetMin: budgetMin }),
        ...(budgetMax !== undefined && { budgetMax: budgetMax }),
        ...(status && { status }),
        ...(source && { source }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(referralType !== undefined && { referralType: referralType || null }),
        updatedBy: req.user.id
      }, { transaction });

      if (hasProductTypeIds) {
        await syncCustomerProductTypes(customer.id, normalizedProductTypeIds, transaction);
      }
    });

    // Get updated customer with relations
    const updatedCustomer = await Customer.findByPk(id, {
      include: getCustomerInclude()
    });

    // Trigger email notification when status changes to a final decision
    if (status && oldStatus !== status && ['approved', 'duplicate'].includes(status)) {
      try {
        const agent = updatedCustomer.agent;
        const customerName = `${updatedCustomer.firstName} ${updatedCustomer.lastName}`;
        const agentNameForNotification = updatedCustomer?.agent
          ? `${updatedCustomer.agent.agentCode || ''} ${updatedCustomer.agent.firstName || ''} ${updatedCustomer.agent.lastName || ''}`.trim()
          : '-';
        const projectNameForNotification = updatedCustomer?.project?.projectName || '-';

        const triggerStatusNotification = async (actionType, statusText) => {
          await sendActionNotification(actionType, {
            customerCode: updatedCustomer?.customerCode || null,
            customerName,
            agentName: agentNameForNotification,
            projectName: projectNameForNotification,
            status: statusText,
            generatedAt: new Date().toLocaleString('th-TH', { hour12: false })
          });
        };

        const isSelfReferral = updatedCustomer.referralType === 'self';
        const agentName = agent ? `${agent.firstName} ${agent.lastName}` : '-';

        if (status === 'approved') {
          const recipients = buildApprovedRecipientList({
            agentEmail: agent?.email,
            project: updatedCustomer.project
          });

          if (recipients.length > 0) {
            updatedCustomer.emailNotification = await sendReferralResultToRecipients({
              recipients,
              agentName,
              customerName,
              status: 'approved',
              isSelfReferral
            });
            await triggerStatusNotification('customer_approved', 'ผ่าน');
            console.log(`[Email] Approval notifications sent to ${recipients.join(', ')} for customer ${customerName}`);
          } else {
            console.warn(`[Email] Cannot send approval notification: no recipients found for customer ${id}`);
            await triggerStatusNotification('customer_approved', 'ผ่าน');
          }
        } else if (status === 'duplicate') {
          if (agent && agent.email) {
            updatedCustomer.emailNotification = await emailService.sendReferralResult({
              to: agent.email,
              agentName,
              customerName,
              status: 'rejected',
              reason: 'duplicate',
              isSelfReferral
            });
            await triggerStatusNotification('customer_rejected', 'ไม่ผ่าน');
            console.log(`[Email] Rejection notification (duplicate) sent to ${agent.email} for customer ${customerName}`);
          } else {
            console.warn(`[Email] Cannot send notification: Agent email not found for customer ${id}`);
            await triggerStatusNotification('customer_rejected', 'ไม่ผ่าน');
          }
        }
      } catch (emailError) {
        // Log error but don't fail the update
        console.error('[Email] Failed to send notification:', emailError.message);
        updatedCustomer.emailNotification = { error: emailError.message };
      }
    }

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลลูกค้าสำเร็จ',
      data: updatedCustomer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลลูกค้า'
    });
  }
});

// DELETE /api/customers/:id - Delete customer
app.delete('/api/customers/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
    }

    // Delete customer
    await customer.destroy();

    res.json({
      success: true,
      message: 'ลบลูกค้าสำเร็จ'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบลูกค้า'
    });
  }
});

// =================================
// PROJECTS ENDPOINTS
// =================================

// GET /api/projects - Get all projects
app.get('/api/projects', checkAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (status && status !== 'all') {
      whereClause.isActive = status === 'active' ? 1 : 0;
    }

    if (search) {
      whereClause[Op.or] = [
        { projectName: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'ASC']],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Projects fetched successfully',
      data: rows,
      pagination: {
        total: count,
        current: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message,
    });
  }
});

// POST /api/projects - Create a new project
app.post('/api/projects', checkAuth, async (req, res) => {
  try {
    const settings = buildProjectPassEmailSettings({
      passEmailEnabled: req.body.passEmailEnabled,
      passEmailRecipients: req.body.passEmailRecipients
    });

    if (settings.passEmailEnabled && settings.recipientList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการเมื่อเปิดฟีเจอร์ส่งเมลผลผ่าน'
      });
    }

    const payload = {
      ...req.body,
      passEmailEnabled: settings.passEmailEnabled,
      passEmailRecipients: settings.passEmailRecipients
    };

    const project = await Project.create(payload);
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create project',
      error: error.message,
    });
  }
});

// GET /api/projects/:id - Get project by ID
app.get('/api/projects/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.json({
      success: true,
      message: 'Project fetched successfully',
      data: project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message,
    });
  }
});

// PUT /api/projects/:id - Update project
app.put('/api/projects/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const payload = {
      ...req.body
    };

    const hasPassEmailEnabled = Object.prototype.hasOwnProperty.call(req.body, 'passEmailEnabled');
    const hasPassEmailRecipients = Object.prototype.hasOwnProperty.call(req.body, 'passEmailRecipients');

    if (hasPassEmailEnabled || hasPassEmailRecipients) {
      const existingProject = await Project.findByPk(id);
      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      const settings = buildProjectPassEmailSettings({
        passEmailEnabled: hasPassEmailEnabled ? req.body.passEmailEnabled : existingProject.passEmailEnabled,
        passEmailRecipients: hasPassEmailRecipients ? req.body.passEmailRecipients : existingProject.passEmailRecipients
      });

      if (settings.passEmailEnabled && settings.recipientList.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุอีเมลผู้รับอย่างน้อย 1 รายการเมื่อเปิดฟีเจอร์ส่งเมลผลผ่าน'
        });
      }

      payload.passEmailEnabled = settings.passEmailEnabled;
      payload.passEmailRecipients = settings.passEmailRecipients;
    }

    const [updated] = await Project.update(payload, {
      where: { id: id },
    });

    if (updated) {
      const updatedProject = await Project.findByPk(id);
      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update project',
      error: error.message,
    });
  }
});

// DELETE /api/projects/:id - Delete project
app.delete('/api/projects/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete project
    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

// GET /api/dashboard/stats - Get dashboard statistics
app.get('/api/dashboard/stats', checkAuth, async (req, res) => {
  try {
    // Count total agents
    const totalAgents = await Agent.count();

    // Count pending agents (inactive status)
    const pendingAgents = await Agent.count({
      where: { status: 'inactive' }
    });

    // Count active agents
    const activeAgents = await Agent.count({
      where: { status: 'active' }
    });

    // Count total customers
    const totalCustomers = await Customer.count();

    // Count new customers (status: new)
    const newCustomers = await Customer.count({
      where: { status: 'new' }
    });

    // Count customers by status
    const customersByStatus = await Customer.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      message: 'ดึงสถิติ Dashboard สำเร็จ',
      data: {
        agents: {
          total: totalAgents,
          active: activeAgents,
          pending: pendingAgents
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
          byStatus: customersByStatus
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถิติ Dashboard'
    });
  }
});

// GET /api/dashboard/recent-activities - Get recent activities for current user
app.get('/api/dashboard/recent-activities', checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = 5; // แสดง 5 รายการล่าสุด

    // Get recent activities from various operations
    const activities = [];

    // Get recent agents - since agents table doesn't have created_by/updated_by columns, just get latest agents
    const recentAgents = await Agent.findAll({
      order: [['updated_at', 'DESC']],
      limit: 3,
      attributes: ['id', 'agentCode', 'firstName', 'lastName', 'created_at', 'updated_at']
    });

    // Get recent customers - fallback to all recent customers if no user-specific data
    let recentCustomers = await Customer.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { created_by: userId },
          { updated_by: userId }
        ]
      },
      order: [['updated_at', 'DESC']],
      limit: 3,
      attributes: ['id', 'firstName', 'lastName', 'status', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      include: [
        {
          model: Agent,
          attributes: ['agentCode', 'firstName', 'lastName'],
          required: false
        }
      ]
    });

    // If no user-specific customers found, get latest customers
    if (recentCustomers.length === 0) {
      recentCustomers = await Customer.findAll({
        order: [['updated_at', 'DESC']],
        limit: 2,
        attributes: ['id', 'firstName', 'lastName', 'status', 'created_at', 'updated_at', 'created_by', 'updated_by'],
        include: [
          {
            model: Agent,
            attributes: ['agentCode', 'firstName', 'lastName'],
            required: false
          }
        ]
      });
    }

    // Format agent activities - since agents table doesn't have created_by/updated_by,
    // determine if it's created vs updated by comparing created_at and updated_at times
    recentAgents.forEach(agent => {
      const isCreated = agent.created_at && agent.updated_at &&
        new Date(agent.created_at).getTime() === new Date(agent.updated_at).getTime();

      activities.push({
        id: `agent-${agent.id}`,
        type: 'agent',
        action: isCreated ? 'created' : 'updated',
        title: isCreated ? 'เพิ่มเอเจนต์ใหม่' : 'ปรับปรุงข้อมูลเอเจนต์',
        description: `${agent.agentCode || agent.firstName || ''} ${agent.lastName || ''}`.trim() || `เอเจนต์ #${agent.id}`,
        timestamp: agent.updated_at || agent.created_at,
        icon: 'user'
      });
    });

    // Format customer activities
    recentCustomers.forEach(customer => {
      const isCreated = customer.created_by === userId &&
        customer.created_at && customer.updated_at &&
        new Date(customer.created_at).getTime() === new Date(customer.updated_at).getTime();

      activities.push({
        id: `customer-${customer.id}`,
        type: 'customer',
        action: isCreated ? 'created' : 'updated',
        title: isCreated ? 'เพิ่มลูกค้าใหม่' : 'ปรับปรุงข้อมูลลูกค้า',
        description: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || `ลูกค้า #${customer.id}` +
          (customer.Agent ? ` (เอเจนต์: ${customer.Agent.firstName || customer.Agent.agentCode || 'ไม่ระบุ'})` : ''),
        timestamp: customer.updated_at || customer.created_at,
        icon: 'team'
      });
    });

    // Sort all activities by timestamp and take top 5
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const topActivities = activities.slice(0, limit);

    res.json({
      success: true,
      message: 'ดึงกิจกรรมล่าสุดสำเร็จ',
      data: topActivities
    });

  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงกิจกรรมล่าสุด'
    });
  }
});

// =================================
// EMAIL ENDPOINTS
// =================================

// GET /api/emails/templates - Get all available email templates
app.get('/api/emails/templates', checkAuth, async (req, res) => {
  res.json({
    success: true,
    data: {
      templates: getAvailableTemplates()
    }
  });
});

// GET /api/emails/test-mode - Get test mode status
app.get('/api/emails/test-mode', checkAuth, async (req, res) => {
  const testModeStatus = emailService.getTestModeStatus();
  res.json({
    success: true,
    data: testModeStatus
  });
});

// GET /api/emails/verify-smtp - Verify SMTP connection
app.get('/api/emails/verify-smtp', checkAuth, async (req, res) => {
  try {
    const result = await emailService.verifyConnection();
    const testModeStatus = emailService.getTestModeStatus();
    
    res.json({
      success: result.success,
      message: result.success ? 'เชื่อมต่อ SMTP สำเร็จ' : 'เชื่อมต่อ SMTP ไม่สำเร็จ',
      data: {
        ...result,
        testMode: testModeStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ตรวจสอบการเชื่อมต่อไม่สำเร็จ',
      error: error.message
    });
  }
});

// GET /api/emails/stats - Get email statistics
app.get('/api/emails/stats', checkAuth, async (req, res) => {
  try {
    const stats = await emailService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ดึงสถิติไม่สำเร็จ',
      error: error.message
    });
  }
});

// GET /api/emails/logs - Get email logs
app.get('/api/emails/logs', checkAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await emailService.getRecentLogs(limit);
    const parsedLogs = logs.map(log => {
      let parsedData = null;

      if (log.data !== null && log.data !== undefined) {
        if (typeof log.data === 'string') {
          try {
            parsedData = JSON.parse(log.data);
          } catch (_) {
            parsedData = log.data;
          }
        } else {
          parsedData = log.data;
        }
      }

      return {
        ...log,
        data: parsedData
      };
    });
    res.json({
      success: true,
      data: {
        count: parsedLogs.length,
        logs: parsedLogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ดึงประวัติไม่สำเร็จ',
      error: error.message
    });
  }
});

// POST /api/emails/send-template - Send email with template
app.post('/api/emails/send-template', checkAuth, async (req, res) => {
  try {
    const { to, template, data, recipientName, cc, bcc } = req.body;

    if (!to || !template) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอีเมลผู้รับ (to) และ template'
      });
    }

    if (!isValidTemplate(template)) {
      return res.status(400).json({
        success: false,
        message: `Template ไม่ถูกต้อง: ${template}`,
        availableTemplates: getAvailableTemplates()
      });
    }

    const result = await emailService.sendTemplateEmail({
      to,
      template,
      data: data || {},
      recipientName,
      cc,
      bcc
    });

    res.json({
      success: true,
      message: 'ส่งอีเมลสำเร็จ',
      data: result
    });
  } catch (error) {
    console.error('[Email API] sendTemplateEmail error:', error);
    res.status(500).json({
      success: false,
      message: 'ส่งอีเมลไม่สำเร็จ',
      error: error.message
    });
  }
});

// POST /api/emails/send-referral-result - Send referral result notification
app.post('/api/emails/send-referral-result', checkAuth, async (req, res) => {
  try {
    const { to, agentName, customerName, status, reason, isSelfReferral } = req.body;

    if (!to || !agentName || !customerName || !status) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ to, agentName, customerName และ status (approved/rejected)'
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status ต้องเป็น approved หรือ rejected'
      });
    }

    const result = await emailService.sendReferralResult({
      to,
      agentName,
      customerName,
      status,
      reason,
      isSelfReferral
    });

    res.json({
      success: true,
      message: `ส่งอีเมลแจ้งผล ${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'} สำเร็จ`,
      data: result
    });
  } catch (error) {
    console.error('[Email API] sendReferralResult error:', error);
    res.status(500).json({
      success: false,
      message: 'ส่งอีเมลไม่สำเร็จ',
      error: error.message
    });
  }
});

// POST /api/emails/preview - Preview template HTML
app.post('/api/emails/preview', checkAuth, async (req, res) => {
  try {
    const { template, data } = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ template'
      });
    }

    if (!isValidTemplate(template)) {
      return res.status(400).json({
        success: false,
        message: `Template ไม่ถูกต้อง: ${template}`,
        availableTemplates: getAvailableTemplates()
      });
    }

    const html = emailTemplates[template](data || {});
    res.json({
      success: true,
      data: { html }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'สร้าง preview ไม่สำเร็จ',
      error: error.message
    });
  }
});

// POST /api/emails/test - Send test email
app.post('/api/emails/test', checkAuth, async (req, res) => {
  try {
    const { to, template = 'FGF_Pass_2_agent' } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอีเมลผู้รับ (to)'
      });
    }

    const result = await emailService.sendTemplateEmail({
      to,
      template,
      data: {
        refereeName: 'คุณทดสอบ ระบบ',
        customerName: 'คุณกรรณิการ์ พวงผกา'
      },
      recipientName: 'คุณทดสอบ ระบบ'
    });

    res.json({
      success: true,
      message: 'ส่งอีเมลทดสอบสำเร็จ',
      data: result
    });
  } catch (error) {
    console.error('[Email API] sendTest error:', error);
    res.status(500).json({
      success: false,
      message: 'ส่งอีเมลทดสอบไม่สำเร็จ',
      error: error.message
    });
  }
});

// Setup associations
User.hasOne(Agent, { foreignKey: 'userId' });
Agent.belongsTo(User, { foreignKey: 'userId' });

Customer.belongsTo(Agent, { foreignKey: 'agentId' });
Agent.hasMany(Customer, { foreignKey: 'agentId' });

Customer.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(Customer, { foreignKey: 'projectId' });

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'ไม่พบ API endpoint ที่ต้องการ'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์',
    ...(config.server.nodeEnv === 'development' && { error: error.message })
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initDatabase();

    const server = app.listen(config.server.port, () => {
      console.log(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 API Base URL: http://${config.server.host}:${config.server.port}/api`);
      console.log(`🏥 Health Check: http://${config.server.host}:${config.server.port}/health`);
      console.log(`🗄️ Database: MySQL connected`);
      console.log(`👤 ทดสอบระบบ: admin@test.com/password`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();