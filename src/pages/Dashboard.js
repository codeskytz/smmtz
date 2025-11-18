import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavClick = (navItem) => {
    setActiveNav(navItem);
    setSidebarOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <img src="https://i.ibb.co/0RK2ydNg/idea.png" alt="SMMTZ Logo" className="dashboard-logo" />
            <span className="dashboard-title">SMMTZ</span>
          </div>
          
          <div className="header-right">
            <label className="switch">
              <input 
                id="theme-input" 
                type="checkbox" 
                checked={isDarkTheme}
                onChange={toggleTheme}
              />
              <div className="slider round">
                <div className="sun-moon">
                  <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                </div>
                <div className="stars">
                  <svg id="star-1" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                  <svg id="star-2" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                  <svg id="star-3" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                  <svg id="star-4" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                </div>
              </div>
            </label>

            <div className="profile-section">
              <button 
                className="profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} />
                  ) : (
                    <span className="avatar-placeholder">
                      {(user.displayName || user.email).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user.displayName || user.email}</p>
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                  </button>
                  <button className="dropdown-item" onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6m-1.78 7.78l-4.24-4.24m-6.08 0l-4.24 4.24"></path>
                    </svg>
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="dashboard-layout">
        {/* Overlay for mobile */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            <div className="nav-item-wrapper">
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
            </div>

            <div className="nav-item-wrapper">
              <button 
                className={`nav-item ${activeNav === 'new-order' ? 'active' : ''}`}
                onClick={() => handleNavClick('new-order')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>New Order</span>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                className={`nav-item ${activeNav === 'deposit' ? 'active' : ''}`}
                onClick={() => handleNavClick('deposit')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Deposit</span>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                className={`nav-item ${activeNav === 'orders' ? 'active' : ''}`}
                onClick={() => handleNavClick('orders')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <span>Orders</span>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                className={`nav-item ${activeNav === 'services' ? 'active' : ''}`}
                onClick={() => handleNavClick('services')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                </svg>
                <span>Services</span>
              </button>
            </div>

            <div className="nav-item-wrapper">
              <button 
                className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('settings')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m6.08 0l4.24-4.24M1 12h6m6 0h6m-1.78 7.78l-4.24-4.24m-6.08 0l-4.24 4.24"></path>
                </svg>
                <span>Settings</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-placeholder">
            <h1>Welcome to SMMTZ Dashboard</h1>
            <p>Select a menu item from the sidebar to get started</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

