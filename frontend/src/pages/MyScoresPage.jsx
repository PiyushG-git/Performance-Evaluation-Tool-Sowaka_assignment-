import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import TrendChart from '../components/TrendChart';
import CommentAccordion from '../components/CommentAccordion';
import './MyScoresPage.css';

const PARAMETERS = ['OWNERSHIP', 'COMMUNICATION', 'QUALITY_OF_WORK', 'COLLABORATION', 'INITIATIVE'];

const PARAM_LABELS = {
  OWNERSHIP:       'Ownership',
  COMMUNICATION:   'Communication',
  QUALITY_OF_WORK: 'Quality',
  COLLABORATION:   'Collaboration',
  INITIATIVE:      'Initiative',
};

const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Compute average score across all months for a parameter
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
      .catch((err) => setError(err.response?.data?.error || 'Failed to load scores'))
      .finally(() => setLoading(false));
  }, []);

  const handleParamClick = (param) => {
    setActiveParam((prev) => (prev === param ? null : param));
  };

  return (
    <div className="page-wrapper">
      <div className="container scores-container">

        {/* Header */}
        <div className="scores-header">
          <div>
            <h1 className="page-title">My Scores</h1>
            <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>
              Your feedback history across all cycles
            </p>
          </div>
          <div className="scores-who">
            <div className="avatar">{user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{user.name}</p>
              <p className="text-muted">{user.companyName}</p>
            </div>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="skeleton" style={{ height: '240px', borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />
          </div>
        )}

        {error && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-danger)' }}>⚠ {error}</div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="card empty-state">
            <div className="empty-icon">📊</div>
            <h3>No feedback yet</h3>
            <p className="text-muted">
              Your scores will appear here once your manager submits feedback for a cycle.
            </p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <>
            {/* Average scores strip */}
            <div className="scores-averages">
              {PARAMETERS.map((p) => {
                const avg = avgScore(history, p);
                const num = parseFloat(avg);
                const colorClass = num >= 4 ? 'success' : num >= 3 ? 'warning' : 'danger';
                return (
                  <div
                    key={p}
                    className={`avg-card avg-card-${colorClass} ${activeParam === p ? 'avg-card-active' : ''}`}
                    onClick={() => handleParamClick(p)}
                    id={`avg-${p}`}
                  >
                    <span className="avg-value">{avg ?? '—'}</span>
                    <span className="avg-label">{PARAM_LABELS[p]}</span>
                    <span className="avg-sublabel text-muted">avg / 5</span>
                  </div>
                );
              })}
            </div>

            {/* Trend chart */}
            <div className="card scores-section">
              <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
                Score Trends
                <span className="text-muted" style={{ fontSize: 'var(--text-sm)', fontWeight: 400, marginLeft: 'var(--space-2)' }}>
                  (click a parameter to highlight)
                </span>
              </h2>
              <TrendChart
                history={history}
                activeParam={activeParam}
                onParamClick={handleParamClick}
              />
            </div>

            {/* Score history table */}
            <div className="card scores-section">
              <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Monthly Breakdown</h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      {PARAMETERS.map((p) => <th key={p}>{PARAM_LABELS[p]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry) => (
                      <tr key={entry.cycleId}>
                        <td>
                          <span style={{ fontWeight: 600 }}>
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
                                <span className="text-muted">—</span>
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

            {/* Comment history — accordion per month */}
            <div className="scores-section">
              <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
                Detailed Comments
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
    </div>
  );
}
