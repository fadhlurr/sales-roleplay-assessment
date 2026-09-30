import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  ['candidate@roleplay.test', 'Candidate'],
  ['sales@roleplay.test', 'Sales/Trainee'],
  ['hr@roleplay.test', 'HR/Recruiter'],
  ['manager@roleplay.test', 'Manager/Trainer'],
  ['admin@roleplay.test', 'Admin'],
];

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container narrow">
      <h1>AI Sales Role Play & Assessment</h1>
      <p className="muted">Masuk untuk memulai simulasi atau melihat dashboard.</p>

      <div className="card">
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Akun demo (password: password123)</h2>
        {DEMO_ACCOUNTS.map(([demoEmail, label]) => (
          <div key={demoEmail} style={{ marginBottom: 6 }}>
            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'space-between' }}
              onClick={() => { setEmail(demoEmail); setPassword('password123'); }}
              type="button"
            >
              <span>{label}</span>
              <span className="muted">{demoEmail}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
