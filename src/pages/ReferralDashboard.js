import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/ReferralDashboard.css';

const ReferralDashboard = () => {
  const { user, referralEarnings, getReferralEarnings } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      
      // Get user's referral code
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const code = userData.referralCode || '';
        setReferralCode(code);
        setReferralLink(`${window.location.origin}/register?ref=${code}`);
        setTotalReferrals(userData.totalReferrals || 0);
      }

      // Refresh referral earnings
      await getReferralEarnings();
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, item) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setCopiedItem(item);
      setTimeout(() => {
        setCopied(false);
        setCopiedItem(null);
      }, 2000);
    });
  };

  const handleNavigateToWithdraw = () => {
    const event = new CustomEvent('navigate', { detail: 'withdraw' });
    window.dispatchEvent(event);
  };

  const earningsInTZS = (referralEarnings / 100).toFixed(2);

  if (loading) {
    return (
      <div className="referral-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="referral-dashboard">
      <div className="referral-header">
        <h1>Referral Program</h1>
        <p className="subtitle">Invite friends and earn 10% commission on their orders</p>
      </div>

      {/* Earnings Card */}
      <div className="earnings-card">
        <div className="earnings-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="earnings-content">
          <div className="earnings-label">Total Referral Earnings</div>
          <div className="earnings-amount">{parseFloat(earningsInTZS).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TZS</div>
          <div className="earnings-note">Minimum withdrawal: 5,000 TZS</div>
          {parseFloat(earningsInTZS) >= 5000 && (
            <button className="withdraw-btn" onClick={handleNavigateToWithdraw}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
              Withdraw Now
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon referrals">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-value">{totalReferrals}</div>
          <div className="stat-label">Total Referrals</div>
          <div className="stat-description">People you've invited</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon earnings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-value">{parseFloat(earningsInTZS).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TZS</div>
          <div className="stat-label">Available Earnings</div>
          <div className="stat-description">Ready to withdraw</div>
        </div>

        <div className="stat-card highlight">
          <div className="stat-icon commission">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-value">10%</div>
          <div className="stat-label">Commission Rate</div>
          <div className="stat-description">Per order from referrals</div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="referral-code-card">
        <h2>Your Referral Code</h2>
        <div className="code-display">
          <div className="code-value">{referralCode}</div>
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(referralCode, 'code')}
            title="Copy code"
          >
            {copied && copiedItem === 'code' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
        {copied && copiedItem === 'code' && <div className="copy-feedback">Copied!</div>}
      </div>

      {/* Referral Link Card */}
      <div className="referral-link-card">
        <h2>Your Referral Link</h2>
        <div className="link-display">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="link-input"
          />
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(referralLink, 'link')}
            title="Copy link"
          >
            {copied && copiedItem === 'link' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
        <p className="link-hint">Share this link with your friends to start earning!</p>
      </div>

      {/* How It Works */}
      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Share Your Link</h3>
              <p>Share your referral link or code with friends</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>They Sign Up</h3>
              <p>Your friends register using your referral code</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>You Earn</h3>
              <p>Earn 10% commission on every order they place</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Withdraw</h3>
              <p>Withdraw your earnings (min 5,000 TZS) to your phone number</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;

