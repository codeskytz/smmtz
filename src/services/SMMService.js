/**
 * SMM Service - Handles all SMM API calls
 */

const SMM_API_URL = 'https://smmguo.com/api/v2';
const API_KEY = process.env.REACT_APP_SMM_API_KEY;

// Validate API key on service initialization
if (!API_KEY) {
  console.warn(
    'SMM API Key is missing. Please create a .env file with REACT_APP_SMM_API_KEY.\n' +
    'Copy .env.example to .env and add your actual API key.'
  );
}

/**
 * Helper function to make API requests
 */
async function makeRequest(params) {
  try {
    if (!API_KEY) {
      throw new Error(
        'SMM API Key is not configured. Please create a .env file with REACT_APP_SMM_API_KEY=your_key'
      );
    }

    // Convert params to URL-encoded form data
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        formData.append(key, params[key]);
      }
    });

    const response = await fetch(SMM_API_URL, {
      method: 'POST',
      mode: 'cors', // Explicitly set CORS mode
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
  } catch (error) {
    console.error('SMM API Error:', error);
    
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(
        'CORS Error: Cannot connect to SMM API from browser. ' +
        'This API requires a backend proxy. Please set up a backend endpoint or use the "Add Service" button to manually add services.'
      );
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Network Error: Unable to reach SMM API. Please check your internet connection and API endpoint.'
      );
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

