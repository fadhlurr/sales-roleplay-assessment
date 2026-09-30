const { RoleplaySession, Scenario, Message, Assessment, User } = require('../models');
const { generateCustomerReply, generateAssessment, AIServiceError } = require('../services/aiService');
const { logAction } = require('../services/auditLogger');

function canAccessSession(reqUser, session) {
  if (['hr', 'manager', 'admin'].includes(reqUser.role)) return true;
  return session.userId === reqUser.userId;
}

// POST /api/sessions  { scenarioId, sessionType }
// Membuat session baru dan langsung meminta AI membuka percakapan sebagai
// customer/prospect (mengikuti basic flow di PRD: AI memberikan opening
// sebelum user merespons).
async function create(req, res, next) {
  try {
    const { scenarioId, sessionType } = req.body;
    if (!scenarioId) return res.status(400).json({ error: 'scenarioId wajib diisi' });

    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario || scenario.status !== 'active') {
      return res.status(404).json({ error: 'Scenario tidak ditemukan atau tidak aktif' });
    }

    const session = await RoleplaySession.create({
      userId: req.user.userId,
      scenarioId: scenario.id,
      sessionType: sessionType === 'screening' ? 'screening' : 'training',
      status: 'in_progress',
      startedAt: new Date(),
    });
    await logAction(req.user.userId, 'scenario.selected', `Scenario "${scenario.name}" dipilih untuk session #${session.id}`);
    await logAction(req.user.userId, 'roleplay.started', `Session #${session.id} dimulai`);

    let opening;
    try {
      opening = await generateCustomerReply(scenario, []);
    } catch (err) {
      console.error('generateCustomerReply gagal:', err);
      // Session tetap tersimpan meski AI gagal di awal — tidak kehilangan
      // data, user bisa retry lewat endpoint messages.
      return res.status(502).json({
        error: 'AI sedang mengalami gangguan saat membuka simulasi. Coba kirim pesan untuk memulai ulang.',
        session,
      });
    }

    const openingMessage = await Message.create({
      sessionId: session.id,
      senderType: 'ai',
      message: opening,
      sequence: 1,
    });

    res.status(201).json({ session, scenario, messages: [openingMessage] });
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/messages  { message }
async function sendMessage(req, res, next) {
  try {
    const session = await RoleplaySession.findByPk(req.params.id, { include: [Scenario] });
    if (!session) return res.status(404).json({ error: 'Session tidak ditemukan' });
    if (!canAccessSession(req.user, session)) return res.status(403).json({ error: 'Akses ditolak' });
    if (session.status !== 'in_progress') {
      return res.status(400).json({ error: 'Session sudah selesai' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'message wajib diisi' });

    const history = await Message.findAll({ where: { sessionId: session.id }, order: [['sequence', 'ASC']] });
    const nextSeq = history.length + 1;

    const userMessage = await Message.create({
      sessionId: session.id,
      senderType: 'user',
      message: message.trim(),
      sequence: nextSeq,
    });

    let reply;
    try {
      reply = await generateCustomerReply(session.Scenario, [...history, userMessage]);
    } catch (err) {
      console.error('generateCustomerReply gagal:', err);
      // Pesan user tetap tersimpan walau AI gagal merespons — memenuhi NFR
      // reliability: error API tidak boleh menghilangkan data session.
      return res.status(502).json({
        error: 'AI sedang mengalami gangguan. Pesanmu tersimpan, coba kirim ulang sesaat lagi.',
        userMessage,
      });
    }

    const aiMessage = await Message.create({
      sessionId: session.id,
      senderType: 'ai',
      message: reply,
      sequence: nextSeq + 1,
    });

    res.json({ userMessage, aiMessage });
  } catch (err) {
    next(err);
  }
}

// POST /api/sessions/:id/complete
async function complete(req, res, next) {
  try {
    const session = await RoleplaySession.findByPk(req.params.id, { include: [Scenario] });
    if (!session) return res.status(404).json({ error: 'Session tidak ditemukan' });
    if (!canAccessSession(req.user, session)) return res.status(403).json({ error: 'Akses ditolak' });
    if (session.status === 'completed') {
      const assessment = await Assessment.findOne({ where: { sessionId: session.id } });
      return res.json({ session, assessment });
    }

    const transcript = await Message.findAll({ where: { sessionId: session.id }, order: [['sequence', 'ASC']] });
    if (transcript.filter((m) => m.senderType === 'user').length === 0) {
      return res.status(400).json({ error: 'Session belum ada respons dari user, belum bisa dinilai' });
    }

    await session.update({ status: 'completed', completedAt: new Date() });
    await logAction(req.user.userId, 'roleplay.completed', `Session #${session.id} selesai`);

    let result;
    try {
      result = await generateAssessment(session.Scenario, transcript);
    } catch (err) {
      console.error('generateAssessment gagal:', err);
      // Session tetap ditandai selesai dan transcript tetap tersimpan; hanya
      // assessment yang belum ada. Frontend bisa menawarkan retry generate.
      return res.status(502).json({
        error: 'AI sedang mengalami gangguan saat membuat penilaian. Transcript sudah tersimpan, coba generate ulang.',
        session,
      });
    }

    const assessment = await Assessment.create({ sessionId: session.id, ...result });
    await logAction(req.user.userId, 'assessment.generated', `Assessment untuk session #${session.id}: overall ${assessment.overallScore}`);
    await logAction(req.user.userId, 'feedback.generated', `Feedback untuk session #${session.id} dibuat`);

    res.json({ session, assessment });
  } catch (err) {
    next(err);
  }
}

// GET /api/sessions/:id
async function detail(req, res, next) {
  try {
    const session = await RoleplaySession.findByPk(req.params.id, {
      include: [Scenario, { model: User, attributes: ['id', 'name', 'email', 'role'] }, Assessment,
        { model: Message }],
    });
    if (!session) return res.status(404).json({ error: 'Session tidak ditemukan' });
    if (!canAccessSession(req.user, session)) return res.status(403).json({ error: 'Akses ditolak' });

    session.Messages?.sort((a, b) => a.sequence - b.sequence);
    await logAction(req.user.userId, 'result.viewed', `Session #${session.id} dilihat oleh ${req.user.email}`);
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// GET /api/sessions — history milik user yang sedang login
async function myHistory(req, res, next) {
  try {
    const sessions = await RoleplaySession.findAll({
      where: { userId: req.user.userId },
      include: [Scenario, Assessment],
      order: [['createdAt', 'DESC']],
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, sendMessage, complete, detail, myHistory };
