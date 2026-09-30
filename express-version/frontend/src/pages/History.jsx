import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function History() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.myHistory(token).then(setSessions);
  }, [token]);

  return (
    <div className="container">
      <h1>Riwayat Latihan</h1>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Scenario</th>
              <th>Status</th>
              <th>Overall Score</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="clickable" onClick={() => (window.location.href = `/sessions/${s.id}`)}>
                <td>{new Date(s.startedAt).toLocaleString('id-ID')}</td>
                <td>{s.Scenario?.name}</td>
                <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                <td>{s.Assessment?.overallScore ?? '—'}</td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={4} className="muted">Belum ada riwayat latihan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Link className="btn primary" to="/scenarios">+ Mulai Latihan Baru</Link>
    </div>
  );
}
