import { Router } from 'express';
import { admin } from '../middlewares/admin.js';
import * as adminCtrl from '../controllers/adminController.js';

const router = Router();

router.use(admin);

// Stats
router.get('/stats', adminCtrl.getStats);

// Players
router.get('/players', adminCtrl.getAllPlayers);
router.get('/players/:id', adminCtrl.getPlayerById);
router.post('/players', adminCtrl.createPlayer);
router.put('/players/:id', adminCtrl.updatePlayer);
router.delete('/players/:id', adminCtrl.deletePlayer);

// Packs
router.get('/packs', adminCtrl.getAllPacks);
router.get('/packs/:id', adminCtrl.getPackById);
router.post('/packs', adminCtrl.createPack);
router.put('/packs/:id', adminCtrl.updatePack);
router.delete('/packs/:id', adminCtrl.deletePack);

// Users
router.get('/users', adminCtrl.getAllUsers);
router.get('/users/:id', adminCtrl.getUserById);
router.put('/users/:id', adminCtrl.updateUser);

// Objectives
router.get('/objectives', adminCtrl.getAllObjectives);
router.get('/objectives/:id', adminCtrl.getObjectiveById);
router.post('/objectives', adminCtrl.createObjective);
router.put('/objectives/:id', adminCtrl.updateObjective);
router.delete('/objectives/:id', adminCtrl.deleteObjective);

export default router;
