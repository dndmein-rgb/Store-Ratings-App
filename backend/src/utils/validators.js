import { body } from 'express-validator';

// Shared field rules, kept in one place so signup/admin-create/password-update
// all enforce the exact same constraints from the spec.

const nameRule = body('name')
  .trim()
  .isLength({ min: 20, max: 60 })
  .withMessage('Name must be between 20 and 60 characters');

const emailRule = body('email')
  .trim()
  .isEmail()
  .withMessage('Please enter a valid email address')
  .normalizeEmail();

const addressRule = body('address')
  .trim()
  .isLength({ min: 1, max: 400 })
  .withMessage('Address is required and must not exceed 400 characters');

// 8-16 chars, at least one uppercase letter, at least one special character.
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;'/]).{8,16}$/;

const passwordRule = body('password')
  .matches(passwordRegex)
  .withMessage(
    'Password must be 8-16 characters and include at least one uppercase letter and one special character'
  );

export {
  nameRule,
  emailRule,
  addressRule,
  passwordRule,
  passwordRegex,
};
