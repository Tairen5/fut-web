import SBC from '../models/SBC.js';

/**
 * Obtiene todos los SBCs activos
 */
export const getAllSBCs = async () => {
  const sbcs = await SBC.find({ isActive: true }).sort({ createdAt: -1 });
  return sbcs;
};

/**
 * Obtiene un SBC por ID
 */
export const getSBCById = async (sbcId) => {
  const sbc = await SBC.findById(sbcId);
  if (!sbc) throw new Error('SBC no encontrado.');
  return sbc;
};

/**
 * Crea un SBC nuevo (admin)
 */
export const createSBC = async (data) => {
  const sbc = await SBC.create(data);
  return sbc;
};

/**
 * Actualiza un SBC (admin)
 */
export const updateSBC = async (sbcId, data) => {
  const sbc = await SBC.findByIdAndUpdate(sbcId, data, { returnDocument: 'after' });
  if (!sbc) throw new Error('SBC no encontrado.');
  return sbc;
};

/**
 * Elimina un SBC (admin)
 */
export const deleteSBC = async (sbcId) => {
  const sbc = await SBC.findByIdAndDelete(sbcId);
  if (!sbc) throw new Error('SBC no encontrado.');
  return sbc;
};

/**
 * Obtiene los SBCs diarios (que expiran en menos de 24h)
 */
export const getDailySBCs = async () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sbcs = await SBC.find({
    isActive: true,
    expiresAt: { $lte: tomorrow, $gt: now },
  }).sort({ expiresAt: 1 });
  return sbcs;
};
