import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);

      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'hr') {
        navigate('/hr', { replace: true });
      } else if (user.role === 'manager' || user.hasDirectReports) {
        navigate('/team', { replace: true });
      } else {
        navigate('/scores', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <div className="login-brand-icon">⚡</div>
          <h1 className="login-title">EvalFlow</h1>
          <p className="login-subtitle">Enterprise Performance Feedback System</p>
        </div>

        <form onSubmit={handleSubmit} className="form-group" style={{ gap: 'var(--s-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="badge badge-danger" style={{ padding: 'var(--s-3)', borderRadius: 'var(--radius)', fontSize: 'var(--text-xs)' }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--s-2)' }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="demo-accounts-box">
          <span className="demo-title">Quick Demo Sign-In</span>
          <div className="demo-pills">
            <button
              type="button"
              className="demo-pill"
              onClick={() => handleQuickLogin('priya@ashoka.com', 'Password@123')}
            >
              Priya (Manager)
            </button>
            <button
              type="button"
              className="demo-pill"
              onClick={() => handleQuickLogin('kavita@ashoka.com', 'Password@123')}
            >
              Kavita (HR Lead)
            </button>
            <button
              type="button"
              className="demo-pill"
              onClick={() => handleQuickLogin('sneha@ashoka.com', 'Password@123')}
            >
              Sneha (Employee)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
