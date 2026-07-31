import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import PlayerCard from '../components/game/PlayerCard';
import './StorePage.css';

const PACK_COLORS = {
  Bronze: { accent: '#cd7f32', bg: 'linear-gradient(180deg, #1a1410 0%, #2a1c12 50%, #1a1410 100%)', border: '#cd7f32' },
  Silver: { accent: '#b0b8c4', bg: 'linear-gradient(180deg, #14161a 0%, #1e2228 50%, #14161a 100%)', border: '#b0b8c4' },
  Gold: { accent: '#d4a843', bg: 'linear-gradient(180deg, #1a1810 0%, #2a2412 50%, #1a1810 100%)', border: '#d4a843' },
  Premium: { accent: '#a855f7', bg: 'linear-gradient(180deg, #18101e 0%, #22142e 50%, #18101e 100%)', border: '#a855f7' },
  Ultimate: { accent: '#1e90ff', bg: 'linear-gradient(180deg, #10141e 0%, #14202e 50%, #10141e 100%)', border: '#1e90ff' },
};

const getPackStyle = (name) => {
  const n = name.toLowerCase();
  if (n.includes('premium')) return PACK_COLORS.Premium;
  if (n.includes('ultimate')) return PACK_COLORS.Ultimate;
  if (n.includes('gold')) return PACK_COLORS.Gold;
  if (n.includes('silver')) return PACK_COLORS.Silver;
  return PACK_COLORS.Bronze;
};

