import Player from '../models/Player.js';

/**
 * Obtiene todos los jugadores del catálogo con filtros opcionales
 * @param {object} filters - { position, minOverall, maxOverall, name }
 */
export const getAllPlayers = async (filters = {}) => {
  const query = {};

  if (filters.position) {
    query.position = filters.position;
  }

  if (filters.name) {
    query.name = { $regex: filters.name, $options: 'i' }; // búsqueda insensible a mayúsculas
  }

  if (filters.minOverall || filters.maxOverall) {
    query.overall = {};
    if (filters.minOverall) query.overall.$gte = Number(filters.minOverall);
    if (filters.maxOverall) query.overall.$lte = Number(filters.maxOverall);
  }

  const players = await Player.find(query).sort({ overall: -1 }); // ordenados de mayor a menor overall
  return players;
};

/**
 * Obtiene un jugador por su ID, incluyendo otras versiones del mismo jugador
 */
export const getPlayerById = async (id) => {
  const player = await Player.findById(id);
  if (!player) throw new Error('Jugador no encontrado.');

  let otherVersions = [];
  if (player.groupKey) {
    otherVersions = await Player.find({
      groupKey: player.groupKey,
      _id: { $ne: player._id },
    }).sort({ overall: -1 });
  }

  return { player, otherVersions };
};

/**
 * Crea un nuevo jugador en el catálogo (solo administradores)
 */
export const createPlayer = async (data) => {
  const { name, image, overall, position, stats } = data;

  if (!name || !image || !overall || !position || !stats) {
    throw new Error('Faltan campos obligatorios: name, image, overall, position, stats.');
  }

  const player = await Player.create(data);
  return player;
};

/**
 * Actualiza los datos de un jugador existente
 */
export const updatePlayer = async (id, data) => {
  const player = await Player.findByIdAndUpdate(id, data, { new: true });
  if (!player) throw new Error('Jugador no encontrado.');
  return player;
};

/**
 * Elimina un jugador del catálogo
 */
export const deletePlayer = async (id) => {
  const player = await Player.findByIdAndDelete(id);
  if (!player) throw new Error('Jugador no encontrado.');
  return player;
};
