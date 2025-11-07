const express = require('express');
const recordController = require('../controllers/recordController');

const router = express.Router();

router.get('/', recordController.getRecords);
router.get('/statistics', recordController.getStatistics);

module.exports = router;
