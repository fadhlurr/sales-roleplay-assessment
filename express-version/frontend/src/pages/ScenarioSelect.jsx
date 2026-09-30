import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const TYPE_LABEL = {
  cold_call: 'Cold Call',
  product_pitch: 'Product Pitch',
  objection_handling: 'Objection Handling',
  closing: 'Closing Conversation',
};

export default function ScenarioSelect() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.scenarios(token).then(setScenarios).catch((err) => setError(err.message));
  }, [token]);

  async function startSession() {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const sessionType = user.role === 'candidate' ? 'screening' : 'training';
      const { session } = await api.createSession(token, selected.id, sessionType);
      navigate(`/roleplay/${session.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <h1>Pilih Scenario</h1>
      <p className="muted">
        {user.role === 'candidate'
          ? 'Skenario ini akan dipakai untuk proses screening kandidat sales.'
          : 'Pilih skenario latihan untuk berlatih mandiri.'}
      </p>
      {error && <div className="error-box">{error}</div>}

      <div className="grid cols-2">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className="card"
            style={{ cursor: 'pointer', borderColor: selected?.id === s.id ? 'var(--primary)' : undefined }}
            onClick={() => setSelected(s)}
          >
            <span className="badge candidate">{TYPE_LABEL[s.type]}</span>
            <h2 style={{ marginTop: 8 }}>{s.name}</h2>
            <p className="muted">{s.description}</p>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card">
          <h2>Instruksi Skenario</h2>
          <p>{selected.instruction}</p>
          <button className="btn primary" onClick={startSession} disabled={busy}>
            {busy ? 'Memulai...' : 'Mulai Simulasi'}
          </button>
        </div>
      )}
    </div>
  );
}
