import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import ScoreGrid from '../components/ScoreGrid';

export default function SessionDetail() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.sessionDetail(token, sessionId).then(setSession).catch((err) => setError(err.message));
  }, [token, sessionId]);

  if (error) return <div className="container"><div className="error-box">{error}</div></div>;
  if (!session) return <div className="container">Memuat...</div>;

  const messages = (session.Messages || []).slice().sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="container">
      <h1>{session.Scenario?.name}</h1>
      <p className="muted">
        {session.User?.name} · {new Date(session.startedAt).toLocaleString('id-ID')} ·{' '}
        <span className={`badge ${session.status}`}>{session.status}</span>
      </p>

      {session.Assessment ? (
        <>
          <ScoreGrid assessment={session.Assessment} />
          <div className="card">
            <h2>Feedback</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{session.Assessment.feedback}</p>
          </div>
          <div className="card">
            <h2>Ringkasan</h2>
            <p>{session.Assessment.summary}</p>
          </div>
        </>
      ) : (
        <div className="card"><p className="muted">Session belum dinilai.</p></div>
      )}

      <div className="card">
        <h2>Transcript</h2>
        <div className="chat-window" style={{ maxHeight: 'none' }}>
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.senderType}`}>{m.message}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
