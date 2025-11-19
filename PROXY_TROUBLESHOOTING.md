# Proxy Server Troubleshooting Guide

If you're getting "Cannot connect to proxy server" errors, follow these steps:

## Step 1: Verify Environment Variable is Set

### Check Your .env File

Make sure you have a `.env` file in your **React app root directory** (not in proxy-server folder) with:

```env
REACT_APP_PROXY_URL=https://your-proxy-server.com
REACT_APP_USE_PROXY=true
```

**Important Notes:**
- ✅ Variable name must start with `REACT_APP_`
- ✅ No spaces around the `=` sign
- ✅ No quotes needed (unless the URL contains special characters)
- ✅ No trailing slash at the end of the URL

### Verify It's Loaded

1. Open browser console (F12)
2. Look for: `🔧 SMM Service Configuration:`
3. Check if `REACT_APP_PROXY_URL` shows your proxy URL

If it shows `undefined` or the default `http://localhost:3001`, the environment variable is not being loaded.

## Step 2: Rebuild Your App

**CRITICAL:** After changing `.env` file, you MUST rebuild:

```bash
# For development
npm start

# For production
npm run build
```

React apps only read `.env` files during build time, not at runtime!

## Step 3: Test Proxy Server Directly

### Test Health Endpoint

Open in browser or use curl:
```
https://your-proxy-server.com/health
```

Should return:
```json
{
  "status": "ok",
  "message": "SMM Proxy Server is running"
}
```

### Test SMM API Endpoint

```bash
curl -X POST https://your-proxy-server.com/api/smm \
  -H "Content-Type: application/json" \
  -d '{"action": "balance"}'
```

## Step 4: Check CORS Configuration

### Verify Proxy Server CORS Settings

In `proxy-server/server.js`, check:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Should be your React app URL
  credentials: true
}));
```

**In Production:**
- Set `FRONTEND_URL` to your exact React app domain
- Include protocol: `https://yourdomain.com`
- No trailing slash
- Example: `FRONTEND_URL=https://smmtz.vercel.app`

### Common CORS Issues

1. **Wildcard (`*`) doesn't work with credentials**
   - If using `credentials: true`, you must specify exact domain
   - Don't use `*` in production

2. **Protocol mismatch**
   - If React app is `https://`, proxy must allow `https://`
   - Can't mix `http://` and `https://`

3. **Subdomain mismatch**
   - `https://app.example.com` ≠ `https://www.example.com`
   - Must match exactly

## Step 5: Check Network/Firewall

### Browser Console Errors

Open browser DevTools → Network tab:
1. Try to sync services
2. Look for failed requests
3. Check the error message:
   - `CORS policy` = CORS issue
   - `Failed to fetch` = Network/connection issue
   - `404 Not Found` = Wrong URL
   - `500 Internal Server Error` = Proxy server error

### Test from Different Network

Try accessing your proxy from:
- Different browser
- Incognito/private mode
- Different network (mobile data)
- Different device

## Step 6: Verify Proxy Server Environment Variables

On your proxy server (Railway/Heroku/etc.), check:

```env
SMM_API_KEY=your_actual_api_key
FRONTEND_URL=https://your-react-app-domain.com
PORT=3001
```

**Important:**
- `FRONTEND_URL` should be your **React app** URL, not proxy URL
- No trailing slash
- Include protocol (`https://`)

## Step 7: Check Proxy Server Logs

### Railway
- Go to your project → Deployments → View logs

### Heroku
```bash
heroku logs --tail --app your-proxy-name
```

Look for:
- Server startup messages
- Error messages
- Request logs

## Common Issues & Solutions

### Issue: "REACT_APP_PROXY_URL is undefined"

**Solution:**
1. Check `.env` file exists in React app root
2. Variable name is exactly `REACT_APP_PROXY_URL`
3. Rebuild the app: `npm run build`
4. Restart dev server: `npm start`

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
1. Set `FRONTEND_URL` on proxy server to your exact React app URL
2. Restart proxy server
3. Clear browser cache
4. Try incognito mode

### Issue: "404 Not Found" when calling proxy

**Solution:**
1. Check proxy URL is correct (no typos)
2. Verify endpoint: `/api/smm` (not `/api/smm/`)
3. Check proxy server is actually running
4. Verify the deployment was successful

### Issue: "500 Internal Server Error"

**Solution:**
1. Check proxy server logs
2. Verify `SMM_API_KEY` is set on proxy server
3. Test SMM API key is valid
4. Check proxy server code for errors

### Issue: Works locally but not in production

**Solution:**
1. Verify production `.env` file has `REACT_APP_PROXY_URL`
2. Rebuild for production: `npm run build`
3. Check production build includes environment variables
4. Verify proxy server `FRONTEND_URL` matches production domain

## Quick Diagnostic Checklist

- [ ] `.env` file exists in React app root
- [ ] `REACT_APP_PROXY_URL` is set correctly
- [ ] App was rebuilt after changing `.env`
- [ ] Proxy server is running (test `/health` endpoint)
- [ ] `FRONTEND_URL` is set on proxy server
- [ ] `SMM_API_KEY` is set on proxy server
- [ ] CORS allows your React app domain
- [ ] No trailing slashes in URLs
- [ ] Protocol matches (both https or both http)
- [ ] Browser console shows correct `PROXY_URL`

## Still Not Working?

1. **Use the Proxy Test Component**
   - Go to Admin Dashboard → Services
   - Use the "Test Connection" button
   - Check the detailed error message

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error messages
   - Check Network tab for failed requests

3. **Test Proxy Manually**
   ```bash
   # Test health
   curl https://your-proxy.com/health
   
   # Test API
   curl -X POST https://your-proxy.com/api/smm \
     -H "Content-Type: application/json" \
     -d '{"action": "balance"}'
   ```

4. **Verify Environment Variables**
   - React app: Check browser console for `PROXY_URL`
   - Proxy server: Check deployment platform environment variables

## Need More Help?

Share these details:
1. Error message from browser console
2. Proxy server URL
3. React app URL
4. Proxy server logs
5. Browser Network tab screenshot

