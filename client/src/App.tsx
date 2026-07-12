import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Placeholder Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AssetDirectory from './pages/AssetDirectory';

import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode, requireRole?: string[] }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireRole && !requireRole.includes(user.role)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="assets" element={<AssetDirectory />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="maintenance" element={<Maintenance />} />
              {/* Other routes to be implemented */}
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
