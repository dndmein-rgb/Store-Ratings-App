import express from 'express';
import { getDashboard } from '../controllers/storeOwnerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('STORE_OWNER'));

router.get('/dashboard', getDashboard);

export default router;
