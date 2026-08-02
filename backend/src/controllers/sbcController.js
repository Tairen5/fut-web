import * as service from '../services/sbcService.js';

/**
 * GET /api/sbc
 */
export const getAll = async (req, res) => {
  try {
    const sbcs = await service.getAllSBCs();
    res.json(sbcs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/sbc/daily
 */
export const getDaily = async (req, res) => {
  try {
    const sbcs = await service.getDailySBCs();
    res.json(sbcs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/sbc/:id
 */
export const getById = async (req, res) => {
  try {
    const sbc = await service.getSBCById(req.params.id);
    res.json(sbc);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

/**
 * POST /api/sbc (admin)
 */
export const create = async (req, res) => {
  try {
    const sbc = await service.createSBC(req.body);
    res.status(201).json(sbc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * PUT /api/sbc/:id (admin)
 */
export const update = async (req, res) => {
  try {
    const sbc = await service.updateSBC(req.params.id, req.body);
    res.json(sbc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * DELETE /api/sbc/:id (admin)
 */
export const remove = async (req, res) => {
  try {
    await service.deleteSBC(req.params.id);
    res.json({ message: 'SBC eliminado.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
