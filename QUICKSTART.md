# 🚀 Quick Start - Railway Deployment

## Option 1: Deploy from GitHub (Easiest - Recommended)

### Step 1: Push to GitHub
```bash
cd /Users/ganjirajesh/ai-agent-portal/ai-agent-portal
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose `rajeshganji/ai-agent-portal`
6. Railway will auto-deploy

### Step 3: Configure Settings
In Railway Dashboard:
- **Settings** → **Root Directory**: Set to `agent-login-app`
- **Variables** → Add these:
  ```
  SESSION_SECRET=<run the command below to generate>
  NODE_ENV=production
  ```

Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Get Your URL
- Go to **Settings** → **Domains**
- Click **"Generate Domain"**
- Your app will be at: `https://your-app.railway.app`

**DONE! ✅ Your app is live with WebSocket support!**

---

## Option 2: Deploy Using CLI

### Quick Setup Script
Run this automated setup:
```bash
cd /Users/ganjirajesh/ai-agent-portal/ai-agent-portal
./deploy-setup.sh
```

Then follow the instructions printed by the script.

### Manual CLI Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd agent-login-app
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   # Generate secret
   SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   
   # Set variables
   railway variables set SESSION_SECRET=$SESSION_SECRET
   railway variables set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get URL**
   ```bash
   railway domain
   ```

---

## ✅ Verify Deployment

### Test 1: Check if app is running
```bash
curl https://your-app.railway.app
```

### Test 2: Test Login API
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","password":"test123"}'
```

### Test 3: Test WebSocket (in browser console)
```javascript
const ws = new WebSocket('wss://your-app.railway.app');
ws.onopen = () => console.log('✅ WebSocket Connected!');
ws.send(JSON.stringify({type: 'register', agentId: 'test'}));
```

### Test 4: Test IVR
```bash
curl "https://your-app.railway.app/api/pbx/ivrflow?sid=test&event=NewCall"
```

---

## 🔧 Troubleshooting

**App not starting?**
```bash
railway logs
```

**WebSocket not connecting?**
- Make sure you use `wss://` (not `ws://`)
- Check browser console for errors

**Need to update code?**
```bash
git push origin main
```
Railway will auto-deploy!

---

## 📞 Update PBX Configuration

After deployment, update your Ozonetel/KooKoo configuration:

**IVR URL:**
```
https://your-app.railway.app/api/pbx/ivrflow
```

**Call Notification URL:**
```
https://your-app.railway.app/api/pbx/receive-call-notification?agentId={agentId}
```

---

## 🎉 Success!

Your AI Agent Portal is now deployed with:
- ✅ Full WebSocket support for real-time notifications
- ✅ All API endpoints working
- ✅ Auto-scaling
- ✅ HTTPS enabled
- ✅ Continuous deployment from GitHub

**Access your app:**
- Agent Login: `https://your-app.railway.app`
- Toolbar: `https://your-app.railway.app/toolbar`

---

For detailed documentation, see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
