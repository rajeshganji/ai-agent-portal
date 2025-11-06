# 🚀 Railway Deployment Guide - AI Agent Portal

## Why Railway?
- ✅ Full WebSocket support
- ✅ Easy deployment from GitHub
- ✅ Free tier: $5 credit/month
- ✅ Auto-scaling and monitoring
- ✅ Custom domains supported

## Deployment Steps

### Method 1: Deploy from GitHub (Recommended)

#### Step 1: Push Code to GitHub
```bash
cd /Users/ganjirajesh/ai-agent-portal/ai-agent-portal
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

#### Step 2: Deploy on Railway
1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `rajeshganji/ai-agent-portal`
5. Railway will auto-detect your Node.js app

#### Step 3: Configure Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```
NODE_ENV=production
SESSION_SECRET=<generate-a-strong-random-string>
PORT=3000
```

**Generate SESSION_SECRET:**
```bash
# Use this command to generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 4: Configure Root Directory
1. In Railway dashboard, go to **Settings**
2. Under **Build & Deploy**, set:
   - **Root Directory**: `agent-login-app`
   - **Build Command**: `npm install --production`
   - **Start Command**: `npm start`

#### Step 5: Deploy
- Railway will automatically deploy
- Wait for deployment to complete (2-3 minutes)
- Your app will be available at: `https://your-app.railway.app`

#### Step 6: Add Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Click **Generate Domain** for a Railway subdomain
3. Or add your own custom domain

---

### Method 2: Deploy Using Railway CLI

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login to Railway
```bash
railway login
```

This will open a browser for authentication.

#### Step 3: Initialize Project
```bash
cd /Users/ganjirajesh/ai-agent-portal/ai-agent-portal/agent-login-app
railway init
```

Select:
- **Create a new project**
- Give it a name: `ai-agent-portal`

#### Step 4: Link to Project
```bash
railway link
```

#### Step 5: Set Environment Variables
```bash
# Generate and set session secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables set SESSION_SECRET=$SESSION_SECRET

# Set environment
railway variables set NODE_ENV=production

# Verify variables
railway variables
```

#### Step 6: Deploy
```bash
railway up
```

Wait for deployment to complete.

#### Step 7: Get Your URL
```bash
railway domain
```

Or generate a new domain:
```bash
railway domain --generate
```

#### Step 8: View Logs
```bash
railway logs
```

---

## 📋 Post-Deployment Checklist

### 1. Test HTTP Endpoints

**Login:**
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent1","password":"pass123"}'
```

**IVR Flow:**
```bash
curl "https://your-app.railway.app/api/pbx/ivrflow?sid=test123&event=NewCall"
```

**Call Notification:**
```bash
curl -X POST "https://your-app.railway.app/api/pbx/receive-call-notification?agentId=agent1" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ANSWERED",
    "caller_number": "9985392390",
    "ucid": "119627154547506",
    "status": "answered"
  }'
```

### 2. Test WebSocket Connection

Open browser console and test:
```javascript
// Replace with your Railway URL
const ws = new WebSocket('wss://your-app.railway.app');

ws.onopen = () => {
    console.log('WebSocket Connected');
    ws.send(JSON.stringify({
        type: 'register',
        agentId: 'agent1'
    }));
};

ws.onmessage = (event) => {
    console.log('Received:', event.data);
};

ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
};
```

### 3. Update PBX Webhook URLs

Update your PBX/Ozonetel configuration to point to:
- IVR Flow: `https://your-app.railway.app/api/pbx/ivrflow`
- Call Notifications: `https://your-app.railway.app/api/pbx/receive-call-notification?agentId={agentId}`

### 4. Test Agent Login Flow
1. Visit: `https://your-app.railway.app`
2. Login with credentials
3. Verify WebSocket connection in browser console
4. Test receiving call notifications

---

## 🔧 Troubleshooting

### Deployment Failed
```bash
railway logs
```
Check for:
- Missing dependencies
- Build errors
- Port conflicts

### WebSocket Not Connecting
1. Ensure you're using `wss://` (not `ws://`)
2. Check Railway logs for connection errors
3. Verify firewall/proxy settings

### Environment Variables Not Set
```bash
railway variables
```
If missing, set them again:
```bash
railway variables set SESSION_SECRET=your-secret-here
railway variables set NODE_ENV=production
```

### App Crashing
```bash
railway logs --tail
```
Common issues:
- Missing `xmldom` package: `cd agent-login-app && npm install xmldom`
- Port already in use: Railway handles this automatically
- Session secret not set: Add SESSION_SECRET variable

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will:
1. Detect the push
2. Build your app
3. Run tests (if configured)
4. Deploy automatically
5. Send notification when complete

---

## 📊 Monitoring

### View Logs
```bash
railway logs
railway logs --tail  # Follow logs in real-time
```

### View Metrics
- Go to Railway dashboard
- Click on your project
- View **Metrics** tab for:
  - CPU usage
  - Memory usage
  - Network traffic
  - Response times

### Set Up Alerts
1. Go to **Settings** → **Notifications**
2. Add webhook URL for alerts
3. Configure alert thresholds

---

## 💰 Pricing

**Free Tier:**
- $5 credit per month
- Enough for development/testing
- ~500 hours of runtime

**Pro Plan ($20/month):**
- $20 credit included
- Pay as you grow
- Priority support

---

## 🆘 Support

### Railway Documentation
https://docs.railway.app

### Railway Discord
https://discord.gg/railway

### Check Status
https://status.railway.app

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ App loads at Railway URL
- ✅ Login page displays correctly
- ✅ Agent can login successfully
- ✅ WebSocket connects (check browser console)
- ✅ Call notifications are received
- ✅ IVR flow returns XML response
- ✅ All API endpoints respond correctly

---

## 🔐 Security Best Practices

1. **Use Strong SESSION_SECRET**
   ```bash
   # Generate a new one
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Enable HTTPS Only** (Railway does this by default)

3. **Set Secure Cookies** (Already configured in code)

4. **Limit CORS** (Add if needed)

5. **Monitor Logs** for suspicious activity

---

## 📝 Quick Reference Commands

```bash
# Login
railway login

# Link project
railway link

# Set variables
railway variables set KEY=value

# View variables
railway variables

# Deploy
railway up

# View logs
railway logs
railway logs --tail

# Get domain
railway domain

# Open in browser
railway open

# Delete deployment
railway down
```

---

## 🎉 You're All Set!

Your AI Agent Portal with full WebSocket support is now deployed on Railway!

**Next Steps:**
1. Share the URL with your team
2. Update PBX webhooks
3. Monitor logs during first calls
4. Set up custom domain if needed
