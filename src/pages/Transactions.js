import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/Transactions.css';

const Transactions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError('');

        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const q = query(transactionsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const transactionsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTransactions(transactionsList);
      } catch (err) {
        console.error('Error loading transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user, navigate]);

  const filteredTransactions = transactions.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const formatCurrency = (amount) => {
    return `TZS ${(amount / 100).toLocaleString('en-TZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate?.() || new Date(date);
    return d.toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'pending';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="transactions-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <div className="transactions-wrapper">
        {/* Header */}
        <div className="trans-header">
          <h1>Transaction History</h1>
          <p>View all your deposit transactions</p>
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

        {/* Filter */}
        <div className="trans-filter">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Transactions</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H3v20h18V8z"></path>
              <polyline points="3 8 21 8"></polyline>
              <polyline points="13 2 13 8"></polyline>
              <line x1="8" y1="13" x2="16" y2="13"></line>
              <line x1="8" y1="17" x2="16" y2="17"></line>
            </svg>
            <h3>No transactions yet</h3>
            <p>You haven't made any deposits. <a href="/deposit">Deposit now</a></p>
          </div>
        ) : (
          <div className="trans-list">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="trans-card">
                <div className="trans-card-left">
                  <div className="trans-icon">
                    {transaction.status?.toUpperCase() === 'COMPLETED' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : transaction.status?.toUpperCase() === 'FAILED' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    )}
                  </div>
                  <div className="trans-info">
                    <div className="trans-id">ID: {transaction.tranID}</div>
                    <div className="trans-phone">{transaction.phoneNumber}</div>
                  </div>
                </div>

                <div className="trans-card-right">
                  <div className="trans-amount">
                    +{formatCurrency(transaction.amount)}
                  </div>
                  <div className={`trans-status status-${getStatusColor(transaction.status)}`}>
                    {transaction.status?.toUpperCase()}
                  </div>
                </div>

                <div className="trans-card-footer">
                  <div className="trans-date">
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="trans-summary">
            <div className="summary-item">
              <span className="summary-label">Total Transactions:</span>
              <span className="summary-value">{filteredTransactions.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Amount:</span>
              <span className="summary-value">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.status?.toUpperCase() === 'COMPLETED')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
