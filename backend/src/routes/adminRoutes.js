import express from 'express';
import {
  getDashboard,
  createUser,
  listUsers,
  getUserById,
  createStore,
  listStores,
  listStoreOwners,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import handleValidation from '../middleware/validate.js';
import { nameRule, emailRule, addressRule, passwordRule } from '../utils/validators.js';

const router = express.Router();

// Every route here is admin-only.
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboard);

router.post('/users', [nameRule, emailRule, addressRule, passwordRule], handleValidation, createUser);
router.get('/users', listUsers);
router.get('/users/:id', getUserById);

router.post('/stores', [nameRule, emailRule, addressRule], handleValidation, createStore);
router.get('/stores', listStores);
router.get('/store-owners', listStoreOwners);

export default router;
