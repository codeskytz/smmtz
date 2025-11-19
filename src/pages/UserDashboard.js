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

  // Social media platform icon components
  const PlatformIcon = ({ platform, size = 24 }) => {
    const iconProps = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor" };
    
    switch (platform) {
      case 'Instagram':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'Facebook':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'Twitter':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'YouTube':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'TikTok':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      case 'LinkedIn':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      case 'Pinterest':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.487.535 6.624 0 11.99-5.367 11.99-11.987C23.97 5.39 18.592.026 11.969.026L12.017 0z"/>
          </svg>
        );
      case 'Snapchat':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.099c0 .012-.007.02-.01.033l-.001.006c-.004.05-.01.098-.01.15 0 .14.07.26.18.33.02.01.04.02.05.03.05.03.1.05.15.07.18.07.37.11.56.11.28 0 .56-.06.81-.18.05-.02.1-.04.15-.07.01-.01.03-.02.05-.03.11-.07.18-.19.18-.33 0-.05-.01-.1-.01-.15l-.01-.006c0-.013-.01-.021-.01-.033l-.003-.099c-.104-1.628-.23-3.654.299-4.847C18.124 1.069 21.481.793 22.471.793c.99 0 .99 1.716.99 2.31 0 .26-.05.51-.14.75-.09.24-.22.47-.38.66-.17.2-.37.37-.58.51-.22.14-.45.25-.7.33-.25.08-.51.12-.78.12-.28 0-.56-.06-.81-.18-.05-.02-.1-.04-.15-.07-.01-.01-.03-.02-.05-.03-.11-.07-.18-.19-.18-.33 0-.05.01-.1.01-.15l.01-.006c0-.013.01-.021.01-.033l.003-.099c.104-1.628.23-3.654-.299-4.847C19.876 1.069 16.519.793 15.529.793c-.99 0-4.347.276-5.93 3.821-.529 1.193-.403 3.219-.299 4.847l.003.099c0 .012.007.02.01.033l.001.006c.004.05.01.098.01.15 0 .14-.07.26-.18.33-.02.01-.04.02-.05.03-.05.03-.1.05-.15.07-.18.07-.37.11-.56.11-.28 0-.56-.06-.81-.18-.05-.02-.1-.04-.15-.07-.01-.01-.03-.02-.05-.03-.11-.07-.18-.19-.18-.33 0-.05.01-.1.01-.15l.01-.006c0-.013.01-.021.01-.033l.003-.099c.104-1.628.23-3.654-.299-4.847C4.876 1.069 1.519.793.529.793c-.99 0-.99 1.716-.99 2.31 0 .26.05.51.14.75.09.24.22.47.38.66.17.2.37.37.58.51.22.14.45.25.7.33.25.08.51.12.78.12.28 0 .56-.06.81-.18.05-.02.1-.04.15-.07.01-.01.03-.02.05-.03.11-.07.18-.19.18-.33 0-.05-.01-.1-.01-.15l-.01-.006c0-.013-.01-.021-.01-.033l-.003-.099c-.104-1.628-.23-3.654.299-4.847C3.876 1.069 7.233.793 8.223.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.099c0 .012-.007.02-.01.033l-.001.006c-.004.05-.01.098-.01.15 0 .14.07.26.18.33.02.01.04.02.05.03.05.03.1.05.15.07.18.07.37.11.56.11.28 0 .56-.06.81-.18.05-.02.1-.04.15-.07.01-.01.03-.02.05-.03.11-.07.18-.19.18-.33 0-.05-.01-.1-.01-.15l-.01-.006c0-.013-.01-.021-.01-.033l-.003-.099c-.104-1.628-.23-3.654.299-4.847C18.124 1.069 21.481.793 22.471.793c.99 0 .99 1.716.99 2.31 0 .26-.05.51-.14.75-.09.24-.22.47-.38.66-.17.2-.37.37-.58.51-.22.14-.45.25-.7.33-.25.08-.51.12-.78.12-.28 0-.56-.06-.81-.18-.05-.02-.1-.04-.15-.07-.01-.01-.03-.02-.05-.03-.11-.07-.18-.19-.18-.33 0-.05.01-.1.01-.15l.01-.006c0-.013.01-.021.01-.033l.003-.099c.104-1.628.23-3.654-.299-4.847C19.876 1.069 16.519.793 15.529.793z"/>
          </svg>
        );
      case 'Telegram':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        );
      case 'Discord':
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        );
      case 'all':
      default:
        return (
          <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
          </svg>
        );
    }
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
            <span className="platform-icon">
              <PlatformIcon platform="all" size={20} />
            </span>
            <span className="platform-name">All</span>
          </button>
          {availablePlatforms.map(platform => (
            <button
              key={platform}
              className={`platform-btn ${selectedPlatform === platform ? 'active' : ''}`}
              onClick={() => setSelectedPlatform(platform)}
            >
              <span className="platform-icon">
                <PlatformIcon platform={platform} size={20} />
              </span>
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
                    <PlatformIcon platform={getPlatformFromCategory(service.category)} size={24} />
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

