import express from 'express';
import {
  getUserCollection,
  getUserPlayerById,
  discardUserPlayer
} from '../controllers/userPlayerController.js';

const router = express.Router();

// GET /api/user-players/:userId               → Ver toda la colección de un usuario
// GET /api/user-players/:userId/:userPlayerId  → Ver detalle de una carta concreta
// DELETE /api/user-players/:id                → Descartar una carta (body: { userId })

router.get('/:userId', getUserCollection);
router.get('/:userId/:userPlayerId', getUserPlayerById);
router.delete('/:id', discardUserPlayer);

export default router;
