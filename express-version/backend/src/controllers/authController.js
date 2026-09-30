const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logAction } = require('../services/auditLogger');

const PANJANG_PASSWORD_MINIMAL = 8;

function sign(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email dan password wajib diisi' });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    // Pesan sengaja dibuat sama untuk akun tidak ada dan password salah, supaya
    // tidak bocor akun mana yang terdaftar.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    await logAction(user.id, 'user.login', `${user.email} login sebagai ${user.role}`);
    res.json({ token: sign(user), user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/register — hanya admin & HR yang boleh membuat akun baru
// (recruiter membuat akun kandidat, admin membuat akun sales/manager/hr lain).
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, dan role wajib diisi' });
    }
    if (password.length < PANJANG_PASSWORD_MINIMAL) {
      return res.status(400).json({ error: `Password minimal ${PANJANG_PASSWORD_MINIMAL} karakter` });
    }
    if (!['candidate', 'sales', 'hr', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }
    // Hanya admin yang boleh membuat akun hr/manager/admin lain; HR hanya
    // boleh membuat akun candidate untuk keperluan screening.
    if (req.user.role === 'hr' && role !== 'candidate') {
      return res.status(403).json({ error: 'HR hanya boleh membuat akun candidate' });
    }

    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.trim().toLowerCase(), passwordHash, role });
    await logAction(req.user.userId, 'user.created', `${req.user.email} membuat akun ${user.email} (${role})`);
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.userId, { attributes: ['id', 'name', 'email', 'role'] });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, register, me };
