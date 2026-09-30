import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Roleplay() {
  const { sessionId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    api.sessionDetail(token, sessionId).then((session) => {
      setScenario(session.Scenario);
      setMessages((session.Messages || []).slice().sort((a, b) => a.sequence - b.sequence));
    });
  }, [token, sessionId]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setError('');
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      const { userMessage, aiMessage } = await api.sendMessage(token, sessionId, text);
      setMessages((prev) => [...prev, userMessage, aiMessage]);
    } catch (err) {
      setError(err.message);
      if (err.data?.userMessage) setMessages((prev) => [...prev, err.data.userMessage]);
    } finally {
      setSending(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    setError('');
    try {
      await api.completeSession(token, sessionId);
      navigate(`/sessions/${sessionId}`);
    } catch (err) {
      setError(err.message);
      setCompleting(false);
    }
  }

  if (!scenario) return <div className="container">Memuat...</div>;

  return (
    <div className="container">
      <h1>{scenario.name}</h1>
      <p className="muted">{scenario.instruction}</p>
      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="chat-window" ref={chatRef}>
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.senderType}`}>{m.message}</div>
          ))}
        </div>
      </div>

      <form className="card" onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
        <input
          style={{ flex: 1 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ketik responsmu sebagai sales..."
          disabled={sending}
        />
        <button className="btn primary" type="submit" disabled={sending}>
          {sending ? 'Mengirim...' : 'Kirim'}
        </button>
      </form>

      <button className="btn" onClick={handleComplete} disabled={completing || messages.length < 2}>
        {completing ? 'Menilai percakapan...' : 'Selesaikan & Lihat Penilaian'}
      </button>
    </div>
  );
}
