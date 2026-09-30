const express = require('express');
const authRoutes = require('./authRoutes');
const scenarioRoutes = require('./scenarioRoutes');
const sessionRoutes = require('./sessionRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/sessions', sessionRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
