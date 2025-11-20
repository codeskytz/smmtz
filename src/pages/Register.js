import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReferralCodeFromURL, storeReferralCode, getStoredReferralCode } from '../utils/referralUtils';
import '../styles/Auth.css';

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, signInWithGoogle, error, checkReferralCode } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [referralCodeValid, setReferralCodeValid] = useState(null);

  // Check for referral code in URL and store it
  useEffect(() => {
    // First check URL parameter
    let refCode = searchParams.get('ref');
    
    // If no URL param, check sessionStorage
    if (!refCode) {
      refCode = getStoredReferralCode();
    }
    
    if (refCode) {
      const upperCode = refCode.toUpperCase().trim();
      setFormData(prev => ({ ...prev, referralCode: upperCode }));
      
      // Store in sessionStorage for Google sign-up and future navigation
      storeReferralCode(upperCode);
      
      // Validate the code
      checkReferralCode(upperCode).then(isValid => {
        setReferralCodeValid(isValid);
      }).catch(err => {
        console.error('Error validating referral code from URL:', err);
        setReferralCodeValid(false);
      });
    }
  }, [searchParams, checkReferralCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');

    if (formData.password !== formData.confirmPassword) {
      setRegError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setRegError('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);

    try {
      const refCode = formData.referralCode.trim() || null;
      await register(formData.email, formData.password, formData.name, 'user', refCode);
      navigate('/dashboard');
    } catch (err) {
      setRegError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setRegError('');
    setLoading(true);

    try {
      const refCode = formData.referralCode.trim() || null;
      await signInWithGoogle(refCode);
      navigate('/dashboard');
    } catch (err) {
      setRegError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReferralCodeChange = async (e) => {
    const code = e.target.value.toUpperCase().trim();
    setFormData(prev => ({ ...prev, referralCode: code }));
    
    if (code.length >= 4) {
      try {
        const isValid = await checkReferralCode(code);
        setReferralCodeValid(isValid);
      } catch (err) {
        console.error('Error validating referral code:', err);
        setReferralCodeValid(false);
      }
    } else {
      setReferralCodeValid(null);
    }
  };

  const GoogleIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" x="0px" y="0px" className="google-icon" viewBox="0 0 48 48" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  );

  return (
    <div className="auth-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>

      <div className="form-container">
        <p className="title">Create Account</p>
        {regError && <p className="error-message">{regError}</p>}
        <form className="form" onSubmit={handleRegister}>
          <input
            type="text"
            name="name"
            className="input"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            className="input"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            className="input"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="confirmPassword"
            className="input"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              name="referralCode"
              className="input"
              placeholder="Referral Code (Optional)"
              value={formData.referralCode}
              onChange={handleReferralCodeChange}
              maxLength="8"
              disabled={loading}
              style={{
                textTransform: 'uppercase',
                paddingRight: referralCodeValid !== null ? '40px' : '16px'
              }}
            />
            {referralCodeValid !== null && (
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: referralCodeValid ? '#22c55e' : '#ef4444',
                fontSize: '18px'
              }}>
                {referralCodeValid ? '✓' : '✗'}
              </span>
            )}
          </div>
          {formData.referralCode && referralCodeValid === false && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              Invalid referral code
            </p>
          )}
          <button type="submit" className="form-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign up'}
          </button>
        </form>
        <p className="sign-up-label">
          Already have an account?
          <span 
            className="sign-up-link"
            onClick={() => navigate('/login')}
          >
            Log in
          </span>
        </p>
        <div className="buttons-container">
          <div className="google-login-button" onClick={handleGoogleSignUp} style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            <GoogleIcon />
            <span>Sign up with Google</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
