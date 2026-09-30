const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { login, register, me } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/register', requireAuth, requireRole('admin', 'hr'), register);

module.exports = router;
