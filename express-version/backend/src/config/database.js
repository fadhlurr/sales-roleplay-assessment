const path = require('path');
const { Sequelize } = require('sequelize');

// Prefer SALES_ROLEPLAY_DATABASE_URL over DATABASE_URL — nama generik seperti
// DATABASE_URL gampang direbut service lain di platform yang sama. Kalau
// kosong, jatuh ke SQLite lokal supaya bisa langsung dijalankan tanpa
// menyiapkan Postgres dulu.
const DATABASE_URL = process.env.SALES_ROLEPLAY_DATABASE_URL || process.env.DATABASE_URL;

const SQLITE_FILE = process.env.SQLITE_FILE || path.join(__dirname, '../../data/sales_roleplay.sqlite');

const isLocalDb = /localhost|127\.0\.0\.1/.test(DATABASE_URL || '');

const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      // Postgres terkelola (Supabase, Neon, Railway) mewajibkan SSL; Postgres
      // lokal biasanya tidak mendukungnya.
      dialectOptions: isLocalDb
        ? {}
        : { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize({ dialect: 'sqlite', storage: SQLITE_FILE, logging: false });

module.exports = sequelize;
module.exports.DATABASE_URL_SOURCE = process.env.SALES_ROLEPLAY_DATABASE_URL
  ? 'SALES_ROLEPLAY_DATABASE_URL'
  : process.env.DATABASE_URL
    ? 'DATABASE_URL'
    : `sqlite:${SQLITE_FILE}`;
