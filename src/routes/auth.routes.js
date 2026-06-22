const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  ctrl.login
);

router.get('/me', authMiddleware, ctrl.me);

router.put('/cambiar-password',
  authMiddleware,
  [
    body('passwordActual').notEmpty().withMessage('Contraseña actual requerida'),
    body('passwordNueva').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener mínimo 8 caracteres'),
  ],
  validate,
  ctrl.cambiarPassword
);

module.exports = router;
