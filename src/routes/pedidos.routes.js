const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/pedidos.controller');

router.use(authMiddleware);

router.get('/', ctrl.listar);

router.get('/stats', ctrl.stats);

router.get('/:id',
  param('id').notEmpty(),
  validate,
  ctrl.obtener
);

router.post('/',
  [
    body('tipo').isIn(['DOMICILIO', 'MESA']).withMessage('Tipo inválido'),
    body('clienteNombre').notEmpty().withMessage('Nombre del cliente requerido'),
    body('clienteTelefono').notEmpty().withMessage('Teléfono del cliente requerido'),
    body('items').isArray({ min: 1 }).withMessage('El pedido debe tener al menos un ítem'),
    body('total').isFloat({ min: 0 }).withMessage('Total inválido'),
  ],
  validate,
  ctrl.crear
);

router.patch('/:id/estado',
  [
    param('id').notEmpty(),
    body('estado').isIn(['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']).withMessage('Estado inválido'),
  ],
  validate,
  ctrl.actualizarEstado
);

router.delete('/:id',
  param('id').notEmpty(),
  validate,
  ctrl.eliminar
);

module.exports = router;
