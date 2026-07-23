import express from 'express';
import {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer
} from '../controllers/playerController.js';

const router = express.Router();

// GET /api/players          → Listar catálogo (con filtros opcionales por ?query)
// GET /api/players/:id      → Ver detalle de un jugador
// POST /api/players         → Crear jugador (admin)
// PUT /api/players/:id      → Actualizar jugador (admin)
// DELETE /api/players/:id   → Eliminar jugador (admin)

router.get('/', getAllPlayers);
router.get('/:id', getPlayerById);
router.post('/', createPlayer);
router.put('/:id', updatePlayer);
router.delete('/:id', deletePlayer);

export default router;
