import { useState, useEffect } from 'react';
import { getRarityStyle } from '../../utils/constants';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/admin.css';
import './AdminPlayers.css';

const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
const ITEMS_PER_PAGE = 15;

const getImageUrl = (img, folder) => {
  if (!img) return `/${folder}/default.png`;
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
  return `/${folder}/${img}`;
};

const emptyPlayer = {
  name: '', shortName: '', image: '', overall: 80, position: 'ST',
  secondaryPositions: [], promo: '', groupKey: '',
  stats: { pac: 80, sho: 80, pas: 80, dri: 80, def: 80, phy: 80 },
  club: { name: '', image: '' }, league: { name: '', image: '' },
  nation: { name: '', image: '' }, playStyles: [],
};

function CardPreview({ form }) {
  const rarity = getRarityStyle(form.overall);
  const hasImage = form.image && (
    form.image.startsWith('http') || form.image.startsWith('data:') || form.image.startsWith('/')
      ? true
      : true
  );
  const imgSrc = form.image
    ? (form.image.startsWith('http') || form.image.startsWith('data:') || form.image.startsWith('/')
        ? form.image
        : `/player-cards/${form.image}`)
    : null;

  return (
    <div className="card-preview">
      <div className="card-preview-frame" style={{ background: rarity.bg, boxShadow: rarity.glow, borderColor: rarity.border }}>
        <div className="card-preview-ovr">{form.overall || '—'}</div>
        <div className="card-preview-pos">{form.position || '—'}</div>
        <div className="card-preview-image">
          {imgSrc ? (
            <img src={imgSrc} alt={form.name} onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <div className="card-preview-placeholder">👤</div>
          )}
        </div>
        <div className="card-preview-name">{form.shortName || form.name || 'Nombre'}</div>
        <div className="card-preview-stats">
          {['pac', 'sho', 'pas', 'dri', 'def', 'phy'].map((k) => (
            <div key={k} className="card-preview-stat">
              <span className="card-preview-stat-label">{k.toUpperCase()}</span>
              <span className="card-preview-stat-value">{form.stats[k]}</span>
            </div>
          ))}
        </div>
        <div className="card-preview-badges">
          {form.nation?.image && (
            <img
              src={form.nation.image.startsWith('http') || form.nation.image.startsWith('/') ? form.nation.image : `/nations/${form.nation.image}`}
              alt="" className="card-preview-badge"
            />
          )}
          {form.club?.image && (
            <img
              src={form.club.image.startsWith('http') || form.club.image.startsWith('/') ? form.club.image : `/clubs/${form.club.image}`}
              alt="" className="card-preview-badge"
            />
          )}
          {form.league?.image && (
            <img
              src={form.league.image.startsWith('http') || form.league.image.startsWith('/') ? form.league.image : `/leagues/${form.league.image}`}
              alt="" className="card-preview-badge"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPlayer);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('player');

  const fetchPlayers = () => {
    api.get('/admin/players')
      .then((res) => setPlayers(res.data))
      .catch(() => {});
  };

  useEffect(() => { fetchPlayers(); }, []);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openCreate = () => { setForm({ ...emptyPlayer }); setEditId(null); setModal('create'); setTab('player'); };
  const openEdit = (p) => { setForm({ ...p }); setEditId(p._id); setModal('edit'); setTab('player'); };

  const handleSave = async () => {
    try {
      if (modal === 'edit') {
        await api.put(`/admin/players/${editId}`, form);
      } else {
        await api.post('/admin/players', form);
      }
      setModal(null);
      fetchPlayers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este jugador?')) return;
    await api.delete(`/admin/players/${id}`);
    fetchPlayers();
  };

  const setStat = (key, val) => setForm((f) => ({ ...f, stats: { ...f.stats, [key]: Math.min(99, Math.max(1, Number(val) || 1)) } }));
  const setClub = (key, val) => setForm((f) => ({ ...f, club: { ...f.club, [key]: val } }));
  const setNation = (key, val) => setForm((f) => ({ ...f, nation: { ...f.nation, [key]: val } }));
  const setLeague = (key, val) => setForm((f) => ({ ...f, league: { ...f.league, [key]: val } }));

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Jugadores ({players.length})</h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Crear Jugador</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          className="admin-input"
          placeholder="Buscar por nombre o posición..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 350 }}
        />
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th><th>OVR</th><th>Nombre</th><th>Pos</th><th>Promo</th><th>Club</th><th>Nación</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.image ? (
                    <img src={getImageUrl(p.image, 'player-cards')} alt={p.name} style={{ width: 36, height: 36, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'rgba(232,234,240,0.3)' }}>N/A</div>
                  )}
                </td>
                <td><span style={{ color: '#1e5ddb', fontWeight: 700 }}>{p.overall}</span></td>
                <td>{p.name}</td>
                <td>{p.position}</td>
                <td>{p.promo || '—'}</td>
                <td>{p.club?.name || '—'}</td>
                <td>{p.nation?.name || '—'}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => openEdit(p)}>Editar</button>
                    <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => handleDelete(p._id)}>Borrar</button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && <tr><td colSpan={8} className="admin-empty">Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>←</button>
          <span className="admin-page-info">{page}/{totalPages}</span>
          <button className="admin-page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>→</button>
        </div>
      )}

      {modal && (
        <div className="player-modal-overlay" onClick={() => setModal(null)}>
          <div className="player-modal" onClick={(e) => e.stopPropagation()}>
            <button className="player-modal-close" onClick={() => setModal(null)}>✕</button>

            <div className="player-modal-layout">
              <CardPreview form={form} />

              <div className="player-modal-form">
                <div className="player-modal-tabs">
                  {[
                    { id: 'player', label: 'Player' },
                    { id: 'affiliations', label: 'Affiliations' },
                    { id: 'stats', label: 'Attributes' },
                    { id: 'extra', label: 'Extra' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      className={`player-modal-tab ${tab === t.id ? 'active' : ''}`}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="player-modal-body">
                  {tab === 'player' && (
                    <>
                      <h3 className="form-section-title">Player Identity</h3>
                      <div className="form-group">
                        <label className="form-label">DISPLAY NAME</label>
                        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">SHORT NAME</label>
                        <input className="form-input" value={form.shortName || ''} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="ej: Messi" />
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">RATING</label>
                          <input className="form-input" type="number" min="1" max="99" value={form.overall} onChange={(e) => setForm({ ...form, overall: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">POSITION</label>
                          <select className="form-select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">IMAGE FILENAME</label>
                        <input className="form-input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="ej: messi.png" />
                      </div>
                    </>
                  )}

                  {tab === 'affiliations' && (
                    <>
                      <h3 className="form-section-title">Affiliations</h3>
                      <div className="form-group">
                        <label className="form-label">CLUB NAME</label>
                        <input className="form-input" value={form.club?.name || ''} onChange={(e) => setClub('name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CLUB IMAGE</label>
                        <input className="form-input" value={form.club?.image || ''} onChange={(e) => setClub('image', e.target.value)} placeholder="ej: inter-miami.png" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LEAGUE NAME</label>
                        <input className="form-input" value={form.league?.name || ''} onChange={(e) => setLeague('name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LEAGUE IMAGE</label>
                        <input className="form-input" value={form.league?.image || ''} onChange={(e) => setLeague('image', e.target.value)} placeholder="ej: mls.png" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">NATION NAME</label>
                        <input className="form-input" value={form.nation?.name || ''} onChange={(e) => setNation('name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">NATION IMAGE</label>
                        <input className="form-input" value={form.nation?.image || ''} onChange={(e) => setNation('image', e.target.value)} placeholder="ej: argentina.png" />
                      </div>
                    </>
                  )}

                  {tab === 'stats' && (
                    <>
                      <h3 className="form-section-title">Face Attributes</h3>
                      <div className="stats-grid-6">
                        {['pac', 'sho', 'pas', 'dri', 'def', 'phy'].map((k) => (
                          <div key={k} className="stat-input-group">
                            <label className="form-label">{k.toUpperCase()}</label>
                            <input
                              className="form-input stat-input"
                              type="number" min="1" max="99"
                              value={form.stats[k]}
                              onChange={(e) => setStat(k, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {tab === 'extra' && (
                    <>
                      <h3 className="form-section-title">Extra Info</h3>
                      <div className="form-group">
                        <label className="form-label">PROMO</label>
                        <input className="form-input" value={form.promo || ''} onChange={(e) => setForm({ ...form, promo: e.target.value })} placeholder="TOTY, TOTW..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">GROUP KEY</label>
                        <input className="form-input" value={form.groupKey || ''} onChange={(e) => setForm({ ...form, groupKey: e.target.value })} placeholder="Para agrupar versiones" />
                      </div>
                    </>
                  )}
                </div>

                <div className="player-modal-footer">
                  <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                    {modal === 'edit' ? 'Guardar Cambios' : 'Crear Jugador'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
