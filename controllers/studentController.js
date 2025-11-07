const { parse } = require('csv-parse/sync');
const { Student } = require('../models');

/**
 * Normalize raw student payloads into objects compatible with the Student model.
 * @param {Array<Object>} rawStudents
 * @returns {Array<Object>}
 */
function normalizeStudents(rawStudents) {
  return rawStudents
    .map((student) => {
      const attendanceValue = student.attendance;
      let attendance = false;

      if (typeof attendanceValue === 'string') {
        attendance = attendanceValue.toLowerCase() === 'true';
      } else if (typeof attendanceValue === 'boolean') {
        attendance = attendanceValue;
      }

      const rawCalledCount =
        typeof student.called_count !== 'undefined'
          ? student.called_count
          : student.calledCount;

      let calledCount = 0;

      if (typeof rawCalledCount === 'number') {
        calledCount = rawCalledCount;
      } else if (typeof rawCalledCount === 'string') {
        const parsed = parseInt(rawCalledCount, 10);
        calledCount = Number.isNaN(parsed) ? 0 : parsed;
      }

      const studentNumberRaw = student.student_number || student.studentNumber;
      const classRaw = student.class;

      return {
        name: student.name?.trim(),
        studentNumber: typeof studentNumberRaw === 'string' ? studentNumberRaw.trim() : studentNumberRaw,
        class: typeof classRaw === 'string' ? classRaw.trim() : classRaw,
        attendance,
        calledCount,
      };
    })
    .filter((student) => student.name && student.studentNumber);
}

exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.findAll({ order: [['id', 'ASC']] });
    res.json(students);
  } catch (error) {
    next(error);
  }
};

exports.importStudents = async (req, res, next) => {
  try {
    const { format = 'json', data } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Missing data payload for import.' });
    }

    let parsedStudents = [];

    if (format === 'csv') {
      const csvRecords = parse(data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      parsedStudents = normalizeStudents(csvRecords);
    } else if (format === 'json') {
      if (!Array.isArray(data)) {
        return res.status(400).json({ message: 'JSON data must be an array of students.' });
      }
      parsedStudents = normalizeStudents(data);
    } else {
      return res.status(400).json({ message: 'Unsupported import format. Use "json" or "csv".' });
    }

    if (!parsedStudents.length) {
      return res.status(400).json({ message: 'No valid student records found in the payload.' });
    }

    const createdStudents = await Student.bulkCreate(parsedStudents, {
      updateOnDuplicate: ['name', 'class', 'attendance', 'called_count'],
    });

    res.status(201).json({
      message: 'Students imported successfully.',
      count: createdStudents.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, class: className, calledCount } = req.body;

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (name) student.name = name;
    if (className) student.class = className;
    if (typeof calledCount === 'number') student.calledCount = calledCount;

    await student.save();

    res.json({ message: 'Student updated successfully.', student });
  } catch (error) {
    next(error);
  }
};

exports.updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attendance } = req.body;

    if (typeof attendance !== 'boolean') {
      return res.status(400).json({ message: 'Attendance flag must be boolean.' });
    }

    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    student.attendance = attendance;
    await student.save();

    res.json({ message: 'Attendance updated successfully.', student });
  } catch (error) {
    next(error);
  }
};
