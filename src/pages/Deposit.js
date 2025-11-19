import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import PaymentService from '../services/PaymentService';
import '../styles/Deposit.css';

const Deposit = () => {
  const navigate = useNavigate();
  const { user, userBalance, updateUserBalance, getUserBalance } = useAuth();

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState(userBalance || 0);
  const [transactionId, setTransactionId] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [pollingTransactionId, setPollingTransactionId] = useState('');
  const [pollTimeRemaining, setPollTimeRemaining] = useState(180); // 3 minutes in seconds
  const [isPolling, setIsPolling] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch current balance
    const loadBalance = async () => {
      try {
        const currentBalance = await getUserBalance();
        setBalance(currentBalance);
      } catch (err) {
        console.error('Error loading balance:', err);
      }
    };

    loadBalance();
  }, [user, navigate, getUserBalance]);

  // Polling effect for transaction status
  useEffect(() => {
    if (!isPolling || !pollingTransactionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await PaymentService.getTransactionStatus(pollingTransactionId);
        
        if (response.data) {
          const status = response.data.payment_status;
          setTransactionStatus(status);

          if (status === 'COMPLETED') {
            // Transaction completed - update balance
            await saveTransaction(pollingTransactionId, 'COMPLETED', response.data.amount);
            setSuccess('✓ Payment completed successfully! Your balance has been updated.');
            setIsPolling(false);
            clearInterval(pollInterval);
          } else if (status === 'FAILED') {
            // Transaction failed
            await saveTransaction(pollingTransactionId, 'FAILED', response.data.amount);
            setError('✗ Payment failed. Please try again.');
            setIsPolling(false);
            clearInterval(pollInterval);
          }
          // If PENDING, continue polling
        }
      } catch (err) {
        console.error('Error checking transaction status:', err);
      }
    }, 5000); // Check every 5 seconds

    // Timeout after 3 minutes
    const timeoutId = setTimeout(() => {
      if (isPolling) {
        setIsPolling(false);
        clearInterval(pollInterval);
        saveTransaction(pollingTransactionId, 'FAILED', 0);
        setError('Payment confirmation timeout. Transaction marked as failed. Please try again.');
      }
    }, 180000); // 3 minutes

    // Countdown timer
    const timerInterval = setInterval(() => {
      setPollTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
      clearTimeout(timeoutId);
    };
  }, [isPolling, pollingTransactionId]);

  const formatDisplayAmount = (value) => {
    if (!value) return '';
    return (value / 100).toFixed(2);
  };

  // Convert display amount to smallest unit
  const convertToSmallestUnit = (displayValue) => {
    if (!displayValue) return 0;
    return Math.round(parseFloat(displayValue) * 100);
  };

  // Save transaction to Firestore
  const saveTransaction = async (tranID, status, transactionAmount) => {
    try {
      if (!user) return;

      const transactionsRef = doc(db, 'users', user.uid, 'transactions', tranID);
      const transactionData = {
        tranID,
        status,
        amount: transactionAmount || convertToSmallestUnit(amount),
        phoneNumber: PaymentService.formatPhoneNumber(phoneNumber),
        createdAt: new Date(),
        completedAt: status === 'COMPLETED' ? new Date() : null,
      };

      await setDoc(transactionsRef, transactionData);

      // If completed, update user balance
      if (status === 'COMPLETED') {
        await updateUserBalance(transactionAmount || convertToSmallestUnit(amount), tranID);
        const newBalance = await getUserBalance();
        setBalance(newBalance);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.trim();
    // Remove non-numeric characters
    value = value.replace(/\D/g, '');
    setPhoneNumber(value);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d+\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const validateForm = () => {
    setError('');

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!PaymentService.isValidPhoneNumber(phoneNumber)) {
      setError('Invalid phone number format. Expected format: 0xxxxxxxxx or 255xxxxxxxxx');
      return false;
    }

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (amount < 1) {
      setError('Minimum deposit amount is 1 TZS');
      return false;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmDeposit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Format phone number
      const formattedPhone = PaymentService.formatPhoneNumber(phoneNumber);
      const smallestUnitAmount = convertToSmallestUnit(amount);

      // Create transaction with FastLipa
      const response = await PaymentService.createTransaction(
        formattedPhone,
        smallestUnitAmount,
        fullName
      );

      if (response.status === 'success' && response.data) {
        const tranID = response.data.tranID;
        setTransactionId(tranID);

        // Save initial transaction record
        await saveTransaction(tranID, 'PENDING', smallestUnitAmount);

        // Show payment initiated message
        setSuccess(
          `Payment initiated successfully! Transaction ID: ${tranID}\n` +
          'A push notification has been sent to your phone.\n' +
          'Please complete the payment confirmation on your device.\n' +
          'We are checking for payment confirmation...'
        );

        // Start polling
        setPollingTransactionId(tranID);
        setIsPolling(true);
        setPollTimeRemaining(180);
        setShowConfirmation(false);

        // Reset form
        setTimeout(() => {
          setPhoneNumber('');
          setAmount('');
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create transaction. Please try again.');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  return (
    <div className="deposit-container">
      <div className="deposit-wrapper">
        {/* Header */}
        <div className="deposit-header">
          <h1>Add Funds to Your Account</h1>
          <p>Deposit money to start creating orders</p>
        </div>

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-info">
            <span className="balance-label">Current Balance</span>
            <span className="balance-amount">
              TZS {formatDisplayAmount(balance)}
            </span>
          </div>
          <div className="balance-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="11"></circle>
              <path d="M12 8v8"></path>
              <path d="M16 12H8"></path>
            </svg>
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

        {/* Polling Status Screen */}
        {isPolling && (
          <div className="polling-screen">
            <div className="polling-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="M12 8v8"></path>
                <path d="M16 12H8"></path>
              </svg>
              <div className="spinner-overlay"></div>
            </div>

            <h2>Processing Payment</h2>
            <p>Transaction ID: <strong>{pollingTransactionId}</strong></p>

            <div className="polling-status">
              <span className="status-label">Status:</span>
              <span className={`status-badge ${transactionStatus.toLowerCase()}`}>
                {transactionStatus || 'PENDING'}
              </span>
            </div>

            <div className="polling-countdown">
              <div className="countdown-timer">
                <svg viewBox="0 0 100 100" width="100" height="100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-color)" strokeWidth="2" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="var(--accent-primary)" 
                    strokeWidth="2"
                    strokeDasharray={`${(pollTimeRemaining / 180) * 282.7} 282.7`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                  <text x="50" y="50" textAnchor="middle" dy=".3em" fontSize="24" fontWeight="bold" fill="var(--text-primary)">
                    {Math.floor(pollTimeRemaining / 60)}:{String(pollTimeRemaining % 60).padStart(2, '0')}
                  </text>
                </svg>
              </div>
              <p className="countdown-text">Waiting for payment confirmation...</p>
            </div>

            <div className="polling-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div>
                <p>Confirm the payment on your phone</p>
                <p>We're checking for confirmation every 5 seconds</p>
                <p>If no confirmation within 3 minutes, the transaction will be marked as failed</p>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Form */}
        {!showConfirmation ? (
          <form onSubmit={handleSubmit} className="deposit-form">
            {/* Phone Number Input */}
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-group">
                <span className="input-prefix">TZ</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="0695123456 or 255695123456"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={loading}
                  required
                />
              </div>
              <small className="input-hint">Enter phone number (9 or 12 digits)</small>
            </div>

            {/* Amount Input */}
            <div className="form-group">
              <label htmlFor="amount">Amount (TZS)</label>
              <div className="input-group amount-group">
                <span className="input-prefix">TZS</span>
                <input
                  id="amount"
                  type="text"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleAmountChange}
                  disabled={loading}
                  required
                />
              </div>
              <small className="input-hint">Minimum deposit: 1 TZS</small>
            </div>

            {/* Quick Amount Buttons */}
            <div className="quick-amounts">
              <button
                type="button"
                className="quick-btn"
                onClick={() => handleQuickAmount('5000')}
                disabled={loading}
              >
                5,000 TZS
              </button>
              <button
                type="button"
                className="quick-btn"
                onClick={() => handleQuickAmount('10000')}
                disabled={loading}
              >
                10,000 TZS
              </button>
              <button
                type="button"
                className="quick-btn"
                onClick={() => handleQuickAmount('20000')}
                disabled={loading}
              >
                20,000 TZS
              </button>
              <button
                type="button"
                className="quick-btn"
                onClick={() => handleQuickAmount('50000')}
                disabled={loading}
              >
                50,000 TZS
              </button>
            </div>

            {/* Full Name Input */}
            <div className="form-group">
              <label htmlFor="fullname">Full Name</label>
              <input
                id="fullname"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
              <small className="input-hint">Must match your ID for verification</small>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-deposit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14"></path>
                    <path d="M5 12h14"></path>
                  </svg>
                  Continue to Payment
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="info-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div>
                <h4>How it works</h4>
                <p>A push notification will be sent to your phone. Confirm the payment on your device to complete the transaction. Your account balance will be updated immediately after confirmation.</p>
              </div>
            </div>
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="confirmation-screen">
            <div className="confirmation-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="11"></circle>
                <path d="M12 8v8"></path>
                <path d="M16 12H8"></path>
              </svg>
            </div>

            <h2>Confirm Deposit</h2>

            <div className="confirmation-details">
              <div className="detail-row">
                <span className="detail-label">Phone Number:</span>
                <span className="detail-value">{PaymentService.formatPhoneNumber(phoneNumber)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value amount">TZS {formatDisplayAmount(amount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{fullName}</span>
              </div>
            </div>

            <div className="confirmation-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDeposit}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Deposit'}
              </button>
            </div>

            <div className="confirmation-notice">
              <p>📱 A push notification will be sent to <strong>{phoneNumber}</strong></p>
              <p>Confirm the payment on your device to complete the transaction.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposit;
