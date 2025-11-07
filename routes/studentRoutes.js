const express = require('express');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/', studentController.getStudents);
router.post('/import', studentController.importStudents);
router.put('/:id', studentController.updateStudent);
router.put('/:id/attendance', studentController.updateAttendance);

module.exports = router;
