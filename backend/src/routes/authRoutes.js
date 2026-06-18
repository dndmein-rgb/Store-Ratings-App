import express from 'express';
import { signup, login, updatePassword, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import handleValidation from '../middleware/validate.js';
import { nameRule, emailRule, addressRule, passwordRule } from '../utils/validators.js';
import { body } from 'express-validator';

const router = express.Router();

router.post('/signup', [nameRule, emailRule, addressRule, passwordRule], handleValidation, signup);
router.post('/login', [
  body('email').trim().isEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
], handleValidation, login);
router.get('/me', authenticate, getMe);
router.put('/password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;'/]).{8,16}$/).withMessage('New password must be 8-16 characters with at least one uppercase letter and one special character'),
], handleValidation, updatePassword);

export default router;
