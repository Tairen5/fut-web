import express from 'express';
import {
  getSquads,
  getActiveSquad,
  createSquad,
  activateSquad,
  updateSquad,
  deleteSquad
} from '../controllers/squadController.js';

const router = express.Router();

// GET /api/squad/user/:userId - Obtener todos los squads de un usuario
router.get('/user/:userId', getSquads);

// GET /api/squad/active/:userId - Obtener el squad activo
router.get('/active/:userId', getActiveSquad);

// POST /api/squad - Crear un squad nuevo
router.post('/', createSquad);

// PUT /api/squad/activate/:id - Activar un squad (desactiva los demás)
router.put('/activate/:id', activateSquad);

// PUT /api/squad/:id - Actualizar formación, titulares, etc.
router.put('/:id', updateSquad);

// DELETE /api/squad/:id - Eliminar un squad
router.delete('/:id', deleteSquad);

export default router;
