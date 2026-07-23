import express from 'express';
import { completeMatch } from '../controllers/matchController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/complete', auth, completeMatch);

export default router;
