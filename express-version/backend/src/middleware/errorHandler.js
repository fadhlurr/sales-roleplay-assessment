// Error handler terpusat — wajib didaftarkan paling akhir di app.js.
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || 'Terjadi kesalahan pada server' });
}

module.exports = errorHandler;
