import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import ScenarioSelect from './pages/ScenarioSelect';
import Roleplay from './pages/Roleplay';
import History from './pages/History';
import SessionDetail from './pages/SessionDetail';
import HRDashboard from './pages/HRDashboard';
import AddCandidate from './pages/AddCandidate';
import CandidateDetail from './pages/CandidateDetail';
import Comparison from './pages/Comparison';
import ManagerDashboard from './pages/ManagerDashboard';
import SalesDetail from './pages/SalesDetail';
import AuditLogPage from './pages/AuditLogPage';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'candidate' || user.role === 'sales') return <Navigate to="/scenarios" replace />;
  if (user.role === 'hr') return <Navigate to="/hr" replace />;
  return <Navigate to="/manager" replace />;
}

export default function App() {
  return (
    <div className="layout">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />

        <Route path="/scenarios" element={
          <ProtectedRoute roles={['candidate', 'sales']}><ScenarioSelect /></ProtectedRoute>
        } />
        <Route path="/roleplay/:sessionId" element={
          <ProtectedRoute roles={['candidate', 'sales']}><Roleplay /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute roles={['candidate', 'sales']}><History /></ProtectedRoute>
        } />
        <Route path="/sessions/:sessionId" element={
          <ProtectedRoute><SessionDetail /></ProtectedRoute>
        } />

        <Route path="/hr" element={
          <ProtectedRoute roles={['hr', 'admin']}><HRDashboard /></ProtectedRoute>
        } />
        <Route path="/hr/candidates/new" element={
          <ProtectedRoute roles={['hr', 'admin']}><AddCandidate /></ProtectedRoute>
        } />
        <Route path="/hr/candidates/:userId" element={
          <ProtectedRoute roles={['hr', 'admin']}><CandidateDetail /></ProtectedRoute>
        } />
        <Route path="/hr/compare" element={
          <ProtectedRoute roles={['hr', 'admin']}><Comparison /></ProtectedRoute>
        } />

        <Route path="/manager" element={
          <ProtectedRoute roles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>
        } />
        <Route path="/manager/users/:userId" element={
          <ProtectedRoute roles={['manager', 'admin']}><SalesDetail /></ProtectedRoute>
        } />
        <Route path="/audit-logs" element={
          <ProtectedRoute roles={['manager', 'admin', 'hr']}><AuditLogPage /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
