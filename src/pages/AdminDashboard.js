import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import UserManagement from './UserManagement';
import AdminBalance from './AdminBalance';
import AdminServices from './AdminServices';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('users');

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (!loading && user && userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, loading, userRole, navigate]);

  // Sync theme with document attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleNavClick = (navName) => {
    setActiveNav(navName);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <img src="https://i.ibb.co/0RK2ydNg/idea.png" alt="SMMTZ Logo" className="dashboard-logo" />
            <h1 className="dashboard-title">Admin Panel</h1>
          </div>

          <div className="header-right">
            <label className="switch">
              <input
                type="checkbox"
                checked={!isDarkTheme}
                onChange={toggleTheme}
              />
              <span className="slider round">
                <svg
                  className="sun-moon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle className="moon" cx="12" cy="12" r="5" />
                  <circle className="moon-dot" cx="10.5" cy="9.5" r="1" />
                  <circle className="moon-dot" cx="9.5" cy="11.5" r="1" />
                  <circle className="moon-dot" cx="11" cy="13" r="1" />
                  <g className="light-ray">
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </g>
                </svg>
                <svg className="stars" viewBox="0 0 24 24" fill="currentColor">
                  <circle class="star" cx="3" cy="3" r="1"></circle>
                  <circle class="star" cx="21" cy="3" r="1"></circle>
                  <circle class="star" cx="6" cy="20" r="1"></circle>
                  <circle class="star" cx="18" cy="20" r="1"></circle>
                </svg>
                <svg className="clouds" viewBox="0 0 24 24" fill="currentColor">
                  <path class="cloud-dark" d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 5.23 11.08 5 12 5c3.04 0 5.5 2.46 5.5 5.5v.5H19c2.05 0 3.71 1.66 3.71 3.71 0 1.98-1.57 3.61-3.52 3.71v-2.05C21.67 15.42 23 13.88 23 12c0-2.15-1.78-3.9-3.9-3.96z"></path>
                  <path class="cloud-dark" d="M16 17.9c.29.23.62.44.98.62.37.19.78.35 1.2.47 2.26.7 4.58.22 6.48-1.33.41-.35.8-.74 1.15-1.18.36-.44.7-.92.99-1.42z" opacity="0.3"></path>
                  <path class="cloud-light" d="M9 13c-2.05 0-3.71-1.66-3.71-3.71 0-1.98 1.57-3.61 3.52-3.71V3.17C7.15 3.23 5.79 3.66 4.6 4.42L3.14 2.96C4.3 1.6 5.77 1.17 7.25 1.17 10.7 1.17 13.73 3.77 14.41 7.22h2.04C16.5 3.88 13.46 1 10 1 8.63 1 7.34 1.3 6.15 1.9V1c-1.1 0-2 .9-2 2v2.04C2.79 5.72 1.29 7.4 1.29 9.5c0 2.05 1.66 3.71 3.71 3.71v-2.05C2.45 11.21 1.34 10.29 1.34 9.25 1.34 8.4 1.92 7.67 2.71 7.27v2.93c0 1.85 1.5 3.35 3.35 3.35H9v2.05z"></path>
                </svg>
              </span>
            </label>

            <div className="profile-section">
              <button
                className="profile-avatar"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.displayName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
              </button>
              {profileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.displayName || 'Admin User'}</p>
                    <p className="dropdown-email">{user?.email}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Profile
                  </button>
                  <button className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                    Settings
                  </button>
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${!sidebarOpen ? 'hidden' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`} 
            onClick={() => handleNavClick('dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeNav === 'users' ? 'active' : ''}`} 
            onClick={() => handleNavClick('users')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Users</span>
          </button>
          <button 
            className={`nav-item ${activeNav === 'balance' ? 'active' : ''}`} 
            onClick={() => handleNavClick('balance')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="11"></circle>
              <path d="M12 8v8"></path>
              <path d="M16 12H8"></path>
            </svg>
            <span>Balance</span>
          </button>
          <button 
            className={`nav-item ${activeNav === 'orders' ? 'active' : ''}`} 
            onClick={() => handleNavClick('orders')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H3v20h18V8z"></path>
              <polyline points="3 8 21 8"></polyline>
              <polyline points="13 2 13 8"></polyline>
            </svg>
            <span>Orders</span>
          </button>
          <button 
            className={`nav-item ${activeNav === 'services' ? 'active' : ''}`} 
            onClick={() => handleNavClick('services')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Services</span>
          </button>
          <button 
            className={`nav-item ${activeNav === 'reports' ? 'active' : ''}`} 
            onClick={() => handleNavClick('reports')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>Reports</span>
          </button>
          <button 
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} 
            onClick={() => handleNavClick('settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08 0l4.24 4.24"></path>
            </svg>
            <span>Settings</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeNav === 'dashboard' && (
          <div className="content-placeholder">
            <h2>Welcome to Admin Panel</h2>
            <p>Dashboard content coming soon...</p>
          </div>
        )}
        {activeNav === 'users' && <UserManagement />}
        {activeNav === 'balance' && <AdminBalance />}
        {activeNav === 'orders' && (
          <div className="content-placeholder">
            <h2>Orders Management</h2>
            <p>Orders content coming soon...</p>
          </div>
        )}
        {activeNav === 'services' && <AdminServices />}
        {activeNav === 'reports' && (
          <div className="content-placeholder">
            <h2>Reports</h2>
            <p>Reports content coming soon...</p>
          </div>
        )}
        {activeNav === 'settings' && (
          <div className="content-placeholder">
            <h2>Settings</h2>
            <p>Settings content coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
