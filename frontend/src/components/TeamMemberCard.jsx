import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './TeamMemberCard.css';

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function TeamMemberCard({ member }) {
  const navigate = useNavigate();
  const { id, name, email, role, submissionStatus, submittedAt } = member;

  const handleClick = () => navigate(`/feedback/${id}`);

  return (
    <div className="team-card card card-clickable" onClick={handleClick} id={`team-card-${id}`}>
      <div className="team-card-top">
        <div className="avatar avatar-lg">{getInitials(name)}</div>
        <StatusBadge status={submissionStatus} />
      </div>

      <div className="team-card-body">
        <h3 className="team-card-name">{name}</h3>
        <p className="team-card-email text-muted">{email}</p>
        <span className="badge badge-muted" style={{ marginTop: '4px', textTransform: 'capitalize' }}>
          {role}
        </span>
      </div>

      {submittedAt && (
        <p className="team-card-submitted text-muted">
          Submitted {new Date(submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}

      <button className="btn btn-primary btn-sm team-card-btn">
        {submissionStatus === 'submitted' ? 'View Feedback' : submissionStatus === 'draft' ? 'Continue Draft' : 'Give Feedback'}
      </button>
    </div>
  );
}
