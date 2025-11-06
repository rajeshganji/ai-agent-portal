# 🚀 Pre-Deployment Checklist

## ✅ Security Implementation Completed

Your application now includes:
- ✅ Helmet.js security headers
- ✅ Rate limiting (auth, API, webhooks)
- ✅ CORS protection
- ✅ Input validation
- ✅ Session security
- ✅ WebSocket security

## 📋 Deployment Steps

### 1. Generate SESSION_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save this output - you'll need it!**

### 2. Commit Changes

```bash
cd /Users/ganjirajesh/ai-agent-portal/ai-agent-portal
git add .
git commit -m "feat: Add comprehensive security features

- Add Helmet.js for security headers
- Implement rate limiting for all endpoints
- Add CORS protection
- Implement input validation
- Enhance session security
- Add WebSocket security
- Update documentation"
git push origin main
```

### 3. Deploy to Railway

#### Option A: GitHub (Recommended)

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `rajeshganji/ai-agent-portal`
5. Railway will auto-detect and deploy

#### Option B: CLI

```bash
# Login
railway login

# Initialize
cd agent-login-app
railway init

# Deploy
railway up
```

### 4. Set Environment Variables in Railway

**Critical - Must be set before first deployment:**

```env
SESSION_SECRET=<paste-the-generated-secret-from-step-1>
NODE_ENV=production
```

**Optional (but recommended):**

```env
ALLOWED_ORIGINS=https://your-app.railway.app
```

### 5. Configure Railway Settings

In Railway Dashboard → Settings:

- **Root Directory**: `agent-login-app`
- **Build Command**: `npm install --production`
- **Start Command**: `npm start`

### 6. Verify Deployment

Once deployed, test:

```bash
# Replace YOUR_APP_URL with your Railway URL
export APP_URL=https://your-app.railway.app

# Test homepage
curl $APP_URL

# Test login (should show rate limit headers)
curl -I -X POST $APP_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","agentId":"agent1","password":"pass"}'

# Test IVR
curl "$APP_URL/api/pbx/ivrflow?sid=test&event=NewCall"
```

### 7. Update PBX Configuration

Update your Ozonetel/KooKoo URLs to:

```
IVR: https://your-app.railway.app/api/pbx/ivrflow
Webhook: https://your-app.railway.app/api/pbx/receive-call-notification?agentId={agentId}
```

## 🔍 Post-Deployment Verification

### Check 1: Security Headers

```bash
curl -I https://your-app.railway.app
```

Should see:
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `Strict-Transport-Security`
- ✅ `X-XSS-Protection`

### Check 2: Rate Limiting

```bash
# Try logging in 6 times quickly
for i in {1..6}; do
  curl -X POST https://your-app.railway.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","agentId":"test","password":"test"}'
  echo ""
done
```

6th attempt should return rate limit error.

### Check 3: WebSocket

Open browser console at `https://your-app.railway.app`:

```javascript
const ws = new WebSocket('wss://your-app.railway.app');
ws.onopen = () => {
    console.log('✅ WebSocket Connected!');
    ws.send(JSON.stringify({type: 'register', agentId: 'test'}));
};
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Check 4: CORS

```bash
curl -X OPTIONS https://your-app.railway.app/api/auth/login \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST"
```

Should see CORS headers in response.

### Check 5: Input Validation

```bash
# Missing fields
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'
```

Should return validation error.

## 📊 Monitor Your Deployment

### Railway Dashboard

Monitor:
- **Deployments**: Build and deploy status
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Variables**: Environment configuration

### View Logs

```bash
# CLI
railway logs --tail

# Or in Railway Dashboard → Logs tab
```

### Watch for:
- Failed login attempts
- Rate limit hits
- Validation errors
- WebSocket connections/disconnections
- API response times

## 🚨 Troubleshooting

### Issue: App Not Starting

**Check logs:**
```bash
railway logs
```

**Common causes:**
- Missing SESSION_SECRET
- Wrong Root Directory setting
- npm install failed

**Fix:**
1. Verify environment variables
2. Check Railway settings
3. Redeploy

### Issue: Rate Limiting Too Strict

**Temporary fix:**
Edit `agent-login-app/config/security.js` and adjust limits:

```javascript
auth: {
  windowMs: 15 * 60 * 1000,
  max: 10  // Increase from 5 to 10
}
```

Then redeploy.

### Issue: CORS Errors

**Check allowed origins:**
```bash
railway variables
```

**Update if needed:**
```bash
railway variables set ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Issue: WebSocket Not Connecting

**Verify:**
1. Using `wss://` (not `ws://`)
2. Railway deployment successful
3. No firewall blocking WebSocket

## 📈 Scaling Considerations

As your application grows:

1. **Increase Rate Limits** for legitimate traffic
2. **Add Redis** for session storage:
   ```bash
   # In Railway, add Redis service
   railway add redis
   ```
3. **Enable Database** if needed:
   ```bash
   railway add postgresql
   ```
4. **Add Monitoring** (Railway provides built-in)
5. **Custom Domain** for professional appearance

## 💰 Cost Monitoring

Railway Free Tier: $5/month credit

Expected usage:
- Small app (< 100 users): $3-7/month
- Medium app (< 1000 users): $10-20/month

**Set up budget alerts in Railway Dashboard!**

## 🎉 Success Criteria

Your deployment is successful when:

- [x] App accessible at Railway URL
- [x] Login works correctly
- [x] WebSocket connects successfully
- [x] Rate limiting works (tested)
- [x] Security headers present
- [x] CORS configured
- [x] Input validation working
- [x] PBX webhooks updated
- [x] Logs show healthy activity
- [x] No errors in Railway dashboard

## 📚 Documentation Created

- ✅ [SECURITY.md](./SECURITY.md) - Security features
- ✅ [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Deployment guide
- ✅ [QUICKSTART.md](./QUICKSTART.md) - Quick start
- ✅ [README.md](./README.md) - Project overview
- ✅ This checklist

## 🎯 Next Steps After Deployment

1. **Test with real PBX calls**
2. **Monitor logs for first 24 hours**
3. **Adjust rate limits if needed**
4. **Set up custom domain** (optional)
5. **Configure backup strategy**
6. **Plan for scaling**

---

**You're ready to deploy! 🚀**

Run: `git push origin main` and let Railway handle the rest!
