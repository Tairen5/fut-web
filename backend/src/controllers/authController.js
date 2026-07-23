import * as discordAuth from '../services/discordAuthService.js';

// Redirige al usuario a la página de autorización de Discord
export const discordLogin = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
};

// Callback tras la autorización de Discord
export const discordCallback = async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Si el usuario canceló el acceso en Discord
  if (error || !code) {
    return res.redirect(`${frontendUrl}/login?error=discord_denied`);
  }

  try {
    const tokenData = await discordAuth.exchangeCode(code);
    const discordUser = await discordAuth.getDiscordUser(tokenData.access_token);
    const { token, user } = await discordAuth.findOrCreateUser(discordUser);

    // Redirigir al frontend con el token y datos del usuario como parámetros de URL
    const params = new URLSearchParams({
      token,
      user: JSON.stringify(user),
    });

    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  } catch (err) {
    console.error('Discord OAuth2 callback error:', err);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
};

// Obtiene los datos del usuario autenticado (para recuperar sesión)
export const getMe = async (req, res) => {
  try {
    const user = await discordAuth.getMe(req.userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
