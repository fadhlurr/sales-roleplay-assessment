const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RoleplaySession extends Model {}

RoleplaySession.init(
  {
    sessionType: {
      type: DataTypes.ENUM('training', 'screening'),
      allowNull: false,
      defaultValue: 'training',
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: 'RoleplaySession', tableName: 'roleplay_sessions' }
);

module.exports = RoleplaySession;
