import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc, where, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/AdminWithdrawals.css';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid, canceled
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      
      const withdrawalsRef = collection(db, 'withdrawals');
      let q;
      
      if (filter === 'all') {
        q = query(withdrawalsRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(
          withdrawalsRef,
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const withdrawalsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setWithdrawals(withdrawalsList);
    } catch (err) {
      console.error('Error loading withdrawals:', err);
      setError('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (withdrawalId, newStatus) => {
    try {
      setProcessing(withdrawalId);
      setError('');
      
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      await updateDoc(withdrawalRef, {
        status: newStatus,
        updatedAt: new Date(),
        processedAt: new Date(),
      });

      // If paid, deduct from user's referral earnings
      if (newStatus === 'paid') {
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal) {
          const userRef = doc(db, 'users', withdrawal.userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const currentEarnings = userDoc.data().referralEarnings || 0;
            const newEarnings = Math.max(0, currentEarnings - withdrawal.amount);
            
            await updateDoc(userRef, {
              referralEarnings: newEarnings,
            });
          }
        }
      }
      
      await loadWithdrawals();
    } catch (err) {
      console.error('Error updating withdrawal:', err);
      setError(err.message || 'Failed to update withdrawal status');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'paid':
        return 'status-paid';
      case 'canceled':
        return 'status-canceled';
      default:
        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Paid';
      case 'canceled':
        return 'Canceled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="admin-withdrawals">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-withdrawals">
      <div className="withdrawals-header">
        <h1>Withdrawal Requests</h1>
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
          >
            Paid
          </button>
          <button
            className={`filter-tab ${filter === 'canceled' ? 'active' : ''}`}
            onClick={() => setFilter('canceled')}
          >
            Canceled
          </button>
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

      {withdrawals.length === 0 ? (
        <div className="empty-state">
          <p>No withdrawals found</p>
        </div>
      ) : (
        <div className="withdrawals-table-container">
          <table className="withdrawals-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone Number</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{withdrawal.userName || 'Unknown'}</div>
                      <div className="user-email">{withdrawal.userEmail}</div>
                    </div>
                  </td>
                  <td>{withdrawal.phoneNumber}</td>
                  <td className="amount-cell">
                    {(withdrawal.amount / 100).toLocaleString('en-TZ', { minimumFractionDigits: 2 })} TZS
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(withdrawal.status)}`}>
                      {getStatusLabel(withdrawal.status)}
                    </span>
                  </td>
                  <td>
                    {withdrawal.createdAt?.toDate?.().toLocaleDateString('en-TZ', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    {withdrawal.status === 'pending' ? (
                      <div className="action-buttons">
                        <button
                          className="btn-approve"
                          onClick={() => handleStatusUpdate(withdrawal.id, 'paid')}
                          disabled={processing === withdrawal.id}
                        >
                          {processing === withdrawal.id ? 'Processing...' : 'Mark as Paid'}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleStatusUpdate(withdrawal.id, 'canceled')}
                          disabled={processing === withdrawal.id}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="processed-date">
                        {withdrawal.processedAt?.toDate?.().toLocaleDateString('en-TZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;

