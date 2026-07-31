import Player from '../models/Player.js';
import Pack from '../models/Pack.js';
import User from '../models/User.js';
import Objective from '../models/Objective.js';
import UserPlayer from '../models/UserPlayer.js';

// ── Stats ──

export const getStats = async () => {
  const [totalUsers, totalPlayers, totalPacks, totalObjectives, totalUserPlayers] = await Promise.all([
    User.countDocuments(),
    Player.countDocuments(),
    Pack.countDocuments(),
    Objective.countDocuments(),
    UserPlayer.countDocuments(),
  ]);

  const currencyAgg = await User.aggregate([
    { $group: { _id: null, total: { $sum: '$currency' } } },
  ]);
  const totalCurrency = currencyAgg[0]?.total || 0;

  const eloAgg = await User.aggregate([
    { $group: { _id: null, avg: { $avg: '$elo' } } },
  ]);
  const avgElo = Math.round(eloAgg[0]?.avg || 0);

  return {
    totalUsers,
    totalPlayers,
    totalPacks,
    totalObjectives,
    totalUserPlayers,
    totalCurrency,
    avgElo,
  };
};

// ── Players CRUD ──

export const getAllPlayers = async (filters = {}) => {
  const query = {};

  if (filters.position) query.position = filters.position;
  if (filters.promo) query.promo = filters.promo;
  if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  if (filters.minOverall || filters.maxOverall) {
    query.overall = {};
    if (filters.minOverall) query.overall.$gte = Number(filters.minOverall);
    if (filters.maxOverall) query.overall.$lte = Number(filters.maxOverall);
  }

  return Player.find(query).sort({ overall: -1 });
};

export const getPlayerById = async (id) => {
  const player = await Player.findById(id);
  if (!player) throw new Error('Jugador no encontrado.');
  return player;
};

export const createPlayer = async (data) => {
  const { name, image, overall, position, stats, club, nation } = data;
  if (!name || !image || !overall || !position || !stats || !club || !nation) {
    throw new Error('Faltan campos obligatorios.');
  }
  return Player.create(data);
};

export const updatePlayer = async (id, data) => {
  const player = await Player.findByIdAndUpdate(id, data, { new: true });
  if (!player) throw new Error('Jugador no encontrado.');
  return player;
};

export const deletePlayer = async (id) => {
  const player = await Player.findByIdAndDelete(id);
  if (!player) throw new Error('Jugador no encontrado.');
  return player;
};

// ── Packs CRUD ──

export const getAllPacks = async () => {
  return Pack.find().populate('possibleCards.player_id');
};

export const getPackById = async (id) => {
  const pack = await Pack.findById(id).populate('possibleCards.player_id');
  if (!pack) throw new Error('Pack no encontrado.');
  return pack;
};

export const createPack = async (data) => {
  const { name, price, numCards } = data;
  if (!name || price == null || !numCards) {
    throw new Error('Faltan campos obligatorios: name, price, numCards.');
  }
  return Pack.create(data);
};

export const updatePack = async (id, data) => {
  const pack = await Pack.findByIdAndUpdate(id, data, { new: true });
  if (!pack) throw new Error('Pack no encontrado.');
  return pack;
};

export const deletePack = async (id) => {
  const pack = await Pack.findByIdAndDelete(id);
  if (!pack) throw new Error('Pack no encontrado.');
  return pack;
};

// ── Users ──

export const getAllUsers = async (filters = {}) => {
  const query = {};

  if (filters.name) {
    query.discordUsername = { $regex: filters.name, $options: 'i' };
  }
  if (filters.isAdmin !== undefined) {
    query.isAdmin = filters.isAdmin === 'true';
  }

  return User.find(query).sort({ createdAt: -1 });
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new Error('Usuario no encontrado.');
  return user;
};

export const updateUser = async (id, data) => {
  const allowed = ['isAdmin', 'currency', 'elo', 'points'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  const user = await User.findByIdAndUpdate(id, update, { new: true });
  if (!user) throw new Error('Usuario no encontrado.');
  return user;
};

// ── Objectives CRUD ──

export const getAllObjectives = async () => {
  return Objective.find().sort({ createdAt: -1 });
};

export const getObjectiveById = async (id) => {
  const objective = await Objective.findById(id);
  if (!objective) throw new Error('Objetivo no encontrado.');
  return objective;
};

export const createObjective = async (data) => {
  const { name, description, type, targetValue, rewardType, rewardValue } = data;
  if (!name || !description || !type || !targetValue || !rewardType || rewardValue == null) {
    throw new Error('Faltan campos obligatorios.');
  }
  return Objective.create(data);
};

export const updateObjective = async (id, data) => {
  const objective = await Objective.findByIdAndUpdate(id, data, { new: true });
  if (!objective) throw new Error('Objetivo no encontrado.');
  return objective;
};

export const deleteObjective = async (id) => {
  const objective = await Objective.findByIdAndDelete(id);
  if (!objective) throw new Error('Objetivo no encontrado.');
  return objective;
};
