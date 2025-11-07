const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Student = sequelize.define(
  'Student',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    studentNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'student_number',
      unique: true,
    },
    class: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    attendance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    calledCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'called_count',
    },
  },
  {
    tableName: 'students',
    timestamps: false,
  }
);

module.exports = Student;
