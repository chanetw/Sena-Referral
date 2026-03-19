import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  refreshToken, 
  logout, 
  changePassword 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateAuth } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateAuth.register, register);
router.post('/login', validateAuth.login, login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(protect); // All routes below require authentication

router.get('/me', getMe);
router.post('/logout', logout);
router.put('/change-password', validateAuth.changePassword, changePassword);

export default router;