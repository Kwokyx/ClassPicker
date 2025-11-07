const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const studentRoutes = require('./routes/studentRoutes');
const randomRoutes = require('./routes/randomRoutes');
const recordRoutes = require('./routes/recordRoutes');
const recordController = require('./controllers/recordController');
const db = require('./models');

dotenv.config();

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ClassPicker API' });
});

app.use('/api/students', studentRoutes);
app.use('/api/random', randomRoutes);
app.use('/api/records', recordRoutes);
app.get('/api/statistics', recordController.getStatistics);

app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

async function initializeDatabase() {
  await db.sequelize.authenticate();
}

initializeDatabase().catch((error) => {
  console.error('Unable to connect to the database:', error);
});

module.exports = app;
