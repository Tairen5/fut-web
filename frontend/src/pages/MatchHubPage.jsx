import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import './MatchHubPage.css';

export default function MatchHubPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showDifficulty, setShowDifficulty] = useState(null);

  const getDivision = (elo) => {
    const score = elo ?? 1000;
    if (score < 800) return 'Division 10';
    if (score < 900) return 'Division 9';
    if (score < 1000) return 'Division 8';
    if (score < 1100) return 'Division 7';
    if (score < 1200) return 'Division 6';
    if (score < 1400) return 'Division 5';
    if (score < 1600) return 'Division 4';
    if (score < 1800) return 'Division 3';
    if (score < 2000) return 'Division 2';
    return 'Division 1';
  };

  const recordStr = user?.record 
    ? `${user.record.wins}-${user.record.draws}-${user.record.losses}`
    : '0-0-0';

  const handleSelectMode = (mode) => {
    if (mode.locked) return;
    setShowDifficulty(mode.id);
  };

  const handleStartMatch = (mode, difficulty) => {
    setShowDifficulty(null);
    navigate(`/matches/live?mode=${mode}&difficulty=${difficulty}`);
  };

  return (
    <div className="match-hub-page">
      {showDifficulty && (
        <div className="difficulty-overlay" onClick={() => setShowDifficulty(null)}>
          <div className="difficulty-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Difficulty</h3>
            <div className="difficulty-options">
              {['easy', 'medium', 'hard'].map((d) => (
                <button key={d} className={`diff-btn diff-${d}`} onClick={() => handleStartMatch(showDifficulty, d)}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="diff-cancel" onClick={() => setShowDifficulty(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="hub-top">
        <div className="hub-hero">
          <div className="hero-stadium-bg" />
          <div className="hero-content">
            <h2 className="hero-headline">Build your legacy.</h2>
            <p className="hero-desc">Compete in different modes and challenge players around the world.</p>
            <svg viewBox="0 0 200 240" className="hero-shield">
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0f2e6e"/>
                  <stop offset="40%" stopColor="#1e5ddb"/>
                  <stop offset="100%" stopColor="#0f2e6e"/>
                </linearGradient>
              </defs>
              <path d="M100 10 L185 50 L185 140 Q185 200 100 225 Q15 200 15 140 L15 50 Z" fill="url(#heroGrad)" stroke="#ffd166" strokeWidth="3"/>
              <path d="M100 25 L170 58 L170 138 Q170 190 100 210 Q30 190 30 138 L30 58 Z" fill="#0a0a0a"/>
              <text x="100" y="120" textAnchor="middle" fontSize="50" fill="#1e5ddb" fontWeight="bold" fontFamily="Arial">UT</text>
            </svg>
          </div>
        </div>

        <div className="hub-modes">
          <button className="mode-card mode-rivals" onClick={() => handleSelectMode({ id: 'rivals', locked: false })}>
            <div className="mode-card-inner">
              <div className="mode-badge rivals-badge">
                <svg viewBox="0 0 200 240" className="mode-shield">
                  <defs>
                    <linearGradient id="rivalsGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8B7537"/>
                      <stop offset="40%" stopColor="#C4A84A"/>
                      <stop offset="100%" stopColor="#8B7537"/>
                    </linearGradient>
                  </defs>
                  <path d="M100 10 L180 45 L180 140 Q180 195 100 220 Q20 195 20 140 L20 45 Z" fill="url(#rivalsGrad)" stroke="#d4b85c" strokeWidth="2"/>
                  <path d="M100 22 L168 52 L168 138 Q168 185 100 208 Q32 185 32 138 L32 52 Z" fill="#1a1a1a"/>
                  <text x="100" y="80" textAnchor="middle" fontSize="16" fill="#888" fontFamily="Arial">DIV</text>
                  <text x="100" y="130" textAnchor="middle" fontSize="52" fill="#d4b85c" fontWeight="bold" fontFamily="Arial">UT</text>
                </svg>
                <span className="mode-shield-label">RIVALS</span>
              </div>
              <div className="mode-info">
                <h3 className="mode-name">Rivals</h3>
                <p className="mode-desc">Compete in Division Rivals and earn weekly rewards.</p>
                <div className="mode-stats">
                  <div className="stat-row">
                    <span className="stat-label">Skill Rating</span>
                    <span className="stat-value">{user?.elo ?? 1000}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Rank</span>
                    <div className="stat-rank">
                      <span>{getDivision(user?.elo)}</span>
                      <span className="rank-icon">XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>

          <button className="mode-card mode-friendlies" onClick={() => handleSelectMode({ id: 'friendlies', locked: false })}>
            <div className="mode-card-inner">
              <div className="mode-badge friendlies-badge">
                <svg viewBox="0 0 200 240" className="mode-shield">
                  <defs>
                    <linearGradient id="friendliesGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1a6b3c"/>
                      <stop offset="40%" stopColor="#2ea86a"/>
                      <stop offset="100%" stopColor="#1a6b3c"/>
                    </linearGradient>
                  </defs>
                  <path d="M100 10 L180 45 L180 140 Q180 195 100 220 Q20 195 20 140 L20 45 Z" fill="url(#friendliesGrad)" stroke="#4ccb7a" strokeWidth="2"/>
                  <path d="M100 22 L168 52 L168 138 Q168 185 100 208 Q32 185 32 138 L32 52 Z" fill="#0a0a0a"/>
                  <circle cx="100" cy="110" r="35" fill="none" stroke="#4ccb7a" strokeWidth="2"/>
                  <circle cx="100" cy="110" r="8" fill="#4ccb7a"/>
                  <path d="M100 75 L100 145" stroke="#4ccb7a" strokeWidth="1.5"/>
                  <path d="M65 110 L135 110" stroke="#4ccb7a" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="mode-info">
                <h3 className="mode-name">Friendlies</h3>
                <p className="mode-desc">Play friendly matches against other players.</p>
                <div className="mode-stats">
                  <div className="stat-row">
                    <span className="stat-label">Record</span>
                    <span className="stat-value">{recordStr}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Last Match</span>
                    <span className="stat-value green">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </button>

          <div className="mode-card mode-champions locked">
            <div className="mode-card-inner">
              <div className="mode-badge champions-badge">
                <svg viewBox="0 0 200 240" className="mode-shield">
                  <defs>
                    <linearGradient id="champGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8B4513"/>
                      <stop offset="40%" stopColor="#CD7F32"/>
                      <stop offset="100%" stopColor="#8B4513"/>
                    </linearGradient>
                  </defs>
                  <path d="M100 10 L180 45 L180 140 Q180 195 100 220 Q20 195 20 140 L20 45 Z" fill="url(#champGrad)" stroke="#daa520" strokeWidth="2"/>
                  <path d="M100 22 L168 52 L168 138 Q168 185 100 208 Q32 185 32 138 L32 52 Z" fill="#1a0a0a"/>
                  <text x="100" y="130" textAnchor="middle" fontSize="52" fill="#cd7f32" fontWeight="bold" fontFamily="Arial">UT</text>
                </svg>
                <span className="mode-lock-icon">🔒</span>
              </div>
              <div className="mode-info">
                <h3 className="mode-name">Champions</h3>
                <p className="mode-desc">Compete for the title and the best rewards.</p>
                <div className="mode-stats">
                  <div className="stat-row">
                    <span className="stat-label orange">Coming Soon</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label dim">Opens in: 2 Days 14 Hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mode-card mode-draft locked">
            <div className="mode-card-inner">
              <div className="mode-badge draft-badge">
                <svg viewBox="0 0 200 240" className="mode-shield">
                  <defs>
                    <linearGradient id="draftGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1a5276"/>
                      <stop offset="40%" stopColor="#2e86c1"/>
                      <stop offset="100%" stopColor="#1a5276"/>
                    </linearGradient>
                  </defs>
                  <path d="M100 10 L180 45 L180 140 Q180 195 100 220 Q20 195 20 140 L20 45 Z" fill="url(#draftGrad)" stroke="#5dade2" strokeWidth="2"/>
                  <path d="M100 22 L168 52 L168 138 Q168 185 100 208 Q32 185 32 138 L32 52 Z" fill="#0a0a1a"/>
                  <text x="100" y="115" textAnchor="middle" fontSize="42" fill="#5dade2" fontWeight="bold" fontFamily="Arial">UT</text>
                  <text x="100" y="150" textAnchor="middle" fontSize="18" fill="#5dade2" fontFamily="Arial">DRAFT</text>
                </svg>
                <span className="mode-lock-icon">🔒</span>
              </div>
              <div className="mode-info">
                <h3 className="mode-name">Draft</h3>
                <p className="mode-desc">Build your squad from player picks.</p>
                <div className="mode-stats">
                  <div className="stat-row">
                    <span className="stat-label orange">Coming Soon</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label dim">Opens in: 2 Days 14 Hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hub-bottom">
        <div className="info-card objectives-card">
          <div className="info-card-text">
            <h3>Objectives</h3>
            <p>Complete objectives to earn rewards and XP.</p>
            <div className="obj-claim">
              <span className="claim-green">3 Objectives</span>
              <span>Ready to Claim</span>
            </div>
          </div>
          <div className="info-card-icon-large">
            <div className="xp-badge">
              <svg viewBox="0 0 120 120" className="xp-svg">
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1a5276"/>
                    <stop offset="50%" stopColor="#2e86c1"/>
                    <stop offset="100%" stopColor="#1a5276"/>
                  </linearGradient>
                </defs>
                <path d="M60 5 L110 30 L110 90 Q110 115 60 115 Q10 115 10 90 L10 30 Z" fill="url(#xpGrad)"/>
                <text x="60" y="75" textAnchor="middle" fontSize="38" fill="#fff" fontWeight="bold" fontFamily="Arial">XP</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="info-card season-card">
          <div className="season-header">
            <span className="season-green">Season 6: Pitch Beasts</span>
          </div>
          <h3>Season Progress</h3>
          <div className="season-level">
            <span>Level 31</span>
            <span className="level-next">32</span>
          </div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: '65%' }} />
          </div>
          <div className="xp-text">
            <span>18,450 / 24,000 XP</span>
          </div>
          <div className="season-end">
            <span>End Season: 27 Days 6 Hours</span>
          </div>
        </div>

        <div className="info-card tots-card">
          <div className="tots-bg" />
          <div className="tots-content">
            <h3 className="tots-title">TEAM OF THE SEASON</h3>
            <p className="tots-desc">The best players of the season are now in packs!</p>
            <div className="tots-players">
              <div className="tots-player">
                <div className="tots-card-img">
                  <span className="tots-rating">97</span>
                  <span className="tots-name">Haaland</span>
                </div>
              </div>
              <div className="tots-player">
                <div className="tots-card-img">
                  <span className="tots-rating">96</span>
                  <span className="tots-name">Bellingham</span>
                </div>
              </div>
              <div className="tots-player">
                <div className="tots-card-img">
                  <span className="tots-rating">95</span>
                  <span className="tots-name">Salah</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
