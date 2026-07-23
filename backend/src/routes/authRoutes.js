import express from 'express';
import { discordLogin, discordCallback, getMe } from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// Inicia el flujo de Discord OAuth2 — redirige al usuario a Discord
router.get('/discord', discordLogin);

// Discord llama a esta URL con el código de autorización
router.get('/discord/callback', discordCallback);

// Obtiene los datos del usuario autenticado (requiere JWT)
router.get('/me', auth, getMe);

export default router;
