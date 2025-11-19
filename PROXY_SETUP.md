# SMM API Proxy Server Setup Guide

This guide will help you set up a backend proxy server to avoid CORS issues when calling the SMM API.

## Why Do We Need a Proxy?

The SMM API (`https://smmguo.com/api/v2`) doesn't allow direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. A proxy server acts as a middleman:
- Your React app → Proxy Server → SMM API
- The proxy server makes the API call (no CORS restrictions)
- The proxy returns the data to your React app

## Quick Setup

### Option 1: Deploy to Railway (Recommended - Easiest)

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Create a new project** and select "Deploy from GitHub repo"

3. **Set the root directory** to `proxy-server` in Railway settings

4. **The proxy server files are already in the `proxy-server/` folder**:
   - `proxy-server/server.js`
   - `proxy-server/package.json`

5. **Set environment variables** in Railway:
   - `SMM_API_KEY` = Your SMM API key
   - `PORT` = 3001 (or leave default)
   - `FRONTEND_URL` = Your React app URL (e.g., `https://yourdomain.com`)

6. **Get your Railway URL** (e.g., `https://your-app.railway.app`)

7. **Update your React app's `.env` file**:
   ```
   REACT_APP_PROXY_URL=https://your-app.railway.app
   REACT_APP_USE_PROXY=true
   ```

### Option 2: Deploy to Heroku

1. **Install Heroku CLI** from [heroku.com](https://devcenter.heroku.com/articles/heroku-cli)

2. **Navigate to the proxy server folder**:
   ```bash
   cd proxy-server
   ```

3. **Initialize git and deploy**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku create your-proxy-name
   heroku config:set SMM_API_KEY=your_api_key_here
   heroku config:set FRONTEND_URL=https://yourdomain.com
   git push heroku main
   ```

5. **Update your React app's `.env`**:
   ```
   REACT_APP_PROXY_URL=https://your-proxy-name.herokuapp.com
   REACT_APP_USE_PROXY=true
   ```

### Option 3: Deploy to Vercel (Serverless Functions)

1. **Create a `api` folder** in your project root

2. **Create `api/smm.js`**:
   ```javascript
   export default async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     const { action, ...params } = req.body;
     const apiKey = process.env.SMM_API_KEY;

     if (!apiKey || !action) {
       return res.status(400).json({ error: 'Missing required parameters' });
     }

     const formData = new URLSearchParams();
     formData.append('key', apiKey);
     formData.append('action', action);
     Object.keys(params).forEach(key => {
       if (params[key] !== undefined && params[key] !== null) {
         formData.append(key, params[key]);
       }
     });

     try {
       const response = await fetch('https://smmguo.com/api/v2', {
         method: 'POST',
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         body: formData.toString(),
       });

       const data = await response.json();
       res.json(data);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   }
   ```

3. **Set environment variables** in Vercel:
   - `SMM_API_KEY` = Your API key

4. **Update your React app's `.env`**:
   ```
   REACT_APP_PROXY_URL=https://your-app.vercel.app
   REACT_APP_USE_PROXY=true
   ```

### Option 4: Local Development

1. **Navigate to proxy server folder**:
   ```bash
   cd proxy-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```
   PORT=3001
   SMM_API_KEY=your_smm_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the proxy server**:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

5. **Update your React app's `.env`** (in the main project directory):
   ```
   REACT_APP_PROXY_URL=http://localhost:3001
   REACT_APP_USE_PROXY=true
   ```

5. **Start your React app** (in a separate terminal):
   ```bash
   npm start
   ```

## Environment Variables

### Proxy Server (.env)
- `PORT` - Server port (default: 3001)
- `SMM_API_KEY` - Your SMM API key from smmguo.com
- `FRONTEND_URL` - Your React app URL (for CORS)

### React App (.env)
- `REACT_APP_PROXY_URL` - Your proxy server URL
- `REACT_APP_USE_PROXY` - Set to `true` to use proxy (default: true)

## Testing

1. **Test the proxy server**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test SMM API through proxy**:
   ```bash
   curl -X POST http://localhost:3001/api/smm \
     -H "Content-Type: application/json" \
     -d '{"action": "balance"}'
   ```

3. **Test from React app**:
   - Go to Admin Dashboard → Services
   - Click "Sync Services from API"
   - Should work without CORS errors!

## Troubleshooting

### "Cannot connect to proxy server"
- Check if proxy server is running
- Verify `REACT_APP_PROXY_URL` is correct
- Check CORS settings in proxy server

### "SMM API Key is required"
- Set `SMM_API_KEY` in proxy server environment
- Don't put API key in React app (security risk)

### Still getting CORS errors
- Make sure `FRONTEND_URL` in proxy matches your React app URL
- Check proxy server logs for errors
- Verify the proxy server is accessible from your domain

## Security Notes

⚠️ **Important**: Never put your SMM API key in the React app's `.env` file. The API key should only be stored in the proxy server's environment variables.

## Production Checklist

- [ ] Proxy server deployed and accessible
- [ ] `REACT_APP_PROXY_URL` set in React app
- [ ] `SMM_API_KEY` set in proxy server (not React app)
- [ ] CORS configured correctly
- [ ] Test sync functionality works
- [ ] Monitor proxy server logs

## Need Help?

If you encounter issues:
1. Check proxy server logs
2. Verify environment variables are set
3. Test proxy endpoint directly with curl
4. Check browser console for errors

