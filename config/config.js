require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASS = 'password',
  DB_NAME = 'classpicker',
  DB_DIALECT = 'mysql',
  DB_PORT = 3306,
} = process.env;

const baseConfig = {
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  dialectOptions: {
    decimalNumbers: true,
  },
};

module.exports = {
  development: { ...baseConfig },
  test: { ...baseConfig, database: `${DB_NAME}_test` },
  production: { ...baseConfig },
};
