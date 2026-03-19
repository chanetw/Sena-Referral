import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntApp } from 'antd';
import thTH from 'antd/locale/th_TH';
import store from './store';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser } from './store/authSlice';

// Import components
import LoginPage from './pages/LoginPage';
import AgentRegister from './pages/AgentRegister';
import Dashboard from './pages/Dashboard';
import AgentDashboard from './pages/AgentDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route component (redirect to appropriate dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated) {
    const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard';
    return <Navigate to={redirectPath} />;
  }
  
  return children;
};

// App content component (inside Redux Provider)
const AppContent = () => {
  const dispatch = useDispatch();
  const { token, loading, user } = useSelector((state) => state.auth);
  const isInitialized = useRef(false);

  useEffect(() => {
    // If we have a token but no user data, try to get current user (only once)
    if (token && !loading && !user && !isInitialized.current) {
      isInitialized.current = true;
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, loading, user]);

  return (
    <ConfigProvider 
      locale={thTH}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          fontFamily: '"Kanit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
    >
      <AntApp>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register-agent"
              element={
                <PublicRoute>
                  <AgentRegister />
                </PublicRoute>
              }
            />
            
            {/* Protected routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy dashboard redirect */}
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" />} />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* 404 - redirect to login */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
};

// Main App component
const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;