import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/feedback/my-team')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load team data.'))
      .finally(() => setLoading(false));
  }, []);

  const submittedCount = data?.team.filter((m) => m.submissionStatus === 'submitted').length ?? 0;
  const draftCount     = data?.team.filter((m) => m.submissionStatus === 'draft').length ?? 0;
  const pendingCount   = data?.team.filter((m) => m.submissionStatus === 'pending').length ?? 0;
  const totalCount     = data?.team.length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Team Performance Reviews</h1>
        <p className="page-subtitle">
          <span>Active Cycle: {data?.cycle ? `${MONTH_NAMES[data.cycle.month]} ${data.cycle.year}` : 'Loading...'}</span>
          <span className="dot">•</span>
          <span>Status: {data?.cycle ? data.cycle.status.toUpperCase() : '—'}</span>
        </p>
      </div>

      {/* Summary Stat Cards */}
      {data && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total Direct Reports</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {submittedCount}
            </div>
            <div className="stat-label">Submitted Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
              {draftCount}
            </div>
            <div className="stat-label">Drafts Saved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
              {pendingCount}
            </div>
            <div className="stat-label">Pending Reviews</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ padding: 'var(--s-8) 0', textAlign: 'center' }}>
          <span className="spinner spinner-dark" />
          <p style={{ marginTop: 'var(--s-2)', color: 'var(--color-text-muted)' }}>Loading your team members...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Team Table */}
      {data && data.team.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.team.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{member.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{member.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={member.submissionStatus} />
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {member.submittedAt
                      ? new Date(member.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Not submitted yet'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={`btn btn-sm ${member.submissionStatus === 'submitted' ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => navigate(`/feedback/${member.id}`)}
                    >
                      {member.submissionStatus === 'submitted'
                        ? 'View Review'
                        : member.submissionStatus === 'draft'
                        ? 'Continue Draft'
                        : 'Start Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.team.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">👥</div>
          <h3>No Direct Reports Assigned</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            There are currently no team members assigned under your supervision.
          </p>
        </div>
      )}
    </div>
  );
}
