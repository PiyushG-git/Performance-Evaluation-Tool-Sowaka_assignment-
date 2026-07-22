import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import ParameterScoreInput from '../components/ParameterScoreInput';
import ConfirmModal from '../components/ConfirmModal';

const PARAMETERS = ['OWNERSHIP', 'COMMUNICATION', 'QUALITY_OF_WORK', 'COLLABORATION', 'INITIATIVE'];

export default function FeedbackFormPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [reviewee, setReviewee] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [scores, setScores] = useState(() =>
    Object.fromEntries(PARAMETERS.map((p) => [p, { score: 0, comment: '' }]))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await client.get('/feedback/my-team');
        const member = data.team.find((m) => m.id === userId);

        if (!member) {
          setError('Team member not found in your report list.');
          setLoading(false);
          return;
        }

        setReviewee(member);

        if (member.submissionId) {
          setSubmissionId(member.submissionId);
          if (member.submissionStatus === 'submitted') {
            setIsSubmitted(true);
          }
          const { data: sub } = await client.get(`/feedback/submission/${member.submissionId}`);
          const filled = { ...scores };
          for (const s of sub.scores) {
            filled[s.parameter] = { score: s.score, comment: s.comment };
          }
          setScores(filled);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load feedback parameters.');
      } finally {
        setLoading(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleScoreChange = useCallback(({ parameter, score, comment }) => {
    setScores((prev) => ({ ...prev, [parameter]: { score, comment } }));
  }, []);

  const buildPayload = () => ({
    revieweeId: userId,
    scores: PARAMETERS.map((p) => ({
      parameter: p,
      score: scores[p].score,
      comment: scores[p].comment,
    })),
  });

  const handleSaveDraft = async () => {
    if (isSubmitted) return;
    setSaving(true);
    try {
      const { data } = await client.post('/feedback', buildPayload());
      setSubmissionId(data.submission.id);
      showToast('Draft saved successfully ✓');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: draftData } = await client.post('/feedback', buildPayload());
      const sid = draftData.submission.id;

      await client.post(`/feedback/${sid}/submit`);
      setIsSubmitted(true);
      setShowModal(false);
      showToast('Performance evaluation submitted successfully! 🎉');
      setTimeout(() => navigate('/team'), 1500);
    } catch (err) {
      setShowModal(false);
      showToast(err.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = PARAMETERS.filter((p) => scores[p].score > 0 && scores[p].comment.trim().length > 0).length;
  const canSubmit = completedCount === PARAMETERS.length;

  if (loading) return (
    <div style={{ padding: 'var(--s-6) 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
        <span className="spinner spinner-dark" />
        <span className="text-muted">Loading evaluation sheet...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="card" style={{ textAlign: 'center', borderColor: 'var(--color-danger-border)' }}>
      <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>⚠ {error}</p>
      <button className="btn btn-secondary" style={{ marginTop: 'var(--s-4)' }} onClick={() => navigate('/team')}>
        ← Return to Team Overview
      </button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <button
          className="btn btn-ghost"
          style={{ marginBottom: 'var(--s-3)', paddingLeft: 0 }}
          onClick={() => navigate('/team')}
        >
          ← Back to Team List
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s-4)' }}>
          <div>
            <h1 className="page-title">
              {isSubmitted ? 'Completed Review:' : 'Performance Review:'} {reviewee?.name}
            </h1>
            <p className="page-subtitle">
              <span>{reviewee?.email}</span>
              <span className="dot">•</span>
              <span style={{ textTransform: 'capitalize' }}>{reviewee?.role}</span>
              <span className="dot">•</span>
              <span>Cycle: July 2026</span>
            </p>
          </div>

          <div>
            {isSubmitted ? (
              <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}>
                ✓ Submitted & Finalized
              </span>
            ) : (
              <span className="badge badge-info" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}>
                {completedCount} / {PARAMETERS.length} Parameters Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {!isSubmitted && (
        <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--s-6)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: 'var(--color-primary)',
              width: `${(completedCount / PARAMETERS.length) * 100}%`,
              transition: 'width 300ms ease',
            }}
          />
        </div>
      )}

      {/* Form List */}
      <div>
        {PARAMETERS.map((p) => (
          <ParameterScoreInput
            key={p}
            parameter={p}
            score={scores[p].score}
            comment={scores[p].comment}
            onChange={handleScoreChange}
            readOnly={isSubmitted}
          />
        ))}
      </div>

      {/* Bottom Sticky Action Bar */}
      {!isSubmitted && (
        <div
          className="card"
          style={{
            position: 'sticky',
            bottom: 'var(--s-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--s-4)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {!canSubmit
              ? `Score and comment all 5 areas to enable final submission (${completedCount}/5 complete).`
              : 'All criteria completed! Ready for final submission.'}
          </div>

          <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              id="save-draft-btn"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              disabled={!canSubmit || submitting}
              id="submit-feedback-btn"
            >
              {submitting ? 'Submitting...' : 'Submit Final Review'}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showModal}
        title="Submit Performance Review?"
        message={`Are you sure you want to submit the performance review for ${reviewee?.name}? Once submitted, scores and comments will be locked.`}
        confirmLabel="Yes, Submit Review"
        loading={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setShowModal(false)}
      />

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
