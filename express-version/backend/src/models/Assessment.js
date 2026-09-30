const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Assessment extends Model {}

Assessment.init(
  {
    communicationScore: { type: DataTypes.INTEGER, allowNull: false },
    pitchScore: { type: DataTypes.INTEGER, allowNull: false },
    objectionScore: { type: DataTypes.INTEGER, allowNull: false },
    confidenceScore: { type: DataTypes.INTEGER, allowNull: false },
    closingScore: { type: DataTypes.INTEGER, allowNull: false },
    overallScore: { type: DataTypes.INTEGER, allowNull: false },
    feedback: { type: DataTypes.TEXT, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, modelName: 'Assessment', tableName: 'assessments' }
);

module.exports = Assessment;
