# 🚂 Railway Deployment Fix

## ❌ Error: npm: command not found

This happens when Railway doesn't detect the correct project structure.

## ✅ Solution

### Step 1: Set Root Directory in Railway Dashboard

**This is CRITICAL:**

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** tab
4. Scroll to **Root Directory**
5. Set it to: `agent-login-app`
6. Click **Save**

### Step 2: Redeploy

Railway will automatically trigger a new deployment with the correct directory.

### Step 3: Verify Build Logs

The build should now show:
```
✓ Found package.json
✓ Installing dependencies
✓ npm install completed
✓ Starting application
```

## 📋 Railway Configuration Summary

**Root Directory**: `agent-login-app` ⚠️ MUST BE SET

**Environment Variables**:
```env
SESSION_SECRET=<your-generated-secret>
NODE_ENV=production
```

**Auto-detected**:
- ✅ Node.js 20
- ✅ npm
- ✅ package.json

## 🔧 Alternative: Deploy Specific Files

If you still have issues, try this structure:

### Option A: Move files to root (Not recommended)

Move everything from `agent-login-app/` to root.

### Option B: Use monorepo setup (Current - Recommended)

Keep the current structure and **just set Root Directory** in Railway settings.

## 📝 Files Created to Help

1. **nixpacks.toml** - Tells Nixpacks to use Node.js 20
2. **railway.json** - Simplified configuration

## ✅ Checklist

Before redeploying:

- [ ] Root Directory set to `agent-login-app` in Railway Dashboard
- [ ] SESSION_SECRET environment variable set
- [ ] NODE_ENV=production set
- [ ] Latest code pushed to GitHub
- [ ] Click "Redeploy" or push new commit

## 🚀 Deploy Command

```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

Railway will auto-deploy!

## 📞 If Still Having Issues

Try manual deployment:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy from correct directory
cd agent-login-app
railway up
```

---

**TL;DR: Set Root Directory to `agent-login-app` in Railway Dashboard Settings!**
