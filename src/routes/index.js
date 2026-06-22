const router = require('express').Router();

router.use('/auth',          require('./auth.routes'));
router.use('/pedidos',       require('./pedidos.routes'));
router.use('/reservas',      require('./reservas.routes'));
router.use('/menu',          require('./menu.routes'));
router.use('/dashboard',     require('./dashboard.routes'));
router.use('/contabilidad',  require('./contabilidad.routes'));

module.exports = router;
