const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/contabilidad.controller');

router.use(authMiddleware);

router.get('/resumen',   ctrl.resumen);
router.get('/ingresos',  ctrl.ingresos);
router.get('/gastos',    ctrl.listarGastos);

router.post('/gastos',
  [
    body('concepto').notEmpty().withMessage('Concepto requerido'),
    body('monto').isFloat({ min: 0.01 }).withMessage('Monto inválido'),
    body('categoria').isIn(['INGREDIENTES', 'SERVICIOS', 'NOMINA', 'MANTENIMIENTO', 'OTRO']).withMessage('Categoría inválida'),
  ],
  validate,
  ctrl.crearGasto
);

router.put('/gastos/:id',
  param('id').notEmpty(),
  validate,
  ctrl.actualizarGasto
);

router.delete('/gastos/:id',
  param('id').notEmpty(),
  validate,
  ctrl.eliminarGasto
);

module.exports = router;
