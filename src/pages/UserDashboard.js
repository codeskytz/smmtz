import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, userBalance, getUserBalance } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // Social media platforms mapping
  const platformIcons = {
    'Instagram': '📷',
    'Facebook': '👥',
    'Twitter': '🐦',
    'YouTube': '📺',
    'TikTok': '🎵',
    'LinkedIn': '💼',
    'Pinterest': '📌',
    'Snapchat': '👻',
    'Telegram': '✈️',
    'Discord': '💬',
    'all': '🌐'
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load balance
      const currentBalance = await getUserBalance();
      setBalance(currentBalance);

      // Load transactions count
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const transactionsQuery = query(transactionsRef, orderBy('createdAt', 'desc'));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      setTransactionsCount(transactionsSnapshot.size);

      // Load orders count (if orders collection exists)
      try {
        const ordersRef = collection(db, 'users', user.uid, 'orders');
        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        setOrdersCount(ordersSnapshot.size);
      } catch (err) {
        // Orders collection might not exist yet
        console.log('Orders collection not found, setting to 0');
        setOrdersCount(0);
      }

      // Load services
      const servicesRef = collection(db, 'services');
      const servicesQuery = query(servicesRef, orderBy('category', 'asc'));
      const servicesSnapshot = await getDocs(servicesQuery);
      
      const servicesList = servicesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(service => service.enabled === true);

      setServices(servicesList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (amount) => {
    return (amount / 100).toFixed(2);
  };

  const getPlatformFromCategory = (category) => {
    if (!category) return 'Other';
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('instagram')) return 'Instagram';
    if (categoryLower.includes('facebook')) return 'Facebook';
    if (categoryLower.includes('twitter')) return 'Twitter';
    if (categoryLower.includes('youtube')) return 'YouTube';
    if (categoryLower.includes('tiktok')) return 'TikTok';
    if (categoryLower.includes('linkedin')) return 'LinkedIn';
    if (categoryLower.includes('pinterest')) return 'Pinterest';
    if (categoryLower.includes('snapchat')) return 'Snapchat';
    if (categoryLower.includes('telegram')) return 'Telegram';
    if (categoryLower.includes('discord')) return 'Discord';
    
    return category;
  };

  const getAvailablePlatforms = () => {
    const platforms = new Set();
    services.forEach(service => {
      const platform = getPlatformFromCategory(service.category);
      platforms.add(platform);
    });
    return Array.from(platforms).sort();
  };

  const filteredServices = selectedPlatform === 'all' 
    ? services 
    : services.filter(service => {
        const platform = getPlatformFromCategory(service.category);
        return platform === selectedPlatform;
      });

  const availablePlatforms = getAvailablePlatforms();

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="user-dashboard">
      {/* Welcome Message */}
      <div className="welcome-section">
        <h1 className="welcome-message">
          Welcome back, <span className="username">{displayName}</span>
        </h1>
      </div>

      {/* Balance Card */}
      <div className="balance-card-container">
        <div className="balance-card">
          <div className="balance-info">
            <span className="balance-label">Your Balance</span>
            <span className="balance-amount">TZS {formatBalance(balance)}</span>
          </div>
          <button 
            className="deposit-btn"
            onClick={() => {
              const event = new CustomEvent('navigate', { detail: 'deposit' });
              window.dispatchEvent(event);
            }}
            title="Add funds"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="analytics-section">
        <h2 className="section-title">Analytics</h2>
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-icon orders">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{ordersCount}</div>
              <div className="analytics-label">Orders Placed</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-icon transactions">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H3v20h18V8z"></path>
                <polyline points="3 8 21 8"></polyline>
                <polyline points="13 2 13 8"></polyline>
                <line x1="8" y1="13" x2="16" y2="13"></line>
                <line x1="8" y1="17" x2="16" y2="17"></line>
              </svg>
            </div>
            <div className="analytics-content">
              <div className="analytics-value">{transactionsCount}</div>
              <div className="analytics-label">Transactions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Filter */}
      <div className="services-section">
        <h2 className="section-title">Available Services</h2>
        <div className="platform-filter">
          <button
            className={`platform-btn ${selectedPlatform === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPlatform('all')}
          >
            <span className="platform-icon">{platformIcons['all']}</span>
            <span className="platform-name">All</span>
          </button>
          {availablePlatforms.map(platform => (
            <button
              key={platform}
              className={`platform-btn ${selectedPlatform === platform ? 'active' : ''}`}
              onClick={() => setSelectedPlatform(platform)}
            >
              <span className="platform-icon">{platformIcons[platform] || '📱'}</span>
              <span className="platform-name">{platform}</span>
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="no-services">
            <p>No services available for this platform</p>
          </div>
        ) : (
          <div className="services-preview-grid">
            {filteredServices.slice(0, 6).map(service => (
              <div key={service.id} className="service-preview-card">
                <div className="service-preview-header">
                  <span className="service-platform-icon">
                    {platformIcons[getPlatformFromCategory(service.category)] || '📱'}
                  </span>
                  <span className="service-category">{service.category}</span>
                </div>
                <h3 className="service-name">{service.name}</h3>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                <div className="service-preview-footer">
                  <span className="service-price">
                    {service.priceTZS 
                      ? `${parseFloat(service.priceTZS).toLocaleString('en-TZ')} TZS`
                      : 'Price on request'
                    }
                  </span>
                  <button 
                    className="view-service-btn"
                    onClick={() => {
                      const event = new CustomEvent('navigate', { detail: 'services' });
                      window.dispatchEvent(event);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredServices.length > 6 && (
          <div className="view-all-services">
            <button 
              className="view-all-btn"
              onClick={() => {
                const event = new CustomEvent('navigate', { detail: 'services' });
                window.dispatchEvent(event);
              }}
            >
              View All Services
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

