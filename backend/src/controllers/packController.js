import * as packService from '../services/packService.js';

export const getAllPacks = async (req, res) => {
  try {
    const packs = await packService.getAllPacks();
    res.status(200).json(packs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const openPack = async (req, res) => {
  try {
    const result = await packService.openPack(req.userId, req.params.packId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const claimPack = async (req, res) => {
  try {
    const result = await packService.claimPack(req.userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
