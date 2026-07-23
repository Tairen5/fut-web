import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PlayerDetail.css';

export default function PlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [otherVersions, setOtherVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/players/${id}`);
        setPlayer(res.data.player);
        setOtherVersions(res.data.otherVersions || []);
      } catch {
        setError('Player not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

  const getImageUrl = (img, folder) => {
    if (!img) return `/${folder}/default.png`;
    if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
    return `/${folder}/${img}`;
  };

  const getStatColor = (val) => {
    if (val >= 80) return '#32d583';
    if (val >= 60) return '#fec84b';
    return '#f97066';
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="skeleton-back skeleton-pulse" />
        <div className="detail-layout">
          <div className="detail-left">
            <div className="skeleton-card skeleton-pulse" />
            <div className="skeleton-panel skeleton-pulse">
              <div className="skeleton-row"><div className="skeleton-bar w40" /><div className="skeleton-bar w60" /></div>
              <div className="skeleton-row"><div className="skeleton-bar w40" /><div className="skeleton-bar w50" /></div>
              <div className="skeleton-row"><div className="skeleton-bar w40" /><div className="skeleton-bar w70" /></div>
            </div>
          </div>
          <div className="detail-right">
            <div className="skeleton-name skeleton-pulse" />
            <div className="skeleton-stats skeleton-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-stat-group">
                  <div className="skeleton-row"><div className="skeleton-bar w50" /><div className="skeleton-bar w20" /></div>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="skeleton-row"><div className="skeleton-bar w60" /><div className="skeleton-bar flex1" /><div className="skeleton-bar w10" /></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="detail-page">
        <div className="state-container error-state">
          <span className="state-icon">⚠️</span>
          <p>{error || 'Player not found.'}</p>
          <button className="btn-outline" onClick={() => navigate('/players')}>Back</button>
        </div>
      </div>
    );
  }

  const s = player.stats || {};
  const playerImage = getImageUrl(player.image, 'player-cards');

  const statGroups = [
    {
      label: 'Pace',
      value: s.pac,
      subs: [
        { name: 'Acceleration', value: s.pac },
        { name: 'Sprint Speed', value: s.pac },
      ],
    },
    {
      label: 'Shooting',
      value: s.sho,
      subs: [
        { name: 'Positioning', value: s.sho },
        { name: 'Finishing', value: s.sho },
        { name: 'Shot Power', value: Math.max(1, s.sho - 5) },
        { name: 'Long Shots', value: Math.max(1, s.sho - 8) },
      ],
    },
    {
      label: 'Passing',
      value: s.pas,
      subs: [
        { name: 'Vision', value: s.pas },
        { name: 'Crossing', value: s.pas },
        { name: 'FK Accuracy', value: Math.max(1, s.pas - 6) },
        { name: 'Short Passing', value: s.pas },
        { name: 'Long Passing', value: Math.max(1, s.pas - 3) },
        { name: 'Curve', value: Math.max(1, s.pas - 2) },
      ],
    },
    {
      label: 'Dribbling',
      value: s.dri,
      subs: [
        { name: 'Agility', value: s.dri },
        { name: 'Balance', value: Math.min(99, s.dri + 2) },
        { name: 'Reactions', value: Math.min(99, s.dri + 3) },
        { name: 'Ball Control', value: s.dri },
        { name: 'Dribbling', value: s.dri },
        { name: 'Composure', value: Math.min(99, s.dri + 4) },
      ],
    },
    {
      label: 'Defending',
      value: s.def,
      subs: [
        { name: 'Interceptions', value: s.def },
        { name: 'Heading Accuracy', value: Math.max(1, s.def + 5) },
        { name: 'Def. Awareness', value: Math.max(1, s.def - 3) },
        { name: 'Standing Tackle', value: Math.max(1, s.def - 2) },
        { name: 'Sliding Tackle', value: Math.max(1, s.def - 4) },
      ],
    },
    {
      label: 'Physical',
      value: s.phy,
      subs: [
        { name: 'Jumping', value: Math.max(1, s.phy - 2) },
        { name: 'Stamina', value: Math.min(99, s.phy + 3) },
        { name: 'Strength', value: s.phy },
        { name: 'Aggression', value: Math.max(1, s.phy - 5) },
      ],
    },
  ];

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate('/players')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        Back to catalog
      </button>

      <div className="detail-layout">
        <div className="detail-left">
          <div className="detail-card-image">
            <img src={playerImage} alt={player.name} />
          </div>

          {otherVersions.length > 0 && (
            <div className="other-versions">
              <span className="other-versions-title">OTHER VERSIONS</span>
              <div className="other-versions-list">
                {otherVersions.map((v) => (
                  <div
                    key={v._id}
                    className="other-version-card"
                    onClick={() => navigate(`/players/${v._id}`)}
                  >
                    <div className="mini-card">
                      <img
                        src="/promominicard/Base.png"
                        alt=""
                        className="mini-card-bg"
                      />
                      <span className="mini-card-ovr">{v.overall}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-info-panel">
            <div className="detail-info-row">
              <span className="detail-info-label">Position</span>
              <span className="detail-info-value">{player.position}</span>
            </div>
            {player.nation?.name && (
              <div className="detail-info-row">
                <span className="detail-info-label">Nation</span>
                <div className="detail-info-inline">
                  <img src={getImageUrl(player.nation.image, 'nations')} alt="" className="detail-info-icon" />
                  <span className="detail-info-value">{player.nation.name}</span>
                </div>
              </div>
            )}
            {player.club?.name && (
              <div className="detail-info-row">
                <span className="detail-info-label">Club</span>
                <div className="detail-info-inline">
                  <img src={getImageUrl(player.club.image, 'clubs')} alt="" className="detail-info-icon" />
                  <span className="detail-info-value">{player.club.name}</span>
                </div>
              </div>
            )}
            {player.league?.name && (
              <div className="detail-info-row">
                <span className="detail-info-label">League</span>
                <div className="detail-info-inline">
                  <img src={getImageUrl(player.league.image, 'leagues')} alt="" className="detail-info-icon" />
                  <span className="detail-info-value">{player.league.name}</span>
                </div>
              </div>
            )}
            {player.secondaryPositions?.length > 0 && (
              <div className="detail-info-row">
                <span className="detail-info-label">Alt. Positions</span>
                <span className="detail-info-value">{player.secondaryPositions.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-right">
          <div className="detail-name-block">
            <div className="detail-name-row">
              <span className="detail-name-full">{player.name}</span>
              {player.promo && (
                <span className="detail-promo-badge">{player.promo}</span>
              )}
            </div>
          </div>

          <div className="detail-stats-container">
            {statGroups.map((group) => (
              <div key={group.label} className="detail-stat-group">
                <div className="detail-stat-header">
                  <span className="detail-stat-label">{group.label}</span>
                  <span className="detail-stat-value">{group.value}</span>
                </div>
                {group.subs.map((sub) => (
                  <div key={sub.name} className="detail-stat-row">
                    <span className="detail-stat-sub-name">{sub.name}</span>
                    <div className="detail-stat-bar-wrap">
                      <div className="detail-stat-bar" style={{ width: `${sub.value}%`, backgroundColor: getStatColor(sub.value) }} />
                    </div>
                    <span className="detail-stat-sub-value">{sub.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {player.playStyles?.length > 0 && (
            <div className="detail-playstyles">
              {player.playStyles.map((ps, idx) => (
                <div key={idx} className="detail-playstyle-card">
                  {ps.image ? (
                    <img src={getImageUrl(ps.image, 'playstyles')} alt={ps.name || 'PlayStyle'} className="detail-playstyle-icon" />
                  ) : (
                    <div className="detail-playstyle-placeholder">✦</div>
                  )}
                  <div className="detail-playstyle-info">
                    <span className="detail-playstyle-name">{ps.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
