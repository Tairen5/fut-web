import * as squadService from '../services/squadService.js';

/**
 * GET /api/squad/user/:userId
 * Obtiene todos los squads de un usuario
 */
export const getSquads = async (req, res) => {
  try {
    const squads = await squadService.getSquadsByUser(req.params.userId);
    res.status(200).json(squads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/squad/active/:userId
 * Obtiene el squad activo de un usuario
 */
export const getActiveSquad = async (req, res) => {
  try {
    const squad = await squadService.getActiveSquad(req.params.userId);
    res.status(200).json(squad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/squad
 * Crea un squad nuevo
 * Body: { userId, name?, formation? }
 */
export const createSquad = async (req, res) => {
  try {
    const { userId, name, formation } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'El campo userId es obligatorio.' });
    }

    const squad = await squadService.createSquad(userId, { name, formation });
    res.status(201).json(squad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/squad/activate/:id
 * Activa un squad y desactiva los demás
 * Body: { userId }
 */
export const activateSquad = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'El campo userId es obligatorio.' });
    }

    const squad = await squadService.activateSquad(req.params.id, userId);
    res.status(200).json(squad);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * PUT /api/squad/:id
 * Actualiza un squad (formación, titulares, banquillo, tácticas)
 * Body: { userId, name?, formation?, startingEleven?, bench?, tactics? }
 */
export const updateSquad = async (req, res) => {
  try {
    const { userId, ...data } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'El campo userId es obligatorio.' });
    }

    const squad = await squadService.updateSquad(req.params.id, userId, data);
    res.status(200).json(squad);
  } catch (error) {
    const status = error.message.includes('no tienes permiso') ? 403 : 400;
    res.status(status).json({ message: error.message });
  }
};

/**
 * DELETE /api/squad/:id
 * Elimina un squad
 * Body: { userId }
 */
export const deleteSquad = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'El campo userId es obligatorio.' });
    }

    await squadService.deleteSquad(req.params.id, userId);
    res.status(200).json({ message: 'Plantilla eliminada correctamente.' });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};
