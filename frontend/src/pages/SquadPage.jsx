import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { FORMATIONS, FORMATION_LIST } from '../utils/formations';
import PlayerCard from '../components/game/PlayerCard';
import './SquadPage.css';
import './CollectionPage.css';

export default function SquadPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [squads, setSquads] = useState([]);
  const [activeSquad, setActiveSquad] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBenchSlot, setSelectedBenchSlot] = useState(null);
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subsOpen, setSubsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [dragData, setDragData] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilters, setModalFilters] = useState({
    position: '',
    minOvr: '',
    maxOvr: '',
    promo: '',
    nation: '',
    club: '',
  });
  const [showModalFilters, setShowModalFilters] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [squadsRes, collectionRes] = await Promise.all([
        api.get(`/squad/user/${user._id}`),
        api.get(`/user-players/${user._id}`),
      ]);
      setSquads(squadsRes.data);
      setCollection(collectionRes.data);
      const active = squadsRes.data.find((s) => s.isActive) || squadsRes.data[0];
      if (active) {
        const fullRes = await api.get(`/squad/active/${user._id}`);
        setActiveSquad(fullRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSquad = async () => {
    try {
      const res = await api.post('/squad', {
        userId: user._id,
        name: `Squad ${squads.length + 1}`,
        formation: '4-3-3',
      });
      setSquads((prev) => [...prev, res.data]);
      await activateSquad(res.data._id);
    } catch (err) {
      console.error(err);
    }
  };

  const activateSquad = async (squadId) => {
    try {
      const res = await api.put(`/squad/activate/${squadId}`, { userId: user._id });
      setActiveSquad(res.data);
      setSquads((prev) => prev.map((s) => ({ ...s, isActive: s._id === squadId })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSquad = async (squadId) => {
    if (squads.length <= 1) return;
    try {
      await api.delete(`/squad/${squadId}`, { data: { userId: user._id } });
      setSquads((prev) => {
        const next = prev.filter((s) => s._id !== squadId);
        if (activeSquad?._id === squadId && next.length > 0) activateSquad(next[0]._id);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const changeFormation = async (formation) => {
    if (!activeSquad) return;
    try {
      const res = await api.put(`/squad/${activeSquad._id}`, {
        userId: user._id,
        formation,
        startingEleven: [],
      });
      setActiveSquad(res.data);
      setShowDropdown(false);
    } catch (err) {
      console.error(err);
    }
  };

  const assignPlayer = async (positionIndex, userPlayerId) => {
    if (!activeSquad) return;
    const newEleven = (activeSquad.startingEleven || []).filter(
      (s) => s.positionIndex !== positionIndex
    );
    if (userPlayerId) newEleven.push({ positionIndex, user_player_id: userPlayerId });
    try {
      const res = await api.put(`/squad/${activeSquad._id}`, {
        userId: user._id,
        startingEleven: newEleven,
      });
      setActiveSquad(res.data);
      setSelectedSlot(null);
    } catch (err) {
      console.error('Error assigning player:', err.response?.data || err.message);
    }
  };

  const assignBenchPlayer = async (benchIndex, userPlayerId) => {
    if (!activeSquad) return;
    const newBench = [...(activeSquad.bench || [])];
    if (userPlayerId) {
      if (newBench[benchIndex]) {
        newBench[benchIndex] = userPlayerId;
      } else {
        while (newBench.length < benchIndex) newBench.push(null);
        newBench[benchIndex] = userPlayerId;
      }
    } else {
      newBench[benchIndex] = null;
    }
    try {
      const res = await api.put(`/squad/${activeSquad._id}`, {
        userId: user._id,
        bench: newBench.filter(Boolean),
      });
      setActiveSquad(res.data);
      setSelectedBenchSlot(null);
    } catch (err) {
      console.error('Error assigning bench player:', err.response?.data || err.message);
    }
  };

  const removeFromSlot = (positionIndex) => assignPlayer(positionIndex, null);

  const getFormation = () => FORMATIONS[activeSquad?.formation] || FORMATIONS['4-3-3'];

  const getPlayerAtSlot = (index) => {
    const slot = activeSquad?.startingEleven?.find((s) => s.positionIndex === index);
    if (!slot) return null;
    const slotId = slot.user_player_id?._id || slot.user_player_id;
    const userPlayer = collection.find((c) => c._id === slotId);
    return userPlayer?.player_id || null;
  };

  const getPlayerAtBench = (index) => {
    const benchId = activeSquad?.bench?.[index];
    if (!benchId) return null;
    const slotId = benchId?._id || benchId;
    const userPlayer = collection.find((c) => c._id === slotId);
    return userPlayer?.player_id || null;
  };

  const getUsedPlayerIds = () => {
    const elevenIds = (activeSquad?.startingEleven || []).map((s) => {
      const id = s.user_player_id;
      return id?._id || id;
    });
    const benchIds = (activeSquad?.bench || []).map((id) => id?._id || id);
    return [...elevenIds, ...benchIds];
  };

  const getAvailablePlayers = () => {
    const usedIds = getUsedPlayerIds();
    return collection.filter((c) => {
      if (usedIds.includes(c._id)) return false;
      const p = c.player_id;
      if (!p) return false;
      if (modalSearch) {
        const q = modalSearch.toLowerCase();
        if (!p.name?.toLowerCase().includes(q) && !p.position?.toLowerCase().includes(q) && !p.promo?.toLowerCase().includes(q)) return false;
      }
      if (modalFilters.position) {
        if (p.position !== modalFilters.position && !p.secondaryPositions?.includes(modalFilters.position)) return false;
      }
      if (modalFilters.minOvr && p.overall < Number(modalFilters.minOvr)) return false;
      if (modalFilters.maxOvr && p.overall > Number(modalFilters.maxOvr)) return false;
      if (modalFilters.promo && p.promo !== modalFilters.promo) return false;
      if (modalFilters.nation && p.nation?.name !== modalFilters.nation) return false;
      if (modalFilters.club && p.club?.name !== modalFilters.club) return false;
      return true;
    });
  };

  const getTeamRating = () => {
  const formation = getFormation();
    const ratings = formation.positions.map((pos) => {
      const player = getPlayerAtSlot(pos.index);
      return player?.overall || 0;
    }).filter((r) => r > 0);
    if (ratings.length === 0) return 0;
    return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  };

  const getStarRating = () => {
    const r = getTeamRating();
    if (r >= 90) return 5;
    if (r >= 80) return 4;
    if (r >= 70) return 3;
    if (r >= 60) return 2;
    if (r > 0) return 1;
    return 0;
  };

  const getImageUrl = (img, folder) => {
    if (!img) return `/${folder}/default.png`;
    if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
    return `/${folder}/${img}`;
  };

  const handleDragStart = (type, index) => (e) => {
    setDragData({ type, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
    e.dataTransfer.setData('text/plain', '');

    const player = type === 'slot' ? getPlayerAtSlot(index) : getPlayerAtBench(index);
    if (!player) return;

    const ghost = document.createElement('img');
    ghost.src = getImageUrl(player.image, 'player-cards');
    ghost.style.cssText = 'position:absolute;top:-9999px;width:120px;z-index:9999;';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 60, 60);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDrop = async (targetType, targetIndex) => {
    if (!dragData) return;
    const { type: srcType, index: srcIndex } = dragData;

    if (srcType === targetType && srcIndex === targetIndex) { setDragData(null); return; }

    const srcPlayerId = srcType === 'slot'
      ? (activeSquad.startingEleven || []).find((s) => s.positionIndex === srcIndex)?.user_player_id?._id || (activeSquad.startingEleven || []).find((s) => s.positionIndex === srcIndex)?.user_player_id
      : (activeSquad.bench || [])[srcIndex]?._id || (activeSquad.bench || [])[srcIndex];

    const tgtPlayerId = targetType === 'slot'
      ? (activeSquad.startingEleven || []).find((s) => s.positionIndex === targetIndex)?.user_player_id?._id || (activeSquad.startingEleven || []).find((s) => s.positionIndex === targetIndex)?.user_player_id
      : (activeSquad.bench || [])[targetIndex]?._id || (activeSquad.bench || [])[targetIndex];

    const newBench = [...(activeSquad.bench || [])];
    let newEleven;

    if (srcType === 'bench' && targetType === 'bench') {
      const temp = newBench[srcIndex];
      newBench[srcIndex] = newBench[targetIndex] || null;
      newBench[targetIndex] = temp;
      newEleven = [...(activeSquad.startingEleven || [])];
    } else {
      newEleven = (activeSquad.startingEleven || []).filter((s) => {
        if (srcType === 'slot' && s.positionIndex === srcIndex) return false;
        if (targetType === 'slot' && s.positionIndex === targetIndex) return false;
        return true;
      });

      if (srcType === 'slot' && targetType === 'slot') {
        if (srcPlayerId) newEleven.push({ positionIndex: targetIndex, user_player_id: srcPlayerId });
        if (tgtPlayerId) newEleven.push({ positionIndex: srcIndex, user_player_id: tgtPlayerId });
      } else if (srcType === 'slot' && targetType === 'bench') {
        if (tgtPlayerId) newEleven.push({ positionIndex: srcIndex, user_player_id: tgtPlayerId });
        while (newBench.length <= targetIndex) newBench.push(null);
        newBench[targetIndex] = srcPlayerId || null;
      } else if (srcType === 'bench' && targetType === 'slot') {
        if (srcPlayerId) newEleven.push({ positionIndex: targetIndex, user_player_id: srcPlayerId });
        if (tgtPlayerId) {
          while (newBench.length <= srcIndex) newBench.push(null);
          newBench[srcIndex] = tgtPlayerId;
        } else {
          newBench.splice(srcIndex, 1);
        }
      }
    }

    try {
      const res = await api.put(`/squad/${activeSquad._id}`, {
        userId: user._id,
        startingEleven: newEleven,
        bench: newBench.filter(Boolean),
      });
      setActiveSquad(res.data);
    } catch (err) {
      console.error('Error swapping players:', err.response?.data || err.message);
    }
    setDragData(null);
  };

  if (loading) {
    return (
      <div className="squad-page">
        <div className="squad-loading"><div className="squad-loading-spinner" /></div>
      </div>
    );
  }

  const formation = getFormation();

  return (
    <div className="squad-page">
      <div className="squad-aurora">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
      </div>
      <div className="squad-main">
        {/* Center */}
        <div className="squad-center">
          <div className="squad-top">
            <h1 className="squad-name">{activeSquad?.name || 'Squad'}</h1>
            <div className="squad-top-tabs">
              {squads.map((s) => (
                <button key={s._id} className={`squad-tab ${activeSquad?._id === s._id ? 'active' : ''}`} onClick={() => activateSquad(s._id)}>
                  {s.name}
                  {squads.length > 1 && <span className="squad-tab-x" onClick={(e) => { e.stopPropagation(); deleteSquad(s._id); }}>×</span>}
                </button>
              ))}
              <button className="squad-tab-add" onClick={createSquad}>+</button>
            </div>
          </div>

          <div className="squad-pitch-area" onDragOver={(e) => e.preventDefault()}>
            <div className="squad-pitch">
              <div className="squad-pitch-slots">
              {formation.positions.map((pos) => {
                const player = getPlayerAtSlot(pos.index);
                return (
                  <div
                    key={pos.index}
                    className={`squad-slot ${player ? 'filled' : 'empty'} ${dragData ? 'drag-target' : ''}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => { setSelectedSlot(pos.index); setModalFilters((prev) => ({ ...prev, position: pos.pos })); }}
                    draggable={!!player}
                    onDragStart={handleDragStart('slot', pos.index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop('slot', pos.index)}
                  >
                    {player ? (
                      <>
                        <div className="slot-card filled-card">
                          <img src={getImageUrl(player.image, 'player-cards')} alt="" className="slot-card-img" />
                        </div>
                        <span className="slot-pos-badge">{pos.pos}</span>
                      </>
                    ) : (
                      <>
                        <div className="slot-card empty-card">
                          <img src="/assets/player-empty.png" alt="" className="slot-card-img" />
                        </div>
                        <span className="slot-pos-badge">{pos.pos}</span>
                      </>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          <div className="squad-subs-bar">
            <button className="squad-subs-toggle" onClick={() => setSubsOpen(!subsOpen)}>
              {subsOpen ? '▲' : '▼'} Subs
            </button>
          </div>

          {subsOpen && (
            <div className="squad-subs-panel">
              <div className="squad-subs-scroll">
                {Array.from({ length: 7 }).map((_, i) => {
                  const player = getPlayerAtBench(i);
                  return (
                    <div
                      key={i}
                      className="sub-card"
                      onClick={() => { setSelectedBenchSlot(i); setModalFilters((prev) => ({ ...prev, position: '' })); }}
                      draggable={!!player}
                      onDragStart={handleDragStart('bench', i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop('bench', i)}
                    >
                      {player ? (
                        <img src={getImageUrl(player.image, 'player-cards')} alt="" className="sub-card-img" />
                      ) : (
                        <img src="/assets/player-empty.png" alt="" className="sub-card-img sub-card-img-empty" />
                      )}
                      <span className="sub-card-label">SUB {i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="squad-sidebar">
          <div className="sidebar-mini-pitch">
            <div className="mini-pitch-field">
              {formation.positions.map((pos) => {
                const player = getPlayerAtSlot(pos.index);
                return (
                  <div key={pos.index} className={`mini-dot ${player ? 'on' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
                );
              })}
            </div>
          </div>

          <div className="sidebar-dropdown-wrapper">
            <button className="sidebar-dropdown-btn" onClick={() => setShowDropdown(!showDropdown)}>
              {activeSquad?.formation || '4-3-3'} <span>▾</span>
            </button>
            {showDropdown && (
              <div className="sidebar-dropdown-menu">
                {FORMATION_LIST.map((f) => (
                  <button key={f} className={`sidebar-dropdown-opt ${activeSquad?.formation === f ? 'active' : ''}`} onClick={() => changeFormation(f)}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="sidebar-set-active" onClick={() => activateSquad(activeSquad?._id)}>
            Set Active
          </button>

          <div className="sidebar-menu">
            <button className="sidebar-menu-item">Tactics <span>›</span></button>
            <button className="sidebar-menu-item">Use Squad Builder <span>›</span></button>
            <button className="sidebar-menu-item">Rename</button>
            <button className="sidebar-menu-item">Copy</button>
            <button className="sidebar-menu-item danger">Clear Squad</button>
          </div>
        </div>
      </div>

      {(selectedSlot !== null || selectedBenchSlot !== null) && (
        <div className="squad-modal-overlay" onClick={() => { setSelectedSlot(null); setSelectedBenchSlot(null); setHoveredPlayer(null); setModalFilters((prev) => ({ ...prev, position: '' })); }}>
          <div className="squad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="squad-modal-header">
              <h3>{selectedSlot !== null ? `Select ${formation.positions[selectedSlot]?.pos}` : `Select SUB ${selectedBenchSlot + 1}`}</h3>
              <button className="squad-modal-close" onClick={() => { setSelectedSlot(null); setSelectedBenchSlot(null); setHoveredPlayer(null); setModalFilters((prev) => ({ ...prev, position: '' })); }}>×</button>
            </div>
            <div className="squad-modal-body">
              {/* Comparison Panel */}
              <div className="squad-modal-compare">
                {(() => {
                  const currentPlayer = selectedSlot !== null ? getPlayerAtSlot(selectedSlot) : getPlayerAtBench(selectedBenchSlot);
                  const hp = hoveredPlayer;
                  const comparePlayer = hp || currentPlayer;
                  const stats = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
                  const statLabels = { pac: 'PAC', sho: 'SHO', pas: 'PAS', dri: 'DRI', def: 'DEF', phy: 'PHY' };

                  return (
                    <div className="squad-modal-compare-inner">
                      <div className="compare-players">
                        <div className="compare-player-slot">
                          {currentPlayer ? (
                            <>
                              <img src={getImageUrl(currentPlayer.image, 'player-cards')} alt="" className="compare-player-img" />
                              <span className="compare-player-name">{currentPlayer.name}</span>
                              <span className="compare-player-ovr">{currentPlayer.overall}</span>
                            </>
                          ) : (
                            <>
                              <img src="/assets/player-empty.png" alt="" className="compare-player-img compare-empty-img" />
                              <span className="compare-player-name empty">Empty</span>
                            </>
                          )}
                        </div>

                        <div className="compare-vs">VS</div>

                        <div className="compare-player-slot">
                          {hp ? (
                            <>
                              <img src={getImageUrl(hp.image, 'player-cards')} alt="" className="compare-player-img" />
                              <span className="compare-player-name">{hp.name}</span>
                              <span className="compare-player-ovr">{hp.overall}</span>
                            </>
                          ) : (
                            <>
                              <img src="/assets/player-empty.png" alt="" className="compare-player-img compare-empty-img" />
                              <span className="compare-player-name empty">Player</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="compare-stats">
                        {stats.map((s) => {
                          const leftVal = currentPlayer?.stats?.[s] || 0;
                          const rightVal = hp?.stats?.[s] || 0;
                          const diff = (hp && currentPlayer) ? rightVal - leftVal : 0;
                          return (
                            <div key={s} className={`compare-stat-row ${diff > 0 ? 'better' : diff < 0 ? 'worse' : ''}`}>
                              <span className="compare-stat-val">{currentPlayer ? leftVal : '-'}</span>
                              <span className="compare-stat-label">{statLabels[s]}</span>
                              <span className="compare-stat-val">{hp ? rightVal : '-'}</span>
                            </div>
                          );
                        })}
                        <div className={`compare-stat-row compare-ovr ${(hp && currentPlayer && hp.overall > currentPlayer.overall) ? 'better' : (hp && currentPlayer && hp.overall < currentPlayer.overall) ? 'worse' : ''}`}>
                          <span className="compare-stat-val">{currentPlayer ? currentPlayer.overall : '-'}</span>
                          <span className="compare-stat-label">OVR</span>
                          <span className="compare-stat-val">{hp ? hp.overall : '-'}</span>
                        </div>
                      </div>

                      {currentPlayer && (
                        <button className="squad-modal-remove" onClick={() => {
                          if (selectedSlot !== null) { removeFromSlot(selectedSlot); setSelectedSlot(null); }
                          else { assignBenchPlayer(selectedBenchSlot, null); setSelectedBenchSlot(null); }
                          setHoveredPlayer(null);
                        }}>
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Player Grid */}
              <div className="squad-modal-right">
                <div className="squad-modal-toolbar">
                  <form className="search-bar-inline" onSubmit={(e) => e.preventDefault()}>
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar jugador..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="search-input-inline"
                    />
                  </form>
                  <button
                    className={`filter-toggle-btn ${showModalFilters ? 'active' : ''}`}
                    onClick={() => setShowModalFilters(!showModalFilters)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="21" x2="4" y2="14"></line>
                      <line x1="4" y1="10" x2="4" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12" y2="3"></line>
                      <line x1="20" y1="21" x2="20" y2="16"></line>
                      <line x1="20" y1="12" x2="20" y2="3"></line>
                      <line x1="1" y1="14" x2="7" y2="14"></line>
                      <line x1="9" y1="8" x2="15" y2="8"></line>
                      <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg>
                    Filtros
                  </button>
                </div>

                {showModalFilters && (() => {
                  const allPlayers = getAvailablePlayers().map((c) => c.player_id).filter(Boolean);
                  const allPromos = [...new Set(allPlayers.map((p) => p.promo).filter(Boolean))].sort();
                  const allNations = [...new Set(allPlayers.map((p) => p.nation?.name).filter(Boolean))].sort();
                  const allClubs = [...new Set(allPlayers.map((p) => p.club?.name).filter(Boolean))].sort();
                  const hasFilters = modalSearch || modalFilters.position || modalFilters.minOvr || modalFilters.maxOvr || modalFilters.promo || modalFilters.nation || modalFilters.club;
                  return (
                    <div className="advanced-filters">
                      <div className="filter-group">
                        <label className="filter-label">Posición</label>
                        <select value={modalFilters.position} onChange={(e) => setModalFilters((prev) => ({ ...prev, position: e.target.value }))} className="filter-select">
                          <option value="">Todas</option>
                          <option value="GK">GK</option>
                          <option value="CB">CB</option>
                          <option value="LB">LB</option>
                          <option value="RB">RB</option>
                          <option value="CDM">CDM</option>
                          <option value="CM">CM</option>
                          <option value="CAM">CAM</option>
                          <option value="LW">LW</option>
                          <option value="RW">RW</option>
                          <option value="ST">ST</option>
                        </select>
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">OVR Min</label>
                        <input type="number" min="0" max="99" placeholder="0" value={modalFilters.minOvr} onChange={(e) => setModalFilters((prev) => ({ ...prev, minOvr: e.target.value }))} className="filter-input" />
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">OVR Max</label>
                        <input type="number" min="0" max="99" placeholder="99" value={modalFilters.maxOvr} onChange={(e) => setModalFilters((prev) => ({ ...prev, maxOvr: e.target.value }))} className="filter-input" />
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">Promo</label>
                        <select value={modalFilters.promo} onChange={(e) => setModalFilters((prev) => ({ ...prev, promo: e.target.value }))} className="filter-select">
                          <option value="">Todas</option>
                          {allPromos.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">Nación</label>
                        <select value={modalFilters.nation} onChange={(e) => setModalFilters((prev) => ({ ...prev, nation: e.target.value }))} className="filter-select">
                          <option value="">Todas</option>
                          {allNations.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">Club</label>
                        <select value={modalFilters.club} onChange={(e) => setModalFilters((prev) => ({ ...prev, club: e.target.value }))} className="filter-select">
                          <option value="">Todos</option>
                          {allClubs.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {hasFilters && (
                        <button className="clear-filters-btn" onClick={() => { setModalSearch(''); setModalFilters({ position: '', minOvr: '', maxOvr: '', promo: '', nation: '', club: '' }); }}>Limpiar filtros</button>
                      )}
                    </div>
                  );
                })()}

                <div className="squad-modal-grid">
                  {getAvailablePlayers().map((item) => {
                    const p = item.player_id;
                    if (!p) return null;
                    return (
                      <div
                        key={item._id}
                        className="collection-item"
                        onMouseEnter={() => setHoveredPlayer(p)}
                        onMouseLeave={() => setHoveredPlayer(null)}
                        onClick={() => {
                          if (selectedSlot !== null) assignPlayer(selectedSlot, item._id);
                          else assignBenchPlayer(selectedBenchSlot, item._id);
                          setHoveredPlayer(null);
                        }}
                      >
                        <PlayerCard player={p} onClick={() => {}} />
                      </div>
                    );
                  })}
                  {getAvailablePlayers().length === 0 && <p className="squad-modal-empty">No hay jugadores disponibles.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
