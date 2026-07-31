import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/admin.css';

const TYPES = ['OPEN_PACKS', 'SELL_PLAYERS', 'BUY_PACKS'];
const REWARD_TYPES = ['coins', 'pack'];

const emptyObjective = {
  name: '', description: '', type: 'OPEN_PACKS',
  targetValue: 1, rewardType: 'coins', rewardValue: 0, isActive: true,
};

export default function AdminObjectives() {
  const [objectives, setObjectives] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyObjective);
  const [editId, setEditId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/objectives'),
      api.get('/admin/packs'),
    ]).then(([objRes, packRes]) => {
      setObjectives(objRes.data);
      setPacks(packRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setForm({ ...emptyObjective }); setEditId(null); setModal('create'); };
  const openEdit = (o) => { setForm({ ...o }); setEditId(o._id); setModal('edit'); };

  const handleSave = async () => {
    try {
      const data = { ...form };
      if (data.rewardType === 'pack' && typeof data.rewardValue === 'string') {
        // keep as ObjectId string
      }
      if (modal === 'edit') {
        await api.put(`/admin/objectives/${editId}`, data);
      } else {
        await api.post('/admin/objectives', data);
      }
      setModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este objetivo?')) return;
    await api.delete(`/admin/objectives/${id}`);
    fetchData();
  };

  const typeLabel = (t) => {
    const map = { OPEN_PACKS: 'Abrir sobres', SELL_PLAYERS: 'Vender jugadores', BUY_PACKS: 'Comprar sobres' };
    return map[t] || t;
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Objetivos ({objectives.length})</h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Crear Objetivo</button>
      </div>

      {loading ? (
        <div className="admin-empty">Cargando...</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th><th>Tipo</th><th>Objetivo</th><th>Recompensa</th><th>Activo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  <td>{typeLabel(o.type)}</td>
                  <td>{o.targetValue}</td>
                  <td>
                    {o.rewardType === 'coins'
                      ? `${o.rewardValue?.toLocaleString()} coins`
                      : `Sobre: ${packs.find((p) => p._id === o.rewardValue)?.name || o.rewardValue}`
                    }
                  </td>
                  <td>{o.isActive ? '✅' : '❌'}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => openEdit(o)}>Editar</button>
                      <button className="admin-btn admin-btn-danger admin-btn-small" onClick={() => handleDelete(o._id)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {objectives.length === 0 && <tr><td colSpan={6} className="admin-empty">No hay objetivos creados</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{modal === 'edit' ? 'Editar Objetivo' : 'Crear Objetivo'}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="admin-form">
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Nombre</label>
                  <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="admin-label">Tipo</label>
                  <select className="admin-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="admin-label">Descripción</label>
                <input className="admin-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Valor objetivo (cuántas veces)</label>
                <input className="admin-input" type="number" min="1" value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })} />
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Tipo de recompensa</label>
                  <select className="admin-select" value={form.rewardType}
                    onChange={(e) => setForm({ ...form, rewardType: e.target.value, rewardValue: e.target.value === 'coins' ? 0 : '' })}>
                    {REWARD_TYPES.map((r) => <option key={r} value={r}>{r === 'coins' ? 'Monedas' : 'Sobre'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="admin-label">{form.rewardType === 'coins' ? 'Monedas' : 'Sobre'}</label>
                  {form.rewardType === 'coins' ? (
                    <input className="admin-input" type="number" min="0" value={form.rewardValue}
                      onChange={(e) => setForm({ ...form, rewardValue: Number(e.target.value) })} />
                  ) : (
                    <select className="admin-select" value={form.rewardValue}
                      onChange={(e) => setForm({ ...form, rewardValue: e.target.value })}>
                      <option value="">Seleccionar sobre...</option>
                      {packs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Activo
                </label>
              </div>

              <button className="admin-btn admin-btn-primary" onClick={handleSave} style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
                {modal === 'edit' ? 'Guardar Cambios' : 'Crear Objetivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
