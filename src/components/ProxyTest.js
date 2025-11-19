/**
 * Proxy Connection Test Component
 * Use this to test your proxy server connection
 */
import React, { useState } from 'react';
import SMMService from '../services/SMMService';

const ProxyTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    setError(null);

    try {
      // Test health endpoint first
      const proxyUrl = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';
      
      console.log('Testing proxy connection...');
      console.log('Proxy URL:', proxyUrl);
      
      // Test health endpoint
      try {
        const healthResponse = await fetch(`${proxyUrl}/health`);
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);
      } catch (healthError) {
        console.error('Health check failed:', healthError);
        throw new Error(`Cannot reach proxy server at ${proxyUrl}/health. Check if the server is running.`);
      }

      // Test SMM API through proxy
      const services = await SMMService.getServices();
      setResult({
        success: true,
        message: `Successfully connected! Found ${services.length} services.`,
        servicesCount: services.length,
        proxyUrl: proxyUrl
      });
    } catch (err) {
      console.error('Test failed:', err);
      setError({
        message: err.message,
        proxyUrl: process.env.REACT_APP_PROXY_URL || 'http://localhost:3001',
        envVar: process.env.REACT_APP_PROXY_URL ? 'Set' : 'Not set'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: 'var(--card-bg)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      marginBottom: '1rem'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>🔧 Proxy Server Connection Test</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Current Configuration:</strong>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li>REACT_APP_PROXY_URL: {process.env.REACT_APP_PROXY_URL || '❌ Not set (using default: http://localhost:3001)'}</li>
          <li>REACT_APP_USE_PROXY: {process.env.REACT_APP_USE_PROXY !== 'false' ? '✅ Enabled' : '❌ Disabled'}</li>
        </ul>
      </div>

      <button
        onClick={testConnection}
        disabled={testing}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: testing ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          opacity: testing ? 0.6 : 1
        }}
      >
        {testing ? 'Testing...' : 'Test Connection'}
      </button>

      {result && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '8px',
          color: '#4caf50'
        }}>
          <strong>✅ Success!</strong>
          <p>{result.message}</p>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            Proxy URL: {result.proxyUrl}
          </p>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(244, 67, 54, 0.1)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderRadius: '8px',
          color: '#f44336'
        }}>
          <strong>❌ Connection Failed</strong>
          <p style={{ whiteSpace: 'pre-line' }}>{error.message}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <p><strong>Proxy URL:</strong> {error.proxyUrl}</p>
            <p><strong>REACT_APP_PROXY_URL:</strong> {error.envVar}</p>
          </div>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.05)', borderRadius: '6px' }}>
            <strong>Quick Fixes:</strong>
            <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Check if REACT_APP_PROXY_URL is set in your .env file</li>
              <li>Rebuild your app: <code>npm run build</code></li>
              <li>Verify the proxy server is running: <a href={`${error.proxyUrl}/health`} target="_blank" rel="noopener noreferrer">Test Health Endpoint</a></li>
              <li>Check CORS settings on your proxy server</li>
              <li>Verify the proxy URL is correct (no trailing slash)</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProxyTest;

