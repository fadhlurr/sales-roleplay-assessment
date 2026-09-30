const sequelize = require('../config/database');
const User = require('./User');
const Scenario = require('./Scenario');
const RoleplaySession = require('./RoleplaySession');
const Message = require('./Message');
const Assessment = require('./Assessment');
const AuditLog = require('./AuditLog');

User.hasMany(RoleplaySession, { foreignKey: 'userId', onDelete: 'CASCADE' });
RoleplaySession.belongsTo(User, { foreignKey: 'userId' });

Scenario.hasMany(RoleplaySession, { foreignKey: 'scenarioId', onDelete: 'RESTRICT' });
RoleplaySession.belongsTo(Scenario, { foreignKey: 'scenarioId' });

RoleplaySession.hasMany(Message, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
Message.belongsTo(RoleplaySession, { foreignKey: 'sessionId' });

RoleplaySession.hasOne(Assessment, { foreignKey: 'sessionId', onDelete: 'CASCADE' });
Assessment.belongsTo(RoleplaySession, { foreignKey: 'sessionId' });

User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Scenario, RoleplaySession, Message, Assessment, AuditLog };
