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

      // Role-based redirect
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'hr') {
        navigate('/hr', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root gradient-bg">
      {/* Decorative orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <main className="login-center">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">⚡</div>
          <h1 className="login-title">EvalFlow</h1>
          <p className="login-subtitle">Performance Evaluation Platform</p>
        </div>

        {/* Card */}
        <div className="login-card glass">
          <div className="login-card-header">
            <h2 className="login-card-title">Welcome back</h2>
            <p className="login-card-desc">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" id="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              id="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="login-hint">
            <span className="login-hint-label">Demo credentials</span>
            <div className="login-hint-pills">
              <button
                type="button"
                className="hint-pill"
                onClick={() => { setEmail('priya@ashoka.com'); setPassword('Password@123'); }}
              >
                Priya (Manager)
              </button>
              <button
                type="button"
                className="hint-pill"
                onClick={() => { setEmail('kavita@ashoka.com'); setPassword('Password@123'); }}
              >
                Kavita (HR)
              </button>
              <button
                type="button"
                className="hint-pill"
                onClick={() => { setEmail('sneha@ashoka.com'); setPassword('Password@123'); }}
              >
                Sneha (Employee)
              </button>
            </div>
          </div>
        </div>

        <p className="login-footer">Shared across all companies · Secure JWT auth</p>
      </main>
    </div>
  );
}
