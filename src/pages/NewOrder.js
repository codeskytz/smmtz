import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import SMMService from '../services/SMMService';
import '../styles/NewOrder.css';

const NewOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userBalance, getUserBalance, withdrawFromBalance } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    link: '',
    quantity: '',
    runs: '',
    interval: '',
    comments: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Try to get service ID from URL params first, then from sessionStorage
    let serviceId = searchParams.get('serviceId');
    if (!serviceId) {
      serviceId = sessionStorage.getItem('selectedServiceId');
      if (serviceId) {
        sessionStorage.removeItem('selectedServiceId');
      }
    }

    if (serviceId) {
      loadService(serviceId);
    } else {
      setError('No service selected');
      setLoading(false);
    }
  }, [user, navigate, searchParams]);

  const loadService = async (serviceId) => {
    try {
      setLoading(true);
      setError('');
      
      const serviceRef = doc(db, 'services', serviceId);
      const serviceSnap = await getDoc(serviceRef);
      
      if (!serviceSnap.exists()) {
        setError('Service not found');
        setLoading(false);
        return;
      }

      const serviceData = serviceSnap.data();
      setService({
        id: serviceSnap.id,
        ...serviceData,
      });

      // Set default quantity to minimum
      if (serviceData.min) {
        setFormData(prev => ({ ...prev, quantity: serviceData.min }));
      }
    } catch (err) {
      console.error('Error loading service:', err);
      setError('Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    if (!service || !service.priceTZS || !formData.quantity) return 0;
    const quantity = parseFloat(formData.quantity) || 0;
    const pricePer1000 = parseFloat(service.priceTZS) || 0;
    // Cost = (quantity / 1000) * price per 1000
    // Convert to smallest units (cents) for consistency
    const costInTZS = (quantity / 1000) * pricePer1000;
    return Math.ceil(costInTZS * 100);
  };

  const validateForm = () => {
    if (!formData.link || !formData.link.trim()) {
      setError('Please enter a valid link');
      return false;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }

    const quantity = parseFloat(formData.quantity);
    const min = parseFloat(service.min) || 0;
    const max = parseFloat(service.max) || Infinity;

    if (quantity < min) {
      setError(`Minimum quantity is ${min}`);
      return false;
    }

    if (quantity > max && max > 0) {
      setError(`Maximum quantity is ${max}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Get current balance
      const currentBalance = await getUserBalance();
      const orderCost = calculateCost();

      // Check if user has sufficient balance
      if (currentBalance < orderCost) {
        setError(`Insufficient balance. You need ${(orderCost / 100).toFixed(2)} TZS but have ${(currentBalance / 100).toFixed(2)} TZS`);
        setSubmitting(false);
        return;
      }

      // Create order via SMM API
      const orderData = {
        service: parseInt(service.serviceId || service.id),
        link: formData.link.trim(),
        quantity: parseInt(formData.quantity),
      };

      // Add optional parameters
      if (formData.runs) orderData.runs = parseInt(formData.runs);
      if (formData.interval) orderData.interval = parseInt(formData.interval);
      if (formData.comments) orderData.comments = formData.comments.trim();

      const apiResponse = await SMMService.createOrder(orderData);

      if (!apiResponse.order) {
        throw new Error('Failed to create order. No order ID received.');
      }

      const orderId = apiResponse.order;

      // Deduct balance from user account
      await withdrawFromBalance(orderCost);

      // Save order to Firestore
      const orderRef = doc(collection(db, 'users', user.uid, 'orders'));
      await setDoc(orderRef, {
        orderId: orderId.toString(),
        serviceId: service.id,
        serviceName: service.name,
        serviceCategory: service.category,
        link: formData.link.trim(),
        quantity: parseInt(formData.quantity),
        runs: formData.runs ? parseInt(formData.runs) : null,
        interval: formData.interval ? parseInt(formData.interval) : null,
        comments: formData.comments || null,
        cost: orderCost,
        pricePer1000: parseFloat(service.priceTZS),
        status: 'Pending',
        currency: 'TZS',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess(`Order placed successfully! Order ID: ${orderId}`);
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        const event = new CustomEvent('navigate', { detail: 'orders' });
        window.dispatchEvent(event);
      }, 2000);

    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="new-order-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="new-order-container">
        <div className="error-state">
          <p>{error || 'Service not found'}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const orderCost = calculateCost();
  const currentBalance = userBalance || 0;
  const hasEnoughBalance = currentBalance >= orderCost;

  return (
    <div className="new-order-container">
      <div className="new-order-wrapper">
        {/* Header */}
        <div className="order-header">
          <button 
            className="back-btn"
            onClick={() => {
              const event = new CustomEvent('navigate', { detail: 'services' });
              window.dispatchEvent(event);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Services
          </button>
          <h1>Place New Order</h1>
        </div>

        {/* Service Info Card */}
        <div className="service-info-card">
          <div className="service-info-header">
            <h2>{service.name}</h2>
            <span className="service-category">{service.category}</span>
          </div>
          {service.description && (
            <p className="service-description">{service.description}</p>
          )}
          <div className="service-details">
            <div className="detail-item">
              <span className="detail-label">Price:</span>
              <span className="detail-value">
                {service.priceTZS 
                  ? `${parseFloat(service.priceTZS).toLocaleString('en-TZ')} TZS per 1000`
                  : 'Price on request'
                }
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Quantity Range:</span>
              <span className="detail-value">
                {service.min || '0'} - {service.max || '∞'}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
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

        {success && (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Order Form */}
        <form className="order-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="link">
              Link <span className="required">*</span>
            </label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://example.com/page"
              required
              disabled={submitting}
            />
            <small className="form-hint">Enter the link to the page/profile you want to boost</small>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">
              Quantity <span className="required">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min={service.min || 0}
              max={service.max || undefined}
              step="1"
              placeholder={service.min || '0'}
              required
              disabled={submitting}
            />
            <small className="form-hint">
              Minimum: {service.min || '0'}, Maximum: {service.max || '∞'}
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="runs">Runs (Optional)</label>
              <input
                type="number"
                id="runs"
                name="runs"
                value={formData.runs}
                onChange={handleInputChange}
                min="1"
                placeholder="Number of runs"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="interval">Interval (Optional)</label>
              <input
                type="number"
                id="interval"
                name="interval"
                value={formData.interval}
                onChange={handleInputChange}
                min="1"
                placeholder="Minutes"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comments">Custom Comments (Optional)</label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter custom comments if required"
              disabled={submitting}
            />
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span className="summary-label">Quantity:</span>
              <span className="summary-value">{formData.quantity || '0'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Price per 1000:</span>
              <span className="summary-value">
                {service.priceTZS 
                  ? `${parseFloat(service.priceTZS).toLocaleString('en-TZ')} TZS`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="summary-row total">
              <span className="summary-label">Total Cost:</span>
              <span className="summary-value">
                {orderCost > 0 ? `${(orderCost / 100).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TZS` : '0.00 TZS'}
              </span>
            </div>
            <div className="summary-row balance">
              <span className="summary-label">Your Balance:</span>
              <span className={`summary-value ${hasEnoughBalance ? 'sufficient' : 'insufficient'}`}>
                {(currentBalance / 100).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TZS
              </span>
            </div>
            {!hasEnoughBalance && orderCost > 0 && (
              <div className="balance-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Insufficient balance. Please deposit funds to continue.
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const event = new CustomEvent('navigate', { detail: 'services' });
                window.dispatchEvent(event);
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !hasEnoughBalance || orderCost <= 0}
            >
              {submitting ? (
                <>
                  <div className="spinner-small"></div>
                  Placing Order...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrder;

