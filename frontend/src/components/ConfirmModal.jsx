import './ConfirmModal.css';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', loading }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🚀</div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message text-muted">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading} id="modal-cancel-btn">
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={loading} id="modal-confirm-btn">
            {loading ? <span className="login-spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
