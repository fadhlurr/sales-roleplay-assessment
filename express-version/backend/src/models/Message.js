const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Message extends Model {}

Message.init(
  {
    senderType: { type: DataTypes.ENUM('user', 'ai'), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    sequence: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Message', tableName: 'messages' }
);

module.exports = Message;
