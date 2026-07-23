import Squad from '../models/Squad.js';
import UserPlayer from '../models/UserPlayer.js';

/**
 * Obtiene todos los squads de un usuario
 */
export const getSquadsByUser = async (userId) => {
  const squads = await Squad.find({ user_id: userId })
    .populate({
      path: 'startingEleven.user_player_id',
      populate: { path: 'player_id' }
    })
    .populate({
      path: 'bench',
      populate: { path: 'player_id' }
    });

  return squads;
};

/**
 * Obtiene el squad activo de un usuario
 */
export const getActiveSquad = async (userId) => {
  const squad = await Squad.findOne({ user_id: userId, isActive: true })
    .populate({
      path: 'startingEleven.user_player_id',
      populate: { path: 'player_id' }
    })
    .populate({
      path: 'bench',
      populate: { path: 'player_id' }
    });

  return squad;
};

/**
 * Crea un squad nuevo para un usuario
 */
export const createSquad = async (userId, data = {}) => {
  const { name, formation } = data;

  const squad = await Squad.create({
    user_id: userId,
    name: name || 'Mi Squad',
    formation: formation || '4-3-3',
    isActive: false,
    startingEleven: [],
    bench: [],
    tactics: { style: 'Equilibrado' }
  });

  return squad;
};

/**
 * Crea el squad por defecto para un usuario nuevo
 */
export const createDefaultSquad = async (userId) => {
  const existing = await Squad.findOne({ user_id: userId });
  if (existing) return existing;

  const squad = await Squad.create({
    user_id: userId,
    name: 'Mi Squad',
    formation: '4-3-3',
    isActive: true,
    startingEleven: [],
    bench: [],
    tactics: { style: 'Equilibrado' }
  });

  return squad;
};

/**
 * Activa un squad y desactiva los demás del usuario
 */
export const activateSquad = async (squadId, userId) => {
  await Squad.updateMany(
    { user_id: userId, isActive: true },
    { isActive: false }
  );

  const squad = await Squad.findOneAndUpdate(
    { _id: squadId, user_id: userId },
    { isActive: true },
    { returnDocument: 'after' }
  )
    .populate({
      path: 'startingEleven.user_player_id',
      populate: { path: 'player_id' }
    })
    .populate({
      path: 'bench',
      populate: { path: 'player_id' }
    });

  if (!squad) {
    throw new Error('Plantilla no encontrada o no tienes permiso.');
  }

  return squad;
};

/**
 * Actualiza un squad (formación, titulares, banquillo, tácticas)
 */
export const updateSquad = async (squadId, userId, data) => {
  const { name, formation, startingEleven, bench, tactics } = data;

  if (startingEleven && startingEleven.length > 0) {
    const playerIds = startingEleven
      .filter(slot => slot.user_player_id)
      .map(slot => slot.user_player_id);

    const validPlayers = await UserPlayer.find({
      _id: { $in: playerIds },
      user_id: userId
    });

    if (validPlayers.length !== playerIds.length) {
      throw new Error('Uno o más jugadores no pertenecen a este usuario.');
    }

    if (startingEleven.length > 11) {
      throw new Error('La plantilla no puede tener más de 11 titulares.');
    }
  }

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (formation !== undefined) updateFields.formation = formation;
  if (startingEleven !== undefined) updateFields.startingEleven = startingEleven;
  if (bench !== undefined) updateFields.bench = bench;
  if (tactics !== undefined) updateFields.tactics = tactics;

  const updatedSquad = await Squad.findOneAndUpdate(
    { _id: squadId, user_id: userId },
    updateFields,
    { returnDocument: 'after' }
  )
    .populate({
      path: 'startingEleven.user_player_id',
      populate: { path: 'player_id' }
    });

  if (!updatedSquad) {
    throw new Error('Plantilla no encontrada o no tienes permiso para editarla.');
  }

  return updatedSquad;
};

/**
 * Elimina un squad
 */
export const deleteSquad = async (squadId, userId) => {
  const result = await Squad.findOneAndDelete({ _id: squadId, user_id: userId });
  if (!result) {
    throw new Error('Plantilla no encontrada o no tienes permiso para eliminarla.');
  }
  return result;
};
