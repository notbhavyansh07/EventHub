// Combines every API route group under /api.
const router = require('express').Router();
const { requireLogin, requireAdmin } = require('../middleware/auth');
const events = require('../controllers/eventController');
const regs = require('../controllers/registrationController');

router.use('/auth', require('./authRoutes'));
router.use('/events', require('./eventRoutes'));
router.get('/my/registrations', requireLogin, regs.mine);
router.get('/stats', requireAdmin, events.stats);

module.exports = router;
