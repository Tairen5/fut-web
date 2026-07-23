import * as playerService from '../services/playerService.js';

/**
 * GET /api/players
 * Lista todos los jugadores con filtros opcionales por query params
 * ?position=DC&minOverall=80&maxOverall=99&name=messi
 */
export const getAllPlayers = async (req, res) => {
  try {
    const players = await playerService.getAllPlayers(req.query);
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/players/:id
 * Devuelve el detalle de un jugador específico
 */
export const getPlayerById = async (req, res) => {
  try {
    const data = await playerService.getPlayerById(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * POST /api/players
 * Crea un jugador nuevo en el catálogo (ruta de admin)
 */
export const createPlayer = async (req, res) => {
  try {
    const player = await playerService.createPlayer(req.body);
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * PUT /api/players/:id
 * Actualiza los datos de un jugador
 */
export const updatePlayer = async (req, res) => {
  try {
    const player = await playerService.updatePlayer(req.params.id, req.body);
    res.status(200).json(player);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * DELETE /api/players/:id
 * Elimina un jugador del catálogo
 */
export const deletePlayer = async (req, res) => {
  try {
    await playerService.deletePlayer(req.params.id);
    res.status(200).json({ message: 'Jugador eliminado correctamente.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
