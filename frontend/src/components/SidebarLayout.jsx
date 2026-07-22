import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function SidebarLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [team, setTeam] = useState([]);

  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'hr' || user.hasDirectReports)) {
      client.get('/feedback/my-team')
        .then((res) => setTeam(res.data.team || []))
        .catch(() => setTeam([]));
    }
  }, [user]);

  if (!user) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name = '') =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const roleLabel = user.role === 'hr' ? 'HR Lead' : user.role === 'manager' ? 'Manager' : 'Employee';

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      <header className="top-header">
        <div className="brand-section">
          <div className="brand-icon">⚡</div>
          <span className="company-name-title">{user.companyName || 'EvalFlow'}</span>
        </div>

        <div className="user-info-header">
          <div className="hide-mobile">
            Role: <strong>{roleLabel}</strong>
          </div>
          <div className="hide-mobile" style={{ color: 'var(--color-border-strong)' }}>|</div>
          <div>
            User: <strong>{user.name}</strong>
          </div>
          <div className="header-avatar" title={user.name}>
            {getInitials(user.name)}
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-nav-group">
            {/* MAIN NAVIGATION */}
            <div>
              <div className="sidebar-section-title">Main Navigation</div>
              <ul className="sidebar-nav-list">
                {(user.role === 'manager' || user.role === 'hr' || user.hasDirectReports) && (
                  <li>
                    <NavLink
                      to="/team"
                      className={({ isActive }) =>
                        `sidebar-link ${isActive && location.pathname === '/team' ? 'sidebar-link-active' : ''}`
                      }
                    >
                      <span style={{ fontSize: '1rem' }}>📋</span> Team Reviews
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink
                    to="/scores"
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                    }
                  >
                    <span style={{ fontSize: '1rem' }}>📊</span> My Scores & History
                  </NavLink>
                </li>
                {user.role === 'hr' && (
                  <li>
                    <NavLink
                      to="/hr"
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                      }
                    >
                      <span style={{ fontSize: '1rem' }}>🏢</span> HR Overview
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>

            {/* DIRECT REPORTS */}
            {team.length > 0 && (
              <div>
                <div className="sidebar-section-title">Direct Reports ({team.length})</div>
                <ul className="sidebar-nav-list">
                  {team.map((member) => (
                    <li key={member.id}>
                      <NavLink
                        to={`/feedback/${member.id}`}
                        className={({ isActive }) =>
                          `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                        }
                      >
                        <span
                          className={`badge ${
                            member.submissionStatus === 'submitted'
                              ? 'badge-success'
                              : member.submissionStatus === 'draft'
                              ? 'badge-warning'
                              : 'badge-muted'
                          }`}
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                        >
                          {member.submissionStatus === 'submitted' ? '✓' : member.submissionStatus === 'draft' ? '•' : '○'}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* SIDEBAR FOOTER */}
          <div className="sidebar-footer-links">
            <button className="sidebar-footer-btn" onClick={() => navigate('/login')}>
              ⇄ Switch User / Company
            </button>
            <button className="sidebar-footer-btn" onClick={handleLogout} id="signout-btn" style={{ color: 'var(--color-danger)' }}>
              ↳ Sign Out
            </button>
          </div>
        </aside>

        {/* Content View */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
