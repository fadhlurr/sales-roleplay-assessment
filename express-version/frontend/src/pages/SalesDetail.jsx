import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function SalesDetail() {
  const { userId } = useParams();
  const { token } = useAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.salesDetail(token, userId).then(setUser);
  }, [token, userId]);

  if (!user) return <div className="container">Memuat...</div>;

  return (
    <div className="container">
      <h1>{user.name}</h1>
      <p className="muted">{user.email}</p>

      <div className="grid cols-2">
        <div className="card score-tile"><div className="value">{user.averageScore ?? '—'}</div><div className="label">Skor Rata-rata</div></div>
        <div className="card score-tile"><div className="value">{user.completedSessions}/{user.totalSessions}</div><div className="label">Sesi Selesai</div></div>
      </div>

      <div className="card">
        <h2>Riwayat Latihan (Performance History)</h2>
        <table>
          <thead><tr><th>Tanggal</th><th>Scenario</th><th>Status</th><th>Skor</th></tr></thead>
          <tbody>
            {user.sessions.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.startedAt).toLocaleDateString('id-ID')}</td>
                <td><Link to={`/sessions/${s.id}`}>{s.scenario}</Link></td>
                <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                <td>{s.overallScore ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
