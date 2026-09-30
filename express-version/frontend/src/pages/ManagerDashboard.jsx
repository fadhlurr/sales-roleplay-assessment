import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { downloadCsv } from '../utils/csv';

export default function ManagerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.managerDashboard(token).then(setData);
  }, [token]);

  if (!data) return <div className="container">Memuat...</div>;

  function exportCsv() {
    downloadCsv(
      'performa-tim-sales.csv',
      ['Nama', 'Email', 'Sesi', 'Skor Rata-rata', 'Skor Terakhir'],
      data.salesUsers.map((u) => [u.name, u.email, u.totalSessions, u.averageScore ?? '', u.latestScore ?? ''])
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard Trainer / Manager</h1>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="grid cols-3">
        <div className="card score-tile"><div className="value">{data.totalSales}</div><div className="label">Total Sales/Trainee</div></div>
        <div className="card score-tile"><div className="value">{data.totalSessions}</div><div className="label">Total Training Session</div></div>
        <div className="card score-tile"><div className="value">{data.averageScore ?? '—'}</div><div className="label">Average Score</div></div>
      </div>

      {data.categoryAverages && (
        <div className="card">
          <h2>Insight Kelemahan Tim</h2>
          <p className="muted">Rata-rata skor per aspek di seluruh sesi tim sales/trainee. Aspek dengan skor terendah adalah area yang paling butuh coaching.</p>
          <div className="grid cols-5">
            {data.categoryAverages.map((c) => (
              <div key={c.key} className={`card score-tile ${c.key === data.weakestCategory ? 'weakest' : ''}`}>
                <div className="value">{c.average ?? '—'}</div>
                <div className="label">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>Performa Sales/Trainee</h2>
        <table>
          <thead><tr><th>Nama</th><th>Sesi</th><th>Skor Rata-rata</th><th>Skor Terakhir</th></tr></thead>
          <tbody>
            {data.salesUsers.map((u) => (
              <tr key={u.id}>
                <td><Link to={`/manager/users/${u.id}`}>{u.name}</Link></td>
                <td>{u.totalSessions}</td>
                <td>{u.averageScore ?? '—'}</td>
                <td>{u.latestScore ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
