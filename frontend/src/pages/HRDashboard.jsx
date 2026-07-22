import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ManagerPendingRow from '../components/ManagerPendingRow';
import './HRDashboard.css';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const ROLE_LABELS = { hr: 'HR', manager: 'Manager', employee: 'Employee' };

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── Client-side CSV export ───────────────────────────────────────────────────
function exportCSV(managers, cycle) {
  const cycleLabel = `${MONTH_NAMES[cycle.month]}_${cycle.year}`;
  const rows = [
    ['Manager', 'Role', 'Total Reports', 'Submitted', 'Pending', 'Status',
     'Pending Employees'],
    ...managers.map((m) => [
      m.managerName,
      m.managerRole,
      m.totalReports,
      m.submittedCount,
      m.pendingCount,
      m.isFullySubmitted ? 'Done' : 'Pending',
      m.pending.map((e) => e.name).join('; '),
    ]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pending_feedback_${cycleLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Tab: Pending Tracker ─────────────────────────────────────────────────────
function PendingTab({ data }) {
  const { cycle, summary, managers } = data;

  return (
    <div className="hr-section">
      {/* Summary stat cards */}
      <div className="hr-stats">
        <div className="stat-card">
          <span className="stat-value">{summary.totalManagers}</span>
          <span className="stat-label">Total Managers</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-success)' }}>
            {summary.fullySubmitted}
          </span>
          <span className="stat-label">Fully Submitted</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-danger)' }}>
            {summary.withPending}
          </span>
          <span className="stat-label">With Pending</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-warning)' }}>
            {managers.reduce((acc, m) => acc + m.pendingCount, 0)}
          </span>
          <span className="stat-label">Reviews Pending</span>
        </div>
      </div>

      {/* Export + table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="hr-table-header">
          <h2 className="section-title">Manager Submission Status</h2>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(managers, cycle)}
            id="export-csv-btn"
          >
            ↓ Export CSV
          </button>
        </div>

        {managers.length === 0 ? (
          <div className="hr-empty">
            <p className="text-muted">No managers with direct reports found.</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Total Reports</th>
                  <th style={{ textAlign: 'center' }}>Submitted</th>
                  <th style={{ textAlign: 'center' }}>Pending</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m) => (
                  <ManagerPendingRow key={m.managerId} manager={m} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Employee Directory ──────────────────────────────────────────────────
function DirectoryTab({ employees, cycle }) {
  const [search, setSearch] = useState('');

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hr-section">
      <div className="dir-search-bar">
        <input
          type="search"
          className="form-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="employee-search"
          style={{ maxWidth: '360px' }}
        />
        <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
          {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Manager</th>
                <th style={{ textAlign: 'center' }}>Manages Team?</th>
                <th style={{ textAlign: 'center' }}>
                  Feedback Received ({MONTH_NAMES[cycle?.month]})
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="avatar">{getInitials(emp.name)}</div>
                      <div>
                        <p style={{ fontWeight: 600 }}>{emp.name}</p>
                        <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {ROLE_LABELS[emp.role] ?? emp.role}
                    </span>
                  </td>
                  <td>{emp.manager?.name ?? <span className="text-muted">—</span>}</td>
                  <td style={{ textAlign: 'center' }}>
                    {emp.hasDirectReports
                      ? <span className="badge badge-info">Yes</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {emp.currentCycleFeedbackReceived
                      ? <span className="badge badge-success">✓ Received</span>
                      : <span className="badge badge-danger">Pending</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main HR Dashboard ────────────────────────────────────────────────────────
export default function HRDashboard() {
  const { user } = useAuth();
  const [pendingData, setPendingData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    Promise.all([
      client.get('/hr/pending'),
      client.get('/hr/employees'),
    ])
      .then(([pendingRes, empRes]) => {
        setPendingData(pendingRes.data);
        setEmployees(empRes.data.employees);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load HR data'))
      .finally(() => setLoading(false));
  }, []);

  const cycle = pendingData?.cycle;

  return (
    <div className="page-wrapper">
      <div className="container hr-container">

        {/* Header */}
        <div className="hr-header">
          <div>
            <h1 className="page-title">HR Dashboard</h1>
            <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>
              {cycle
                ? `${MONTH_NAMES[cycle.month]} ${cycle.year} · Cycle is ${cycle.status}`
                : 'Loading cycle…'}
            </p>
          </div>
          <div className="hr-user-info">
            <div className="avatar">
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{user.name}</p>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{user.companyName}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="hr-tabs">
          <button
            className={`hr-tab ${activeTab === 'pending' ? 'hr-tab-active' : ''}`}
            onClick={() => setActiveTab('pending')}
            id="tab-pending"
          >
            📋 Pending Tracker
          </button>
          <button
            className={`hr-tab ${activeTab === 'directory' ? 'hr-tab-active' : ''}`}
            onClick={() => setActiveTab('directory')}
            id="tab-directory"
          >
            👥 Employee Directory
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="hr-stats">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
            <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
          </div>
        )}

        {error && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-danger)' }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'pending' && pendingData && (
              <PendingTab data={pendingData} />
            )}
            {activeTab === 'directory' && (
              <DirectoryTab employees={employees} cycle={cycle} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
