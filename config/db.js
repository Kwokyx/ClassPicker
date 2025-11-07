const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASS = 'password',
  DB_NAME = 'classpicker',
  DB_DIALECT = 'mysql',
  DB_PORT = 3306,
  NODE_ENV = 'development',
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: false,
    freezeTableName: false,
  },
});

module.exports = sequelize;
