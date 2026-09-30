import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS_BY_ROLE = {
  candidate: [['/scenarios', 'Mulai Screening'], ['/history', 'Riwayat']],
  sales: [['/scenarios', 'Latihan'], ['/history', 'Riwayat']],
  hr: [['/hr', 'Dashboard HR']],
  manager: [['/manager', 'Dashboard Manager'], ['/audit-logs', 'Audit Trail']],
  admin: [['/hr', 'Dashboard HR'], ['/manager', 'Dashboard Manager'], ['/audit-logs', 'Audit Trail']],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const links = LINKS_BY_ROLE[user.role] || [];

  return (
    <div className="navbar">
      <div className="brand">AI Sales Role Play</div>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
          </NavLink>
        ))}
        <span className="muted">{user.name} · <span className={`badge ${user.role}`}>{user.role}</span></span>
        <button className="btn" onClick={logout}>Logout</button>
      </nav>
    </div>
  );
}
