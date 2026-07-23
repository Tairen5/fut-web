import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PROMO_COLORS } from '../utils/constants';
import PlayerCard from '../components/game/PlayerCard';
import './PromoPage.css';

const PROMO_DESCRIPTIONS = {
  TOTY: 'Has votado por lo mejor del fútbol – descubre quién ha ganado la votación del Equipo del año.',
  TOTS: 'Los mejores jugadores de la temporada, elegidos por su rendimiento excepcional.',
  TOTW: 'Las mejores actuaciones de la semana recompensadas con tarjetas especiales.',
  FUT: 'Las estrellas más emblemáticas de la historia del Ultimate Team.',
  HERO: 'Jugadores legendarios que marcaron una era en el fútbol.',
  ICON: 'Leyendas del fútbol disponibles en tu equipo.',
  IF: 'Informes de las mejores actuaciones semanales del fútbol mundial.',
  BASE: 'La base de todos los jugadores disponibles en el juego.',
};

const POSITION_GROUPS = [
  {
    key: 'ATT',
    label: 'ATTACKER',
    positions: ['ST', 'LW', 'RW', 'LF', 'RF', 'CF'],
    icon: (color) => (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="position-icon-svg">
        <path d="M20 65L40 15L60 65H20Z" stroke={color} strokeWidth="3" fill="none" />
        <path d="M28 50L40 25L52 50" stroke={color} strokeWidth="2" opacity="0.5" />
        <circle cx="40" cy="35" r="4" fill={color} opacity="0.7" />
      </svg>
    ),
  },
  {
    key: 'MID',
    label: 'MIDFIELDER',
    positions: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
    icon: (color) => (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="position-icon-svg">
        <circle cx="40" cy="40" r="25" stroke={color} strokeWidth="3" fill="none" />
        <circle cx="40" cy="40" r="8" fill={color} opacity="0.4" />
        <line x1="40" y1="15" x2="40" y2="65" stroke={color} strokeWidth="1.5" opacity="0.3" />
        <line x1="15" y1="40" x2="65" y2="40" stroke={color} strokeWidth="1.5" opacity="0.3" />
      </svg>
    ),
  },
  {
    key: 'DEF',
    label: 'DEFENDER',
    positions: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'GK'],
    icon: (color) => (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="position-icon-svg">
        <path d="M40 10L65 25V55L40 70L15 55V25L40 10Z" stroke={color} strokeWidth="3" fill="none" />
        <path d="M40 20L55 28V48L40 56L25 48V28L40 20Z" stroke={color} strokeWidth="1.5" opacity="0.4" />
      </svg>
    ),
  },
];

export default function PromoPage() {
  const { promoName } = useParams();
  const navigate = useNavigate();
  const colors = PROMO_COLORS[promoName] || PROMO_COLORS.BASE;
  const description = PROMO_DESCRIPTIONS[promoName] || 'Descubre los mejores jugadores de esta promoción.';

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const groupRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    groupRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await api.get('/players');
        const filtered = res.data.filter((p) => p.promo === promoName);
        setPlayers(filtered);
      } catch {
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [promoName]);

  const grouped = POSITION_GROUPS.map((group) => ({
    ...group,
    players: players.filter((p) => group.positions.includes(p.position)),
  })).filter((group) => group.players.length > 0);

  return (
    <div className="promo-page" style={{ background: colors.gradient }}>
      <div className="promo-content">
        <div className="promo-left">
          <h1 className="promo-title">
            <span className="promo-title-the">THE</span>
            <span className="promo-title-name" style={{ color: colors.text }}>{promoName}</span>
          </h1>
          <p className="promo-description">{description}</p>
          <button className="promo-back-btn" onClick={() => navigate('/players')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al catálogo
          </button>
        </div>
        <div className="promo-right">
          <div className="promo-formation">
            <img
              src="/promoassets/team formation.png"
              alt="Team formation"
              className="promo-formation-img"
            />
          </div>
        </div>
      </div>

      {!loading && grouped.length > 0 && (
        <div className="promo-players-section">
          {grouped.map((group, index) => (
            <div
              key={group.key}
              className="position-group"
              ref={(el) => { groupRefs.current[index] = el; }}
            >
              <div className="position-group-left">
                <div className="position-icon">{group.icon(colors.text)}</div>
                <div className="position-info">
                  <h2 className="position-label">{group.label}</h2>
                </div>
              </div>
              <div className="position-group-right">
                {group.players.map((player) => (
                  <div key={player._id} className="promo-player-card">
                    <PlayerCard player={player} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
