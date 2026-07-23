import UserPlayer from '../models/UserPlayer.js';

/**
 * Obtiene todos los jugadores de la colección de un usuario,
 * con los datos completos del jugador base populados.
 */
export const getUserCollection = async (userId) => {
  const collection = await UserPlayer.find({ user_id: userId })
    .populate('player_id')
    .sort({ createdAt: -1 }); // las cartas más recientes primero
  return collection;
};

/**
 * Obtiene una carta específica de la colección de un usuario
 */
export const getUserPlayerById = async (userPlayerId, userId) => {
  const userPlayer = await UserPlayer.findOne({
    _id: userPlayerId,
    user_id: userId
  }).populate('player_id');

  if (!userPlayer) throw new Error('Carta no encontrada en tu colección.');
  return userPlayer;
};

/**
 * Añade un jugador a la colección de un usuario.
 * Se usa internamente al abrir sobres.
 * @param {string} userId
 * @param {string} playerId
 * @param {boolean} isTradeable
 */
export const addPlayerToCollection = async (userId, playerId, isTradeable = false) => {
  const userPlayer = await UserPlayer.create({
    user_id: userId,
    player_id: playerId,
    isTradeable
  });

  return userPlayer.populate('player_id');
};

/**
 * Descarta (elimina) una carta de la colección del usuario.
 * Valida que la carta pertenezca al usuario que hace la petición.
 */
export const discardUserPlayer = async (userPlayerId, userId) => {
  const userPlayer = await UserPlayer.findOneAndDelete({
    _id: userPlayerId,
    user_id: userId
  });

  if (!userPlayer) {
    throw new Error('Carta no encontrada o no tienes permiso para eliminarla.');
  }

  return userPlayer;
};
