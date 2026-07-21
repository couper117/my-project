const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const rCtrl = require('../controllers/reportController');
const uCtrl = require('../controllers/userController');

router.use(authenticate);

// ---------- REPORTS ----------
router.get('/reports/summary',      rCtrl.getSummary);
router.get('/reports/stock',        rCtrl.getStock);
router.get('/reports/daily',        rCtrl.getDaily);
router.get('/reports/monthly',      rCtrl.getMonthly);
router.get('/reports/yearly',       rCtrl.getYearly);
router.get('/reports/export',       authorize('Admin'), rCtrl.exportCSV);
router.get('/reports/export/pdf',   authorize('Admin'), rCtrl.exportPDF);

// ---------- USERS (Admin only) ----------
router.get('/users',         authorize('Admin'), uCtrl.getAll);
router.get('/users/:id',     authorize('Admin'), uCtrl.getById);
router.put('/users/:id/role',authorize('Admin'), uCtrl.updateRole);
router.delete('/users/:id',  authorize('Admin'), uCtrl.remove);

module.exports = router;
