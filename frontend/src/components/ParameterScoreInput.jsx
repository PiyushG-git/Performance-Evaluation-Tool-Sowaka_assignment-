import { useState } from 'react';
import './ParameterScoreInput.css';

const PARAMETER_META = {
  OWNERSHIP: {
    label: 'Ownership',
    desc: 'Takes accountability, follows through on commitments without being chased',
    icon: '🎯',
  },
  COMMUNICATION: {
    label: 'Communication',
    desc: 'Expresses ideas clearly, listens actively, and keeps stakeholders informed',
    icon: '💬',
  },
  QUALITY_OF_WORK: {
    label: 'Quality of Work',
    desc: 'Delivers accurate, thorough work that meets or exceeds expectations',
    icon: '✅',
  },
  COLLABORATION: {
    label: 'Collaboration',
    desc: 'Works well with teammates, shares knowledge, and uplifts the team',
    icon: '🤝',
  },
  INITIATIVE: {
    label: 'Initiative',
    desc: 'Proactively identifies problems and opportunities without waiting to be asked',
    icon: '🚀',
  },
};

const SCORE_LABELS = ['', 'Needs improvement', 'Below expectations', 'Meets expectations', 'Above expectations', 'Outstanding'];

export default function ParameterScoreInput({ parameter, score, comment, onChange, readOnly }) {
  const [hovered, setHovered] = useState(0);
  const meta = PARAMETER_META[parameter] ?? { label: parameter, desc: '', icon: '📊' };
  const displayScore = hovered || score || 0;

  const handleScore = (val) => {
    if (!readOnly) onChange({ parameter, score: val, comment });
  };

  const handleComment = (e) => {
    onChange({ parameter, score, comment: e.target.value });
  };

  return (
    <div className={`param-card card ${score ? 'param-card-scored' : ''}`} id={`param-${parameter}`}>
      <div className="param-header">
        <div className="param-icon">{meta.icon}</div>
        <div className="param-info">
          <h3 className="param-label">{meta.label}</h3>
          <p className="param-desc text-muted">{meta.desc}</p>
        </div>
        {score > 0 && (
          <div className={`score-chip score-${score}`}>{score}</div>
        )}
      </div>

      {/* Star rating */}
      <div className="param-stars" role="radiogroup" aria-label={`Score for ${meta.label}`}>
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            type="button"
            className={`star-btn ${displayScore >= val ? 'star-active' : ''}`}
            onClick={() => handleScore(val)}
            onMouseEnter={() => !readOnly && setHovered(val)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${val} — ${SCORE_LABELS[val]}`}
            disabled={readOnly}
          >
            ★
          </button>
        ))}
        <span className="score-label-text">
          {displayScore > 0 ? SCORE_LABELS[displayScore] : 'Select a score'}
        </span>
      </div>

      {/* Comment */}
      <div className="form-group">
        <label className="form-label" htmlFor={`comment-${parameter}`}>
          Why this score? {!readOnly && <span className="required-hint">(required to submit)</span>}
        </label>
        <textarea
          id={`comment-${parameter}`}
          className="form-input form-textarea"
          placeholder={`Explain your ${meta.label.toLowerCase()} score…`}
          value={comment || ''}
          onChange={handleComment}
          readOnly={readOnly}
          rows={3}
        />
      </div>
    </div>
  );
}
