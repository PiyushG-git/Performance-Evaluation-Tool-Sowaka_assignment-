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
            <div className="avatar">{getInitials(managerName)}</div>
            <div>
              <p style={{ fontWeight: 600 }}>{managerName}</p>
              <p className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{managerEmail}</p>
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
            ? <span className="badge badge-success">✓ Done</span>
            : <span className="badge badge-warning">In Progress</span>}
        </td>
        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          {expanded ? '▲' : '▼'}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="detail-row">
          <td colSpan={7} style={{ padding: 0 }}>
            <div className="detail-body">
              {/* Submitted list */}
              {submitted.length > 0 && (
                <div className="detail-group">
                  <p className="detail-group-label">
                    <span className="badge badge-success">✓ Submitted</span>
                  </p>
                  <div className="detail-chips">
                    {submitted.map((e) => (
                      <span key={e.id} className="employee-chip employee-chip-done">
                        {getInitials(e.name)}
                        <span>{e.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending list */}
              {pending.length > 0 && (
                <div className="detail-group">
                  <p className="detail-group-label">
                    <span className="badge badge-danger">⏳ Pending</span>
                  </p>
                  <div className="detail-chips">
                    {pending.map((e) => (
                      <span key={e.id} className="employee-chip employee-chip-pending">
                        {getInitials(e.name)}
                        <span>{e.name}</span>
                      </span>
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
