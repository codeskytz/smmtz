/**
 * Utility functions for referral code management
 */

/**
 * Get referral code from URL parameters
 * @returns {string|null} Referral code or null
 */
export const getReferralCodeFromURL = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  } catch (err) {
    console.warn('Error getting referral code from URL:', err);
    return null;
  }
};

/**
 * Store referral code in sessionStorage
 * @param {string} code - Referral code to store
 */
export const storeReferralCode = (code) => {
  try {
    if (code && code.trim()) {
      sessionStorage.setItem('referralCode', code.toUpperCase().trim());
    }
  } catch (err) {
    console.warn('Error storing referral code:', err);
  }
};

/**
 * Get referral code from sessionStorage
 * @returns {string|null} Referral code or null
 */
export const getStoredReferralCode = () => {
  try {
    return sessionStorage.getItem('referralCode');
  } catch (err) {
    console.warn('Error getting referral code from storage:', err);
    return null;
  }
};

/**
 * Remove referral code from sessionStorage
 */
export const clearStoredReferralCode = () => {
  try {
    sessionStorage.removeItem('referralCode');
  } catch (err) {
    console.warn('Error clearing referral code from storage:', err);
  }
};

/**
 * Preserve referral code in navigation
 * @param {string} path - Path to navigate to
 * @param {string|null} refCode - Referral code to preserve
 * @returns {string} Path with referral code parameter
 */
export const preserveReferralInNavigation = (path, refCode = null) => {
  const code = refCode || getReferralCodeFromURL() || getStoredReferralCode();
  if (code) {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}ref=${code}`;
  }
  return path;
};

