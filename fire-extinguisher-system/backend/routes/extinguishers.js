const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/extinguisherController');

const extRules = [
  body('serial_number').trim().notEmpty().withMessage('Serial number required'),
  body('type').isIn(['Water', 'CO2', 'Foam', 'Dry Chemical']).withMessage('Invalid type'),
  body('size').isIn(['2.5 lbs', '5 lbs', '9 lbs', '12 lbs']).withMessage('Invalid size'),
  body('location').trim().notEmpty().withMessage('Location required'),
  body('installation_date').isDate().withMessage('Valid installation date required'),
  body('expiry_date').isDate().withMessage('Valid expiry date required'),
  body('status').optional().isIn(['Active', 'Expired', 'Under Maintenance', 'Decommissioned']),
];

// All routes require authentication
router.use(authenticate);

// GET /api/extinguishers
router.get('/', ctrl.getAll);

// GET /api/extinguishers/:id
router.get('/:id', ctrl.getById);

// POST /api/extinguishers — Admin/Inspector only
router.post('/', authorize('Admin', 'Inspector'), extRules, ctrl.create);

// PUT /api/extinguishers/:id — Admin/Inspector only
router.put('/:id', authorize('Admin', 'Inspector'), extRules, ctrl.update);

// DELETE /api/extinguishers/:id — Admin only
router.delete('/:id', authorize('Admin'), ctrl.remove);

module.exports = router;
