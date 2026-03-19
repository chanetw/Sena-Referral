import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Placeholder for user management routes
router.get('/', authorize('admin', 'manager'), (req, res) => {
  res.json({
    success: true,
    message: 'User routes - Coming soon',
    data: []
  });
});

export default router;