import { useState, useEffect } from 'react';
import api from '../../services/api';
import ImagePicker from '../../components/admin/ImagePicker';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/admin.css';
import './AdminPlayers.css';
import './AdminPacks.css';

const getImageUrl = (img, folder) => {
  if (!img) return `/${folder}/default.png`;
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
  return `/${folder}/${img}`;
};

const emptyPack = {
  name: '', price: 0, numCards: 3, type: 'standard', availableInStore: true, image: '',
  possibleCards: [],
};

function PackPreview({ form }) {
  const imgSrc = form.image
    ? (form.image.startsWith('http') || form.image.startsWith('data:') || form.image.startsWith('/')
        ? form.image
        : `/packs/${form.image}`)
    : null;

  return (
    <div className="card-preview">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={form.name || 'Pack'}
          className="card-preview-img"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div className="card-preview-placeholder" style={{ display: imgSrc ? 'none' : 'flex' }}>
        <span>Sin imagen</span>
      </div>
      <div className="pack-preview-info">
        <span className="pack-preview-name">{form.name || 'Nombre del sobre'}</span>
        <span className="pack-preview-price">{form.price?.toLocaleString() || '0'} coins</span>
        <span className="pack-preview-meta">{form.numCards} cartas · {form.type} · {form.availableInStore ? 'En tienda' : 'No disponible'}</span>
      </div>
    </div>
  );
}

function getWeightForOvr(ovr) {
  if (ovr >= 90) return 1;
  if (ovr >= 85) return 3;
  if (ovr >= 80) return 6;
  if (ovr >= 75) return 10;
  return 15;
}

