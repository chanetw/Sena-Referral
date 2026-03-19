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

// Import models
const User = require('./src/models/User-cjs');
const Agent = require('./src/models/Agent-cjs');
const AgentType = require('./src/models/AgentType-cjs');
const Customer = require('./src/models/Customer-cjs');
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
  if (req.path.startsWith('/api') && req.path !== '/api/docs' && req.path !== '/api/docs/') {
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
      projects: '/api/projects/*'
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
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'dev-secret-sena-referral-2024',
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-sena-referral-2024');
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
  general: 'general'
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

const getNextAgentCode = async (transaction) => {
  const lastAgent = await Agent.findOne({
    order: [['agentCode', 'DESC']],
    attributes: ['agentCode'],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined
  });

  let nextNumber = 1;
  if (lastAgent && lastAgent.agentCode) {
    const lastNumber = parseInt(lastAgent.agentCode.replace('AG', ''), 10);
    if (!Number.isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `AG${nextNumber.toString().padStart(3, '0')}`;
};

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
          firstName: agent.firstName,
          lastName: agent.lastName,
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
    console.log('=== Register Agent Request ===');
    console.log('Request Body:', req.body);

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
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // Set password as ID card number
    const password = idCard;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้แล้ว',
        errorType: 'email'
      });
    }

    // Check if ID card already exists
    const existingAgent = await Agent.findOne({ where: { idCard } });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'เลขประจำตัวประชาชนนี้ถูกใช้แล้ว',
        errorType: 'idCard'
      });
    }

    // Check for duplicate phone (if provided)
    if (phone) {
      const existingPhone = await Agent.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({
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

    // Generate new agent code
    const existingAgents = await Agent.findAll({ order: [['agentCode', 'DESC']] });
    const existingCodes = existingAgents.map(a => a.agentCode);
    let newAgentCode;
    let codeNumber = 1;

    do {
      newAgentCode = `AG${String(codeNumber).padStart(3, '0')}`;
      codeNumber++;
    } while (existingCodes.includes(newAgentCode));

    // Create user first
    const newUser = await User.create({
      email,
      password,
      role: 'agent'
    });

    // Create agent
    const newAgent = await Agent.create({
      userId: newUser.id,
      agentTypeId: agentType.id,
      agentCode: newAgentCode,
      firstName,
      lastName,
      phone: phone || '',
      idCard,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'inactive' // Agent needs admin approval
    });

    res.status(201).json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ',
      data: {
        agentCode: newAgent.agentCode,
        firstName: newAgent.firstName,
        lastName: newAgent.lastName,
        email: newUser.email,
        status: newAgent.status,
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
    const existingUser = await User.findOne({ where: { email: requestPayload.email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว',
        errorType: 'email'
      });
    }

    const existingAgentByIdCard = await Agent.findOne({ where: { idCard: requestPayload.idCard } });
    if (existingAgentByIdCard) {
      return res.status(409).json({
        success: false,
        message: 'เลขประจำตัวประชาชนนี้ถูกใช้งานในระบบแล้ว',
        errorType: 'idCard'
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

      const agentCode = await getNextAgentCode(transaction);

      return Agent.create({
        userId: user.id,
        agentTypeId: agentType.id,
        agentCode,
        idCard: requestPayload.idCard,
        firstName: requestPayload.firstName,
        lastName: requestPayload.lastName,
        phone: requestPayload.phone || '',
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'active'
      }, { transaction });
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
    const agentTypes = await AgentType.findAll({
      where: { isActive: true },
      attributes: ['id', 'code', 'nameTh', 'sortOrder'],
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      message: 'ดึงประเภทเอเจนต์สำเร็จ',
      data: agentTypes.map((agentType) => ({
        id: agentType.id,
        code: agentType.code,
        nameTh: agentType.nameTh,
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

    // Search by name or agent code
    if (search) {
      const { Op } = require('sequelize');
      whereCondition[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { agentCode: { [Op.like]: `%${search}%` } }
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
          attributes: ['id', 'code', 'nameTh'],
          required: false
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
    // Get the latest agent code
    const latestAgent = await Agent.findOne({
      order: [['agentCode', 'DESC']],
      attributes: ['agentCode']
    });

    let nextCode = 'AG001'; // Default first code

    if (latestAgent && latestAgent.agentCode) {
      // Extract number from agent code (e.g., AG007 -> 7)
      const currentNumber = parseInt(latestAgent.agentCode.replace('AG', ''), 10);
      const nextNumber = currentNumber + 1;

      // Format next code with leading zeros (e.g., 8 -> AG008)
      nextCode = `AG${nextNumber.toString().padStart(3, '0')}`;
    }

    res.json({
      success: true,
      data: {
        nextAgentCode: nextCode
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
          attributes: ['id', 'code', 'nameTh'],
          required: false
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
    const { email, firstName, lastName, phone, idCard, agentTypeCode } = req.body;

    // Set password as ID card number if not provided
    const password = idCard;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้แล้ว'
      });
    }

    // Check if ID card already exists
    const existingAgent = await Agent.findOne({ where: { idCard } });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'เลขบัตรประชาชนนี้ถูกใช้แล้ว'
      });
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await Agent.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'เบอร์โทรศัพท์นี้ถูกใช้แล้ว'
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
    const agent = await Agent.create({
      userId: user.id,
      agentTypeId: agentType.id,
      agentCode,
      idCard,
      firstName,
      lastName,
      phone: phone || '',
      registrationDate: new Date(),
      status: 'active'
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

// PUT /api/agents/:id - Update agent
app.put('/api/agents/:id', checkAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { agentCode, firstName, lastName, phone, status } = req.body;

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

    // Update agent
    await agent.update({
      ...(agentCode && { agentCode }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(status && { status })
    });

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

    // Search by name, phone, or email
    if (search) {
      const { Op } = require('sequelize');
      whereCondition[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'agentCode', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectName'],
          required: false
        }
      ],
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

// POST /api/customers - Create new customer
app.post('/api/customers', checkAuth, async (req, res) => {
  try {
    const {
      customerCode, firstName, lastName, phone, email, idCard,
      agentId, projectId, budgetMin, budgetMax,
      status = 'new', source = 'referral', notes, referralType
    } = req.body;

    // Check for duplicate customerCode
    if (customerCode) {
      const existingCustomerCode = await Customer.findOne({ where: { customerCode } });
      if (existingCustomerCode) {
        return res.status(400).json({
          success: false,
          message: 'รหัสลูกค้านี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Check for duplicate phone
    if (phone) {
      const existingPhone = await Customer.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Check for duplicate email
    if (email) {
      const existingEmail = await Customer.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Check for duplicate ID card
    if (idCard) {
      const existingIdCard = await Customer.findOne({ where: { idCard } });
      if (existingIdCard) {
        return res.status(400).json({
          success: false,
          message: 'เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว'
        });
      }
    }

    // Verify agent exists
    if (agentId) {
      const agent = await Agent.findByPk(agentId);
      if (!agent) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบเอเจนต์ที่ระบุ'
        });
      }
    }

    // Create customer
    const customer = await Customer.create({
      customerCode: customerCode || null,
      firstName,
      lastName,
      phone: phone || null,
      email: email || null,
      idCard: idCard || null,
      agentId: agentId || null,
      projectId: projectId || null,
      budgetMin: budgetMin || null,
      budgetMax: budgetMax || null,
      status,
      source,
      notes: notes || null,
      referralType: referralType || null,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    // Get customer with relations
    const customerWithRelations = await Customer.findByPk(customer.id, {
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'agentCode', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectName'],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'สร้างลูกค้าใหม่สำเร็จ',
      data: customerWithRelations
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
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'agentCode', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectName'],
          required: false
        }
      ]
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
      status, source, notes, referralType
    } = req.body;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลลูกค้า'
      });
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

    // Update customer
    await customer.update({
      ...(customerCode !== undefined && { customerCode: customerCode || null }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(email !== undefined && { email: email || null }),
      ...(idCard !== undefined && { idCard: idCard || null }),
      ...(agentId !== undefined && { agentId: agentId || null }),
      ...(projectId !== undefined && { projectId: projectId || null }),
      ...(budgetMin !== undefined && { budgetMin: budgetMin || null }),
      ...(budgetMax !== undefined && { budgetMax: budgetMax || null }),
      ...(status && { status }),
      ...(source && { source }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(referralType !== undefined && { referralType: referralType || null }),
      updatedBy: req.user.id
    });

    // Get updated customer with relations
    const updatedCustomer = await Customer.findByPk(id, {
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'agentCode', 'firstName', 'lastName'],
          required: false
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectName'],
          required: false
        }
      ]
    });

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
      order: [['created_at', 'DESC']],
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
    const project = await Project.create(req.body);
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
    const [updated] = await Project.update(req.body, {
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