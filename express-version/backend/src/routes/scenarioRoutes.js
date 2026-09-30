const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { list, detail, create } = require('../controllers/scenarioController');

const router = express.Router();

router.get('/', requireAuth, list);
router.get('/:id', requireAuth, detail);
router.post('/', requireAuth, requireRole('admin'), create);

module.exports = router;
