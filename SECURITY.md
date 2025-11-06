# 🔒 Security Implementation Guide

## ✅ Implemented Security Features

### 1. **Helmet.js** - Security Headers
Protects against common web vulnerabilities:
- ✅ XSS Protection
- ✅ Content Security Policy (CSP)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ Frame Guard (Clickjacking protection)
- ✅ MIME Sniffing prevention

### 2. **Rate Limiting**
Prevents abuse and DDoS attacks:
- **Authentication**: 5 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP
- **PBX Webhooks**: 50 requests per minute per IP
- **IVR Flow**: 30 requests per minute per IP

### 3. **CORS (Cross-Origin Resource Sharing)**
Controls which domains can access your API:
- Configured via `ALLOWED_ORIGINS` environment variable
- Credentials support enabled
- Proper preflight handling

### 4. **Input Validation**
Validates all user inputs using `express-validator`:
- **Login**: username, agentId, password validation
- **Status Updates**: Only allows valid status values
- Prevents SQL injection and XSS attacks

### 5. **Session Security**
Enhanced session management:
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Flag**: HTTPS only in production
- **SameSite**: CSRF protection
- **Session Regeneration**: Prevents session fixation
- **Custom Session Name**: Security through obscurity

### 6. **WebSocket Security**
- Origin verification
- Connection logging
- Rate limiting ready

## 📋 Required Environment Variables

### For Railway Deployment:

```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in Railway Dashboard:
SESSION_SECRET=<your-generated-secret>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app.railway.app
```

## 🚀 Deploy to Railway with Security

### Step 1: Set Environment Variables

In Railway Dashboard → Variables:

```env
SESSION_SECRET=<generate-with-command-above>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app.railway.app,https://yourdomain.com
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add security features: helmet, rate limiting, CORS, validation"
git push origin main
```

### Step 3: Railway Auto-Deploy

Railway will automatically:
1. Install dependencies (including security packages)
2. Apply all security configurations
3. Deploy with HTTPS/WSS enabled

## 🧪 Testing Security Features

### Test Rate Limiting

```bash
# This should succeed
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","agentId":"agent1","password":"pass"}'

# Repeat 6 times quickly - should get rate limited
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","agentId":"agent1","password":"pass"}'
done
```

Expected response after 5 attempts:
```json
{
  "error": "Too many login attempts",
  "message": "Please try again after 15 minutes"
}
```

### Test Input Validation

```bash
# Missing required fields
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test"}'
```

Expected response:
```json
{
  "error": "Validation failed",
  "details": [
    {"msg": "Agent ID is required", "param": "agentId"},
    {"msg": "Password is required", "param": "password"}
  ]
}
```

### Test Status Validation

```bash
# Invalid status value
curl -X PUT http://localhost:3000/api/auth/status \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=your-session-id" \
  -d '{"status":"invalid"}'
```

Expected response:
```json
{
  "error": "Validation failed",
  "details": [
    {"msg": "Invalid status value", "param": "status"}
  ]
}
```

### Test Security Headers

```bash
curl -I http://localhost:3000
```

Should see headers like:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-XSS-Protection: 1; mode=block
```

## 🛡️ Security Best Practices

### DO's ✅

1. **Always use HTTPS in production** (Railway provides this automatically)
2. **Rotate SESSION_SECRET regularly** (every 90 days)
3. **Monitor rate limit violations** in Railway logs
4. **Keep dependencies updated**:
   ```bash
   npm audit
   npm audit fix
   ```
5. **Use strong passwords** for agent accounts
6. **Log security events** (already implemented)
7. **Review Railway logs regularly**

### DON'Ts ❌

1. **Never commit .env files** (already gitignored)
2. **Never log passwords or API keys**
3. **Never disable security features in production**
4. **Never expose internal error details to users**
5. **Never use default or weak SESSION_SECRET**

## 📊 Rate Limit Configuration

Current limits can be adjusted in `config/security.js`:

```javascript
// Adjust these based on your traffic
rateLimiters: {
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5                      // 5 attempts
  },
  general: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                    // 100 requests
  },
  pbxWebhook: {
    windowMs: 60 * 1000,        // 1 minute
    max: 50                     // 50 requests
  },
  ivr: {
    windowMs: 60 * 1000,        // 1 minute
    max: 30                     // 30 requests
  }
}
```

## 🔍 Monitoring Security

### Railway Logs

Monitor for:
- Failed login attempts
- Rate limit violations
- Validation errors
- WebSocket connection issues

```bash
# View logs in Railway
railway logs --tail

# Filter for security events
railway logs | grep "Auth\|Security\|Error"
```

### Log Patterns to Watch

```
[Auth] Login failed for user: xxx          # Failed login attempt
Too many login attempts                     # Rate limit hit
Validation failed                           # Invalid input
Not allowed by CORS                         # CORS violation
WebSocket] Connection closed                # WebSocket disconnect
```

## 🚨 Security Incident Response

If you notice suspicious activity:

1. **Check Railway Logs** for IP addresses and patterns
2. **Temporarily increase rate limits** if legitimate traffic is blocked
3. **Block malicious IPs** using Railway's network settings
4. **Rotate SESSION_SECRET** if session compromise is suspected
5. **Review and update** ALLOWED_ORIGINS if needed

## 📞 OpenAI API Security (Future)

When you add OpenAI integration:

```javascript
// In config/security.js or separate config
openaiRateLimit: rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 20,                    // 20 requests per minute
  message: 'OpenAI API rate limit exceeded'
})

// In your routes
app.use('/api/speech', securityConfig.rateLimiters.openaiRateLimit);
```

## 📦 Dependencies Installed

```json
{
  "helmet": "^7.1.0",                // Security headers
  "cors": "^2.8.5",                  // CORS handling
  "express-rate-limit": "^7.1.5",    // Rate limiting
  "express-validator": "^7.0.1"      // Input validation
}
```

## ✅ Security Checklist for Deployment

Before deploying to production:

- [ ] SESSION_SECRET generated and set in Railway
- [ ] NODE_ENV set to 'production'
- [ ] ALLOWED_ORIGINS configured
- [ ] All dependencies updated (`npm audit`)
- [ ] .env file in .gitignore
- [ ] HTTPS enabled (automatic on Railway)
- [ ] WebSocket WSS enabled (automatic on Railway)
- [ ] Rate limits tested
- [ ] Input validation tested
- [ ] Security headers verified
- [ ] Logs monitored

## 🎓 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Railway Security](https://docs.railway.app/deploy/deployments#security)

---

**Your application is now production-ready with enterprise-grade security! 🎉**
