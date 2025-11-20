import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/WithdrawalRequest.css';

const WithdrawalRequest = () => {
  const { user, referralEarnings, getReferralEarnings } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const MIN_WITHDRAWAL = 500000; // 5000 TZS in cents

  useEffect(() => {
    if (user) {
      loadPendingWithdrawals();
      getReferralEarnings();
    }
  }, [user]);

  const loadPendingWithdrawals = async () => {
    try {
      setLoading(true);
      const withdrawalsRef = collection(db, 'withdrawals');
      const q = query(
        withdrawalsRef,
        where('userId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const withdrawals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingWithdrawals(withdrawals);
    } catch (err) {
      console.error('Error loading withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    const withdrawalAmount = parseFloat(amount) * 100; // Convert to cents
    const availableEarnings = referralEarnings || 0;

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!amount || withdrawalAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ${(MIN_WITHDRAWAL / 100).toLocaleString('en-TZ')} TZS`);
      return;
    }

    if (withdrawalAmount > availableEarnings) {
      setError('Insufficient referral earnings');
      return;
    }

    // Validate phone number format (Tanzania: +255 or 0 followed by 9 digits)
    const phoneRegex = /^(\+255|0)[0-9]{9}$/;
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid Tanzania phone number (e.g., +255123456789 or 0712345678)');
      return;
    }

    try {
      setSubmitting(true);

      // Create withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Unknown',
        phoneNumber: cleanPhone,
        amount: withdrawalAmount,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess('Withdrawal request submitted successfully! Admin will process it shortly.');
      setPhoneNumber('');
      setAmount('');
      await loadPendingWithdrawals();
      await getReferralEarnings();
    } catch (err) {
      console.error('Error submitting withdrawal:', err);
      setError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const availableEarnings = referralEarnings || 0;
  const availableInTZS = (availableEarnings / 100).toFixed(2);

  return (
    <div className="withdrawal-request">
      <div className="withdrawal-header">
        <h1>Request Withdrawal</h1>
        <p className="subtitle">Withdraw your referral earnings to your phone number</p>
      </div>

      {/* Available Earnings Card */}
      <div className="earnings-card">
        <div className="earnings-info">
          <div className="earnings-label">Available Earnings</div>
          <div className="earnings-amount">{availableInTZS} TZS</div>
          <div className="earnings-note">Minimum withdrawal: 5,000 TZS</div>
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

      {/* Withdrawal Form */}
      <div className="withdrawal-form-card">
        <h2>Submit Withdrawal Request</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phoneNumber">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+255123456789 or 0712345678"
              required
              disabled={submitting}
            />
            <small className="form-hint">Enter your Tanzania phone number (M-Pesa, Tigo Pesa, etc.)</small>
          </div>

          <div className="form-group">
            <label htmlFor="amount">
              Amount (TZS) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="5000"
              step="100"
              placeholder="5000"
              required
              disabled={submitting}
            />
            <small className="form-hint">Minimum: 5,000 TZS</small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || availableEarnings < MIN_WITHDRAWAL}
          >
            {submitting ? (
              <>
                <div className="spinner-small"></div>
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </form>
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="pending-withdrawals">
          <h2>Pending Withdrawals</h2>
          <div className="withdrawals-list">
            {pendingWithdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="withdrawal-item">
                <div className="withdrawal-info">
                  <div className="withdrawal-amount">
                    {(withdrawal.amount / 100).toLocaleString('en-TZ', { minimumFractionDigits: 2 })} TZS
                  </div>
                  <div className="withdrawal-details">
                    <div className="withdrawal-phone">{withdrawal.phoneNumber}</div>
                    <div className="withdrawal-date">
                      {withdrawal.createdAt?.toDate?.().toLocaleDateString('en-TZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div className="withdrawal-status pending">
                  <span className="status-badge">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalRequest;