export default function AdminPacks() {
  const [packs, setPacks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPack);
  const [editId, setEditId] = useState(null);
  const [tab, setTab] = useState('info');
  const [playerSearch, setPlayerSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/packs'),
      api.get('/admin/players'),
    ]).then(([packRes, playerRes]) => {
      setPacks(packRes.data);
      setPlayers(playerRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setForm({ ...emptyPack, possibleCards: [] }); setEditId(null); setModal('create'); setTab('info'); setPlayerSearch(''); };
  const openEdit = (p) => { setForm({ ...p }); setEditId(p._id); setModal('edit'); setTab('info'); setPlayerSearch(''); };

  const handleSave = async () => {
    try {
      if (modal === 'edit') {
        await api.put(`/admin/packs/${editId}`, form);
      } else {
        await api.post('/admin/packs', form);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este pack?')) return;
    await api.delete(`/admin/packs/${id}`);
    fetchData();
  };

  const addPossibleCard = () => {
    setForm((f) => ({
      ...f,
      possibleCards: [...f.possibleCards, { player_id: '', weight: 1 }],
    }));
  };

  const updatePossibleCard = (index, key, value) => {
    setForm((f) => {
      const cards = [...f.possibleCards];
      cards[index] = { ...cards[index], [key]: key === 'player_id' ? value : Number(value) };
      return { ...f, possibleCards: cards };
    });
  };

  const removePossibleCard = (index) => {
    setForm((f) => ({
      ...f,
      possibleCards: f.possibleCards.filter((_, i) => i !== index),
    }));
  };

  const autoWeight = () => {
    setForm((f) => ({
      ...f,
      possibleCards: f.possibleCards.map((pc) => {
        const player = players.find((p) => p._id === pc.player_id);
        if (!player) return pc;
        return { ...pc, weight: getWeightForOvr(player.overall) };
      }),
    }));
  };

  const addAllPlayers = () => {
    const existingIds = new Set(form.possibleCards.map((pc) => pc.player_id));
    const newCards = players
      .filter((p) => !existingIds.has(p._id))
      .map((p) => ({ player_id: p._id, weight: getWeightForOvr(p.overall) }));
    setForm((f) => ({ ...f, possibleCards: [...f.possibleCards, ...newCards] }));
  };

  const availablePlayers = players.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    p.position.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Sobres ({packs.length})</h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Crear Sobre</button>
      </div>

      {loading ? (
        <div className="admin-empty">Cargando...</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th><th>Nombre</th><th>Precio</th><th>Cartas</th><th>Tipo</th><th>Tienda</th><th>Probables</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((p) => (
                <tr key={p._id}>
                  <td>
                    {p.image ? (
                      <img src={getImageUrl(p.image, 'packs')} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'rgba(232,234,240,0.3)' }}>🎁</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.price.toLocaleString()} coins</td>
                  <td>{p.numCards}</td>
                  <td>{p.type}</td>
                  <td>{p.availableInStore ? '✅' : '❌'}</td>
                  <td>{p.possibleCards?.length || 0} jugadores</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => openEdit(p)}>Editar</button>
                      <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => handleDelete(p._id)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {packs.length === 0 && <tr><td colSpan={8} className="admin-empty">No hay sobres creados</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="player-modal-overlay" onClick={() => setModal(null)}>
          <div className="player-modal pack-modal" onClick={(e) => e.stopPropagation()}>
            <button className="player-modal-close" onClick={() => setModal(null)}>✕</button>

            <div className="player-modal-layout">
              <PackPreview form={form} />

              <div className="player-modal-form">
                <div className="player-modal-tabs">
                  {[
                    { id: 'info', label: 'Info' },
                    { id: 'players', label: `Players (${form.possibleCards.length})` },
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
                  {tab === 'info' && (
                    <>
                      <h3 className="form-section-title">Pack Info</h3>
                      <div className="form-group">
                        <label className="form-label">NAME</label>
                        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">PRICE (COINS)</label>
                          <input className="form-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">NUM CARDS</label>
                          <input className="form-input" type="number" min="1" max="30" value={form.numCards} onChange={(e) => setForm({ ...form, numCards: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">TYPE</label>
                          <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            <option value="standard">Standard</option>
                            <option value="draft">Draft</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">STORE</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.availableInStore} onChange={(e) => setForm({ ...form, availableInStore: e.target.checked })} />
                            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: '#e8eaf0' }}>Disponible en tienda</span>
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <ImagePicker
                          folder="packs"
                          value={form.image || ''}
                          onChange={(val) => setForm({ ...form, image: val })}
                          label="PACK IMAGE"
                        />
                      </div>
                    </>
                  )}

                  {tab === 'players' && (
                    <>
                      <div className="pack-players-header">
                        <h3 className="form-section-title" style={{ margin: 0 }}>Possible Cards</h3>
                        <div className="pack-players-actions">
                          <button className="admin-btn admin-btn-outline admin-btn-small" onClick={autoWeight}>Auto Weight by OVR</button>
                          <button className="admin-btn admin-btn-outline admin-btn-small" onClick={addAllPlayers}>Add All Players</button>
                          <button className="admin-btn admin-btn-primary admin-btn-small" onClick={addPossibleCard}>+ Add</button>
                        </div>
                      </div>

                      <input
                        className="form-input"
                        placeholder="Buscar jugador por nombre o posición..."
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        style={{ marginBottom: '0.8rem' }}
                      />

                      <div className="pack-players-list">
                        {form.possibleCards.map((pc, i) => {
                          const player = players.find((p) => p._id === pc.player_id);
                          return (
                            <div key={i} className="pack-player-row">
                              <div className="pack-player-row-left">
                                {player?.image ? (
                                  <img
                                    src={getImageUrl(player.image, 'player-cards')}
                                    alt={player.name}
                                    className="pack-player-thumb"
                                  />
                                ) : (
                                  <div className="pack-player-thumb pack-player-thumb-empty">?</div>
                                )}
                                <select className="form-select pack-player-select" value={pc.player_id} onChange={(e) => updatePossibleCard(i, 'player_id', e.target.value)}>
                                  <option value="">Seleccionar jugador...</option>
                                  {availablePlayers.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name} ({p.overall} OVR · {p.position})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="pack-player-row-right">
                                <div className="pack-weight-input">
                                  <label className="form-label">W</label>
                                  <input className="form-input" type="number" min="1" value={pc.weight}
                                    onChange={(e) => updatePossibleCard(i, 'weight', e.target.value)} />
                                </div>
                                {player && (
                                  <span className="pack-player-ovr" title="OVR">{player.overall}</span>
                                )}
                                <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => removePossibleCard(i)}>✕</button>
                              </div>
                            </div>
                          );
                        })}
                        {form.possibleCards.length === 0 && (
                          <div className="admin-empty">No hay jugadores añadidos</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="player-modal-footer">
                  <button className="admin-btn admin-btn-primary" onClick={handleSave}>
                    {modal === 'edit' ? 'Guardar Cambios' : 'Crear Sobre'}
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
