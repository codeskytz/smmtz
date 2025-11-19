/**
 * SMM API Proxy Server
 * This server proxies requests to the SMM API to avoid CORS issues
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const SMM_API_URL = 'https://smmguo.com/api/v2';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow your frontend domain
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SMM Proxy Server is running' });
});

// Proxy endpoint for SMM API
app.post('/api/smm', async (req, res) => {
  try {
    const { action, ...params } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    // Get API key from environment or request
    const apiKey = process.env.SMM_API_KEY || req.body.key;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'SMM API Key is required' });
    }

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    formData.append('action', action);
    
    // Add other parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && key !== 'key') {
        formData.append(key, params[key]);
      }
    });

    // Make request to SMM API
    const response = await fetch(SMM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `SMM API error: ${response.statusText}`,
        details: errorText 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SMM Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxying requests to: ${SMM_API_URL}`);
  console.log(`🔑 API Key configured: ${process.env.SMM_API_KEY ? 'Yes' : 'No'}`);
});

