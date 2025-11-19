import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import SMMService from '../services/SMMService';
import ProxyTest from '../components/ProxyTest';
import '../styles/UserManagement.css';

// Quick Price Edit Component
const QuickPriceEdit = ({ service, currentPrice, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [priceValue, setPriceValue] = useState(currentPrice || '');

  useEffect(() => {
    setPriceValue(currentPrice || '');
  }, [currentPrice]);

  const handleSave = () => {
    if (priceValue && parseFloat(priceValue) > 0 && priceValue !== currentPrice) {
      onSave(service, priceValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPriceValue(currentPrice || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="quick-edit-price">
        <input
          type="number"
          value={priceValue}
          onChange={(e) => setPriceValue(e.target.value)}
          placeholder="Enter price"
          min="0"
          step="0.01"
          autoFocus
          className="quick-edit-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button className="quick-edit-save" onClick={handleSave} title="Save">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <button className="quick-edit-cancel" onClick={handleCancel} title="Cancel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`detail-value ${currentPrice ? 'has-price' : 'no-price'} quick-editable`}
      onClick={() => setIsEditing(true)}
      title="Click to edit price"
    >
      {currentPrice ? (
        <>
          <strong>{parseFloat(currentPrice).toLocaleString('en-TZ')} TZS</strong>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px', opacity: 0.6 }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </>
      ) : (
        <>
          <span>Not set</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px', opacity: 0.6 }}>
            <path d="M12 5v14M5 12h14"></path>
          </svg>
        </>
      )}
    </div>
  );
};

const AdminServices = () => {
  const { userRole } = useAuth();
  const [services, setServices] = useState([]);
  const [apiServices, setApiServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingService, setEditingService] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [smmBalance, setSmmBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // Form state for editing/adding
  const [formData, setFormData] = useState({
    serviceId: '',
    name: '',
    category: '',
    description: '',
    priceTZS: '',
    enabled: true,
    min: '',
    max: '',
  });

  useEffect(() => {
    if (userRole !== 'admin') return;
    loadServices();
    loadApiServices();
    loadSmmBalance();
  }, [userRole]);

  const loadSmmBalance = async () => {
    try {
      setBalanceLoading(true);
      setBalanceError('');
      const balanceData = await SMMService.getBalance();
      setSmmBalance(balanceData);
    } catch (err) {
      console.error('Error loading SMM balance:', err);
      setBalanceError(err.message || 'Failed to load balance');
      setSmmBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      const servicesRef = collection(db, 'services');
      // Use single orderBy to avoid index requirement, then sort in memory
      const q = query(servicesRef, orderBy('category', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const servicesList = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          // Sort by enabled status first (enabled services first)
          const aEnabled = a.enabled === true ? 1 : 0;
          const bEnabled = b.enabled === true ? 1 : 0;
          if (aEnabled !== bEnabled) {
            return bEnabled - aEnabled; // Enabled (1) comes before disabled (0)
          }
          // Then sort by category
          if (a.category !== b.category) {
            return (a.category || '').localeCompare(b.category || '');
          }
          // Finally sort by name
          return (a.name || '').localeCompare(b.name || '');
        });
      
      setServices(servicesList);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(servicesList.map(s => s.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading services:', err);
      // If query fails, try without orderBy
      try {
        const servicesRef = collection(db, 'services');
        const querySnapshot = await getDocs(servicesRef);
        const servicesList = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Sort by enabled status first (enabled services first)
            const aEnabled = a.enabled === true ? 1 : 0;
            const bEnabled = b.enabled === true ? 1 : 0;
            if (aEnabled !== bEnabled) {
              return bEnabled - aEnabled; // Enabled (1) comes before disabled (0)
            }
            // Then sort by category
            if (a.category !== b.category) {
              return (a.category || '').localeCompare(b.category || '');
            }
            // Finally sort by name
            return (a.name || '').localeCompare(b.name || '');
          });
        setServices(servicesList);
        const uniqueCategories = [...new Set(servicesList.map(s => s.category))];
        setCategories(uniqueCategories);
      } catch (fallbackErr) {
        setError('Failed to load services: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadApiServices = async () => {
    try {
      const apiServicesList = await SMMService.getServices();
      setApiServices(apiServicesList);
    } catch (err) {
      console.error('Failed to load API services:', err);
    }
  };

  const syncFromAPI = async () => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');
      
      // Note: API key is now handled by the proxy server
      // No need to check for it in the React app
      const apiServicesList = await SMMService.getServices();
      
      if (!Array.isArray(apiServicesList) || apiServicesList.length === 0) {
        setError('No services found in API response. Please check your API key.');
        setSyncing(false);
        return;
      }
      
      let addedCount = 0;
      let updatedCount = 0;
      
      // Add new services from API that don't exist in Firestore
      for (const apiService of apiServicesList) {
        const serviceId = apiService.service?.toString() || apiService.serviceId?.toString();
        if (!serviceId) continue;
        
        const existingService = services.find(s => s.serviceId === serviceId || s.id === serviceId);
        
        if (!existingService) {
          // Create new service in Firestore
          const newService = {
            serviceId: serviceId,
            name: apiService.name || 'Unnamed Service',
            category: apiService.category || 'Uncategorized',
            type: apiService.type || 'Default',
            rate: apiService.rate || '0',
            min: apiService.min || '0',
            max: apiService.max || '0',
            refill: apiService.refill || false,
            cancel: apiService.cancel || false,
            description: '',
            priceTZS: '',
            enabled: false, // New services are disabled by default
            createdAt: new Date(),
          };
          
          await setDoc(doc(db, 'services', serviceId), newService);
          addedCount++;
        } else {
          // Update existing service with latest API data (but preserve custom fields)
          await updateDoc(doc(db, 'services', existingService.id), {
            name: apiService.name || existingService.name,
            category: apiService.category || existingService.category,
            type: apiService.type || existingService.type,
            rate: apiService.rate || existingService.rate,
            min: apiService.min || existingService.min,
            max: apiService.max || existingService.max,
            refill: apiService.refill !== undefined ? apiService.refill : existingService.refill,
            cancel: apiService.cancel !== undefined ? apiService.cancel : existingService.cancel,
            updatedAt: new Date(),
          });
          updatedCount++;
        }
      }
      
      setSuccess(
        `Sync completed! Added ${addedCount} new service(s), updated ${updatedCount} existing service(s).`
      );
      await loadServices();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Sync error:', err);
      let errorMessage = err.message || 'Failed to sync services';
      
      // Provide more helpful error messages
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch') || errorMessage.includes('Cannot connect to proxy')) {
        if (errorMessage.includes('proxy')) {
          errorMessage = 
            'Proxy Server Error: Cannot connect to the proxy server. ' +
            'Please ensure your proxy server is running and REACT_APP_PROXY_URL is set correctly in your .env file. ' +
            'See PROXY_SETUP.md for setup instructions.';
        } else {
          errorMessage = 
            'CORS Error: The SMM API cannot be accessed directly from the browser. ' +
            'You need to set up a backend proxy server. ' +
            'See PROXY_SETUP.md for detailed setup instructions, or use the "Add New Service" button to manually add services.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      serviceId: service.serviceId || service.id,
      name: service.name || '',
      category: service.category || '',
      description: service.description || '',
      priceTZS: service.priceTZS || '',
      enabled: service.enabled !== undefined ? service.enabled : true,
      min: service.min || '',
      max: service.max || '',
    });
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setFormData({
      serviceId: '',
      name: '',
      category: '',
      description: '',
      priceTZS: '',
      enabled: true,
      min: '',
      max: '',
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    try {
      setError('');
      
      if (!formData.name || !formData.category) {
        setError('Name and category are required');
        return;
      }

      const serviceData = {
        name: formData.name,
        category: formData.category,
        description: formData.description || '',
        priceTZS: formData.priceTZS || '',
        enabled: formData.enabled,
        min: formData.min || '',
        max: formData.max || '',
        updatedAt: new Date(),
      };

      if (editingService) {
        // Update existing service
        await updateDoc(doc(db, 'services', editingService.id), serviceData);
        setSuccess('Service updated successfully!');
      } else {
        // Add new service
        if (!formData.serviceId) {
          setError('Service ID is required for new services');
          return;
        }
        serviceData.serviceId = formData.serviceId;
        serviceData.createdAt = new Date();
        await setDoc(doc(db, 'services', formData.serviceId), serviceData);
        setSuccess('Service added successfully!');
      }

      setShowAddModal(false);
      await loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save service: ' + err.message);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await deleteDoc(doc(db, 'services', serviceId));
      setSuccess('Service deleted successfully!');
      await loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete service: ' + err.message);
    }
  };

  const handleToggleEnabled = async (service) => {
    try {
      await updateDoc(doc(db, 'services', service.id), {
        enabled: !service.enabled,
        updatedAt: new Date(),
      });
      setSuccess(`Service ${!service.enabled ? 'enabled' : 'disabled'} successfully!`);
      await loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update service: ' + err.message);
    }
  };

  const handleQuickPriceEdit = async (service, newPrice) => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    try {
      await updateDoc(doc(db, 'services', service.id), {
        priceTZS: parseFloat(newPrice),
        updatedAt: new Date(),
      });
      setSuccess('Price updated successfully!');
      await loadServices();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update price: ' + err.message);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="um-header">
        <div>
          <h2>Services Management</h2>
          <p>Manage SMM services, prices, and availability</p>
        </div>
        <div className="um-stats">
          <div className="stat-card">
            <div className="stat-value">{services.length}</div>
            <div className="stat-label">Total Services</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{services.filter(s => s.enabled).length}</div>
            <div className="stat-label">Enabled</div>
          </div>
          <div className="stat-card smm-balance-card">
            <div className="stat-header-row">
              <div className="stat-label">SMM Panel Balance</div>
              <button 
                className="balance-refresh-btn"
                onClick={loadSmmBalance}
                disabled={balanceLoading}
                title="Refresh balance"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={balanceLoading ? 'spinning' : ''}
                >
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
                </svg>
              </button>
            </div>
            {balanceLoading ? (
              <div className="stat-value loading">Loading...</div>
            ) : balanceError ? (
              <div className="stat-value error" title={balanceError}>
                Error
              </div>
            ) : smmBalance ? (
              <div className="stat-value balance-amount">
                {parseFloat(smmBalance.balance || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
                <span className="balance-currency"> {smmBalance.currency || 'USD'}</span>
              </div>
            ) : (
              <div className="stat-value">--</div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="um-alert error">{error}</div>}
      {success && <div className="um-alert success">{success}</div>}

      {/* Proxy Connection Test */}
      {!process.env.REACT_APP_PROXY_URL && <ProxyTest />}

      {/* Proxy Info Box */}
      {!process.env.REACT_APP_PROXY_URL && (
        <div className="um-alert info" style={{ 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--accent-primary)',
          color: 'var(--text-primary)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1rem'
        }}>
          <strong>⚠️ Proxy Server Not Configured:</strong> Add <code>REACT_APP_PROXY_URL</code> to your <code>.env</code> file to enable API syncing.
          <br />
          <strong>Note:</strong> Due to CORS restrictions, you need a backend proxy server. See <code>PROXY_SETUP.md</code> for setup instructions.
          <br />
          Alternatively, use "Add New Service" to manually add services.
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="services-actions">
        <button 
          className="action-primary-btn sync-btn" 
          onClick={syncFromAPI} 
          disabled={syncing}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
          </svg>
          {syncing ? 'Syncing Services...' : 'Sync Services from API'}
        </button>

        <button 
          className="action-primary-btn add-btn" 
          onClick={handleAddNew}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
          </svg>
          Add New Service
        </button>
      </div>

      <div className="um-controls">
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

        <div className="filter-controls">
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
      </div>

      {/* Desktop Table View */}
      <div className="services-table-container desktop-only">
        <table className="users-table">
          <thead>
            <tr>
              <th>Service ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price (TZS)</th>
              <th>Min/Max</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No services found
                </td>
              </tr>
            ) : (
              filteredServices.map(service => (
                <tr key={service.id}>
                  <td>{service.serviceId || service.id}</td>
                  <td>
                    <div className="service-name-cell">
                      <strong>{service.name}</strong>
                      {service.description && (
                        <small className="service-description">{service.description}</small>
                      )}
                    </div>
                  </td>
                  <td>{service.category}</td>
                  <td>
                    <QuickPriceEdit 
                      service={service} 
                      currentPrice={service.priceTZS}
                      onSave={handleQuickPriceEdit}
                    />
                  </td>
                  <td>{service.min || '0'} / {service.max || '∞'}</td>
                  <td>
                    <button
                      className={`action-btn ${service.enabled ? 'promote' : 'suspend'}`}
                      onClick={() => handleToggleEnabled(service)}
                      title={service.enabled ? 'Disable' : 'Enable'}
                    >
                      {service.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn promote"
                        onClick={() => handleEdit(service)}
                        title="Edit Service"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        className="action-btn suspend"
                        onClick={() => handleDelete(service.id)}
                        title="Delete Service"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="services-cards-container mobile-only">
        {filteredServices.length === 0 ? (
          <div className="empty-state-card">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3>No services found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="services-cards-grid">
            {filteredServices.map(service => (
              <div key={service.id} className="service-admin-card">
                <div className="service-admin-card-header">
                  <div className="service-admin-title">
                    <h3>{service.name}</h3>
                    <span className="service-admin-id">ID: {service.serviceId || service.id}</span>
                  </div>
                  <button
                    className={`status-toggle-btn ${service.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => handleToggleEnabled(service)}
                    title={service.enabled ? 'Disable' : 'Enable'}
                  >
                    <span className="status-dot"></span>
                    {service.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {service.description && (
                  <p className="service-admin-description">{service.description}</p>
                )}

                <div className="service-admin-details">
                  <div className="admin-detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{service.category}</span>
                  </div>
                  <div className="admin-detail-row">
                    <span className="detail-label">Price:</span>
                    <QuickPriceEdit 
                      service={service} 
                      currentPrice={service.priceTZS}
                      onSave={handleQuickPriceEdit}
                    />
                  </div>
                  <div className="admin-detail-row">
                    <span className="detail-label">Quantity:</span>
                    <span className="detail-value">{service.min || '0'} - {service.max || '∞'}</span>
                  </div>
                </div>

                <div className="service-admin-actions">
                  <button
                    className="admin-action-btn edit-btn"
                    onClick={() => handleEdit(service)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                  <button
                    className="admin-action-btn delete-btn"
                    onClick={() => handleDelete(service.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Service ID *</label>
                <input
                  type="text"
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  disabled={!!editingService}
                  placeholder="Service ID from API"
                />
              </div>
              
              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Service name"
                />
              </div>
              
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Category name"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Service description"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Price (TZS)</label>
                <input
                  type="number"
                  value={formData.priceTZS}
                  onChange={(e) => setFormData({ ...formData, priceTZS: e.target.value })}
                  placeholder="Price in TZS"
                  min="0"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Min Quantity</label>
                  <input
                    type="number"
                    value={formData.min}
                    onChange={(e) => setFormData({ ...formData, min: e.target.value })}
                    placeholder="Min"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Max Quantity</label>
                  <input
                    type="number"
                    value={formData.max}
                    onChange={(e) => setFormData({ ...formData, max: e.target.value })}
                    placeholder="Max"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  <span>Enable this service for users</span>
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingService ? 'Update' : 'Add'} Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;

