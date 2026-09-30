const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Scenario extends Model {}

Scenario.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM('cold_call', 'product_pitch', 'objection_handling', 'closing'),
      allowNull: false,
    },
    // Instruksi yang ditampilkan ke user sebelum simulasi dimulai, dan juga
    // dipakai sebagai bagian dari system prompt AI untuk berperan sebagai
    // customer/prospect sesuai skenario ini.
    instruction: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  { sequelize, modelName: 'Scenario', tableName: 'scenarios' }
);

module.exports = Scenario;
