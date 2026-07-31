import { NavLink } from 'react-router-dom';
import './admin.css';

const NAV_ADMIN = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/players', label: 'Jugadores', icon: '⚽' },
  { to: '/admin/packs', label: 'Sobres', icon: '🎁' },
  { to: '/admin/users', label: 'Usuarios', icon: '👤' },
  { to: '/admin/objectives', label: 'Objetivos', icon: '🎯' },
];

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-badge">ADMIN</span>
        </div>
        <nav className="admin-nav">
          {NAV_ADMIN.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink to="/players" className="admin-back-link">
          ← Volver a la web
        </NavLink>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
