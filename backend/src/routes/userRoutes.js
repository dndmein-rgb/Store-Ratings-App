import express from 'express';
import { listStoresForUser, submitRating } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Normal users only.
router.use(authenticate, authorize('USER'));

router.get('/stores', listStoresForUser);
router.post('/stores/:storeId/rating', submitRating);

export default router;
