import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Comparison() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
    if (ids.length >= 2) api.compareCandidates(token, ids).then((d) => setRows(d.rows));
  }, [token, searchParams]);

  return (
    <div className="container">
      <h1>Perbandingan Kandidat</h1>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Kandidat</th><th>Communication</th><th>Pitch</th><th>Objection</th><th>Confidence</th><th>Closing</th><th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.communication ?? '—'}</td>
                <td>{r.pitch ?? '—'}</td>
                <td>{r.objection ?? '—'}</td>
                <td>{r.confidence ?? '—'}</td>
                <td>{r.closing ?? '—'}</td>
                <td><strong>{r.overall ?? '—'}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
