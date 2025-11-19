import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/Services.css';

const Services = () => {
  const navigate = useNavigate();
  const { user, userBalance, getUserBalance } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadServices();
    loadBalance();
  }, [user, navigate]);

  const loadBalance = async () => {
    try {
      const currentBalance = await getUserBalance();
      setBalance(currentBalance);
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');

      // Only load enabled services
      const servicesRef = collection(db, 'services');
      // Note: Firestore requires an index for multiple orderBy or where + orderBy
      // For now, we'll filter in memory after fetching
      const q = query(servicesRef, orderBy('category', 'asc'));
      const querySnapshot = await getDocs(q);

      // Filter enabled services and sort
      const servicesList = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(service => service.enabled === true)
        .sort((a, b) => {
          // Sort by category first, then by name
          if (a.category !== b.category) {
            return (a.category || '').localeCompare(b.category || '');
          }
          return (a.name || '').localeCompare(b.name || '');
        });

      setServices(servicesList);

      // Extract unique categories
      const uniqueCategories = [...new Set(servicesList.map(s => s.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `${parseFloat(amount).toLocaleString('en-TZ')} TZS`;
  };

  const handleOrderService = (service) => {
    // Navigate to order page with service details
    navigate(`/new-order?serviceId=${service.id}`);
  };

  if (loading) {
    return (
      <div className="services-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-container">
      <div className="services-wrapper">
        {/* Header */}
        <div className="services-header">
          <div>
            <h1>Available Services</h1>
            <p>Choose from our range of SMM services</p>
          </div>
          <div className="balance-display">
            <span className="balance-label">Your Balance</span>
            <span className="balance-amount">
              TZS {(balance / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="services-filters">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="empty-state">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No services available</h3>
            <p>Check back later for new services</p>
          </div>
        ) : (
          <div className="services-grid">
            {filteredServices.map(service => (
              <div key={service.id} className="service-card">
                <div className="service-card-header">
                  <div className="service-category">{service.category}</div>
                  {service.type && (
                    <div className="service-type">{service.type}</div>
                  )}
                </div>
                
                <div className="service-card-body">
                  <h3 className="service-name">{service.name}</h3>
                  {service.description && (
                    <p className="service-description">{service.description}</p>
                  )}
                  
                  <div className="service-details">
                    <div className="service-detail-item">
                      <span className="detail-label">Min:</span>
                      <span className="detail-value">{service.min || 'N/A'}</span>
                    </div>
                    <div className="service-detail-item">
                      <span className="detail-label">Max:</span>
                      <span className="detail-value">{service.max || '∞'}</span>
                    </div>
                  </div>
                </div>

                <div className="service-card-footer">
                  <div className="service-price">
                    {service.priceTZS ? (
                      <>
                        <span className="price-amount">{formatCurrency(service.priceTZS)}</span>
                        <span className="price-unit">per 1000</span>
                      </>
                    ) : (
                      <span className="price-amount">Price on request</span>
                    )}
                  </div>
                  <button
                    className="btn-order"
                    onClick={() => handleOrderService(service)}
                    disabled={!service.priceTZS}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14"></path>
                      <path d="M5 12h14"></path>
                    </svg>
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;

