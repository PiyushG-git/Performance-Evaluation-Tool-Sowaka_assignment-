import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import ParameterScoreInput from '../components/ParameterScoreInput';
import ConfirmModal from '../components/ConfirmModal';
import './FeedbackFormPage.css';

const PARAMETERS = ['OWNERSHIP', 'COMMUNICATION', 'QUALITY_OF_WORK', 'COLLABORATION', 'INITIATIVE'];

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function FeedbackFormPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [reviewee, setReviewee] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // scores: { OWNERSHIP: { score, comment }, ... }
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

  // Load reviewee info + existing draft
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch team to find this specific member + their submission
        const { data } = await client.get('/feedback/my-team');
        const member = data.team.find((m) => m.id === userId);

        if (!member) {
          setError('This person is not in your team.');
          setLoading(false);
          return;
        }

        setReviewee(member);

        // If there's a draft/submission, load it
        if (member.submissionId) {
          setSubmissionId(member.submissionId);
          if (member.submissionStatus === 'submitted') {
            setIsSubmitted(true);
          }
          const { data: sub } = await client.get(`/feedback/submission/${member.submissionId}`);
          // Populate existing scores
          const filled = { ...scores };
          for (const s of sub.scores) {
            filled[s.parameter] = { score: s.score, comment: s.comment };
          }
          setScores(filled);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load feedback data.');
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
      showToast('Draft saved ✓');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Save latest scores first (in case user didn't explicitly draft)
      const { data: draftData } = await client.post('/feedback', buildPayload());
      const sid = draftData.submission.id;

      // Then finalize
      await client.post(`/feedback/${sid}/submit`);
      setIsSubmitted(true);
      setShowModal(false);
      showToast('Feedback submitted successfully! 🎉');
      setTimeout(() => navigate('/team'), 2000);
    } catch (err) {
      setShowModal(false);
      showToast(err.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const allScored = PARAMETERS.every((p) => scores[p].score > 0);
  const allCommented = PARAMETERS.every((p) => scores[p].comment.trim().length > 0);
  const canSubmit = allScored && allCommented;
  const completedCount = PARAMETERS.filter((p) => scores[p].score > 0).length;

  if (loading) return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
        <div className="feedback-form-skeleton">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: 'var(--space-10)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-danger)' }}>⚠ {error}</p>
        <button className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }} onClick={() => navigate('/team')}>
          ← Back to Team
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="container feedback-container">

        {/* Back + header */}
        <button className="btn btn-secondary btn-sm back-btn" onClick={() => navigate('/team')}>
          ← Back to Team
        </button>

        <div className="feedback-header card">
          <div className="avatar avatar-lg">{getInitials(reviewee?.name)}</div>
          <div className="feedback-header-info">
            <h1 className="feedback-title">
              {isSubmitted ? 'Feedback Submitted' : `Feedback for ${reviewee?.name}`}
            </h1>
            <p className="text-muted">{reviewee?.email}</p>
            {isSubmitted && <span className="badge badge-success" style={{ marginTop: '8px' }}>✓ Submitted</span>}
          </div>

          {/* Progress bar */}
          {!isSubmitted && (
            <div className="feedback-progress">
              <div className="feedback-progress-label text-muted">
                {completedCount} / {PARAMETERS.length} scored
              </div>
              <div className="feedback-progress-bar">
                <div
                  className="feedback-progress-fill"
                  style={{ width: `${(completedCount / PARAMETERS.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Parameter cards */}
        <div className="feedback-form-grid">
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

        {/* Action bar */}
        {!isSubmitted && (
          <div className="feedback-actions card">
            <div className="feedback-actions-hint text-muted">
              {!allScored && 'Score all 5 parameters to submit'}
              {allScored && !allCommented && 'Add comments to all parameters to submit'}
              {canSubmit && '✓ Ready to submit!'}
            </div>
            <div className="feedback-actions-btns">
              <button
                className="btn btn-secondary"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                id="save-draft-btn"
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowModal(true)}
                disabled={!canSubmit || submitting}
                id="submit-feedback-btn"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={showModal}
        title="Submit Feedback?"
        message={`You're about to submit feedback for ${reviewee?.name}. This cannot be changed after submission.`}
        confirmLabel="Yes, Submit"
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
