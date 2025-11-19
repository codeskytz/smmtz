# Quick Start: Fix CORS Error

## The Problem
You're getting CORS errors when trying to sync services because browsers block direct API calls to `smmguo.com`.

## The Solution
Use a proxy server that makes the API calls for you.

## Fastest Setup (5 minutes)

### Step 1: Deploy Proxy to Railway (Free)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Set the root directory to `proxy-server` in Railway settings

4. The proxy server is already in the `proxy-server/` folder. Add environment variables in Railway:
     ```
     SMM_API_KEY=your_actual_api_key_here
     PORT=3001
     FRONTEND_URL=https://your-react-app-domain.com
     ```
5. Railway will give you a URL like: `https://your-app.railway.app`

### Step 2: Update Your React App

**Note:** Make sure you're in the main project directory (not proxy-server folder)

Add to your React app's `.env` file:
```
REACT_APP_PROXY_URL=https://your-app.railway.app
REACT_APP_USE_PROXY=true
```

### Step 3: Rebuild and Deploy

```bash
npm run build
# Deploy your React app
```

### Step 4: Test

Go to Admin Dashboard → Services → Click "Sync Services from API"

✅ Should work without CORS errors!

## Alternative: Local Development

1. Navigate to proxy server folder:
   ```bash
   cd proxy-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   PORT=3001
   SMM_API_KEY=your_api_key
   FRONTEND_URL=http://localhost:3000
   ```

4. Start proxy server:
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

5. Update React `.env` (in the main project directory):
   ```
   REACT_APP_PROXY_URL=http://localhost:3001
   REACT_APP_USE_PROXY=true
   ```

6. Start React app (in another terminal, from main project directory):
   ```bash
   npm start
   ```

## Important Notes

- ✅ API key goes in **proxy server** `.env` (not React app)
- ✅ Proxy server URL goes in **React app** `.env`
- ✅ Never commit API keys to git
- ✅ Use environment variables in production

## Need More Help?

See `PROXY_SETUP.md` for detailed instructions and other deployment options.

