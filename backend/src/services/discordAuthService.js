import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'futweb-secret-key';

// Construye la URL del avatar de Discord desde el ID y hash
function buildAvatarUrl(userId, avatarHash) {
  if (!avatarHash) return null;
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
}

// Intercambia el code de OAuth2 por un access_token de Discord
export async function exchangeCode(code) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Discord token exchange failed: ${err}`);
  }

  return response.json();
}

// Obtiene los datos del usuario autenticado usando el access_token
export async function getDiscordUser(accessToken) {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Discord user data.');
  }

  return response.json();
}

// Busca al usuario en MongoDB por su discordId o lo crea si es nuevo
export async function findOrCreateUser(discordUser) {
  const avatarUrl = buildAvatarUrl(discordUser.id, discordUser.avatar);

  let user = await User.findOne({ discordId: discordUser.id });

  if (!user) {
    // Crear nuevo usuario con datos de Discord
    user = await User.create({
      discordId: discordUser.id,
      discordUsername: discordUser.username,
      discordAvatar: avatarUrl,
    });
  } else {
    // Actualizar datos de Discord por si el usuario cambió su avatar o nombre
    user.discordUsername = discordUser.username;
    user.discordAvatar = avatarUrl;
    await user.save();
  }

  // Generar JWT de la web con el _id de MongoDB
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: {
      _id: user._id,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      discordAvatar: user.discordAvatar,
      currency: user.currency,
      points: user.points,
      elo: user.elo,
      record: user.record,
    },
  };
}

// Obtiene los datos del usuario por su ID de MongoDB
export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found.');
  return {
    _id: user._id,
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    discordAvatar: user.discordAvatar,
    currency: user.currency,
    points: user.points,
    elo: user.elo,
    record: user.record,
  };
}
