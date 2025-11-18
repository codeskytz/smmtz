import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [validating, setValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  
  const [searchParams] = useSearchParams();
  // Handle both 'oobCode' from Firebase default and 'code' from custom implementation
  const code = searchParams.get('oobCode') || searchParams.get('code');
  const mode = searchParams.get('mode');
  const { resetPassword, verifyResetCode } = useAuth();
  const navigate = useNavigate();

  // Verify reset code when component mounts
  useEffect(() => {
    const verifyCode = async () => {
      // Check if this is actually a password reset request
      if (mode && mode !== 'resetPassword') {
        setMessage('Invalid request mode.');
        setMessageType('error');
        setValidating(false);
        return;
      }

      if (!code) {
        setMessage('No reset code provided. Please check your email link.');
        setMessageType('error');
        setValidating(false);
        return;
      }

      try {
        await verifyResetCode(code);
        setIsValidCode(true);
      } catch (error) {
        setMessage(error.message || 'Invalid or expired reset link. Please request a new one.');
        setMessageType('error');
      } finally {
        setValidating(false);
      }
    };

    verifyCode();
  }, [code, mode, verifyResetCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const result = await resetPassword(code, password);
      setMessage(result.message);
      setMessageType('success');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMessage(error.message || 'Failed to reset password. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating code
  if (validating) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Validating Reset Link...</h2>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Please wait while we verify your reset link.
          </p>
        </div>
      </div>
    );
  }

  // Show error if code is invalid
  if (!isValidCode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Invalid Reset Link</h2>
          </div>
          {message && (
            <div className={`auth-message ${messageType}`}>
              {message}
            </div>
          )}
          <div className="auth-footer">
            <p>
              <Link to="/forgot-password">Request a new reset link</Link>
            </p>
            <p>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create New Password</h2>
          <p>Enter your new password below</p>
        </div>

        {message && (
          <div className={`auth-message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
