import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import PlayerCard from '../components/game/PlayerCard';
import './StorePage.css';

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
        const remaining = Math.max(0, 60 - elapsed);
        setClaimTimeLeft(remaining);
      }
    };

    fetchPacks();
    checkClaimTimer();
  }, [user]);

  useEffect(() => {
    if (claimTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setClaimTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [claimTimeLeft]);

  const handleBuyPack = async (packId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/packs/open/${packId}`);
      const data = res.data;
      setUser({ ...user, currency: data.currency });
      setOpenedCards(data.cards);
      setCurrentCardIndex(0);
      setShowOpening(true);
    } catch (error) {
      console.error('Error opening pack:', error);
      alert(error.response?.data?.message || 'Error opening pack');
    }
  };

  const handleClaim = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (claimTimeLeft > 0) return;
    try {
      const res = await api.post('/packs/open/claim');
      const data = res.data;
      setUser({ ...user, currency: data.currency });
      setOpenedCards(data.cards);
      setCurrentCardIndex(0);
      setShowOpening(true);
      localStorage.setItem('lastClaimTime', Date.now().toString());
      setClaimTimeLeft(60);
    } catch (error) {
      console.error('Error claiming pack:', error);
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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (user === null || loading) {
    return (
      <div className="store-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <div className="store-header">
        <h1>Store</h1>
        {user && (
          <div className="user-coins">
            <span className="coin-icon">🪙</span>
            <span className="coin-amount">{user.currency.toLocaleString()}</span>
          </div>
        )}
      </div>

      <section className="claim-section">
        <div className="claim-card">
          <div className="claim-glow"></div>
          <div className="claim-content">
            <h2>Free Pack</h2>
            <p>Get a free pack every minute!</p>
            {claimTimeLeft > 0 ? (
              <div className="claim-timer">
                <span>Available in {formatTime(claimTimeLeft)}</span>
              </div>
            ) : (
              <button className="claim-btn" onClick={handleClaim}>
                Claim Now
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="packs-section">
        <h2>Packs</h2>
        <div className="packs-grid">
          {packs.map((pack) => {
            const samplePlayers = pack.possibleCards
              .slice(0, 3)
              .map((c) => c.player_id)
              .filter(Boolean);
            return (
              <div key={pack._id} className={`pack-card pack-${pack.image}`}>
                <div className="pack-visual">
                  <div className="pack-shine"></div>
                  <div className="pack-players-preview">
                    {samplePlayers.map((p, i) => (
                      <div key={p._id || i} className="preview-player">
                        <span className="preview-ovr">{p.overall}</span>
                        <span className="preview-name">{p.name.split(' ').pop()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pack-info">
                  <h3>{pack.name}</h3>
                  <p className="pack-cards">{pack.numCards} players</p>
                  <button
                    className="buy-btn"
                    onClick={() => handleBuyPack(pack._id)}
                    disabled={!user || user.currency < pack.price}
                  >
                    🪙 {pack.price.toLocaleString()}
                  </button>
                </div>
              </div>
            );
          })}
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
              {currentCardIndex < openedCards.length - 1
                ? 'Tap to reveal next'
                : 'Tap to close'}
            </p>
            <div className="card-dots">
              {openedCards.map((_, i) => (
                <span
                  key={i}
                  className={`dot ${i === currentCardIndex ? 'active' : ''} ${i < currentCardIndex ? 'seen' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePage;
