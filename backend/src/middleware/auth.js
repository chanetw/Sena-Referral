import jwt from 'jsonwebtoken';
import { User, Agent } from '../models/index.js';
import config from '../config/config.js';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ Token การเข้าถึงถูกปฏิเสธ'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from token
      const user = await User.findByPk(decoded.id, {
        include: [{
          model: Agent,
          as: 'agent'
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'ไม่พบผู้ใช้งาน Token ไม่ถูกต้อง'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'บัญชีผู้ใช้ถูกระงับ'
        });
      }

      // Add user to request
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token หมดอายุแล้ว'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token ไม่ถูกต้อง'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'การยืนยันตัวตนล้มเหลว'
        });
      }
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `บทบาท ${req.user.role} ไม่มีสิทธิ์เข้าถึงรีซอร์สนี้`
      });
    }
    next();
  };
};

// Check if user is agent owner or admin
export const authorizeAgentOrAdmin = async (req, res, next) => {
  try {
    const { role } = req.user;
    
    // Admin can access everything
    if (role === 'admin' || role === 'manager') {
      return next();
    }

    // For agent role, check if they own the resource
    if (role === 'agent') {
      const agentId = req.params.agentId || req.body.agentId || req.query.agentId;
      
      if (!agentId) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบ Agent ID'
        });
      }

      // Check if the authenticated user's agent ID matches the requested agent ID
      if (req.user.agent && req.user.agent.id.toString() === agentId.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลของเอเจนต์คนอื่น'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'สิทธิ์ไม่เพียงพอ'
    });

  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
    });
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findByPk(decoded.id, {
          include: [{
            model: Agent,
            as: 'agent'
          }]
        });

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors in optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};