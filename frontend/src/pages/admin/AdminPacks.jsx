import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/admin.css';

const emptyPack = {
  name: '', price: 0, numCards: 3, type: 'standard', availableInStore: true, image: '',
  possibleCards: [],
};

export default function AdminPacks() {
  const [packs, setPacks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyPack);
  const [editId, setEditId] = useState(null);

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

  const openCreate = () => { setForm({ ...emptyPack, possibleCards: [] }); setEditId(null); setModal('create'); };
  const openEdit = (p) => { setForm({ ...p }); setEditId(p._id); setModal('edit'); };

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
                <th>Nombre</th><th>Precio</th><th>Cartas</th><th>Tipo</th><th>Tienda</th><th>Probables</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((p) => (
                <tr key={p._id}>
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
              {packs.length === 0 && <tr><td colSpan={7} className="admin-empty">No hay sobres creados</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modal === 'edit' ? 'Editar Sobre' : 'Crear Sobre'}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="admin-form">
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Nombre</label>
                  <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="admin-label">Precio (coins)</label>
                  <input className="admin-input" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Nº de cartas</label>
                  <input className="admin-input" type="number" min="1" max="30" value={form.numCards} onChange={(e) => setForm({ ...form, numCards: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="admin-label">Tipo</label>
                  <select className="admin-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="standard">Standard</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Imagen URL</label>
                  <input className="admin-input" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                    <input type="checkbox" checked={form.availableInStore} onChange={(e) => setForm({ ...form, availableInStore: e.target.checked })} />
                    Disponible en tienda
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="admin-label" style={{ marginBottom: 0 }}>Jugadores probables (peso)</label>
                  <button className="admin-btn admin-btn-outline admin-btn-small" onClick={addPossibleCard}>+ Añadir</button>
                </div>
                {form.possibleCards.map((pc, i) => (
                  <div key={i} className="admin-form-row" style={{ marginBottom: '0.4rem', alignItems: 'center' }}>
                    <select className="admin-select" value={pc.player_id} onChange={(e) => updatePossibleCard(i, 'player_id', e.target.value)}>
                      <option value="">Seleccionar jugador...</option>
                      {players.map((p) => (
                        <option key={p._id} value={p._id}>{p.name} ({p.overall} OVR)</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <input className="admin-input" type="number" min="1" value={pc.weight}
                        onChange={(e) => updatePossibleCard(i, 'weight', e.target.value)} style={{ width: 70 }} />
                      <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => removePossibleCard(i)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="admin-btn admin-btn-primary" onClick={handleSave} style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
                {modal === 'edit' ? 'Guardar Cambios' : 'Crear Sobre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
