import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/admin.css';

const POSITIONS = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
const ITEMS_PER_PAGE = 15;

const emptyPlayer = {
  name: '', image: '', overall: 80, position: 'ST',
  secondaryPositions: [], promo: '', groupKey: '',
  stats: { pac: 80, sho: 80, pas: 80, dri: 80, def: 80, phy: 80 },
  club: { name: '', image: '' }, league: { name: '', image: '' },
  nation: { name: '', image: '' }, playStyles: [],
};

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(emptyPlayer);
  const [editId, setEditId] = useState(null);

  const fetchPlayers = () => {
    setLoading(true);
    api.get('/admin/players')
      .then((res) => setPlayers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlayers(); }, []);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openCreate = () => { setForm({ ...emptyPlayer }); setEditId(null); setModal('create'); };
  const openEdit = (p) => { setForm({ ...p }); setEditId(p._id); setModal('edit'); };

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

  const setStat = (key, val) => setForm((f) => ({ ...f, stats: { ...f.stats, [key]: Number(val) } }));
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
              <th>OVR</th><th>Nombre</th><th>Pos</th><th>Promo</th><th>Club</th><th>Nación</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((p) => (
              <tr key={p._id}>
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
            {paged.length === 0 && <tr><td colSpan={7} className="admin-empty">Sin resultados</td></tr>}
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
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modal === 'edit' ? 'Editar Jugador' : 'Crear Jugador'}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="admin-form">
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Nombre</label>
                  <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="admin-label">Overall</label>
                  <input className="admin-input" type="number" min="1" max="99" value={form.overall} onChange={(e) => setForm({ ...form, overall: Number(e.target.value) })} />
                </div>
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Posición</label>
                  <select className="admin-select" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">Promo</label>
                  <input className="admin-input" value={form.promo || ''} onChange={(e) => setForm({ ...form, promo: e.target.value })} placeholder="TOTY, TOTW..." />
                </div>
              </div>
              <div>
                <label className="admin-label">Imagen URL</label>
                <input className="admin-input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Club nombre</label>
                  <input className="admin-input" value={form.club?.name || ''} onChange={(e) => setClub('name', e.target.value)} />
                </div>
                <div>
                  <label className="admin-label">Club imagen URL</label>
                  <input className="admin-input" value={form.club?.image || ''} onChange={(e) => setClub('image', e.target.value)} />
                </div>
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Nación nombre</label>
                  <input className="admin-input" value={form.nation?.name || ''} onChange={(e) => setNation('name', e.target.value)} />
                </div>
                <div>
                  <label className="admin-label">Nación imagen URL</label>
                  <input className="admin-input" value={form.nation?.image || ''} onChange={(e) => setNation('image', e.target.value)} />
                </div>
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Liga nombre</label>
                  <input className="admin-input" value={form.league?.name || ''} onChange={(e) => setLeague('name', e.target.value)} />
                </div>
                <div>
                  <label className="admin-label">Liga imagen URL</label>
                  <input className="admin-input" value={form.league?.image || ''} onChange={(e) => setLeague('image', e.target.value)} />
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <label className="admin-label">Stats (PAC / SHO / PAS / DRI / DEF / PHY)</label>
                <div className="admin-form-row">
                  {['pac', 'sho', 'pas', 'dri', 'def', 'phy'].map((k) => (
                    <input key={k} className="admin-input" type="number" min="1" max="99"
                      value={form.stats[k]} onChange={(e) => setStat(k, e.target.value)}
                      placeholder={k.toUpperCase()} style={{ width: '100%' }} />
                  ))}
                </div>
              </div>

              <button className="admin-btn admin-btn-primary" onClick={handleSave} style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
                {modal === 'edit' ? 'Guardar Cambios' : 'Crear Jugador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
