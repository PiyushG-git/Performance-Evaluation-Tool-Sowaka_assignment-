import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SidebarLayout from './components/SidebarLayout';
import LoginPage from './pages/LoginPage';
import ManagerDashboard from './pages/ManagerDashboard';
import FeedbackFormPage from './pages/FeedbackFormPage';
import MyScoresPage from './pages/MyScoresPage';
import HRDashboard from './pages/HRDashboard';

// Smart default redirect based on role
function DefaultRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'hr') return <Navigate to="/hr" replace />;
  if (user.role === 'manager' || user.hasDirectReports) return <Navigate to="/team" replace />;
  return <Navigate to="/scores" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login page without sidebar */}
          <Route path="/login" element={<LoginPage />} />

          {/* All Protected Routes wrapped in SidebarLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Routes>
                    <Route path="dashboard" element={<DefaultRedirect />} />

                    {/* Manager / HR Feedback routes */}
                    <Route
                      path="team"
                      element={
                        <ProtectedRoute roles={['manager', 'hr']}>
                          <ManagerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="feedback/:userId"
                      element={
                        <ProtectedRoute roles={['manager', 'hr']}>
                          <FeedbackFormPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Employee & History routes */}
                    <Route path="scores" element={<MyScoresPage />} />

                    {/* HR Dashboard */}
                    <Route
                      path="hr"
                      element={
                        <ProtectedRoute roles={['hr']}>
                          <HRDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<DefaultRedirect />} />
                  </Routes>
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
