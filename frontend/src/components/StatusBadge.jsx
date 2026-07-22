import './StatusBadge.css';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', className: 'badge badge-success' },
  draft:     { label: 'Draft Saved', className: 'badge badge-warning' },
  pending:   { label: 'Pending', className: 'badge badge-danger' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={config.className}>
      <span className="badge-dot" />
      {config.label}
    </span>
  );
}
