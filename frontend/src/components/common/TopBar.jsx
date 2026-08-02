import { useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import './TopBar.css';

export default function TopBar() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const clubName = user?.discordUsername || 'My Club';
  const avatarUrl = user?.discordAvatar || null;

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <span className="top-bar-site-name">Blue Lock</span>
      </div>

      <div className="top-bar-right">
        <div className="top-bar-currencies">
          <div className="currency-item">
            <div className="currency-icon coins-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#1e5ddb" stroke="#ffd166" strokeWidth="1"/>
                <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1a1200">C</text>
              </svg>
            </div>
            <span className="currency-value">{user?.currency?.toLocaleString() || '0'}</span>
          </div>
          <div className="currency-item">
            <div className="currency-icon points-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="#4f8ef7" stroke="#7ab0ff" strokeWidth="0.5"/>
              </svg>
            </div>
            <span className="currency-value">{user?.points?.toLocaleString() || '0'}</span>
            <span className="currency-label">FC Points</span>
          </div>
        </div>

        {user?.isAdmin && (
          <>
            <div className="top-bar-divider" />
            <Link to="/admin" className="top-bar-admin-btn" title="Panel Admin">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Admin</span>
            </Link>
          </>
        )}

        <div className="top-bar-divider" />

        <div className="top-bar-club">
          <div className="club-info">
            <span className="club-name">{clubName}</span>
          </div>
          <div className="club-badge">
            {avatarUrl ? (
              <img src={avatarUrl} alt={clubName} className="club-badge-img" />
            ) : (
              <svg viewBox="0 0 40 48" width="32" height="38">
                <path d="M20 4 L36 14 L36 30 Q36 42 20 46 Q4 42 4 30 L4 14 Z" fill="#1a1a2e" stroke="#1e5ddb" strokeWidth="2.5"/>
                <text x="20" y="30" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fill="#1e5ddb" fontWeight="bold">UT</text>
              </svg>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
