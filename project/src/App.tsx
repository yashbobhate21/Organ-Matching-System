import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { DonorList } from './components/Donors/DonorList';
import { RecipientList } from './components/Recipients/RecipientList';
import { MatchingDashboard } from './components/Matching/MatchingDashboard';
import { AllocationsList } from './components/Allocations/AllocationsList';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

function AuthWrapper() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return isLogin ? (
    <LoginForm onToggleForm={() => setIsLogin(false)} />
  ) : (
    <SignupForm onToggleForm={() => setIsLogin(true)} />
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthWrapper />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'donors':
        return <DonorList />;
      case 'recipients':
        return <RecipientList />;
      case 'matching':
        return <MatchingDashboard />;
      case 'allocations':
        return <AllocationsList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="w-64 flex-shrink-0">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      </div>
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
}

function ProtectedApp() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthWrapper />} />
          <Route path="/get-started" element={<Navigate to="/login" replace />} />
          {/* Protected routes */}
          <Route element={<ProtectedApp />}>
            <Route path="/dashboard" element={<MainApp />} />
            <Route path="/donors" element={<DonorList />} />
            <Route path="/recipients" element={<RecipientList />} />
            <Route path="/allocations" element={<AllocationsList />} />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;