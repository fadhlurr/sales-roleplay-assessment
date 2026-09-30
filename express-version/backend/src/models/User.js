const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    // candidate: kandidat yang sedang discreening
    // sales: sales/trainee internal yang berlatih mandiri
    // hr: recruiter yang menyaring kandidat
    // manager: trainer/manager yang memantau performa sales
    // admin: mengelola user & sistem
    role: {
      type: DataTypes.ENUM('candidate', 'sales', 'hr', 'manager', 'admin'),
      allowNull: false,
      defaultValue: 'candidate',
    },
  },
  { sequelize, modelName: 'User', tableName: 'users' }
);

module.exports = User;
