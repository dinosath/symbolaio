import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PageEditorPage from './pages/PageEditorPage';
import ObjectsPage from './pages/ObjectsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages/:pageId"
        element={
          <ProtectedRoute>
            <PageEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/objects"
        element={
          <ProtectedRoute>
            <ObjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/objects/:objectId"
        element={
          <ProtectedRoute>
            <ObjectsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
