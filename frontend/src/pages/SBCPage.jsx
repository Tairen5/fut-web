import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './SBCPage.css';

const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const now = new Date();
  const diff = new Date(expiresAt) - now;
  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} Days ${hours} Hours`;
  if (hours > 0) return `${hours} Hours ${mins} Mins`;
  return `${mins} Mins`;
};

export default function SBCPage({ detail }) {
  const { id } = useParams();
  const navigate = useNavigate();

  if (detail && id) {
    return <SBCDetailPage id={id} onBack={() => navigate('/sbc')} />;
  }

  return <SBCListPage onOpen={(sbc) => navigate(`/sbc/${sbc._id}`)} />;
}

function SBCListPage({ onOpen }) {
  const [sbcs, setSbcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSBCs = async () => {
      try {
        const res = await api.get('/sbc');
        setSbcs(res.data);
      } catch (err) {
        console.error('Error fetching SBCs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSBCs();
  }, []);

  const filtered = sbcs.filter((sbc) =>
    sbc.name.toLowerCase().includes(search.toLowerCase())
  );

  const dailySbcs = filtered.filter((sbc) => {
    if (!sbc.expiresAt) return false;
    const diff = new Date(sbc.expiresAt) - new Date();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  });

  return (
    <div className="sbc-page">
      <div className="sbc-header">
        <input
          type="text"
          className="sbc-search"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {dailySbcs.length > 0 && (
          <button className="sbc-daily-btn">
            Solve All Daily SBCs
          </button>
        )}
      </div>

      {loading ? (
        <div className="sbc-loading">Loading SBCs...</div>
      ) : (
        <div className="sbc-grid">
          {filtered.map((sbc) => (
            <SBCGroupCard key={sbc._id} sbc={sbc} onClick={() => onOpen(sbc)} />
          ))}
          {filtered.length === 0 && (
            <div className="sbc-empty">No SBCs found.</div>
          )}
        </div>
      )}
    </div>
  );
}

function SBCDetailPage({ id, onBack }) {
  const [sbc, setSbc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSBC = async () => {
      try {
        const res = await api.get(`/sbc/${id}`);
        setSbc(res.data);
      } catch (err) {
        console.error('Error fetching SBC:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSBC();
  }, [id]);

  if (loading) return <div className="sbc-loading">Loading...</div>;
  if (!sbc) return <div className="sbc-loading">SBC not found.</div>;

  const completedCount = 0;
  const totalCount = sbc.challenges?.length || 0;
  const timeLeft = formatTimeLeft(sbc.expiresAt);

  return (
    <div className="sbc-page">
      <button className="sbc-back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="sbc-detail-header">
        <div className="sbc-detail-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <h2 className="sbc-detail-name">{sbc.name}</h2>
          <p className="sbc-detail-desc">{sbc.description}</p>
        </div>
      </div>

      <div className="sbc-detail-rewards">
        <span className="sbc-rewards-label">Group Rewards:</span>
        <span className="sbc-rewards-value">{sbc.rewardDescription}</span>
      </div>

      <div className="sbc-detail-progress">
        <div className="sbc-progress-bar">
          <div className="sbc-progress-fill" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
        </div>
        <span className="sbc-progress-text">{completedCount}/{totalCount} SBCs</span>
      </div>

      <div className="sbc-detail-tags">
        {!sbc.repeatable && (
          <span className="sbc-tag sbc-tag-nonrepeatable">
            <span className="sbc-tag-icon">🔒</span> Non-Repeatable
          </span>
        )}
        {sbc.repeatable && (
          <span className="sbc-tag sbc-tag-repeatable">
            <span className="sbc-tag-icon">🔄</span> Repeatable
          </span>
        )}
        {timeLeft && (
          <span className="sbc-tag sbc-tag-expiry">
            <span className="sbc-tag-icon">⏱</span> Expires In: {timeLeft}
          </span>
        )}
      </div>

      <div className="sbc-detail-challenges">
        {sbc.challenges?.map((challenge, i) => (
          <div key={challenge._id || i} className="sbc-challenge-card">
            <div className="sbc-challenge-header">
              <h4 className="sbc-challenge-name">{challenge.name}</h4>
              <span className="sbc-challenge-reward">{challenge.rewards?.description}</span>
            </div>
            {challenge.description && (
              <p className="sbc-challenge-desc">{challenge.description}</p>
            )}
            <div className="sbc-challenge-reqs">
              {challenge.requirements?.minOverall > 0 && (
                <span className="sbc-req">Min OVR: {challenge.requirements.minOverall}</span>
              )}
              {challenge.requirements?.minLeagues > 0 && (
                <span className="sbc-req">Min Leagues: {challenge.requirements.minLeagues}</span>
              )}
              {challenge.requirements?.minClubs > 0 && (
                <span className="sbc-req">Min Clubs: {challenge.requirements.minClubs}</span>
              )}
              {challenge.requirements?.minNations > 0 && (
                <span className="sbc-req">Min Nations: {challenge.requirements.minNations}</span>
              )}
            </div>
            <button className="sbc-challenge-btn">Start Challenge</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SBCGroupCard({ sbc, onClick }) {
  const completedCount = 0;
  const totalCount = sbc.challenges?.length || 0;
  const timeLeft = formatTimeLeft(sbc.expiresAt);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="sbc-card" onClick={onClick}>
      <div className="sbc-card-top">
        <div className="sbc-card-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h3 className="sbc-card-name">{sbc.name}</h3>
      </div>

      <p className="sbc-card-desc">{sbc.description}</p>

      <div className="sbc-card-progress">
        <div className="sbc-progress-bar">
          <div className="sbc-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="sbc-progress-text">{completedCount}/{totalCount} SBCs</span>
      </div>

      <div className="sbc-card-rewards">
        <span className="sbc-rewards-label">Group Rewards:</span>
        <span className="sbc-rewards-value">{sbc.rewardDescription}</span>
      </div>

      <div className="sbc-card-tags">
        {!sbc.repeatable && (
          <span className="sbc-tag sbc-tag-nonrepeatable">
            <span className="sbc-tag-icon">🔒</span> Non-Repeatable
          </span>
        )}
        {sbc.repeatable && (
          <span className="sbc-tag sbc-tag-repeatable">
            <span className="sbc-tag-icon">🔄</span> Repeatable
          </span>
        )}
        {timeLeft && (
          <span className="sbc-tag sbc-tag-expiry">
            <span className="sbc-tag-icon">⏱</span> Expires In: {timeLeft}
          </span>
        )}
      </div>
    </div>
  );
}
