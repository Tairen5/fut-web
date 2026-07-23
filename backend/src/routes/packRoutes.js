import express from 'express';
import { getAllPacks, openPack, claimPack } from '../controllers/packController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getAllPacks);
router.post('/open/claim', auth, claimPack);
router.post('/open/:packId', auth, openPack);

export default router;
