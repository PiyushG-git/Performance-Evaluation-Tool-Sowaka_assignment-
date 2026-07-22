import './TrendChart.css';

const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PARAM_COLORS = {
  OWNERSHIP:       '#6366f1',
  COMMUNICATION:   '#06b6d4',
  QUALITY_OF_WORK: '#10b981',
  COLLABORATION:   '#f59e0b',
  INITIATIVE:      '#ec4899',
};

const PARAM_LABELS = {
  OWNERSHIP:       'Ownership',
  COMMUNICATION:   'Communication',
  QUALITY_OF_WORK: 'Quality of Work',
  COLLABORATION:   'Collaboration',
  INITIATIVE:      'Initiative',
};

const PARAMETERS = ['OWNERSHIP', 'COMMUNICATION', 'QUALITY_OF_WORK', 'COLLABORATION', 'INITIATIVE'];

// Map score 1–5 to SVG Y position (score 5 = top, score 1 = bottom)
function scoreToY(score, height, padTop, padBottom) {
  const usable = height - padTop - padBottom;
  return padTop + usable - ((score - 1) / 4) * usable;
}

export default function TrendChart({ history, activeParam, onParamClick }) {
  if (!history || history.length === 0) {
    return (
      <div className="trend-empty">
        <p className="text-muted">No score history yet</p>
      </div>
    );
  }

  // Sort oldest → newest left to right
  const sorted = [...history].reverse();

  const W = 600;
  const H = 220;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 36;
  const PAD_LEFT = 36;
  const PAD_RIGHT = 16;
  const plotW = W - PAD_LEFT - PAD_RIGHT;
  const step = sorted.length > 1 ? plotW / (sorted.length - 1) : plotW;

  const xOf = (i) => PAD_LEFT + (sorted.length > 1 ? i * step : plotW / 2);

  return (
    <div className="trend-chart-wrapper">
      {/* Legend */}
      <div className="trend-legend">
        {PARAMETERS.map((p) => (
          <button
            key={p}
            className={`legend-pill ${activeParam === p ? 'legend-pill-active' : ''}`}
            style={{ '--pill-color': PARAM_COLORS[p] }}
            onClick={() => onParamClick(p)}
            id={`legend-${p}`}
          >
            <span className="legend-dot" style={{ background: PARAM_COLORS[p] }} />
            {PARAM_LABELS[p]}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="trend-svg-container">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="trend-svg"
          aria-label="Score trend chart"
        >
          {/* Y-axis grid lines at scores 1,2,3,4,5 */}
          {[1, 2, 3, 4, 5].map((s) => {
            const y = scoreToY(s, H, PAD_TOP, PAD_BOTTOM);
            return (
              <g key={s}>
                <line
                  x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
                <text
                  x={PAD_LEFT - 8} y={y + 4}
                  fill="rgba(255,255,255,0.3)"
                  fontSize="10" textAnchor="end"
                >
                  {s}
                </text>
              </g>
            );
          })}

          {/* X-axis month labels */}
          {sorted.map((entry, i) => (
            <text
              key={entry.cycleId}
              x={xOf(i)} y={H - 4}
              fill="rgba(255,255,255,0.35)"
              fontSize="10" textAnchor="middle"
            >
              {MONTH_SHORT[entry.month]}
            </text>
          ))}

          {/* Lines + dots per parameter */}
          {PARAMETERS.map((p) => {
            const color = PARAM_COLORS[p];
            const isActive = activeParam === p || !activeParam;
            const opacity = isActive ? 1 : 0.15;

            const points = sorted
              .map((entry, i) => {
                const s = entry.scores[p]?.score;
                if (!s) return null;
                return { x: xOf(i), y: scoreToY(s, H, PAD_TOP, PAD_BOTTOM), score: s, entry };
              })
              .filter(Boolean);

            if (points.length === 0) return null;

            // Build polyline path
            const d = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

            return (
              <g key={p} style={{ opacity, transition: 'opacity 0.2s' }}>
                {/* Line */}
                {points.length > 1 && (
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {/* Dots */}
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r={5} fill={color} />
                    <circle cx={pt.x} cy={pt.y} r={3} fill="#0a0f1e" />
                    {/* Score label on active param */}
                    {isActive && activeParam === p && (
                      <text
                        x={pt.x} y={pt.y - 10}
                        fill={color}
                        fontSize="11" fontWeight="700" textAnchor="middle"
                      >
                        {pt.score}
                      </text>
                    )}
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
