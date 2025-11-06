#!/bin/bash

echo "🚀 AI Agent Portal - Railway Deployment Helper"
echo "=============================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI is not installed."
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed!"
else
    echo "✅ Railway CLI is already installed"
fi

echo ""
echo "📝 Generating secure SESSION_SECRET..."
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ SESSION_SECRET generated: $SESSION_SECRET"
echo ""

echo "🔐 Save this SESSION_SECRET - you'll need it for deployment!"
echo ""

# Save to .env file
echo "SESSION_SECRET=$SESSION_SECRET" > agent-login-app/.env
echo "NODE_ENV=production" >> agent-login-app/.env
echo "PORT=3000" >> agent-login-app/.env

echo "✅ Environment variables saved to agent-login-app/.env"
echo ""

echo "📋 Next Steps:"
echo "1. Run: railway login"
echo "2. Run: cd agent-login-app && railway init"
echo "3. Run: railway variables set SESSION_SECRET=$SESSION_SECRET"
echo "4. Run: railway variables set NODE_ENV=production"
echo "5. Run: railway up"
echo ""
echo "Or deploy from GitHub:"
echo "1. Push your code to GitHub"
echo "2. Go to https://railway.app"
echo "3. Click 'Deploy from GitHub repo'"
echo "4. Add the SESSION_SECRET in Railway dashboard variables"
echo ""
echo "🎉 Ready to deploy!"
