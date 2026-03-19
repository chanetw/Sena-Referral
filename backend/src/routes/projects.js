import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Placeholder for project management routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Project routes - Coming soon',
    data: []
  });
});

export default router;