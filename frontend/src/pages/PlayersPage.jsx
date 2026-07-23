import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PROMO_COLORS } from '../utils/constants';
import PlayerCard from '../components/game/PlayerCard';
import './PlayersPage.css';

const SORT_TABS = [
  { id: 'ovr_desc', label: 'OVR ↓', color: '#ff6b35' },
  { id: 'ovr_asc', label: 'OVR ↑', color: '#32d583' },
  { id: 'name_asc', label: 'A-Z', color: '#a855f7' },
  { id: 'name_desc', label: 'Z-A', color: '#4f8ef7' },
];

const MAX_PROMO_CARDS = 5;
const TOP_PLAYERS_COUNT = 5;

const ITEMS_PER_PAGE_GRID = 32;
const ITEMS_PER_PAGE_LIST = 20;

export default function PlayersPage() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [viewType, setViewType] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ovr_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    position: '',
    minOvr: '',
    maxOvr: '',
    promo: '',
    nation: '',
    club: '',
  });

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/players');
      setPlayers(res.data);
    } catch {
      setError('Could not load catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlayers(); }, []);

  const getImageUrl = (img, folder) => {
    if (!img) return `/${folder}/default.png`;
    if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
    return `/${folder}/${img}`;
  };

  const getStatClass = (val) => {
    if (val >= 90) return 'stat-excelent';
    if (val >= 80) return 'stat-good';
    if (val >= 70) return 'stat-avg';
    return 'stat-poor';
  };

  const allPromos = [...new Set(players.map((p) => p.promo).filter(Boolean))].sort();
  const allNations = [...new Set(players.map((p) => p.nation?.name).filter(Boolean))].sort();
  const allClubs = [...new Set(players.map((p) => p.club?.name).filter(Boolean))].sort();

  const filteredPlayers = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchSearch = p.name?.toLowerCase().includes(q) || p.position?.toLowerCase().includes(q) || p.promo?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    if (filters.position) {
      const posMatch = p.position === filters.position || p.secondaryPositions?.includes(filters.position);
      if (!posMatch) return false;
    }
    if (filters.minOvr && p.overall < Number(filters.minOvr)) return false;
    if (filters.maxOvr && p.overall > Number(filters.maxOvr)) return false;
    if (filters.promo && p.promo !== filters.promo) return false;
    if (filters.nation && p.nation?.name !== filters.nation) return false;
    if (filters.club && p.club?.name !== filters.club) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'ovr_desc') return (b.overall || 0) - (a.overall || 0);
    if (sortBy === 'ovr_asc') return (a.overall || 0) - (b.overall || 0);
    if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
    return 0;
  });

  const groupedByPromo = {};
  filteredPlayers.forEach((p) => {
    if (!p.promo) return;
    const key = p.promo;
    if (!groupedByPromo[key]) groupedByPromo[key] = [];
    groupedByPromo[key].push(p);
  });

  const promoGroups = Object.entries(groupedByPromo).sort((a, b) => b[1].length - a[1].length);

  const itemsPerPage = viewType === 'grid' ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const topPlayers = [...players].sort((a, b) => (b.overall || 0) - (a.overall || 0)).slice(0, TOP_PLAYERS_COUNT);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ position: '', minOvr: '', maxOvr: '', promo: '', nation: '', club: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = search || filters.position || filters.minOvr || filters.maxOvr || filters.promo || filters.nation || filters.club;

  const stats = {
    total: players.length,
    promos: allPromos.length,
    nations: allNations.length,
  };

  return (
    <div className="players-page">
      {/* Hero Skeleton */}
      {loading && (
        <section className="catalog-hero">
          <div className="catalog-hero-bg" />
          <div className="catalog-hero-content">
            <div className="catalog-hero-text">
              <div className="skeleton-bar w40" style={{ height: '12px', marginBottom: '8px' }} />
              <div className="skeleton-bar" style={{ width: '280px', height: '48px', marginBottom: '8px' }} />
              <div className="skeleton-bar w60" style={{ height: '14px', marginBottom: '16px' }} />
              <div className="catalog-hero-stats">
                <div className="skeleton-bar" style={{ width: '60px', height: '32px' }} />
                <div className="skeleton-bar" style={{ width: '60px', height: '32px' }} />
                <div className="skeleton-bar" style={{ width: '60px', height: '32px' }} />
              </div>
            </div>
            <div className="catalog-hero-cards">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="catalog-hero-card-skeleton" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="skeleton-card" style={{ width: '150px', height: '220px', borderRadius: '14px' }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      {!loading && !error && topPlayers.length > 0 && (
        <section className="catalog-hero">
          <div className="catalog-hero-bg" />
          <div className="catalog-hero-content">
            <div className="catalog-hero-text">
              <span className="catalog-hero-label">TOP PLAYERS</span>
              <h2 className="catalog-hero-title">ELITE SQUAD</h2>
              <p className="catalog-hero-desc">Los mejores jugadores del catálogo. Explora, filtra y construye tu equipo ideal.</p>
              <div className="catalog-hero-stats">
                <div className="catalog-hero-stat">
                  <span className="catalog-hero-stat-value">{stats.total}</span>
                  <span className="catalog-hero-stat-label">JUGADORES</span>
                </div>
                <div className="catalog-hero-stat-divider" />
                <div className="catalog-hero-stat">
                  <span className="catalog-hero-stat-value">{stats.promos}</span>
                  <span className="catalog-hero-stat-label">PROMOS</span>
                </div>
                <div className="catalog-hero-stat-divider" />
                <div className="catalog-hero-stat">
                  <span className="catalog-hero-stat-value">{stats.nations}</span>
                  <span className="catalog-hero-stat-label">PAÍSES</span>
                </div>
              </div>
            </div>
            <div className="catalog-hero-cards">
              {topPlayers.map((player, i) => (
                <div
                  key={player._id}
                  className="catalog-hero-card"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => navigate(`/players/${player._id}`)}
                >
                  <PlayerCard player={player} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Header */}
      <div className="catalog-header">
        <div className="catalog-title-area">
          <h1 className="catalog-title">Catálogo</h1>
          <p className="catalog-subtitle">Explora todos los jugadores disponibles</p>
        </div>
        <div className="catalog-stats-row">
          <span className="catalog-stat-pill">{stats.total} cartas</span>
          <span className="catalog-stat-pill">{stats.promos} promos</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="catalog-toolbar">
        <form className="search-bar-inline" onSubmit={(e) => e.preventDefault()}>
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar jugador, promo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="search-input-inline"
          />
        </form>

        <div className="toolbar-actions">
          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
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

          <div className="view-toggles">
            <button
              className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
              onClick={() => { setViewType('grid'); setCurrentPage(1); }}
              title="Grid"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button
              className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
              onClick={() => { setViewType('list'); setCurrentPage(1); }}
              title="Lista"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <button
              className={`view-btn ${viewType === 'promos' ? 'active' : ''}`}
              onClick={() => { setViewType('promos'); setCurrentPage(1); }}
              title="Por Promos"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="7" rx="1"></rect><rect x="2" y="14" width="20" height="7" rx="1"></rect></svg>
            </button>
          </div>
        </div>
      </div>

      {viewType !== 'promos' && (
        <div className="filter-tabs">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`filter-tab ${sortBy === tab.id ? 'active' : ''}`}
              style={{ '--tab-color': tab.color }}
              onClick={() => setSortBy(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {viewType !== 'promos' && showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label className="filter-label">Posición</label>
            <select value={filters.position} onChange={(e) => handleFilterChange('position', e.target.value)} className="filter-select">
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
            <input type="number" min="0" max="99" placeholder="0" value={filters.minOvr} onChange={(e) => handleFilterChange('minOvr', e.target.value)} className="filter-input" />
          </div>
          <div className="filter-group">
            <label className="filter-label">OVR Max</label>
            <input type="number" min="0" max="99" placeholder="99" value={filters.maxOvr} onChange={(e) => handleFilterChange('maxOvr', e.target.value)} className="filter-input" />
          </div>
          <div className="filter-group">
            <label className="filter-label">Promo</label>
            <select value={filters.promo} onChange={(e) => handleFilterChange('promo', e.target.value)} className="filter-select">
              <option value="">Todas</option>
              {allPromos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Nación</label>
            <select value={filters.nation} onChange={(e) => handleFilterChange('nation', e.target.value)} className="filter-select">
              <option value="">Todas</option>
              {allNations.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Club</label>
            <select value={filters.club} onChange={(e) => handleFilterChange('club', e.target.value)} className="filter-select">
              <option value="">Todos</option>
              {allClubs.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>Limpiar filtros</button>
          )}
        </div>
      )}

      {viewType !== 'promos' && hasActiveFilters && (
        <div className="active-filters-row">
          <span className="results-count">{filteredPlayers.length} resultados</span>
          {search && <span className="filter-tag" onClick={() => setSearch('')}>"{search}" ✕</span>}
          {filters.position && <span className="filter-tag" onClick={() => handleFilterChange('position', '')}>{filters.position} ✕</span>}
          {filters.minOvr && <span className="filter-tag" onClick={() => handleFilterChange('minOvr', '')}>Min {filters.minOvr} ✕</span>}
          {filters.maxOvr && <span className="filter-tag" onClick={() => handleFilterChange('maxOvr', '')}>Max {filters.maxOvr} ✕</span>}
          {filters.promo && <span className="filter-tag" onClick={() => handleFilterChange('promo', '')}>{filters.promo} ✕</span>}
          {filters.nation && <span className="filter-tag" onClick={() => handleFilterChange('nation', '')}>{filters.nation} ✕</span>}
          {filters.club && <span className="filter-tag" onClick={() => handleFilterChange('club', '')}>{filters.club} ✕</span>}
        </div>
      )}

      {loading && (
        <div className="state-container">
          <div className="spinner" />
          <p>Loading catalog...</p>
        </div>
      )}

      {error && (
        <div className="state-container error-state">
          <span className="state-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn-outline" onClick={fetchPlayers}>Retry</button>
        </div>
      )}

      {!loading && !error && filteredPlayers.length === 0 && (
        <div className="state-container">
          <span className="state-icon">🔍</span>
          <p>No players match your filters.</p>
          <button className="btn-outline" onClick={clearFilters}>Clear all</button>
        </div>
      )}

      {!loading && !error && filteredPlayers.length > 0 && (
        viewType === 'grid' ? (
          <div className="collection-grid">
            {paginatedPlayers.map((player, i) => (
              <div key={player._id} style={{ animationDelay: `${i * 0.04}s` }}>
                <PlayerCard player={player} />
              </div>
            ))}
          </div>
        ) : viewType === 'list' ? (
          <div className="players-list-container">
            <table className="players-list-table">
              <thead>
                <tr>
                  <th className="col-player">PLAYER</th>
                  <th className="col-rat">OVR</th>
                  <th className="col-info">INFO</th>
                  <th className="col-details">PLAYSTYLES</th>
                  <th className="col-pos">POS</th>
                  <th className="col-stat">PAC</th>
                  <th className="col-stat">SHO</th>
                  <th className="col-stat">PAS</th>
                  <th className="col-stat">DRI</th>
                  <th className="col-stat">DEF</th>
                  <th className="col-stat col-stat-last">PHY</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map((player) => {
                  const s = player.stats || {};
                  return (
                    <tr key={player._id} className="player-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/players/${player._id}`)}>
                      <td className="col-player">
                        <div className="list-player-block">
                          <img src={getImageUrl(player.image, 'player-cards')} alt={player.name} className="list-player-img" />
                          <div className="list-player-name-block">
                            <span className="list-player-name">{player.name}</span>
                            <span className="list-player-type">{player.promo || 'BASE'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="col-rat"><div className="rat-badge-styled">{player.overall}</div></td>
                      <td className="col-info">
                        <div className="info-rows">
                          {player.nation?.name && (
                            <div className="info-row">
                              <img src={getImageUrl(player.nation.image, 'nations')} className="info-icon" alt="" />
                              <span>{player.nation.name}</span>
                            </div>
                          )}
                          {player.club?.name && (
                            <div className="info-row">
                              <img src={getImageUrl(player.club.image, 'clubs')} className="info-icon" alt="" />
                              <span>{player.club.name}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="col-details">
                        <div className="details-block playstyles-row">
                          {player.playStyles?.length > 0 ? (
                            <>
                              {[...player.playStyles]
                                .sort((a, b) => (a.name?.includes('+') ? 0 : 1) - (b.name?.includes('+') ? 0 : 1))
                                .slice(0, 4)
                                .map((ps, idx) => (
                                  ps.image
                                    ? <img key={idx} src={getImageUrl(ps.image, 'playstyles')} title={ps.name} className="playstyle-icon" alt={ps.name} />
                                    : <span key={idx} className="details-value">{ps.name}</span>
                                ))}
                              {player.playStyles.length > 4 && (
                                <div className="stat-box stat-avg playstyle-overflow">+{player.playStyles.length - 4}</div>
                              )}
                            </>
                          ) : (
                            <span className="details-value">None</span>
                          )}
                        </div>
                      </td>
                      <td className="col-pos">
                        <div className="pos-badge-container">
                          <span className="pos-badge-main">{player.position}</span>
                          {player.secondaryPositions?.length > 0 && (
                            <span className="pos-badge-sub">{player.secondaryPositions.join(', ')}</span>
                          )}
                        </div>
                      </td>
                      <td className="col-stat"><div className={`stat-box ${getStatClass(s.pac)}`}>{s.pac || 0}</div></td>
                      <td className="col-stat"><div className={`stat-box ${getStatClass(s.sho)}`}>{s.sho || 0}</div></td>
                      <td className="col-stat"><div className={`stat-box ${getStatClass(s.pas)}`}>{s.pas || 0}</div></td>
                      <td className="col-stat"><div className={`stat-box ${getStatClass(s.dri)}`}>{s.dri || 0}</div></td>
                      <td className="col-stat"><div className={`stat-box ${getStatClass(s.def)}`}>{s.def || 0}</div></td>
                      <td className="col-stat col-stat-last"><div className={`stat-box ${getStatClass(s.phy)}`}>{s.phy || 0}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="catalog-promo-groups">
            {promoGroups.map(([promo, cards]) => {
              const colors = PROMO_COLORS[promo] || PROMO_COLORS.BASE;
              const visibleCards = cards.slice(0, MAX_PROMO_CARDS);
              const remaining = cards.length - MAX_PROMO_CARDS;
              return (
                <div
                  key={promo}
                  className="promo-group"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/promos/${promo}`)}
                >
                  <div
                    className="promo-group-header"
                    style={{ background: colors.gradient }}
                  >
                    <h3 className="promo-group-title" style={{ color: colors.text }}>{promo}</h3>
                    <span className="promo-group-arrow" style={{ color: colors.text }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                  </div>
                  <div className="promo-group-cards">
                    {visibleCards.map((player) => (
                      <div key={player._id} className="collection-card-wrapper">
                        <PlayerCard player={player} />
                      </div>
                    ))}
                    {remaining > 0 && (
                      <div className="whitecard-overflow">
                        <img src="/assets/whitecard.png" alt="+" className="whitecard-img" />
                        <span className="whitecard-count" style={{ color: colors.text }}>+{remaining}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {viewType !== 'promos' && !loading && !error && totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          {(() => {
            const pages = [];
            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (currentPage > 3) pages.push('...');
              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
              if (currentPage < totalPages - 2) pages.push('...');
              pages.push(totalPages);
            }
            return pages.map((page, idx) =>
              page === '...'
                ? <span key={`dots-${idx}`} className="pagination-dots">...</span>
                : <button key={page} className={`pagination-page ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
            );
          })()}
          <button className="pagination-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      )}
    </div>
  );
}
