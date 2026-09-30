const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4200/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request gagal (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),
  register: (token, payload) => request('/auth/register', { method: 'POST', body: payload, token }),

  scenarios: (token) => request('/scenarios', { token }),

  createSession: (token, scenarioId, sessionType) =>
    request('/sessions', { method: 'POST', body: { scenarioId, sessionType }, token }),
  sendMessage: (token, sessionId, message) =>
    request(`/sessions/${sessionId}/messages`, { method: 'POST', body: { message }, token }),
  completeSession: (token, sessionId) =>
    request(`/sessions/${sessionId}/complete`, { method: 'POST', token }),
  sessionDetail: (token, sessionId) => request(`/sessions/${sessionId}`, { token }),
  myHistory: (token) => request('/sessions', { token }),

  hrDashboard: (token, query = '') => request(`/dashboard/hr${query}`, { token }),
  candidateDetail: (token, userId) => request(`/dashboard/hr/candidates/${userId}`, { token }),
  compareCandidates: (token, ids) => request(`/dashboard/hr/compare?ids=${ids.join(',')}`, { token }),
  managerDashboard: (token) => request('/dashboard/manager', { token }),
  salesDetail: (token, userId) => request(`/dashboard/manager/users/${userId}`, { token }),
  auditLogs: (token) => request('/dashboard/audit-logs', { token }),
};
