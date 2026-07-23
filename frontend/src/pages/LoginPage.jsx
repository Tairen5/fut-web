import { useSearchParams } from 'react-router-dom';
import './AuthPages.css';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleDiscordLogin = () => {
    // Redirige al backend que inicia el flujo de Discord OAuth2
    window.location.href = 'http://localhost:5000/api/auth/discord';
  };

  const errorMessages = {
    discord_denied: 'You cancelled the Discord authorisation.',
    server_error: 'A server error occurred. Please try again.',
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>

        <p style={{
          textAlign: 'center',
          color: 'rgba(232,234,240,0.5)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2rem',
        }}>
          Use your Discord account to sign in and link your bot progress to the web.
        </p>

        {error && (
          <span className="auth-error" style={{ display: 'block', marginBottom: '1rem' }}>
            {errorMessages[error] || 'An error occurred.'}
          </span>
        )}

        <button
          onClick={handleDiscordLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.85rem 1rem',
            background: '#5865F2',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontFamily: 'var(--font-ui)',
            fontSize: '1rem',
            fontWeight: '700',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4752c4'}
          onMouseLeave={e => e.currentTarget.style.background = '#5865F2'}
        >
          {/* Logo SVG de Discord */}
          <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          Login with Discord
        </button>
      </div>
    </div>
  );
}