const StorePage = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOpening, setShowOpening] = useState(false);
  const [openedCards, setOpenedCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [claimTimeLeft, setClaimTimeLeft] = useState(0);
  const [highlightPack, setHighlightPack] = useState(null);
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) return;
    const fetchPacks = async () => {
      try {
        const res = await api.get('/packs');
        setPacks(res.data);
      } catch (error) {
        console.error('Error fetching packs:', error);
      } finally {
        setLoading(false);
      }
    };
    const checkClaimTimer = () => {
      const lastClaim = localStorage.getItem('lastClaimTime');
      if (lastClaim) {
        const elapsed = Math.floor((Date.now() - parseInt(lastClaim)) / 1000);
        setClaimTimeLeft(Math.max(0, 60 - elapsed));
      }
    };
    fetchPacks();
    checkClaimTimer();
  }, [user]);

  useEffect(() => {
    if (claimTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setClaimTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [claimTimeLeft]);

  const handleBuyPack = async (packId) => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.post(`/packs/open/${packId}`);
      setUser({ ...user, currency: res.data.currency });
      setOpenedCards(res.data.cards);
      setCurrentCardIndex(0);
      setShowOpening(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Error opening pack');
    }
  };

  const handleClaim = async () => {
    if (!user) { navigate('/login'); return; }
    if (claimTimeLeft > 0) return;
    try {
      const res = await api.post('/packs/open/claim');
      setUser({ ...user, currency: res.data.currency });
      setOpenedCards(res.data.cards);
      setCurrentCardIndex(0);
      setShowOpening(true);
      localStorage.setItem('lastClaimTime', Date.now().toString());
      setClaimTimeLeft(60);
    } catch (error) {
      alert(error.response?.data?.message || 'Error claiming pack');
    }
  };

  const nextCard = useCallback(() => {
    if (currentCardIndex < openedCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setShowOpening(false);
      setOpenedCards([]);
      setCurrentCardIndex(0);
    }
  }, [currentCardIndex, openedCards.length]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (user === null || loading) {
    return <div className="store-loading"><div className="spinner" /></div>;
  }

  const featured = packs.find((p) => p.price >= 5000) || packs[0];

  return (
    <div className="store-page">
      <div className="store-hero">
        <div className="store-hero-content">
          <h2 className="store-hero-title">Free Pack</h2>
          <p className="store-hero-desc">Get a free pack every minute</p>
          {claimTimeLeft > 0 ? (
            <div className="store-hero-timer">
              <span>Available in {formatTime(claimTimeLeft)}</span>
            </div>
          ) : (
            <button className="store-hero-btn" onClick={handleClaim}>
              CLAIM NOW <span>&rsaquo;</span>
            </button>
          )}
        </div>
        <div className="store-hero-visual">
          <div className="store-hero-glow" />
          <div className="store-hero-pack-stack">
            <div className="store-hero-pack-card" />
            <div className="store-hero-pack-card store-hero-pack-card--top" />
          </div>
        </div>
        <div className="store-hero-blue-lock-watermark">BLUE<br/>LOCK</div>
      </div>

      <div className="store-tabs">
        <button className="store-tab active">Packs</button>
        <button className="store-tab">Items</button>
        <button className="store-tab">Bundles</button>
        <button className="store-tab">Stadium</button>
        <button className="store-tab">Customization</button>
      </div>

      <section className="store-packs-section">
        <div className="store-packs-grid">
          {packs.map((pack) => {
            const style = getPackStyle(pack.name);
            const highlighted = pack.possibleCards
              ?.filter((c) => c.player_id?.overall >= 85)
              .map((c) => c.player_id)
              .filter(Boolean) || [];
            return (
              <div
                key={pack._id}
                className={`store-pack-card ${!user || user.currency < pack.price ? 'store-pack-card--disabled' : ''}`}
                style={{ '--pack-accent': style.accent, borderColor: style.border }}
                onClick={() => handleBuyPack(pack._id)}
                role="button"
                tabIndex={0}
              >
                <div className="store-pack-visual" style={{ background: style.bg }}>
                  <div className="store-pack-glow" style={{ background: `radial-gradient(circle, ${style.accent}33 0%, transparent 70%)` }} />
                  {pack.image ? (
                    <div className="store-pack-image">
                      <img
                        src={pack.image.startsWith('http') || pack.image.startsWith('/') ? pack.image : `/packs/${pack.image}`}
                        alt={pack.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="store-pack-envelope" style={{ '--env-accent': style.accent }}>
                      <div className="store-pack-envelope-back" />
                      <div className="store-pack-envelope-front">
                        <div className="store-pack-envelope-logo">
                          <div className="store-pack-envelope-pentagon" />
                        </div>
                      </div>
                      <div className="store-pack-envelope-shine" />
                    </div>
                  )}
                </div>
                <div className="store-pack-info">
                  <h3 className="store-pack-name" style={{ color: style.accent }}>{pack.name}</h3>
                  <div className="store-pack-stats">
                    <div className="store-pack-stat">
                      <div className="store-pack-stat-icon store-pack-stat-icon--players" />
                      <span className="store-pack-stat-val">{pack.numCards}</span>
                      <span className="store-pack-stat-label">Players</span>
                    </div>
                    <div className="store-pack-stat">
                      <div className="store-pack-stat-icon store-pack-stat-icon--items" />
                      <span className="store-pack-stat-val">{pack.numCards}</span>
                      <span className="store-pack-stat-label">Items</span>
                    </div>
                  </div>
                  <div className="store-pack-price">
                    <div className="store-pack-price-coin" />
                    <span>{pack.price.toLocaleString()}</span>
                  </div>
                  {highlighted.length > 0 && (
                    <button
                      className="store-highlight-btn"
                      onClick={(e) => { e.stopPropagation(); setHighlightPack({ pack, players: highlighted }); }}
                    >
                      View Highlights
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {highlightPack && (
        <div className="store-highlight-overlay" onClick={() => setHighlightPack(null)}>
          <div className="store-highlight-modal" onClick={(e) => e.stopPropagation()}>
            <div className="store-highlight-header">
              <h3>{highlightPack.pack.name} — Highlights</h3>
              <button className="store-highlight-close" onClick={() => setHighlightPack(null)}>&times;</button>
            </div>
            <div className="store-highlight-grid">
              {highlightPack.players.map((p, i) => (
                <div key={p._id || i} className="store-highlight-card">
                  <PlayerCard player={p} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showOpening && (
        <div className="pack-opening-overlay" onClick={nextCard}>
          <div className="pack-opening-content">
            <h2>Your Players</h2>
            <div className="opened-card-container">
              <div className="card-reveal" key={currentCardIndex}>
                <PlayerCard player={openedCards[currentCardIndex]} />
              </div>
            </div>
            <p className="tap-hint">
              {currentCardIndex < openedCards.length - 1 ? 'Tap to reveal next' : 'Tap to close'}
            </p>
            <div className="card-dots">
              {openedCards.map((_, i) => (
                <span key={i} className={`dot ${i === currentCardIndex ? 'active' : ''} ${i < currentCardIndex ? 'seen' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;
