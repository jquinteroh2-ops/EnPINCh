const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/public.controller');

// Ruta pública — sin autenticación — usada por el sitio web del restaurante
router.post('/reservas',
  [
    body('nombreCliente').notEmpty().withMessage('Nombre requerido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('hora').notEmpty().withMessage('Hora requerida'),
    body('personas').isInt({ min: 1, max: 50 }).withMessage('Número de personas inválido'),
  ],
  validate,
  ctrl.crearReserva
);

module.exports = router;
