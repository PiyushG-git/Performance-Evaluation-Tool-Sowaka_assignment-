import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
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

export default function MyScoresPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeParam, setActiveParam] = useState(null);

  useEffect(() => {
    client.get('/feedback/my-scores')
      .then((res) => setHistory(res.data.history))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load score history.'))
      .finally(() => setLoading(false));
  }, []);

  const handleParamClick = (param) => {
    setActiveParam((prev) => (prev === param ? null : param));
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">My Scores & Feedback History</h1>
        <p className="page-subtitle">
          <span>{user.name}</span>
          <span className="dot">•</span>
          <span>{user.companyName}</span>
          <span className="dot">•</span>
          <span>{history.length} Cycles Completed</span>
        </p>
      </div>

      {loading && (
        <div style={{ padding: 'var(--s-8) 0', textAlign: 'center' }}>
          <span className="spinner spinner-dark" />
          <p style={{ marginTop: 'var(--s-2)', color: 'var(--color-text-muted)' }}>Loading your performance history...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">📊</div>
          <h3>No Feedback Records Yet</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Your monthly feedback scores and comments will appear here once submitted by your manager.
          </p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <>
          {/* Average Cards */}
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
                  id={`avg-${p}`}
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

          {/* Score Trend Chart */}
          <div className="card" style={{ marginBottom: 'var(--s-6)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--s-4)' }}>
              Monthly Score Trends
            </h2>
            <TrendChart
              history={history}
              activeParam={activeParam}
              onParamClick={handleParamClick}
            />
          </div>

          {/* Breakdown Table */}
          <div className="card" style={{ marginBottom: 'var(--s-6)', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                Monthly Ratings Breakdown
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

          {/* Detailed Comments Accordion */}
          <div>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--s-4)' }}>
              Detailed Manager Feedback
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
