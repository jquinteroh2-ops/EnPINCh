const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/reservas.controller');

router.use(authMiddleware);

router.get('/', ctrl.listar);

router.get('/:id',
  param('id').notEmpty(),
  validate,
  ctrl.obtener
);

router.post('/',
  [
    body('nombreCliente').notEmpty().withMessage('Nombre requerido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('hora').notEmpty().withMessage('Hora requerida'),
    body('personas').isInt({ min: 1 }).withMessage('Número de personas inválido'),
  ],
  validate,
  ctrl.crear
);

router.patch('/:id/estado',
  [
    param('id').notEmpty(),
    body('estado').isIn(['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA']).withMessage('Estado inválido'),
  ],
  validate,
  ctrl.actualizarEstado
);

router.put('/:id',
  param('id').notEmpty(),
  validate,
  ctrl.actualizar
);

router.delete('/:id',
  param('id').notEmpty(),
  validate,
  ctrl.eliminar
);

module.exports = router;
