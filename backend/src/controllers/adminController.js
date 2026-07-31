import * as adminService from '../services/adminService.js';

// ── Stats ──

export const getStats = async (req, res) => {
  try {
    const stats = await adminService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Players ──

export const getAllPlayers = async (req, res) => {
  try {
    const players = await adminService.getAllPlayers(req.query);
    res.status(200).json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlayerById = async (req, res) => {
  try {
    const player = await adminService.getPlayerById(req.params.id);
    res.status(200).json(player);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPlayer = async (req, res) => {
  try {
    const player = await adminService.createPlayer(req.body);
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePlayer = async (req, res) => {
  try {
    const player = await adminService.updatePlayer(req.params.id, req.body);
    res.status(200).json(player);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePlayer = async (req, res) => {
  try {
    await adminService.deletePlayer(req.params.id);
    res.status(200).json({ message: 'Jugador eliminado.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// ── Packs ──

export const getAllPacks = async (req, res) => {
  try {
    const packs = await adminService.getAllPacks();
    res.status(200).json(packs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPackById = async (req, res) => {
  try {
    const pack = await adminService.getPackById(req.params.id);
    res.status(200).json(pack);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPack = async (req, res) => {
  try {
    const pack = await adminService.createPack(req.body);
    res.status(201).json(pack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePack = async (req, res) => {
  try {
    const pack = await adminService.updatePack(req.params.id, req.body);
    res.status(200).json(pack);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePack = async (req, res) => {
  try {
    await adminService.deletePack(req.params.id);
    res.status(200).json({ message: 'Pack eliminado.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// ── Users ──

export const getAllUsers = async (req, res) => {
  try {
    const users = await adminService.getAllUsers(req.query);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Objectives ──

export const getAllObjectives = async (req, res) => {
  try {
    const objectives = await adminService.getAllObjectives();
    res.status(200).json(objectives);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getObjectiveById = async (req, res) => {
  try {
    const objective = await adminService.getObjectiveById(req.params.id);
    res.status(200).json(objective);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createObjective = async (req, res) => {
  try {
    const objective = await adminService.createObjective(req.body);
    res.status(201).json(objective);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateObjective = async (req, res) => {
  try {
    const objective = await adminService.updateObjective(req.params.id, req.body);
    res.status(200).json(objective);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteObjective = async (req, res) => {
  try {
    await adminService.deleteObjective(req.params.id);
    res.status(200).json({ message: 'Objetivo eliminado.' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
