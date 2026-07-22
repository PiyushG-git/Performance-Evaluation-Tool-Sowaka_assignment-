const PARAMETER_META = {
  OWNERSHIP: {
    num: 1,
    label: 'Ownership',
    desc: 'Takes initiative, follows through on commitments, and takes full accountability for outcomes.',
    placeholder: 'Provide specific examples of ownership shown this month...',
  },
  COMMUNICATION: {
    num: 2,
    label: 'Communication',
    desc: 'Effectiveness in verbal and written interactions, active listening, and keeping stakeholders aligned.',
    placeholder: 'Feedback on communication clarity, style, and timeliness...',
  },
  QUALITY_OF_WORK: {
    num: 3,
    label: 'Quality of Work',
    desc: 'Accuracy, attention to detail, and overall thoroughness of output delivered.',
    placeholder: 'Examples of quality standards met or exceeded this month...',
  },
  COLLABORATION: {
    num: 4,
    label: 'Collaboration',
    desc: 'Works constructively within the team, shares knowledge, and supports cross-functional partners.',
    placeholder: 'Notes on teamwork, cross-functional collaboration, and peer support...',
  },
  INITIATIVE: {
    num: 5,
    label: 'Reliability & Initiative',
    desc: 'Consistency in performance, meeting deadlines, attendance, and proactive problem solving.',
    placeholder: 'Observations on initiative taken and consistency in meeting goals...',
  },
};

const SCORE_LABELS = ['', 'Needs Improvement', 'Below Expectations', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding'];

export default function ParameterScoreInput({ parameter, score, comment, onChange, readOnly }) {
  const meta = PARAMETER_META[parameter] ?? {
    num: 1,
    label: parameter,
    desc: 'Evaluation criterion',
    placeholder: 'Enter detailed feedback...',
  };

  const handleScore = (val) => {
    if (!readOnly) onChange({ parameter, score: val, comment });
  };

  const handleComment = (e) => {
    onChange({ parameter, score, comment: e.target.value });
  };

  return (
    <div className="eval-block card" id={`param-${parameter}`} style={{ marginBottom: 'var(--s-6)' }}>
      {/* Parameter Title & Description */}
      <div className="eval-block-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="eval-num">{meta.num}</span>
            <h3 className="eval-label">{meta.label}</h3>
          </div>
          {score > 0 && (
            <span className={`badge score-${score}`} style={{ marginLeft: 'auto', padding: '4px 12px' }}>
              Score: {score} — {SCORE_LABELS[score]}
            </span>
          )}
        </div>
        <p className="eval-desc">{meta.desc}</p>
      </div>

      {/* Rating Buttons (1 to 5) */}
      <div className="form-group" style={{ marginBottom: 'var(--s-4)' }}>
        <label className="form-label">
          Rating {!readOnly && <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>*</span>}
        </label>
        <div className="score-num-row" role="radiogroup" aria-label={`Score for ${meta.label}`}>
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              type="button"
              className={`score-num-btn ${score === val ? 'selected' : ''}`}
              onClick={() => handleScore(val)}
              disabled={readOnly}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Comments Textarea */}
      <div className="form-group">
        <label className="form-label" htmlFor={`comment-${parameter}`}>
          Reasoning & Examples {!readOnly && <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>*</span>}
        </label>
        <textarea
          id={`comment-${parameter}`}
          className="form-input"
          placeholder={meta.placeholder}
          value={comment || ''}
          onChange={handleComment}
          readOnly={readOnly}
          rows={3}
        />
      </div>
    </div>
  );
}
