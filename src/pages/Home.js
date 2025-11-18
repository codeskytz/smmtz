import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // SVG Icons
  const UsersIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );

  const HeartIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );

  const EyeIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const MessageIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  const FacebookIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
    </svg>
  );

  const InstagramIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2"></path>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"></circle>
    </svg>
  );

  const TwitterIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s1.1 5.5-7 9"></path>
    </svg>
  );

  const GrowthIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );

  return (
    <div className="App" data-theme={isDarkTheme ? 'dark' : 'light'}>
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo-section">
            <img src="https://i.ibb.co/0RK2ydNg/idea.png" alt="SMMTZ Logo" className="logo" />
            <span className="logo-text">SMMTZ</span>
          </div>
          <div className="nav-right">
            <label className="switch">
              <input 
                id="theme-input" 
                type="checkbox" 
                checked={isDarkTheme}
                onChange={toggleTheme}
              />
              <div className="slider round">
                <div className="sun-moon">
                  <svg id="moon-dot-1" className="moon-dot" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="moon-dot-2" className="moon-dot" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="moon-dot-3" className="moon-dot" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="light-ray-1" className="light-ray" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="light-ray-2" className="light-ray" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="light-ray-3" className="light-ray" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-1" className="cloud-dark" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-2" className="cloud-dark" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-3" className="cloud-dark" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-4" className="cloud-light" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-5" className="cloud-light" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                  <svg id="cloud-6" className="cloud-light" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="50"></circle>
                  </svg>
                </div>
                <div className="stars">
                  <svg id="star-1" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                  <svg id="star-2" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                  <svg id="star-3" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                  <svg id="star-4" className="star" viewBox="0 0 20 20">
                    <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
                  </svg>
                </div>
              </div>
            </label>
            <button className="cta-btn" onClick={() => navigate('/login')}>Get Started</button>
          </div>
        </div>
      </nav>

      {user && (
        <div className="user-banner">
          <div className="user-info">
            <span className="welcome-text">Welcome, {user.displayName || user.email}!</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="hero-blob-1"></div>
        <div className="hero-blob-2"></div>
        <div className="hero-blob-3"></div>
        <div className="hero-container">
          <div className="hero-content">
            <h1>Elevate Your Social Media Presence</h1>
            <p>Professional growth strategies for your brand. Real engagement, authentic growth, and measurable results.</p>
            <div className="hero-buttons">
              <button className="btn primary" onClick={() => navigate('/register')}>Start Growing</button>
              <button className="btn secondary">Learn More</button>
            </div>
          </div>
          <div className="hero-illustration">
            <div className="illustration-card">
              <div className="growth-chart">
                <GrowthIcon />
              </div>
              <div className="stat-box">
                <div className="stat-label">Growth Rate</div>
                <div className="stat-value">+250%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose SMMTZ?</h2>
            <p>Comprehensive solutions for sustainable social media growth</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="icon-wrapper primary">
                <UsersIcon />
              </div>
              <h3>Real Followers</h3>
              <p>High-quality, targeted followers that genuinely engage with your content.</p>
            </div>
            <div className="feature-card">
              <div className="icon-wrapper secondary">
                <HeartIcon />
              </div>
              <h3>Authentic Engagement</h3>
              <p>Boost your posts with genuine interactions from active community members.</p>
            </div>
            <div className="feature-card">
              <div className="icon-wrapper tertiary">
                <EyeIcon />
              </div>
              <h3>Increased Visibility</h3>
              <p>Get more visibility with organic reach and improved algorithmic performance.</p>
            </div>
            <div className="feature-card">
              <div className="icon-wrapper quaternary">
                <MessageIcon />
              </div>
              <h3>Community Building</h3>
              <p>Foster meaningful interactions and build a loyal community around your brand.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Social Presence?</h2>
          <p>Join leading brands growing their influence with SMMTZ</p>
          <button className="btn primary large" onClick={() => navigate('/login')}>Get Started Today</button>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo-wrapper">
                <img src="https://i.ibb.co/0RK2ydNg/idea.png" alt="SMMTZ Logo" className="footer-logo" />
                <span className="footer-logo-text">SMMTZ</span>
              </div>
              <p>Professional social media growth solutions for Tanzanian and international brands.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#privacy">Privacy</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-icons">
                <a href="#facebook" className="social-icon facebook" title="Facebook">
                  <FacebookIcon />
                </a>
                <a href="#instagram" className="social-icon instagram" title="Instagram">
                  <InstagramIcon />
                </a>
                <a href="#twitter" className="social-icon twitter" title="Twitter">
                  <TwitterIcon />
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 SMMTZ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
