import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function CandidateDetail() {
  const { userId } = useParams();
  const { token } = useAuth();
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    api.candidateDetail(token, userId).then(setCandidate);
  }, [token, userId]);

  if (!candidate) return <div className="container">Memuat...</div>;

  return (
    <div className="container">
      <h1>{candidate.name}</h1>
      <p className="muted">{candidate.email}</p>

      <div className="grid cols-2">
        <div className="card score-tile"><div className="value">{candidate.averageScore ?? '—'}</div><div className="label">Skor Rata-rata</div></div>
        <div className="card score-tile"><div className="value">{candidate.completedSessions}/{candidate.totalSessions}</div><div className="label">Sesi Selesai</div></div>
      </div>

      <div className="card">
        <h2>Riwayat Sesi</h2>
        <table>
          <thead><tr><th>Scenario</th><th>Status</th><th>Skor</th></tr></thead>
          <tbody>
            {candidate.sessions.map((s) => (
              <tr key={s.id} className="clickable">
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
