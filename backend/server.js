const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./src/config/config');

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

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
    message: 'Agent Referral System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      agents: '/api/agents/*',
      customers: '/api/customers/*',
      projects: '/api/projects/*'
    }
  });
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const { sequelize } = require('./src/config/database');
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'Database connection successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Auth routes placeholder
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาป้อนอีเมลและรหัสผ่าน'
    });
  }
  
  // Check admin login
  if (email === 'admin@test.com' && password === '123456') {
    return res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: {
          id: 1,
          email: 'admin@test.com',
          role: 'admin'
        },
        token: 'mock-jwt-token-admin'
      }
    });
  }
  
  // Check agent login
  const agent = mockAgents.find(a => a.email === email && a.password === password);
  
  if (agent) {
    if (agent.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'บัญचีของคุณยังไม่ได้รับการอนุมัติ กรุณารอการอนุมัติจากผู้ดูแลระบบ'
      });
    }
    
    if (agent.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
      });
    }
    
    return res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: {
          id: agent.id,
          email: agent.email,
          role: 'agent',
          agentId: agent.id,
          agentCode: agent.agentCode,
          firstName: agent.firstName,
          lastName: agent.lastName
        },
        token: `mock-jwt-token-agent-${agent.id}`
      }
    });
  }
  
  res.status(401).json({
    success: false,
    message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  });
});

// Get current user endpoint
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบ Token การเข้าถึงถูกปฏิเสธ'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Mock token validation for admin
  if (token === 'mock-jwt-token-admin') {
    return res.json({
      success: true,
      message: 'ดึงข้อมูลผู้ใช้สำเร็จ',
      data: {
        id: 1,
        email: 'admin@test.com',
        role: 'admin'
      }
    });
  }
  
  // Mock token validation for agents
  const agentTokenMatch = token.match(/^mock-jwt-token-agent-(\d+)$/);
  if (agentTokenMatch) {
    const agentId = parseInt(agentTokenMatch[1]);
    const agent = mockAgents.find(a => a.id === agentId);
    
    if (agent) {
      return res.json({
        success: true,
        message: 'ดึงข้อมูลผู้ใช้สำเร็จ',
        data: {
          id: agent.id,
          email: agent.email,
          role: 'agent',
          agentId: agent.id,
          agentCode: agent.agentCode,
          firstName: agent.firstName,
          lastName: agent.lastName,
          status: agent.status
        }
      });
    }
  }
  
  res.status(401).json({
    success: false,
    message: 'Token ไม่ถูกต้อง'
  });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ'
  });
});

// Mock data for agents
let mockAgents = [
  {
    id: 1,
    agentCode: 'AG001',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'somchai@example.com',
    phone: '081-123-4567',
    idCard: '1234567890123',
    password: '123456', // For testing
    status: 'active',
    registrationDate: '2023-01-15',
    createdAt: '2023-01-15T10:00:00Z'
  },
  {
    id: 2,
    agentCode: 'AG002',
    firstName: 'สุมาลี',
    lastName: 'สวยงาม',
    email: 'sumalee@example.com',
    phone: '082-234-5678',
    idCard: '2345678901234',
    password: '123456', // For testing
    status: 'active',
    registrationDate: '2023-02-20',
    createdAt: '2023-02-20T14:30:00Z'
  },
  {
    id: 3,
    agentCode: 'AG003',
    firstName: 'วิชาญ',
    lastName: 'เก่งจริง',
    email: 'wichan@example.com',
    phone: '083-345-6789',
    idCard: '3456789012345',
    password: '123456', // For testing
    status: 'inactive',
    registrationDate: '2023-03-10',
    createdAt: '2023-03-10T09:15:00Z'
  }
];

// Reset data endpoint for development
app.post('/api/reset-data', (req, res) => {
  mockAgents = [
    {
      id: 1,
      agentCode: 'AG001',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      email: 'somchai@example.com',
      phone: '081-123-4567',
      idCard: '1234567890123',
      password: '123456',
      status: 'active',
      registrationDate: '2023-01-15',
      createdAt: '2023-01-15T10:00:00Z'
    }
  ];
  
  res.json({
    success: true,
    message: 'ล้างข้อมูลสำเร็จ',
    data: { agentsCount: mockAgents.length }
  });
});

// Agent Registration endpoint
app.post('/api/auth/register-agent', (req, res) => {
  console.log('=== Register Agent Request ===');
  console.log('Request Body:', req.body);
  
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    idCard, 
    password 
  } = req.body;
  
  console.log('Extracted fields:', { firstName, lastName, email, phone, idCard, password: password ? '***' : 'undefined' });
  
  // Basic validation
  if (!firstName || !lastName || !email || !idCard || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }
  
  // Check if email or ID card already exists
  console.log('Checking for existing agent...');
  console.log('Current mockAgents:', mockAgents.map(a => ({ email: a.email, idCard: a.idCard, phone: a.phone })));
  
  // Check for duplicate email
  const existingEmail = mockAgents.find(a => a.email === email);
  if (existingEmail) {
    console.log('Found existing email:', existingEmail.email);
    return res.status(400).json({
      success: false,
      message: 'อีเมลนี้ถูกใช้แล้ว',
      errorType: 'email',
      existingData: {
        email: existingEmail.email,
        agentCode: existingEmail.agentCode,
        firstName: existingEmail.firstName,
        lastName: existingEmail.lastName
      }
    });
  }
  
  // Check for duplicate ID card
  const existingIdCard = mockAgents.find(a => a.idCard === idCard);
  if (existingIdCard) {
    console.log('Found existing ID card:', existingIdCard.idCard);
    return res.status(400).json({
      success: false,
      message: 'เลขประจำตัวประชาชนนี้ถูกใช้แล้ว',
      errorType: 'idCard',
      existingData: {
        idCard: existingIdCard.idCard,
        agentCode: existingIdCard.agentCode,
        firstName: existingIdCard.firstName,
        lastName: existingIdCard.lastName
      }
    });
  }
  
  // Check for duplicate phone (if provided)
  if (phone) {
    const existingPhone = mockAgents.find(a => a.phone === phone);
    if (existingPhone) {
      console.log('Found existing phone:', existingPhone.phone);
      return res.status(400).json({
        success: false,
        message: 'เบอร์โทรนี้ถูกใช้แล้ว',
        errorType: 'phone',
        existingData: {
          phone: existingPhone.phone,
          agentCode: existingPhone.agentCode,
          firstName: existingPhone.firstName,
          lastName: existingPhone.lastName
        }
      });
    }
  }
  
  // Generate new agent code
  const existingCodes = mockAgents.map(a => a.agentCode);
  let newAgentCode;
  let codeNumber = 1;
  
  do {
    newAgentCode = `AG${String(codeNumber).padStart(3, '0')}`;
    codeNumber++;
  } while (existingCodes.includes(newAgentCode));
  
  const newAgent = {
    id: Math.max(...mockAgents.map(a => a.id)) + 1,
    agentCode: newAgentCode,
    firstName,
    lastName,
    email,
    phone: phone || '',
    idCard,
    password, // In real app, this should be hashed
    status: 'pending', // Agent needs admin approval
    registrationDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  
  mockAgents.push(newAgent);
  
  res.status(201).json({
    success: true,
    message: 'ลงทะเบียนสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ',
    data: {
      agentCode: newAgent.agentCode,
      firstName: newAgent.firstName,
      lastName: newAgent.lastName,
      email: newAgent.email,
      status: newAgent.status
    }
  });
});

// Helper function to check auth
const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบ Token การเข้าถึงถูกปฏิเสธ'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Check admin token
  if (token === 'mock-jwt-token-admin') {
    req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
    return next();
  }
  
  // Check agent token
  const agentTokenMatch = token.match(/^mock-jwt-token-agent-(\d+)$/);
  if (agentTokenMatch) {
    const agentId = parseInt(agentTokenMatch[1]);
    const agent = mockAgents.find(a => a.id === agentId);
    
    if (agent && agent.status === 'active') {
      req.user = { 
        id: agent.id, 
        email: agent.email, 
        role: 'agent',
        agentId: agent.id,
        agentCode: agent.agentCode
      };
      return next();
    }
  }
  
  return res.status(401).json({
    success: false,
    message: 'Token ไม่ถูกต้อง'
  });
};

// Agents API endpoints
// GET /api/agents - Get all agents
app.get('/api/agents', checkAuth, (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  
  let filteredAgents = [...mockAgents];
  
  // Filter by status
  if (status && status !== 'all') {
    filteredAgents = filteredAgents.filter(agent => agent.status === status);
  }
  
  // Search by name or agent code
  if (search) {
    const searchLower = search.toLowerCase();
    filteredAgents = filteredAgents.filter(agent => 
      agent.firstName.toLowerCase().includes(searchLower) ||
      agent.lastName.toLowerCase().includes(searchLower) ||
      agent.agentCode.toLowerCase().includes(searchLower) ||
      agent.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    message: 'ดึงข้อมูลเอเจนต์สำเร็จ',
    data: paginatedAgents,
    pagination: {
      current: parseInt(page),
      pageSize: parseInt(limit),
      total: filteredAgents.length,
      totalPages: Math.ceil(filteredAgents.length / limit)
    }
  });
});

// GET /api/agents/list - Get agents list for dropdown (MUST BE BEFORE :id route)
app.get('/api/agents/list', checkAuth, (req, res) => {
  console.log('=== API /api/agents/list called ===');
  console.log('Total agents:', mockAgents.length);
  console.log('Agents data:', mockAgents.map(a => ({ id: a.id, code: a.agentCode, name: `${a.firstName} ${a.lastName}`, status: a.status })));
  
  const agentsList = mockAgents
    .filter(agent => agent.status === 'active')
    .map(agent => ({
      id: agent.id,
      agentCode: agent.agentCode,
      firstName: agent.firstName,
      lastName: agent.lastName,
      fullName: `${agent.agentCode} - ${agent.firstName} ${agent.lastName}`
    }));
  
  console.log('Filtered active agents:', agentsList.length);
  console.log('Active agents list:', agentsList);
  
  res.json({
    success: true,
    message: 'ดึงรายชื่อเอเจนต์สำเร็จ',
    data: agentsList
  });
});

// GET /api/agents/:id - Get agent by ID
app.get('/api/agents/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const agent = mockAgents.find(a => a.id === parseInt(id));
  
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
});

// POST /api/agents - Create new agent
app.post('/api/agents', checkAuth, (req, res) => {
  const { 
    agentCode, 
    firstName, 
    lastName, 
    email, 
    phone, 
    idCard, 
    registrationDate 
  } = req.body;
  
  // Basic validation
  if (!agentCode || !firstName || !lastName || !email || !idCard) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }
  
  // Check if agent code or email already exists
  const existingAgent = mockAgents.find(a => 
    a.agentCode === agentCode || a.email === email || a.idCard === idCard
  );
  
  if (existingAgent) {
    return res.status(400).json({
      success: false,
      message: 'รหัสเอเจนต์ อีเมล หรือเลขประจำตัวประชาชนซ้ำ'
    });
  }
  
  const newAgent = {
    id: Math.max(...mockAgents.map(a => a.id)) + 1,
    agentCode,
    firstName,
    lastName,
    email,
    phone: phone || '',
    idCard,
    status: 'active',
    registrationDate: registrationDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  
  mockAgents.push(newAgent);
  
  res.status(201).json({
    success: true,
    message: 'เพิ่มเอเจนต์สำเร็จ',
    data: newAgent
  });
});

// PUT /api/agents/:id - Update agent
app.put('/api/agents/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const agentIndex = mockAgents.findIndex(a => a.id === parseInt(id));
  
  if (agentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบข้อมูลเอเจนต์'
    });
  }
  
  const { firstName, lastName, phone, status } = req.body;
  
  // Update agent
  mockAgents[agentIndex] = {
    ...mockAgents[agentIndex],
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(phone && { phone }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'อัพเดทข้อมูลเอเจนต์สำเร็จ',
    data: mockAgents[agentIndex]
  });
});

// DELETE /api/agents/:id - Delete agent
app.delete('/api/agents/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const agentIndex = mockAgents.findIndex(a => a.id === parseInt(id));
  
  if (agentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบข้อมูลเอเจนต์'
    });
  }
  
  const deletedAgent = mockAgents.splice(agentIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'ลบเอเจนต์สำเร็จ',
    data: deletedAgent
  });
});

// PUT /api/agents/profile - Update agent's own profile
app.put('/api/agents/profile', checkAuth, (req, res) => {
  console.log('=== PUT /api/agents/profile Debug ===');
  console.log('User from token:', req.user);
  console.log('Request body:', req.body);
  
  // Only agents can update their own profile
  if (req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'เฉพาะเอเจนต์เท่านั้นที่สามารถแก้ไขข้อมูลส่วนตัวได้'
    });
  }
  
  const agentId = req.user.agentId;
  const agentIndex = mockAgents.findIndex(a => a.id === agentId);
  
  if (agentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบข้อมูลเอเจนต์'
    });
  }
  
  const { phone } = req.body;
  
  // Agents can only update their phone number
  // firstName and lastName can only be updated by Admin
  
  // Update agent data (only phone)
  mockAgents[agentIndex] = {
    ...mockAgents[agentIndex],
    phone: phone || '',
    updatedAt: new Date().toISOString()
  };
  
  const updatedAgent = mockAgents[agentIndex];
  
  // Return updated agent data (without password)
  const { password, ...agentData } = updatedAgent;
  
  console.log('Updated agent:', agentData);
  
  res.json({
    success: true,
    message: 'อัพเดทเบอร์โทรสำเร็จ',
    data: {
      id: agentData.id,
      email: agentData.email,
      role: 'agent',
      agentId: agentData.id,
      agentCode: agentData.agentCode,
      firstName: agentData.firstName,
      lastName: agentData.lastName,
      phone: agentData.phone,
      status: agentData.status
    }
  });
});

// Mock data for customers
let mockCustomers = [
  {
    id: 1,
    customerCode: 'CU001',
    firstName: 'นพดล',
    lastName: 'สุขใจ',
    email: 'napadol@example.com',
    phone: '081-111-2222',
    idCard: '1111111111111',
    address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110',
    agentId: 1,
    status: 'active',
    registrationDate: '2023-06-01',
    createdAt: '2023-06-01T10:00:00Z'
  },
  {
    id: 2,
    customerCode: 'CU002',
    firstName: 'สมหญิง',
    lastName: 'ใจดี',
    email: 'somying@example.com',
    phone: '082-222-3333',
    idCard: '2222222222222',
    address: '456 ถนนรัชดาภิเษก แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    agentId: 1,
    status: 'active',
    registrationDate: '2023-06-15',
    createdAt: '2023-06-15T14:30:00Z'
  },
  {
    id: 3,
    customerCode: 'CU003',
    firstName: 'วิชาญ',
    lastName: 'มั่งมี',
    email: 'wichan.customer@example.com',
    phone: '083-333-4444',
    idCard: '3333333333333',
    address: '789 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400',
    agentId: 2,
    status: 'inactive',
    registrationDate: '2023-07-10',
    createdAt: '2023-07-10T09:15:00Z'
  },
  {
    id: 4,
    customerCode: 'CU004',
    firstName: 'นิภา',
    lastName: 'รุ่งเรือง',
    email: 'nipha@example.com',
    phone: '084-444-5555',
    idCard: '4444444444444',
    address: '321 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400',
    agentId: 2,
    status: 'active',
    registrationDate: '2023-07-20',
    createdAt: '2023-07-20T16:45:00Z'
  },
  {
    id: 5,
    customerCode: 'CU005',
    firstName: 'สมศักดิ์',
    lastName: 'พันธุ์ดี',
    email: 'somsak@example.com',
    phone: '085-555-6666',
    idCard: '5555555555555',
    address: '654 ถนนลาดพร้าว แขวงวังทองหลาง เขตวังทองหลาง กรุงเทพฯ 10310',
    agentId: 3,
    status: 'active',
    registrationDate: '2023-08-01',
    createdAt: '2023-08-01T11:20:00Z'
  }
];

// Customers API endpoints
// GET /api/customers - Get all customers
app.get('/api/customers', checkAuth, (req, res) => {
  const { page = 1, limit = 10, status, search, agentId } = req.query;
  
  let filteredCustomers = [...mockCustomers];
  
  // Filter by status
  if (status && status !== 'all') {
    filteredCustomers = filteredCustomers.filter(customer => customer.status === status);
  }
  
  // Filter by agent
  if (agentId && agentId !== 'all') {
    filteredCustomers = filteredCustomers.filter(customer => customer.agentId === parseInt(agentId));
  }
  
  // Search by name, customer code, email, or phone
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName.toLowerCase().includes(searchLower) ||
      customer.customerCode.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower)
    );
  }
  
  // Add agent info to each customer
  filteredCustomers = filteredCustomers.map(customer => {
    const agent = mockAgents.find(a => a.id === customer.agentId);
    return {
      ...customer,
      agent: agent ? {
        id: agent.id,
        agentCode: agent.agentCode,
        firstName: agent.firstName,
        lastName: agent.lastName
      } : null
    };
  });
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    message: 'ดึงข้อมูลลูกค้าสำเร็จ',
    data: paginatedCustomers,
    pagination: {
      current: parseInt(page),
      pageSize: parseInt(limit),
      total: filteredCustomers.length,
      totalPages: Math.ceil(filteredCustomers.length / limit)
    }
  });
});

// GET /api/customers/:id - Get customer by ID
app.get('/api/customers/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const customer = mockCustomers.find(c => c.id === parseInt(id));
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบข้อมูลลูกค้า'
    });
  }
  
  // Add agent info
  const agent = mockAgents.find(a => a.id === customer.agentId);
  const customerWithAgent = {
    ...customer,
    agent: agent ? {
      id: agent.id,
      agentCode: agent.agentCode,
      firstName: agent.firstName,
      lastName: agent.lastName
    } : null
  };
  
  res.json({
    success: true,
    message: 'ดึงข้อมูลลูกค้าสำเร็จ',
    data: customerWithAgent
  });
});

// POST /api/customers - Create new customer
app.post('/api/customers', checkAuth, (req, res) => {
  console.log('=== POST /api/customers Debug ===');
  console.log('Request body:', req.body);
  
  const { 
    customerCode, 
    firstName, 
    lastName, 
    email, 
    phone, 
    idCard, 
    address,
    agentId,
    registrationDate 
  } = req.body;
  
  console.log('Extracted values:', {
    customerCode,
    firstName,
    lastName,
    email,
    phone,
    idCard,
    address,
    agentId,
    registrationDate
  });
  
  // Basic validation
  if (!customerCode || !firstName || !lastName || !email || !idCard || !agentId) {
    console.log('Validation failed - missing required fields');
    console.log('Missing:', {
      customerCode: !customerCode,
      firstName: !firstName,
      lastName: !lastName,
      email: !email,
      idCard: !idCard,
      agentId: !agentId
    });
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }
  
  // Check if customer code or email already exists
  const existingCustomer = mockCustomers.find(c => 
    c.customerCode === customerCode || c.email === email || c.idCard === idCard
  );
  
  if (existingCustomer) {
    console.log('Duplicate customer found:', existingCustomer);
    console.log('Checking against:', { customerCode, email, idCard });
    return res.status(400).json({
      success: false,
      message: 'รหัสลูกค้า อีเมล หรือเลขประจำตัวประชาชนซ้ำ'
    });
  }
  
  // Check if agent exists
  console.log('Looking for agent with ID:', agentId, 'parsed:', parseInt(agentId));
  console.log('Available agents:', mockAgents.map(a => ({ id: a.id, code: a.agentCode, name: `${a.firstName} ${a.lastName}` })));
  
  const agent = mockAgents.find(a => a.id === parseInt(agentId));
  if (!agent) {
    console.log('Agent not found for ID:', agentId);
    return res.status(400).json({
      success: false,
      message: 'ไม่พบข้อมูลเอเจนต์ที่เลือก'
    });
  }
  
  console.log('Agent found:', { id: agent.id, code: agent.agentCode, name: `${agent.firstName} ${agent.lastName}` });
  
  const newCustomer = {
    id: Math.max(...mockCustomers.map(c => c.id)) + 1,
    customerCode,
    firstName,
    lastName,
    email,
    phone: phone || '',
    idCard,
    address: address || '',
    agentId: parseInt(agentId),
    status: 'active',
    registrationDate: registrationDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  
  mockCustomers.push(newCustomer);
  
  // Add agent info to response
  const customerWithAgent = {
    ...newCustomer,
    agent: {
      id: agent.id,
      agentCode: agent.agentCode,
      firstName: agent.firstName,
      lastName: agent.lastName
    }
  };
  
  res.status(201).json({
    success: true,
    message: 'เพิ่มลูกค้าสำเร็จ',
    data: customerWithAgent
  });
});

// PUT /api/customers/:id - Update customer
app.put('/api/customers/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const customerIndex = mockCustomers.findIndex(c => c.id === parseInt(id));
  
  if (customerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบข้อมูลลูกค้า'
    });
  }
  
  const { firstName, lastName, phone, address, agentId, status } = req.body;
  
  // If agentId is being updated, check if agent exists
  if (agentId && agentId !== mockCustomers[customerIndex].agentId) {
    const agent = mockAgents.find(a => a.id === parseInt(agentId));
    if (!agent) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบข้อมูลเอเจนต์ที่เลือก'
      });
    }
  }
  
  // Update customer
  mockCustomers[customerIndex] = {
    ...mockCustomers[customerIndex],
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(phone && { phone }),
    ...(address && { address }),
    ...(agentId && { agentId: parseInt(agentId) }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };
  
  // Add agent info to response
  const agent = mockAgents.find(a => a.id === mockCustomers[customerIndex].agentId);
  const customerWithAgent = {
    ...mockCustomers[customerIndex],
    agent: agent ? {
      id: agent.id,
      agentCode: agent.agentCode,
      firstName: agent.firstName,
      lastName: agent.lastName
    } : null
  };
  
  res.json({
    success: true,
    message: 'อัพเดทข้อมูลลูกค้าสำเร็จ',
    data: customerWithAgent
  });
});

// DELETE /api/customers/:id - Delete customer
app.delete('/api/customers/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const customerIndex = mockCustomers.findIndex(c => c.id === parseInt(id));
  
  if (customerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบข้อมูลลูกค้า'
    });
  }
  
  const deletedCustomer = mockCustomers.splice(customerIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'ลบลูกค้าสำเร็จ',
    data: deletedCustomer
  });
});

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
    const server = app.listen(config.server.port, () => {
      console.log(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
      console.log(`📊 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 API Base URL: http://${config.server.host}:${config.server.port}/api`);
      console.log(`🏥 Health Check: http://${config.server.host}:${config.server.port}/health`);
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