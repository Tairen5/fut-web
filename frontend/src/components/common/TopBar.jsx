import { useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import './TopBar.css';

const PAGE_TITLES = {
  '/players': 'Home',
  '/squad': 'Squads',
  '/collection': 'Club',
  '/store': 'Store',
  '/matches': 'Play',
  '/login': 'Login',
};

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/players/')) return 'Player Detail';
    if (path.startsWith('/promos/')) return 'Promo';
    if (path.startsWith('/matches/live')) return 'Match Day';
    if (path.startsWith('/matches')) return 'Play';
    return PAGE_TITLES[path] || 'Home';
  };

  const clubName = user?.discordUsername || 'My Club';
  const avatarUrl = user?.discordAvatar || null;

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-site-name" style={{ fontSize: '1.2rem' }}>{getPageTitle()}</span>
      </div>

      <div className="top-bar-right">
        <div className="top-bar-currencies">
          <div className="currency-item">
            <div className="currency-icon coins-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#c9a752" stroke="#ffd166" strokeWidth="1"/>
                <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1a1200">C</text>
              </svg>
            </div>
            <span className="currency-value" style={{ fontSize: '1rem' }}>{user?.currency?.toLocaleString() || '0'}</span>
          </div>
          <div className="currency-item">
            <div className="currency-icon points-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="#4f8ef7" stroke="#7ab0ff" strokeWidth="0.5"/>
              </svg>
            </div>
            <span className="currency-value" style={{ fontSize: '1rem' }}>{user?.points?.toLocaleString() || '0'}</span>
            <span className="currency-label" style={{ fontSize: '0.7rem' }}>FC Points</span>
          </div>
        </div>

        <div className="top-bar-divider" />

        <div className="top-bar-club">
          <div className="club-info">
            <span className="club-name" style={{ fontSize: '0.85rem' }}>{clubName}</span>
          </div>
          {/* Avatar de Discord si está disponible, sino el escudo genérico */}
          <div className="club-badge">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={clubName}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '2px solid #5865F2',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <svg viewBox="0 0 40 48" width="36" height="42">
                <path d="M20 4 L36 14 L36 30 Q36 42 20 46 Q4 42 4 30 L4 14 Z" fill="#1a1a2e" stroke="#c9a752" strokeWidth="2.5"/>
                <text x="20" y="30" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fill="#c9a752" fontWeight="bold">UT</text>
              </svg>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
