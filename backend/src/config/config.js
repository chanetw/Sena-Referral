require('dotenv').config();

// Helper: parse comma-separated origins into array; default to common dev ports
const parseOrigins = (val) => {
  if (!val || typeof val !== 'string') return ['http://localhost:5173', 'http://localhost:3000'];
  const parts = val.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : ['http://localhost:5173', 'http://localhost:3000'];
};

const config = {
  server: {
    port: process.env.PORT || 5001,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'referral_system',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  activation: {
    secret: process.env.ACTIVATION_TOKEN_SECRET || process.env.JWT_SECRET || 'your-activation-secret',
    issuer: process.env.ACTIVATION_TOKEN_ISSUER || 'external-registration-web',
    audience: process.env.ACTIVATION_TOKEN_AUDIENCE || 'sena-agent-api',
    maxAge: process.env.ACTIVATION_TOKEN_MAX_AGE || '30m',
    rateLimitWindowMs: parseInt(process.env.ACTIVATION_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    rateLimitMaxRequests: parseInt(process.env.ACTIVATION_RATE_LIMIT_MAX_REQUESTS) || 20
  },
  
  cors: {
    origin: parseOrigins(process.env.CORS_ORIGIN),
    credentials: true
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },
  
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD
  },
  
  // Server-to-server register API key
  // ต้องตั้งค่าใน production — ถ้าไม่ตั้งค่า endpoint /api/auth/register จะถูกบล็อกทั้งหมด
  registerApiKey: {
    key: process.env.REGISTER_API_KEY || '',
    rateLimit: {
      windowMs: parseInt(process.env.REGISTER_API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: parseInt(process.env.REGISTER_API_RATE_LIMIT_MAX_REQUESTS) || 30
    }
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  }
};

module.exports = config;
