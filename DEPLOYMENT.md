# Vercel Deployment Guide for AI Agent Portal

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`

## Important Notes

### WebSocket Limitation
⚠️ **Vercel does not support WebSocket connections in serverless functions.**

Your application uses WebSocket for real-time agent notifications. For production deployment with WebSocket support, consider these alternatives:

1. **Deploy to a Platform with WebSocket Support:**
   - Railway (https://railway.app)
   - Render (https://render.com)
   - Heroku (https://heroku.com)
   - DigitalOcean App Platform
   - AWS EC2/ECS
   - Google Cloud Run

2. **Use Vercel with External WebSocket Service:**
   - Deploy HTTP routes to Vercel
   - Use a separate WebSocket service (Pusher, Ably, Socket.io hosted service)
   - Modify your code to use these services instead of native WebSocket

## Deploy to Vercel (HTTP Only)

If you want to deploy the HTTP endpoints only (without WebSocket):

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Configure Environment Variables
In your Vercel dashboard or via CLI, set these environment variables:

```bash
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
```

### Step 4: Deploy
From the project root directory:

```bash
cd /Users/ganjirajesh/ai-agent-portal/ai-agent-portal
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time)
- What's your project's name? **ai-agent-portal**
- In which directory is your code located? **./agent-login-app**
- Want to override the settings? **N**

### Step 5: Set Environment Variables in Vercel
```bash
vercel env add SESSION_SECRET
# Enter your secret key when prompted

vercel env add NODE_ENV
# Enter: production
```

### Step 6: Deploy to Production
```bash
vercel --prod
```

## Recommended: Deploy to Railway (Full WebSocket Support)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Initialize Project
```bash
cd /Users/ganjirajesh/ai-agent-portal/ai-agent-portal/agent-login-app
railway init
```

### Step 4: Set Environment Variables
```bash
railway variables set SESSION_SECRET=your-random-secret-key
railway variables set NODE_ENV=production
```

### Step 5: Deploy
```bash
railway up
```

### Step 6: Add Domain (Optional)
```bash
railway domain
```

## Files Created for Deployment

1. **vercel.json** - Vercel configuration
2. **.vercelignore** - Files to ignore during deployment
3. **.env.example** - Environment variables template
4. **package.json** - Updated with correct scripts

## Post-Deployment Checklist

- [ ] Update SESSION_SECRET environment variable
- [ ] Test all API endpoints
- [ ] Verify WebSocket connections (if using Railway/Render)
- [ ] Update PBX webhook URLs to point to your deployed domain
- [ ] Test agent login and notification flow
- [ ] Monitor logs for any errors

## Testing Your Deployment

### Test Login Endpoint
```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","password":"test123"}'
```

### Test IVR Flow
```bash
curl "https://your-domain.vercel.app/api/pbx/ivrflow?sid=test&event=NewCall"
```

### Test Call Notification
```bash
curl -X POST "https://your-domain.vercel.app/api/pbx/receive-call-notification?agentId=agent1" \
  -H "Content-Type: application/json" \
  -d '{"event":"ANSWERED","caller_number":"1234567890"}'
```

## Troubleshooting

### Error: Module not found
- Run `npm install` in the agent-login-app directory
- Ensure all dependencies are in package.json

### Error: Session secret not set
- Set the SESSION_SECRET environment variable in Vercel dashboard

### WebSocket connection failed
- Vercel doesn't support WebSocket - use Railway or Render instead

## Support
For issues, check the logs:
```bash
vercel logs
# or
railway logs
```
