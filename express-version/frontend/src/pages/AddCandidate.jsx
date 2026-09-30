import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function AddCandidate() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await api.register(token, { ...form, role: 'candidate' });
      setSuccess(`Akun kandidat ${form.email} berhasil dibuat. Kandidat bisa langsung login pakai email & password ini.`);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container narrow">
      <h1>Tambah Kandidat</h1>
      <p className="muted">
        Buat akun kandidat asli untuk proses screening. Kandidat login memakai email & password ini,
        mengerjakan role-play sendiri, lalu hasilnya otomatis muncul di dashboard HR — bukan data dummy.
      </p>

      {error && <div className="error-box">{error}</div>}
      {success && (
        <div className="card" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>{success}</div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password Awal</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Minimal 8 karakter"
              required
            />
          </div>
          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Menyimpan...' : 'Buat Akun Kandidat'}
          </button>
          <button className="btn" type="button" style={{ marginLeft: 8 }} onClick={() => navigate('/hr')}>
            Kembali ke Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
