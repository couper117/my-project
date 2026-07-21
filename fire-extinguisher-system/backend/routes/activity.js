const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const iCtrl = require('../controllers/inspectionController');
const mCtrl = require('../controllers/maintenanceController');

router.use(authenticate);

// ---------- INSPECTIONS ----------
// GET /api/inspections
router.get('/inspections', iCtrl.getAll);

// GET /api/inspections/:id
router.get('/inspections/:id', iCtrl.getById);

// POST /api/inspections/schedule — any authenticated user can schedule
router.post('/inspections/schedule', [
  body('extinguisher_id').isInt().withMessage('Valid extinguisher ID required'),
  body('scheduled_date').isISO8601().withMessage('Valid date required'),
], iCtrl.schedule);

// POST /api/inspections — Inspector/Admin log result
router.post('/inspections', authorize('Admin', 'Inspector'), [
  body('extinguisher_id').isInt(),
  body('inspection_date').isISO8601(),
  body('status').isIn(['Pass', 'Fail', 'Pending']),
], iCtrl.create);

// ---------- MAINTENANCE ----------
// GET /api/maintenance
router.get('/maintenance', mCtrl.getAll);

// GET /api/maintenance/:id
router.get('/maintenance/:id', mCtrl.getById);

// POST /api/maintenance — Inspector/Admin only
router.post('/maintenance', authorize('Admin', 'Inspector'), [
  body('extinguisher_id').isInt(),
  body('maintenance_date').isISO8601(),
  body('action_taken').notEmpty().withMessage('Action taken is required'),
], mCtrl.create);

module.exports = router;
