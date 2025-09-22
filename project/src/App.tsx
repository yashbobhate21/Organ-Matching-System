import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { DonorList } from './components/Donors/DonorList';
import { RecipientList } from './components/Recipients/RecipientList';
import { MatchingDashboard } from './components/Matching/MatchingDashboard';
import { AllocationsList } from './components/Allocations/AllocationsList';

function AuthWrapper() {
  const [isLogin, setIsLogin] = useState(true);

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

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;