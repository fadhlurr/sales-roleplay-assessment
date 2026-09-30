const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class AuditLog extends Model {}

AuditLog.init(
  {
    // Contoh: user.login, scenario.selected, roleplay.started,
    // roleplay.completed, assessment.generated, feedback.generated,
    // result.viewed
    action: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'AuditLog', tableName: 'audit_logs' }
);

module.exports = AuditLog;
