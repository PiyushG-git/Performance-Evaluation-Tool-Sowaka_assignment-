import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ManagerPendingRow from '../components/ManagerPendingRow';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const ROLE_LABELS = { hr: 'HR', manager: 'Manager', employee: 'Employee' };

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function exportCSV(managers, cycle) {
  const cycleLabel = `${MONTH_NAMES[cycle.month]}_${cycle.year}`;
  const rows = [
    ['Manager', 'Role', 'Total Reports', 'Submitted', 'Pending', 'Status', 'Pending Employees'],
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

function PendingTab({ data }) {
  const { cycle, summary, managers } = data;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{summary.totalManagers}</div>
          <div className="stat-label">Total Managers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>
            {summary.fullySubmitted}
          </div>
          <div className="stat-label">Fully Submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
            {summary.withPending}
          </div>
          <div className="stat-label">Managers Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
            {managers.reduce((acc, m) => acc + m.pendingCount, 0)}
          </div>
          <div className="stat-label">Total Outstanding Reviews</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
            Manager Submission Tracker
          </h2>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(managers, cycle)}
            id="export-csv-btn"
          >
            ↓ Export CSV Report
          </button>
        </div>

        {managers.length === 0 ? (
          <div style={{ padding: 'var(--s-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No manager submission data available for this cycle.
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Reports</th>
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

function DirectoryTab({ employees, cycle }) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-4)', gap: 'var(--s-4)' }}>
        <input
          type="search"
          className="form-input"
          placeholder="Search by name or email address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="employee-search"
          style={{ maxWidth: '340px' }}
        />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Showing {filtered.length} of {employees.length} employees
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
                <th style={{ textAlign: 'center' }}>Direct Reports?</th>
                <th style={{ textAlign: 'center' }}>Feedback Status ({MONTH_NAMES[cycle?.month]})</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
                      <div className="header-avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{emp.name}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                      {ROLE_LABELS[emp.role] ?? emp.role}
                    </span>
                  </td>
                  <td>{emp.manager?.name ?? <span style={{ color: 'var(--color-text-faint)' }}>—</span>}</td>
                  <td style={{ textAlign: 'center' }}>
                    {emp.hasDirectReports
                      ? <span className="badge badge-info">Yes</span>
                      : <span style={{ color: 'var(--color-text-faint)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {emp.currentCycleFeedbackReceived
                      ? <span className="badge badge-success">✓ Received</span>
                      : <span className="badge badge-danger">Pending</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/hr/employee/${emp.id}`)}
                    >
                      View History
                    </button>
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
      .catch((err) => setError(err.response?.data?.error || 'Failed to load HR dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const cycle = pendingData?.cycle;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">HR Administration Overview</h1>
        <p className="page-subtitle">
          <span>{user.companyName}</span>
          <span className="dot">•</span>
          <span>Cycle: {cycle ? `${MONTH_NAMES[cycle.month]} ${cycle.year}` : 'Loading...'}</span>
          <span className="dot">•</span>
          <span>Status: {cycle?.status.toUpperCase()}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('pending')}
          id="tab-pending"
        >
          📋 Pending Submissions Tracker
        </button>
        <button
          className={`tab-btn ${activeTab === 'directory' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('directory')}
          id="tab-directory"
        >
          👥 Employee Directory ({employees.length})
        </button>
      </div>

      {loading && (
        <div style={{ padding: 'var(--s-8) 0', textAlign: 'center' }}>
          <span className="spinner spinner-dark" />
          <p style={{ marginTop: 'var(--s-2)', color: 'var(--color-text-muted)' }}>Loading administrative metrics...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'pending' && pendingData && <PendingTab data={pendingData} />}
          {activeTab === 'directory' && <DirectoryTab employees={employees} cycle={cycle} />}
        </>
      )}
    </div>
  );
}
