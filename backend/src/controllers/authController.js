import jwt from 'jsonwebtoken';
import { User, Agent } from '../models/index.js';
import config from '../config/config.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { email, password, role = 'agent' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้มีผู้ใช้งานแล้ว'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      role
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        user,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาป้อนอีเมลและรหัสผ่าน'
      });
    }

    // Check if user exists and include password for comparison
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Agent,
        as: 'agent'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'บัญชีผู้ใช้ถูกระงับ'
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

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Agent,
        as: 'agent'
      }]
    });

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ Refresh Token'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      // Get user
      const user = await User.findByPk(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Refresh Token ไม่ถูกต้อง'
        });
      }

      // Generate new tokens
      const newToken = generateToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      res.json({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Refresh Token หมดอายุหรือไม่ถูกต้อง'
      });
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการต่ออายุ Token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาป้อนรหัสผ่านปัจจุบันและรหัสผ่านใหม่'
      });
    }

    // Get user with password
    const user = await User.findByPk(req.user.id);

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
      });
    }

    // Update password
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
    });
  }
};