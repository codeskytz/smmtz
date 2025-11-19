# SMM Proxy Server

This is a standalone proxy server that handles SMM API requests to avoid CORS issues in the browser.

## Quick Start

### 1. Install Dependencies

```bash
cd proxy-server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3001
SMM_API_KEY=your_actual_smm_api_key_here
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port you specified).

## Testing

Test the health endpoint:
```bash
curl http://localhost:3001/health
```

Test the SMM API proxy:
```bash
curl -X POST http://localhost:3001/api/smm \
  -H "Content-Type: application/json" \
  -d '{"action": "balance"}'
```

## Deployment

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Set the root directory to `proxy-server`
4. Add environment variables:
   - `SMM_API_KEY`
   - `FRONTEND_URL`
   - `PORT` (optional, defaults to 3001)
5. Deploy!

### Heroku

1. Create a new Heroku app:
   ```bash
   heroku create your-proxy-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set SMM_API_KEY=your_key
   heroku config:set FRONTEND_URL=https://yourdomain.com
   ```

3. Deploy:
   ```bash
   git subtree push --prefix proxy-server heroku main
   ```

### Other Platforms

Any Node.js hosting platform will work. Just:
- Set the working directory to `proxy-server`
- Set the environment variables
- Run `npm start`

## API Endpoints

### `GET /health`
Health check endpoint. Returns server status.

### `POST /api/smm`
Proxies requests to the SMM API.

**Request Body:**
```json
{
  "action": "services",
  // ... other SMM API parameters
}
```

**Response:**
Returns the SMM API response directly.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `SMM_API_KEY` | Your SMM API key | Yes | - |
| `FRONTEND_URL` | Your React app URL (for CORS) | No | * (allows all) |

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to git
- Keep your `SMM_API_KEY` secret
- Set `FRONTEND_URL` to your actual domain in production
- Use HTTPS in production

## Troubleshooting

### "Cannot connect to proxy server"
- Check if the server is running
- Verify the port is correct
- Check firewall settings

### "SMM API Key is required"
- Make sure `.env` file exists
- Verify `SMM_API_KEY` is set correctly
- Restart the server after changing `.env`

### CORS errors
- Set `FRONTEND_URL` to your exact React app URL
- Include protocol (http:// or https://)
- No trailing slash

## Need Help?

See the main project's `PROXY_SETUP.md` for detailed setup instructions.

