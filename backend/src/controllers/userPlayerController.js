import * as userPlayerService from '../services/userPlayerService.js';

/**
 * GET /api/user-players/:userId
 * Devuelve toda la colección de cartas de un usuario
 */
export const getUserCollection = async (req, res) => {
  try {
    const collection = await userPlayerService.getUserCollection(req.params.userId);
    res.status(200).json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/user-players/:userId/:userPlayerId
 * Devuelve el detalle de una carta específica de la colección
 */
export const getUserPlayerById = async (req, res) => {
  try {
    const userPlayer = await userPlayerService.getUserPlayerById(
      req.params.userPlayerId,
      req.params.userId
    );
    res.status(200).json(userPlayer);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * DELETE /api/user-players/:id
 * Descarta (elimina) una carta de la colección
 * Body: { userId }
 */
export const discardUserPlayer = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'El campo userId es obligatorio.' });
    }

    await userPlayerService.discardUserPlayer(req.params.id, userId);
    res.status(200).json({ message: 'Carta descartada correctamente.' });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};
