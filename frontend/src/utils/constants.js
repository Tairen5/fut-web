// Usuario de prueba mientras no existe el sistema de Auth
// Cuando implementemos el login, este valor vendrá del JWT/Zustand
export const DEV_USER_ID = 'dev-user-placeholder';

// Posiciones disponibles en el juego
export const POSITIONS = ['POR', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC', 'SD'];

// Colores de cada promo
export const PROMO_COLORS = {
  TOTW: { gradient: 'linear-gradient(135deg, #0a1628, #1a3a5c, #0d2240)', text: '#5b9bd5', border: '#2980b9', bg: '#0d2240' },
  TOTY: { gradient: 'linear-gradient(135deg, #0d1b2a, #1b3a5c, #c9a752)', text: '#c9a752', border: '#c9a752', bg: '#0d1b2a' },
  TOTS: { gradient: 'linear-gradient(135deg, #0a2e1a, #1a5c3a, #32d583)', text: '#32d583', border: '#32d583', bg: '#0a2e1a' },
  FUT:  { gradient: 'linear-gradient(135deg, #2a0a2e, #5c1a5c, #a855f7)', text: '#a855f7', border: '#a855f7', bg: '#2a0a2e' },
  IF:   { gradient: 'linear-gradient(135deg, #0a1628, #1a3a5c, #0d2240)', text: '#5b9bd5', border: '#2980b9', bg: '#0d2240' },
  HERO: { gradient: 'linear-gradient(135deg, #1a0a0a, #5c1a1a, #f97066)', text: '#f97066', border: '#f97066', bg: '#1a0a0a' },
  ICON: { gradient: 'linear-gradient(135deg, #2a1a0a, #5c3a1a, #f0b040)', text: '#f0b040', border: '#f0b040', bg: '#2a1a0a' },
  BASE: { gradient: 'linear-gradient(135deg, #1a1a1a, #2a2a2a, #3a3a3a)', text: '#c9a752', border: '#555',    bg: '#1a1a1a' },
};

// Colores de rareza según el overall del jugador
export const getRarityStyle = (overall) => {
  if (overall >= 85) return { bg: 'var(--card-gold)',   border: 'rgba(240,180,41,0.6)',  label: 'GOLD',   glow: '0 0 40px rgba(240,180,41,0.3)' };
  if (overall >= 75) return { bg: 'var(--card-silver)', border: 'rgba(180,190,210,0.5)', label: 'SILVER', glow: '0 0 40px rgba(180,190,210,0.2)' };
  return                    { bg: 'var(--card-bronze)', border: 'rgba(180,100,40,0.5)',  label: 'BRONZE', glow: '0 0 40px rgba(180,100,40,0.2)' };
};
