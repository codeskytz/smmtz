import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * Prevents logged-in users from accessing authentication pages
 */
const ProtectedRoute = ({ children, requireAuth = false, requireAdmin = false }) => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // If user is logged in and trying to access auth pages, redirect to dashboard
      if (user && (window.location.pathname === '/login' || 
                   window.location.pathname === '/register' ||
                   window.location.pathname === '/forgot-password' ||
                   window.location.pathname === '/reset-password')) {
        if (userRole === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        return;
      }

      // If route requires authentication and user is not logged in
      if (requireAuth && !user) {
        navigate('/login', { replace: true });
        return;
      }

      // If route requires admin and user is not admin
      if (requireAdmin && userRole !== 'admin') {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [user, userRole, loading, navigate, requireAuth, requireAdmin]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--bg-secondary)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

