const { Op } = require('sequelize');
const { User, RoleplaySession, Scenario, Assessment, AuditLog } = require('../models');

async function usersWithSessions(role) {
  const users = await User.findAll({
    where: { role },
    attributes: ['id', 'name', 'email', 'role'],
    include: [{ model: RoleplaySession, include: [Scenario, Assessment] }],
    order: [['name', 'ASC']],
  });
  return users.map((u) => summarizeUser(u));
}

function summarizeUser(user) {
  const sessions = user.RoleplaySessions || [];
  const completed = sessions.filter((s) => s.status === 'completed' && s.Assessment);
  const overallScores = completed.map((s) => s.Assessment.overallScore);
  const avg = overallScores.length ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length) : null;
  const latest = completed.length
    ? completed.reduce((a, b) => (a.completedAt > b.completedAt ? a : b))
    : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    totalSessions: sessions.length,
    completedSessions: completed.length,
    averageScore: avg,
    latestScore: latest ? latest.Assessment.overallScore : null,
    status: completed.length === 0 ? 'belum_assessment' : 'sudah_assessment',
    sessions: sessions.map((s) => ({
      id: s.id,
      scenario: s.Scenario?.name,
      scenarioType: s.Scenario?.type,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      overallScore: s.Assessment?.overallScore ?? null,
    })),
  };
}

// GET /api/dashboard/hr?scenarioType=&minScore=&status=
async function hrDashboard(req, res, next) {
  try {
    const { scenarioType, minScore, status } = req.query;
    let candidates = await usersWithSessions('candidate');

    if (status) candidates = candidates.filter((c) => c.status === status);
    if (minScore) candidates = candidates.filter((c) => (c.averageScore ?? 0) >= Number(minScore));
    if (scenarioType) {
      candidates = candidates.filter((c) => c.sessions.some((s) => s.scenarioType === scenarioType));
    }

    res.json({
      totalCandidates: candidates.length,
      assessedCandidates: candidates.filter((c) => c.completedSessions > 0).length,
      candidates,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/hr/candidates/:userId
async function candidateDetail(req, res, next) {
  try {
    const user = await User.findOne({
      where: { id: req.params.userId, role: 'candidate' },
      attributes: ['id', 'name', 'email', 'role'],
      include: [{ model: RoleplaySession, include: [Scenario, Assessment] }],
    });
    if (!user) return res.status(404).json({ error: 'Kandidat tidak ditemukan' });
    res.json(summarizeUser(user));
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/hr/compare?ids=1,2,3
async function compareCandidates(req, res, next) {
  try {
    const ids = String(req.query.ids || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2) return res.status(400).json({ error: 'Minimal 2 id kandidat untuk dibandingkan' });

    const users = await User.findAll({
      where: { id: { [Op.in]: ids }, role: 'candidate' },
      attributes: ['id', 'name', 'email'],
      include: [{ model: RoleplaySession, include: [Scenario, Assessment] }],
    });

    const rows = users.map((u) => {
      const completed = (u.RoleplaySessions || []).filter((s) => s.status === 'completed' && s.Assessment);
      const best = completed.reduce((a, b) => (!a || b.Assessment.overallScore > a.Assessment.overallScore ? b : a), null);
      return {
        id: u.id,
        name: u.name,
        communication: best?.Assessment.communicationScore ?? null,
        pitch: best?.Assessment.pitchScore ?? null,
        objection: best?.Assessment.objectionScore ?? null,
        confidence: best?.Assessment.confidenceScore ?? null,
        closing: best?.Assessment.closingScore ?? null,
        overall: best?.Assessment.overallScore ?? null,
      };
    });

    res.json({ rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/manager
async function managerDashboard(req, res, next) {
  try {
    const salesUsers = await usersWithSessions('sales');
    const allScores = salesUsers.flatMap((u) => u.sessions.map((s) => s.overallScore).filter((v) => v != null));
    const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

    res.json({
      totalSales: salesUsers.length,
      totalSessions: salesUsers.reduce((sum, u) => sum + u.totalSessions, 0),
      averageScore: avg,
      salesUsers,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/manager/users/:userId
async function salesDetail(req, res, next) {
  try {
    const user = await User.findOne({
      where: { id: req.params.userId, role: 'sales' },
      attributes: ['id', 'name', 'email', 'role'],
      include: [{ model: RoleplaySession, include: [Scenario, Assessment] }],
    });
    if (!user) return res.status(404).json({ error: 'Sales/trainee tidak ditemukan' });
    res.json(summarizeUser(user));
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/audit-logs?limit=50
async function auditLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const logs = await AuditLog.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

module.exports = { hrDashboard, candidateDetail, compareCandidates, managerDashboard, salesDetail, auditLogs };
