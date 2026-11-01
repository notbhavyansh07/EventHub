const router = require('express').Router();
const events = require('../controllers/eventController');
const regs = require('../controllers/registrationController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

router.get('/', events.list);                                  // public
router.post('/', requireAdmin, events.create);                 // admin
router.put('/:id', requireAdmin, events.update);               // admin
router.delete('/:id', requireAdmin, events.remove);            // admin
router.get('/:id/attendees', requireAdmin, events.attendees);  // admin
router.post('/:id/register', requireLogin, regs.register);     // user
router.delete('/:id/register', requireLogin, regs.cancel);     // user

module.exports = router;
