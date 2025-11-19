/**
 * Payment Service - Handles all FastLipa payment gateway API calls
 */

const FASTLIPA_API_URL = 'https://api.fastlipa.com/api';
const API_KEY = process.env.REACT_FASTLIPA_API_KEY;

// Validate API key on service initialization
if (!API_KEY) {
  console.warn(
    'FastLipa API Key is missing. Please create a .env file with REACT_FASTLIPA_API_KEY.\n' +
    'Copy .env.example to .env and add your actual API key.'
  );
}

/**
 * Get account balance from FastLipa
 * @returns {Promise<Object>} Balance information
 */
export async function getBalance() {
  try {
    if (!API_KEY) {
      throw new Error(
        'FastLipa API Key is not configured. Please create a .env file with REACT_FASTLIPA_API_KEY=your_key'
      );
    }

    const response = await fetch(`${FASTLIPA_API_URL}/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Balance fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

/**
 * Create a payment transaction
 * @param {string} phoneNumber - Recipient's phone number
 * @param {number} amount - Amount in smallest currency unit
 * @param {string} recipientName - Recipient's full name
 * @returns {Promise<Object>} Transaction response with tranID
 */
export async function createTransaction(phoneNumber, amount, recipientName) {
  try {
    if (!API_KEY) {
      throw new Error(
        'FastLipa API Key is not configured. Please create a .env file with REACT_FASTLIPA_API_KEY=your_key'
      );
    }

    // Validate inputs
    if (!phoneNumber || !amount || !recipientName) {
      throw new Error('Missing required fields: phoneNumber, amount, recipientName');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const response = await fetch(`${FASTLIPA_API_URL}/create-transaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phoneNumber,
        amount: parseInt(amount),
        name: recipientName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Transaction creation failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Transaction creation failed');
    }

    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Check transaction status from FastLipa API
 * @param {string} tranID - Transaction ID to check
 * @returns {Promise<Object>} Transaction status response
 */
export async function getTransactionStatus(tranID) {
  try {
    if (!API_KEY) {
      throw new Error(
        'FastLipa API Key is not configured. Please create a .env file with REACT_FASTLIPA_API_KEY=your_key'
      );
    }

    if (!tranID) {
      throw new Error('Transaction ID is required');
    }

    const response = await fetch(
      `${FASTLIPA_API_URL}/status-transaction?tranid=${encodeURIComponent(tranID)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to fetch transaction status');
    }

    return data;
  } catch (error) {
    console.error('Error checking transaction status:', error);
    throw error;
  }
}

/**
 * Format currency
 * @param {number} amount - Amount in smallest unit
 * @param {string} currency - Currency code (default: TZS)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'TZS') {
  const num = amount / 100; // Convert from smallest unit
  return `${currency} ${num.toLocaleString('en-TZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse phone number to international format
 * @param {string} number - Phone number (local or international)
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(number) {
  // Remove any non-digit characters
  const cleaned = number.replace(/\D/g, '');

  // Handle Tanzania numbers (255xxx)
  if (cleaned.length === 9) {
    return `255${cleaned}`; // Local format 0xxx -> 255xxx
  } else if (cleaned.length === 12 && cleaned.startsWith('255')) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Validate phone number
 * @param {string} number - Phone number to validate
 * @returns {boolean} Is valid
 */
export function isValidPhoneNumber(number) {
  const formatted = formatPhoneNumber(number);
  return formatted.length === 12 && formatted.startsWith('255');
}

export default {
  getBalance,
  createTransaction,
  getTransactionStatus,
  formatCurrency,
  formatPhoneNumber,
  isValidPhoneNumber,
};
