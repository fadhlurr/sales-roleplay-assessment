const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { create, sendMessage, complete, detail, myHistory } = require('../controllers/sessionController');

const router = express.Router();

router.use(requireAuth);
router.get('/', myHistory);
router.post('/', create);
router.get('/:id', detail);
router.post('/:id/messages', sendMessage);
router.post('/:id/complete', complete);

module.exports = router;
