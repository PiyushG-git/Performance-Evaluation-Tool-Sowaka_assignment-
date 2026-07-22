import { useState } from 'react';
import './CommentAccordion.css';

const PARAM_LABELS = {
  OWNERSHIP:       'Ownership',
  COMMUNICATION:   'Communication',
  QUALITY_OF_WORK: 'Quality of Work',
  COLLABORATION:   'Collaboration',
  INITIATIVE:      'Initiative',
};

export default function CommentAccordion({ month, year, reviewer, scores }) {
  const [open, setOpen] = useState(false);

  const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const parameters = Object.keys(scores ?? {});

  return (
    <div className={`accordion ${open ? 'accordion-open' : ''}`}>
      <button
        className="accordion-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        id={`accordion-${year}-${month}`}
      >
        <span className="accordion-title">
          {MONTH_NAMES[month]} {year}
          {reviewer && <span className="accordion-reviewer text-muted">· by {reviewer.name}</span>}
        </span>
        <span className="accordion-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="accordion-body">
          {parameters.length === 0 ? (
            <p className="text-muted">No comments available.</p>
          ) : (
            parameters.map((param) => {
              const { score, comment } = scores[param] ?? {};
              return (
                <div key={param} className="accordion-item">
                  <div className="accordion-item-header">
                    <span className="accordion-param">{PARAM_LABELS[param] ?? param}</span>
                    {score && (
                      <span className={`score-chip score-${score}`}>{score}</span>
                    )}
                  </div>
                  {comment && (
                    <p className="accordion-comment text-muted">&ldquo;{comment}&rdquo;</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
