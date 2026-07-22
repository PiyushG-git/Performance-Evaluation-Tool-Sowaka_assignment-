import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/ManagerDashboard';
import FeedbackFormPage from './pages/FeedbackFormPage';
import MyScoresPage from './pages/MyScoresPage';

// Pages — loaded lazily in later phases; stubbed here so routing works now
// These will be replaced with real components in Phase 6, 7, 8
const ComingSoon = ({ label }) => (
  <div className="page-wrapper">
    <div className="container" style={{ paddingTop: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '8px' }}>{label}</h2>
      <p>Coming in the next phase…</p>
    </div>
  </div>
);

// Smart default redirect based on role
function DefaultRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'hr') return <Navigate to="/hr" replace />;
  return <Navigate to="/scores" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Default: smart redirect */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DefaultRedirect />
              </ProtectedRoute>
            }
          />

          {/* Manager + HR: give feedback */}
          <Route
            path="/team"
            element={
              <ProtectedRoute roles={['manager', 'hr']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback/:userId"
            element={
              <ProtectedRoute roles={['manager', 'hr']}>
                <FeedbackFormPage />
              </ProtectedRoute>
            }
          />

          {/* All roles: view own scores */}
          <Route
            path="/scores"
            element={
              <ProtectedRoute>
                <MyScoresPage />
              </ProtectedRoute>
            }
          />

          {/* HR only */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute roles={['hr']}>
                <ComingSoon label="HR Dashboard" />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
