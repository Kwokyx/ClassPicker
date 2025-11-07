const { Student, Record, sequelize } = require('../models');

const STRATEGIES = {
  PURE: 'pure',
  BALANCED: 'balanced',
};

function chooseRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function getLastRecord() {
  return Record.findOne({
    order: [['calledAt', 'DESC']],
  });
}

async function pickStudent(strategy) {
  const students = await Student.findAll({ order: [['id', 'ASC']] });

  if (!students.length) {
    throw new Error('No students available for random selection.');
  }

  const presentStudents = students.filter((student) => student.attendance === true);
  const sourcePool = presentStudents.length ? presentStudents : students;

  const lastRecord = await getLastRecord();
  const lastStudentId = lastRecord?.studentId;

  let eligibleStudents = sourcePool;

  if (sourcePool.length > 1 && lastStudentId) {
    eligibleStudents = sourcePool.filter((student) => student.id !== lastStudentId);
  }

  if (!eligibleStudents.length) {
    eligibleStudents = sourcePool;
  }

  if (strategy === STRATEGIES.BALANCED) {
    const minCalledCount = Math.min(...eligibleStudents.map((student) => student.calledCount));
    const leastCalled = eligibleStudents.filter(
      (student) => student.calledCount === minCalledCount
    );
    return chooseRandom(leastCalled);
  }

  return chooseRandom(eligibleStudents);
}

async function recordSelection(studentId, result, transaction) {
  await Record.create(
    {
      studentId,
      result,
    },
    { transaction }
  );
}

async function incrementCalledCount(student, transaction) {
  student.calledCount += 1;
  await student.save({ transaction, fields: ['calledCount'] });
}

exports.STRATEGIES = STRATEGIES;

const ALLOWED_RESULTS = ['answered', 'skipped', 'absent'];

exports.performRandomSelection = async (strategy = STRATEGIES.PURE, result = 'answered') => {
  if (!Object.values(STRATEGIES).includes(strategy)) {
    throw new Error('Unsupported strategy. Use "pure" or "balanced".');
  }

  if (!ALLOWED_RESULTS.includes(result)) {
    throw new Error('Unsupported result. Use "answered", "skipped" or "absent".');
  }

  return sequelize.transaction(async (transaction) => {
    const student = await pickStudent(strategy);

    await incrementCalledCount(student, transaction);
    await recordSelection(student.id, result, transaction);

    return student;
  });
};

exports.getStatistics = async () => {
  const [studentCount, attendanceCount, totalRecords, answeredCount, skippedCount, absentCount] =
    await Promise.all([
      Student.count(),
      Student.count({ where: { attendance: true } }),
      Record.count(),
      Record.count({ where: { result: 'answered' } }),
      Record.count({ where: { result: 'skipped' } }),
      Record.count({ where: { result: 'absent' } }),
    ]);

  return {
    students: studentCount,
    attendance: attendanceCount,
    attendanceRate: studentCount ? attendanceCount / studentCount : 0,
    records: {
      total: totalRecords,
      answered: answeredCount,
      skipped: skippedCount,
      absent: absentCount,
    },
  };
};

exports.getRecentRecords = async (limit = 20) => {
  return Record.findAll({
    include: [{ model: Student, as: 'student', attributes: ['id', 'name', 'studentNumber'] }],
    order: [['calledAt', 'DESC']],
    limit,
  });
};
