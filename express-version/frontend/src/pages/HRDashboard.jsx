import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { downloadCsv } from '../utils/csv';

export default function HRDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [minScore, setMinScore] = useState('');
  const [selected, setSelected] = useState([]);

  function load() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (minScore) params.set('minScore', minScore);
    const qs = params.toString() ? `?${params}` : '';
    api.hrDashboard(token, qs).then(setData);
  }

  useEffect(load, [token, status, minScore]);

  if (!data) return <div className="container">Memuat...</div>;

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function exportCsv() {
    downloadCsv(
      'laporan-kandidat.csv',
      ['Nama', 'Email', 'Sesi', 'Skor Rata-rata', 'Skor Terakhir', 'Status'],
      data.candidates.map((c) => [c.name, c.email, c.totalSessions, c.averageScore ?? '', c.latestScore ?? '', c.status])
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard HR</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={exportCsv}>Export CSV</button>
          <button className="btn primary" onClick={() => navigate('/hr/candidates/new')}>+ Tambah Kandidat</button>
        </div>
      </div>

      <div className="grid cols-3">
        <div className="card score-tile"><div className="value">{data.totalCandidates}</div><div className="label">Total Kandidat</div></div>
        <div className="card score-tile"><div className="value">{data.assessedCandidates}</div><div className="label">Sudah Assessment</div></div>
        <div className="card score-tile"><div className="value">{data.candidates.length - data.assessedCandidates}</div><div className="label">Belum Assessment</div></div>
      </div>

      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="sudah_assessment">Sudah assessment</option>
          <option value="belum_assessment">Belum assessment</option>
        </select>
        <input placeholder="Skor minimal" type="number" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
        {selected.length >= 2 && (
          <button className="btn primary" onClick={() => navigate(`/hr/compare?ids=${selected.join(',')}`)}>
            Bandingkan ({selected.length})
          </button>
        )}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Kandidat</th>
              <th>Sesi</th>
              <th>Skor Rata-rata</th>
              <th>Skor Terakhir</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.candidates.map((c) => (
              <tr key={c.id}>
                <td><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                <td className="clickable" onClick={() => navigate(`/hr/candidates/${c.id}`)}>
                  <Link to={`/hr/candidates/${c.id}`}>{c.name}</Link>
                  <div className="muted">{c.email}</div>
                </td>
                <td>{c.totalSessions}</td>
                <td>{c.averageScore ?? '—'}</td>
                <td>{c.latestScore ?? '—'}</td>
                <td><span className={`badge ${c.status === 'sudah_assessment' ? 'completed' : 'in_progress'}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
