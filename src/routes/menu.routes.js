/* const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/menu.controller');

router.use(authMiddleware);

router.get('/', ctrl.listar);

router.get('/:id',
  param('id').notEmpty(),
  validate,
  ctrl.obtener
);

router.post('/',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
    body('categoria').notEmpty().withMessage('Categoría requerida'),
  ],
  validate,
  ctrl.crear
);

router.put('/:id',
  [
    param('id').notEmpty(),
    body('nombre').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('precio').optional().isFloat({ min: 0 }).withMessage('Precio inválido'),
  ],
  validate,
  ctrl.actualizar
);

router.patch('/:id/disponibilidad',
  param('id').notEmpty(),
  validate,
  ctrl.toggleDisponibilidad
);

router.delete('/:id',
  param('id').notEmpty(),
  validate,
  ctrl.eliminar
);

module.exports = router;
 */