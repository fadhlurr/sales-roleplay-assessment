// Entry point khusus Vercel — dijalankan sebagai serverless function.
// Tidak memanggil app.listen() atau sequelize.sync() di sini: schema sudah
// dibuat lewat `npm run seed` sekali di awal, dan tiap cold start cukup
// mengekspor app-nya saja (models sudah ter-register lewat require chain).
require('dotenv').config();
const app = require('../src/app');

module.exports = app;
