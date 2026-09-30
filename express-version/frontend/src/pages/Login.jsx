import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSlowHint } from '../hooks/useSlowHint';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const showSlowHint = useSlowHint(busy);

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
            {busy && <span className="spinner" />}
            {busy ? 'Memproses...' : 'Login'}
          </button>
          {showSlowHint && (
            <p className="slow-hint">
              Server sedang bangun dari mode idle — bisa makan waktu 10–15 detik pada percobaan pertama. Mohon tunggu, jangan klik ulang.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
