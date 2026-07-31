import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/admin.css';

const ITEMS_PER_PAGE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users')
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) =>
    u.discordUsername.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openEdit = (u) => {
    setEditForm({ isAdmin: u.isAdmin, currency: u.currency, elo: u.elo, points: u.points });
    setModal(u);
  };

  const handleSave = async () => {
    try {
      await api.put(`/admin/users/${modal._id}`, editForm);
      setModal(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Usuarios ({users.length})</h1>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          className="admin-input"
          placeholder="Buscar por username..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 350 }}
        />
      </div>

      {loading ? (
        <div className="admin-empty">Cargando...</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th><th>Discord ID</th><th>Coins</th><th>ELO</th><th>Admin</th><th>Récord</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.discordUsername}</td>
                  <td style={{ fontFamily: 'var(--font-stats)', fontSize: '0.75rem', color: 'rgba(232,234,240,0.4)' }}>{u.discordId}</td>
                  <td>{u.currency?.toLocaleString() || 0}</td>
                  <td>{u.elo}</td>
                  <td>{u.isAdmin ? '🛡️' : '—'}</td>
                  <td>{u.record?.wins || 0}W / {u.record?.draws || 0}D / {u.record?.losses || 0}L</td>
                  <td>
                    <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => openEdit(u)}>Editar</button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={7} className="admin-empty">Sin resultados</td></tr>}
            </tbody>
          </table>
        </div>
      )}

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
              <h2 className="admin-modal-title">Editar: {modal.discordUsername}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="admin-form">
              <div>
                <label className="admin-label">Admin</label>
                <button
                  className={`admin-toggle ${editForm.isAdmin ? 'active' : ''}`}
                  onClick={() => setEditForm({ ...editForm, isAdmin: !editForm.isAdmin })}
                />
              </div>
              <div className="admin-form-row">
                <div>
                  <label className="admin-label">Monedas</label>
                  <input className="admin-input" type="number" min="0"
                    value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="admin-label">ELO</label>
                  <input className="admin-input" type="number" min="0"
                    value={editForm.elo} onChange={(e) => setEditForm({ ...editForm, elo: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="admin-label">Puntos</label>
                <input className="admin-input" type="number" min="0"
                  value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: Number(e.target.value) })} />
              </div>

              <button className="admin-btn admin-btn-primary" onClick={handleSave} style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
