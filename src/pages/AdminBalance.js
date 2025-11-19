import React, { useState, useEffect } from 'react';
import PaymentService from '../services/PaymentService';

const AdminBalance = () => {
  const [adminBalance, setAdminBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch balance on component mount and set up refresh interval
  useEffect(() => {
    const loadBalance = async () => {
      await fetchBalance();
    };

    loadBalance();

    // Refresh balance every 5 minutes
    const interval = setInterval(loadBalance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await PaymentService.getBalance();

      if (response && response.data) {
        setAdminBalance(response.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError('Failed to fetch balance: ' + err.message);
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'TZS 0.00';
    return `TZS ${parseFloat(amount).toLocaleString('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-TZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-balance-section">
      <div className="section-header">
        <h3>Payment Gateway Balance</h3>
        <button
          className="refresh-btn"
          onClick={fetchBalance}
          disabled={loading}
          title="Refresh balance"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
          </svg>
        </button>
      </div>

      {error && (
        <div className="balance-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="balance-loading">
          <div className="spinner-small"></div>
          <span>Loading balance...</span>
        </div>
      ) : adminBalance ? (
        <div className="balance-content">
          <div className="balance-card">
            <div className="balance-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="M12 8v8"></path>
                <path d="M16 12H8"></path>
              </svg>
            </div>
            <div className="balance-info">
              <span className="balance-label">Available Balance</span>
              <span className="balance-amount">{formatCurrency(adminBalance.balance)}</span>
            </div>
          </div>

          {adminBalance.last_transaction && (
            <div className="transaction-info">
              <div className="trans-item">
                <span className="trans-label">Last Transaction:</span>
                <span className="trans-value">{new Date(adminBalance.last_transaction).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {lastUpdated && (
            <div className="balance-footer">
              <small>Last updated: {formatTime(lastUpdated)}</small>
            </div>
          )}
        </div>
      ) : (
        <div className="balance-placeholder">
          <p>Unable to load balance information</p>
        </div>
      )}
    </div>
  );
};

export default AdminBalance;
