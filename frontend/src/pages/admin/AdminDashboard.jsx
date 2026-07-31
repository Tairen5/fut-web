import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import '../../components/admin/admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="admin-empty">Cargando...</div></AdminLayout>;
  if (!stats) return <AdminLayout><div className="admin-empty">Error al cargar stats.</div></AdminLayout>;

  const cards = [
    { label: 'Usuarios', value: stats.totalUsers },
    { label: 'Jugadores', value: stats.totalPlayers },
    { label: 'Sobres', value: stats.totalPacks },
    { label: 'Objetivos', value: stats.totalObjectives },
    { label: 'Cartas en circulation', value: stats.totalUserPlayers },
    { label: 'Monedas totales', value: stats.totalCurrency.toLocaleString() },
    { label: 'ELO promedio', value: stats.avgElo },
  ];

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="stat-card-label">{c.label}</span>
            <span className="stat-card-value">{c.value}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
