const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const {
  hrDashboard, candidateDetail, compareCandidates, managerDashboard, salesDetail, auditLogs,
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(requireAuth);
router.get('/hr', requireRole('hr', 'admin'), hrDashboard);
router.get('/hr/candidates/:userId', requireRole('hr', 'admin'), candidateDetail);
router.get('/hr/compare', requireRole('hr', 'admin'), compareCandidates);
router.get('/manager', requireRole('manager', 'admin'), managerDashboard);
router.get('/manager/users/:userId', requireRole('manager', 'admin'), salesDetail);
router.get('/audit-logs', requireRole('admin', 'manager', 'hr'), auditLogs);

module.exports = router;
