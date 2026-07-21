const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const registerRules = [
  body('first_name').trim().notEmpty().withMessage('First name required'),
  body('last_name').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Admin', 'Inspector', 'User']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

// POST /api/auth/register
router.post('/register', registerRules, ctrl.register);

// POST /api/auth/login
router.post('/login', loginRules, ctrl.login);

// GET /api/auth/profile
router.get('/profile', authenticate, ctrl.getProfile);

// PUT /api/auth/profile
router.put('/profile', authenticate, [
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
], ctrl.updateProfile);

// PUT /api/auth/change-password
router.put('/change-password', authenticate, ctrl.changePassword);

// POST /api/auth/forgot-password
router.post('/forgot-password', ctrl.recoverPassword);

module.exports = router;
