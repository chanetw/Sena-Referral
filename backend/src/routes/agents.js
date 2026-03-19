import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getAgents } from '../controllers/agentController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Agent management routes
router.get('/', authorize('admin', 'manager'), getAgents);

export default router;