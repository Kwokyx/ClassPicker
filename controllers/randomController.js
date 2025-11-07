const { performRandomSelection, STRATEGIES } = require('../services/randomService');

exports.randomPick = async (req, res, next) => {
  try {
    const { strategy = STRATEGIES.PURE, result = 'answered' } = req.body;
    const student = await performRandomSelection(strategy, result);
    res.json({
      message: 'Random selection successful.',
      strategy,
      student,
    });
  } catch (error) {
    next(error);
  }
};
