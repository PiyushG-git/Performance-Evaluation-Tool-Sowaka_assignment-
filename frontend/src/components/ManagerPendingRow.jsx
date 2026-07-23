import { useState } from 'react';
import './ManagerPendingRow.css';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ManagerPendingRow({ manager }) {
  const [expanded, setExpanded] = useState(false);
  const { managerName, managerEmail, managerRole, totalReports,
          submittedCount, pendingCount, isFullySubmitted, submitted, pending } = manager;

  return (
    <>
      <tr
        className={`manager-row ${!isFullySubmitted ? 'tr-warning' : ''} ${expanded ? 'manager-row-expanded' : ''}`}
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: 'pointer' }}
        id={`manager-row-${manager.managerId}`}
      >
        <td>
          <div className="manager-cell">
            <div className="header-avatar" style={{ width: '32px', height: '32px', fontSize: '11px', flexShrink: 0 }}>
              {getInitials(managerName)}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>{managerName}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{managerEmail}</p>
            </div>
          </div>
        </td>
        <td>
          <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>
            {managerRole}
          </span>
        </td>
        <td style={{ textAlign: 'center', fontWeight: 600 }}>{totalReports}</td>
        <td style={{ textAlign: 'center' }}>
          <span className="badge badge-success">{submittedCount}</span>
        </td>
        <td style={{ textAlign: 'center' }}>
          {pendingCount > 0
            ? <span className="badge badge-danger">{pendingCount}</span>
            : <span className="badge badge-success">0</span>}
        </td>
        <td style={{ textAlign: 'center' }}>
          {isFullySubmitted
            ? <span className="badge badge-success">✓ Completed</span>
            : <span className="badge badge-warning">In Progress</span>}
        </td>
        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          {expanded ? '▲' : '▼'}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="detail-row">
          <td colSpan={7}>
            <div className="detail-body">
              {/* Submitted list */}
              {submitted.length > 0 && (
                <div className="detail-group">
                  <div className="detail-group-header">
                    <span className="badge badge-success">✓ Submitted ({submitted.length})</span>
                  </div>
                  <div className="detail-chips">
                    {submitted.map((e) => (
                      <div key={e.id} className="emp-detail-card emp-detail-card-done">
                        <div className="emp-avatar emp-avatar-done">
                          {getInitials(e.name)}
                        </div>
                        <span className="emp-name">{e.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending list */}
              {pending.length > 0 && (
                <div className="detail-group">
                  <div className="detail-group-header">
                    <span className="badge badge-danger">⏳ Pending ({pending.length})</span>
                  </div>
                  <div className="detail-chips">
                    {pending.map((e) => (
                      <div key={e.id} className="emp-detail-card emp-detail-card-pending">
                        <div className="emp-avatar emp-avatar-pending">
                          {getInitials(e.name)}
                        </div>
                        <span className="emp-name">{e.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
