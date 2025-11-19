/**
 * SMM Service - Handles all SMM API calls
 * Uses a proxy server to avoid CORS issues
 */

// Proxy server URL - Set this to your deployed proxy server URL
// For local development: http://localhost:3001
// For production: https://your-proxy-server.com
const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';
const USE_PROXY = process.env.REACT_APP_USE_PROXY !== 'false'; // Default to true

// Direct API (for reference, but won't work due to CORS)
const SMM_API_URL = 'https://smmguo.com/api/v2';
const API_KEY = process.env.REACT_APP_SMM_API_KEY;

/**
 * Helper function to make API requests through proxy
 */
async function makeRequest(params) {
  try {
    if (USE_PROXY) {
      // Use proxy server
      const response = await fetch(`${PROXY_URL}/api/smm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          // API key is handled by the proxy server from environment variables
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Proxy request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if the response contains an error from SMM API
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } else {
      // Direct API call (will fail due to CORS, but kept for reference)
      if (!API_KEY) {
        throw new Error(
          'SMM API Key is not configured. Please set up a proxy server or configure REACT_APP_SMM_API_KEY.'
        );
      }

      const formData = new URLSearchParams();
      formData.append('key', API_KEY);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          formData.append(key, params[key]);
        }
      });

      const response = await fetch(SMM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('SMM API Error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      if (USE_PROXY) {
        throw new Error(
          `Cannot connect to proxy server at ${PROXY_URL}. ` +
          'Please ensure the proxy server is running and REACT_APP_PROXY_URL is set correctly.'
        );
      } else {
        throw new Error(
          'CORS Error: Cannot connect to SMM API from browser. ' +
          'Please set up a proxy server by setting REACT_APP_PROXY_URL in your .env file.'
        );
      }
    }
    
    throw error;
  }
}

/**
 * Get all available services from SMM API
 * @returns {Promise<Array>} Array of services
 */
export async function getServices() {
  try {
    const data = await makeRequest({ action: 'services' });
    
    // Handle both array and object responses
    if (Array.isArray(data)) {
      return data;
    }
    
    // If it's an object with error
    if (data.error) {
      throw new Error(data.error);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

/**
 * Get account balance from SMM API
 * @returns {Promise<Object>} Balance information
 */
export async function getBalance() {
  try {
    const data = await makeRequest({ action: 'balance' });
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

/**
 * Create a new order
 * @param {Object} orderData - Order parameters
 * @param {number} orderData.service - Service ID
 * @param {string} orderData.link - Link to page
 * @param {number} [orderData.quantity] - Needed quantity
 * @param {number} [orderData.runs] - Runs to deliver
 * @param {number} [orderData.interval] - Interval in minutes
 * @param {string} [orderData.comments] - Custom comments
 * @param {string} [orderData.usernames] - Mentions custom list
 * @param {string} [orderData.hashtag] - Mentions hashtag
 * @param {string} [orderData.username] - Mentions user followers
 * @param {string} [orderData.media] - Mentions media likers
 * @param {string} [orderData.answer_number] - Poll answer number
 * @returns {Promise<Object>} Order response with order ID
 */
export async function createOrder(orderData) {
  try {
    const params = {
      action: 'add',
      service: orderData.service,
      link: orderData.link,
    };

    // Add optional parameters
    if (orderData.quantity) params.quantity = orderData.quantity;
    if (orderData.runs) params.runs = orderData.runs;
    if (orderData.interval) params.interval = orderData.interval;
    if (orderData.comments) params.comments = orderData.comments;
    if (orderData.usernames) params.usernames = orderData.usernames;
    if (orderData.hashtag) params.hashtag = orderData.hashtag;
    if (orderData.username) params.username = orderData.username;
    if (orderData.media) params.media = orderData.media;
    if (orderData.answer_number) params.answer_number = orderData.answer_number;

    const data = await makeRequest(params);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get order status
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Order status
 */
export async function getOrderStatus(orderId) {
  try {
    const data = await makeRequest({
      action: 'status',
      order: orderId,
    });
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching order status:', error);
    throw error;
  }
}

/**
 * Get multiple orders status
 * @param {Array<number>} orderIds - Array of order IDs
 * @returns {Promise<Object>} Orders status
 */
export async function getMultipleOrderStatus(orderIds) {
  try {
    const data = await makeRequest({
      action: 'status',
      orders: orderIds.join(','),
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching multiple orders status:', error);
    throw error;
  }
}

/**
 * Cancel orders
 * @param {Array<number>} orderIds - Array of order IDs to cancel
 * @returns {Promise<Array>} Cancel results
 */
export async function cancelOrders(orderIds) {
  try {
    const data = await makeRequest({
      action: 'cancel',
      orders: orderIds.join(','),
    });
    
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error canceling orders:', error);
    throw error;
  }
}

/**
 * Create refill for an order
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Refill response
 */
export async function createRefill(orderId) {
  try {
    const data = await makeRequest({
      action: 'refill',
      order: orderId,
    });
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating refill:', error);
    throw error;
  }
}

/**
 * Get refill status
 * @param {number} refillId - Refill ID
 * @returns {Promise<Object>} Refill status
 */
export async function getRefillStatus(refillId) {
  try {
    const data = await makeRequest({
      action: 'refill_status',
      refill: refillId,
    });
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching refill status:', error);
    throw error;
  }
}

export default {
  getServices,
  getBalance,
  createOrder,
  getOrderStatus,
  getMultipleOrderStatus,
  cancelOrders,
  createRefill,
  getRefillStatus,
};

