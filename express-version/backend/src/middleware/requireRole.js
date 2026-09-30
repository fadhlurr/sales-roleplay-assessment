// Dipasang setelah requireAuth. Token yang sah belum tentu berhak — misalnya
// candidate punya token yang valid tapi tidak boleh menyentuh dashboard HR.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Akses ditolak untuk peran ini' });
    }
    next();
  };
}

module.exports = requireRole;
