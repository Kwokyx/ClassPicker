const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Record = sequelize.define(
  'Record',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id',
    },
    calledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'called_at',
    },
    result: {
      type: DataTypes.ENUM('answered', 'skipped', 'absent'),
      defaultValue: 'answered',
    },
  },
  {
    tableName: 'records',
    updatedAt: false,
    createdAt: false,
  }
);

module.exports = Record;
