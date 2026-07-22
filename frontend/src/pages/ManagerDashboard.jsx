import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import TeamMemberCard from '../components/TeamMemberCard';
import './ManagerDashboard.css';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);   // { cycle, team }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/feedback/my-team')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  const submitted = data?.team.filter((m) => m.submissionStatus === 'submitted').length ?? 0;
  const draft     = data?.team.filter((m) => m.submissionStatus === 'draft').length ?? 0;
  const pending   = data?.team.filter((m) => m.submissionStatus === 'pending').length ?? 0;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 'var(--space-10)' }}>

        {/* Page header */}
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">My Team</h1>
            <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>
              {data?.cycle
                ? `${MONTH_NAMES[data.cycle.month]} ${data.cycle.year} · Cycle ${data.cycle.status}`
                : 'Loading cycle…'}
            </p>
          </div>
          <div className="dashboard-welcome">
            <span>👋 Hello, {user.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* Stat cards */}
        {data && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>{submitted}</span>
              <span className="stat-label">Submitted</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: 'var(--color-warning)' }}>{draft}</span>
              <span className="stat-label">Draft Saved</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{pending}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.team.length}</span>
              <span className="stat-label">Total Reports</span>
            </div>
          </div>
        )}

        {/* Team grid */}
        {loading && (
          <div className="team-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {error && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-danger)' }}>
            ⚠ {error}
          </div>
        )}

        {data && data.team.length === 0 && (
          <div className="empty-state card">
            <div className="empty-icon">👥</div>
            <h3>No direct reports</h3>
            <p className="text-muted">You don't have any team members assigned to you yet.</p>
          </div>
        )}

        {data && data.team.length > 0 && (
          <div className="team-grid">
            {data.team.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
