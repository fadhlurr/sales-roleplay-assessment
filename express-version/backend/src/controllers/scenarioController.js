const { Scenario } = require('../models');

// GET /api/scenarios
async function list(req, res, next) {
  try {
    const scenarios = await Scenario.findAll({ where: { status: 'active' }, order: [['id', 'ASC']] });
    res.json(scenarios);
  } catch (err) {
    next(err);
  }
}

// GET /api/scenarios/:id
async function detail(req, res, next) {
  try {
    const scenario = await Scenario.findByPk(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario tidak ditemukan' });
    res.json(scenario);
  } catch (err) {
    next(err);
  }
}

// POST /api/scenarios — admin only
async function create(req, res, next) {
  try {
    const { name, description, type, instruction } = req.body;
    if (!name || !description || !type || !instruction) {
      return res.status(400).json({ error: 'name, description, type, dan instruction wajib diisi' });
    }
    const scenario = await Scenario.create({ name, description, type, instruction });
    res.status(201).json(scenario);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create };
