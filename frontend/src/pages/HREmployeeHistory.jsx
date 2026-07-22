import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import TrendChart from '../components/TrendChart';
import CommentAccordion from '../components/CommentAccordion';

const PARAMETERS = ['OWNERSHIP', 'COMMUNICATION', 'QUALITY_OF_WORK', 'COLLABORATION', 'INITIATIVE'];

const PARAM_LABELS = {
  OWNERSHIP:       'Ownership',
  COMMUNICATION:   'Communication',
  QUALITY_OF_WORK: 'Quality',
  COLLABORATION:   'Collaboration',
  INITIATIVE:      'Reliability',
};

const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function avgScore(history, param) {
  const values = history
    .map((h) => h.scores[param]?.score)
    .filter(Boolean);
  if (values.length === 0) return null;
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
}

export default function HREmployeeHistory() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeParam, setActiveParam] = useState(null);

  useEffect(() => {
    client.get(`/hr/feedback/${userId}`)
      .then((res) => {
        setEmployee(res.data.employee);
        setHistory(res.data.history);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load employee history.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleParamClick = (param) => {
    setActiveParam((prev) => (prev === param ? null : param));
  };

  return (
    <div>
      <div className="page-header">
        <button
          className="btn btn-ghost"
          style={{ marginBottom: 'var(--s-3)', paddingLeft: 0 }}
          onClick={() => navigate('/hr')}
        >
          ← Back to HR Dashboard
        </button>
        <h1 className="page-title">Employee Feedback History</h1>
        {employee ? (
          <p className="page-subtitle">
            <span>{employee.name}</span>
            <span className="dot">•</span>
            <span>{employee.email}</span>
            <span className="dot">•</span>
            <span style={{ textTransform: 'capitalize' }}>{employee.role}</span>
          </p>
        ) : (
          <p className="page-subtitle">Loading...</p>
        )}
      </div>

      {loading && (
        <div style={{ padding: 'var(--s-8) 0', textAlign: 'center' }}>
          <span className="spinner spinner-dark" />
          <p style={{ marginTop: 'var(--s-2)', color: 'var(--color-text-muted)' }}>Loading records...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">📂</div>
          <h3>No Records Found</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            This employee has not received any finalized feedback yet.
          </p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <>
          <div className="avg-row">
            {PARAMETERS.map((p) => {
              const avg = avgScore(history, p);
              const num = parseFloat(avg);
              const colorClass = num >= 4 ? 'success' : num >= 3 ? 'warning' : 'danger';
              return (
                <div
                  key={p}
                  className={`avg-card avg-card-${colorClass} ${activeParam === p ? 'active' : ''}`}
                  onClick={() => handleParamClick(p)}
                >
                  <div className="avg-val">{avg ?? '—'}</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)' }}>
                    {PARAM_LABELS[p]}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Avg Score / 5</div>
                </div>
              );
            })}
          </div>

          <div className="card" style={{ marginBottom: 'var(--s-6)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--s-4)' }}>
              Historical Trend
            </h2>
            <TrendChart
              history={history}
              activeParam={activeParam}
              onParamClick={handleParamClick}
            />
          </div>

          <div className="card" style={{ marginBottom: 'var(--s-6)', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                Monthly Ratings
              </h2>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Cycle</th>
                    {PARAMETERS.map((p) => <th key={p}>{PARAM_LABELS[p]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.cycleId}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {MONTH_SHORT[entry.month]} {entry.year}
                        </span>
                      </td>
                      {PARAMETERS.map((p) => {
                        const s = entry.scores[p]?.score;
                        return (
                          <td key={p}>
                            {s ? (
                              <span className={`score-chip score-${s}`}>{s}</span>
                            ) : (
                              <span style={{ color: 'var(--color-text-faint)' }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--s-4)' }}>
              Detailed Context & Feedback
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              {history.map((entry) => (
                <CommentAccordion
                  key={entry.cycleId}
                  month={entry.month}
                  year={entry.year}
                  reviewer={entry.reviewer}
                  scores={entry.scores}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
