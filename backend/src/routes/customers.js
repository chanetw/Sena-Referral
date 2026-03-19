import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer management routes
router
  .route('/')
  .get(authorize('admin', 'manager'), getCustomers)
  .post(authorize('admin', 'manager'), createCustomer);

router
  .route('/:id')
  .put(authorize('admin', 'manager'), updateCustomer)
  .delete(authorize('admin', 'manager'), deleteCustomer);

export default router;
