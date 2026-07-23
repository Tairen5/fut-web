import { useNavigate } from 'react-router-dom';
import { getRarityStyle } from '../../utils/constants';
import './PlayerCard.css';

export default function PlayerCard({ player, onClick, actionLabel }) {
  const navigate = useNavigate();
  if (!player) return null;

  const rarity = getRarityStyle(player.overall);
  const isPlaceholder = !player.image || player.image.includes('dicebear');

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/players/${player._id}`);
    }
  };

  return (
    <div className={`player-card-wrapper ${isPlaceholder ? 'placeholder-wrapper' : 'real-wrapper'} animate-fade-up`}>
      <div
        className={`player-card ${isPlaceholder ? 'placeholder-card' : 'real-card'}`}
        style={isPlaceholder ? { background: rarity.bg, borderColor: rarity.border } : {}}
        onClick={handleClick}
      >
        {/* Imagen del jugador (que es la carta completa o cara si es placeholder) */}
        <div className="card-image-wrapper">
          {player.image ? (
            <img
              src={
                player.image.startsWith('http://') || 
                player.image.startsWith('https://') || 
                player.image.startsWith('data:') || 
                player.image.startsWith('/')
                  ? player.image
                  : `/player-cards/${player.image}`
              }
              alt={player.name}
              className="card-image"
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="card-image-placeholder">👤</div>
          )}
        </div>

        {/* Si es un placeholder, pintamos el nombre dentro del recuadro para identificarlo */}
        {isPlaceholder && (
          <div className="placeholder-name font-game" style={{ color: '#fff' }}>
            {player.name}
          </div>
        )}
      </div>

      {actionLabel && (
        <button
          className="card-action btn-gold"
          onClick={e => { e.stopPropagation(); onClick && onClick(); }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
