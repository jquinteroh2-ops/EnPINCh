const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/dashboard.controller');

router.use(authMiddleware);

router.get('/resumen',      ctrl.resumen);
router.get('/ventas',       ctrl.ventas);
router.get('/actividad',    ctrl.actividadReciente);

module.exports = router;
