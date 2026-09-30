import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function AuditLogPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.auditLogs(token).then(setLogs);
  }, [token]);

  return (
    <div className="container">
      <h1>Audit Trail</h1>
      <div className="card">
        <table>
          <thead><tr><th>Waktu</th><th>User</th><th>Action</th><th>Deskripsi</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString('id-ID')}</td>
                <td>{l.User ? `${l.User.name} (${l.User.role})` : '—'}</td>
                <td><code>{l.action}</code></td>
                <td className="muted">{l.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
