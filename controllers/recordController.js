const { getStatistics, getRecentRecords } = require('../services/randomService');

exports.getStatistics = async (req, res, next) => {
  try {
    const stats = await getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

exports.getRecords = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const parsedLimit = Number(limit) || 20;
    const records = await getRecentRecords(parsedLimit);
    res.json(records);
  } catch (error) {
    next(error);
  }
};
