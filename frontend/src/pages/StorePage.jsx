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
          <span className="store-hero-badge">BLUE LOCK</span>
          <h2 className="store-hero-title">{featured?.name || 'PREMIUM PACK'}</h2>
          <p className="store-hero-desc">The best pack to find the best players.</p>
          {featured && (
            <button className="store-hero-btn" onClick={() => handleBuyPack(featured._id)}>
              VIEW PACK <span>›</span>
            </button>
          )}
        </div>
        <div className="store-hero-visual">
          <div className="store-hero-glow" />
          <div className="store-hero-pack-icon">🎁</div>
        </div>
        <div className="store-hero-blue-lock-watermark">BLUE<br/>LOCK</div>
      </div>

      <div className="store-tabs">
        <button className="store-tab active">Packs</button>
        <button className="store-tab">Items</button>
        <button className="store-tab">Bundles</button>
      </div>

      <section className="store-packs-section">
        <div className="store-packs-grid">
          {packs.map((pack) => {
            const style = getPackStyle(pack.name);
            const rareCount = pack.possibleCards?.filter((c) => c.player_id?.overall >= 85).length || 0;
            return (
              <div key={pack._id} className="store-pack-card" style={{ borderColor: style.border }}>
                <div className="store-pack-visual" style={{ background: style.bg }}>
                  <div className="store-pack-glow" style={{ background: `radial-gradient(circle, ${style.accent}22 0%, transparent 70%)` }} />
                  <div className="store-pack-image">
                    {pack.image ? (
                      <img
                        src={pack.image.startsWith('http') || pack.image.startsWith('/') ? pack.image : `/packs/${pack.image}`}
                        alt={pack.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="store-pack-icon-placeholder">🎁</div>
                    )}
                  </div>
                  <span className="store-pack-label" style={{ color: style.accent }}>{pack.name}</span>
                </div>
                <div className="store-pack-info">
                  <div className="store-pack-stats">
                    <div className="store-pack-stat">
                      <span className="store-pack-stat-icon">👤</span>
                      <span className="store-pack-stat-val">{pack.numCards}</span>
                      <span className="store-pack-stat-label">PLAYERS</span>
                    </div>
                    <div className="store-pack-stat">
                      <span className="store-pack-stat-icon">🃏</span>
                      <span className="store-pack-stat-val">{pack.numCards}</span>
                      <span className="store-pack-stat-label">ITEMS</span>
                    </div>
                    <div className="store-pack-stat">
                      <span className="store-pack-stat-icon">⭐</span>
                      <span className="store-pack-stat-val">{rareCount}</span>
                      <span className="store-pack-stat-label">RARES</span>
                    </div>
                  </div>
                  <button
                    className="store-buy-btn"
                    onClick={() => handleBuyPack(pack._id)}
                    disabled={!user || user.currency < pack.price}
                  >
                    <span className="store-buy-coins">🪙</span>
                    {pack.price.toLocaleString()}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="store-claim-section">
        <div className="store-claim-card">
          <div className="store-claim-left">
            <span className="store-claim-icon">🎁</span>
            <div>
              <h3 className="store-claim-title">Free Pack</h3>
              <p className="store-claim-desc">Claim a free pack every minute</p>
            </div>
          </div>
          {claimTimeLeft > 0 ? (
            <div className="store-claim-timer">
              <span>{formatTime(claimTimeLeft)}</span>
            </div>
          ) : (
            <button className="store-claim-btn" onClick={handleClaim}>Claim</button>
          )}
        </div>
      </section>

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
