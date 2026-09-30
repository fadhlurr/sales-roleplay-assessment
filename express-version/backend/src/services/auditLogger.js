const { AuditLog } = require('../models');

// Audit trail: dipanggil dari controller di titik-titik yang disyaratkan PRD
// (login, scenario dipilih, roleplay dimulai/selesai, assessment/feedback
// dibuat, hasil dilihat). Gagal mencatat log tidak boleh menggagalkan aksi
// utama, jadi errornya cukup dicetak, tidak dilempar ulang.
async function logAction(userId, action, description) {
  try {
    await AuditLog.create({ userId: userId || null, action, description: description || null });
  } catch (err) {
    console.error('Gagal mencatat audit log:', err.message);
  }
}

module.exports = { logAction };
