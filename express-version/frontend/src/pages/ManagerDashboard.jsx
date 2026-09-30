import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ManagerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.managerDashboard(token).then(setData);
  }, [token]);

  if (!data) return <div className="container">Memuat...</div>;

  return (
    <div className="container">
      <h1>Dashboard Trainer / Manager</h1>

      <div className="grid cols-3">
        <div className="card score-tile"><div className="value">{data.totalSales}</div><div className="label">Total Sales/Trainee</div></div>
        <div className="card score-tile"><div className="value">{data.totalSessions}</div><div className="label">Total Training Session</div></div>
        <div className="card score-tile"><div className="value">{data.averageScore ?? '—'}</div><div className="label">Average Score</div></div>
      </div>

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
