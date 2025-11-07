const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const Student = require('./Student');
const Record = require('./Record');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Student = Student;
db.Record = Record;

Student.hasMany(Record, { foreignKey: 'studentId', as: 'records' });
Record.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

module.exports = db;
