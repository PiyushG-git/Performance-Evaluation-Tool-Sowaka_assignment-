import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // A user who has direct reports can give feedback (manager or hr with reports)
  const canGiveFeedback = user.hasDirectReports || user.role === 'manager';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Initials from name
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Brand */}
        <NavLink to="/dashboard" className="navbar-brand">
          <span className="navbar-logo">⚡</span>
          <span className="navbar-brand-name">EvalFlow</span>
        </NavLink>

        {/* Nav links */}
        <div className="navbar-links">
          {canGiveFeedback && (
            <NavLink
              to="/team"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              My Team
            </NavLink>
          )}

          <NavLink
            to="/scores"
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            My Scores
          </NavLink>

          {user.role === 'hr' && (
            <NavLink
              to="/hr"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              HR Dashboard
            </NavLink>
          )}
        </div>

        {/* User info + logout */}
        <div className="navbar-user">
          <span className="navbar-company hide-mobile">{user.companyName}</span>
          <div className="avatar" title={user.name}>{initials}</div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} id="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
