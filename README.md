# 🤖 AI Agent Portal

A real-time call center agent portal with WebSocket support for live call notifications and IVR flow management.

## ✨ Features

- 🔐 **Agent Authentication** - Secure login system
- 📞 **Real-time Call Notifications** - WebSocket-based instant notifications
- 📊 **Agent Dashboard** - Live call information and status management
- 🎯 **IVR Flow Designer** - KooKoo-compatible IVR responses
- 📱 **Responsive UI** - Bootstrap-powered interface
- 🔄 **Call Status Management** - Real-time agent status updates

## 🚀 Quick Deploy to Railway (Recommended)

Railway provides full WebSocket + API support!

### Method 1: Deploy from GitHub (Easiest)
1. Push your code to GitHub
2. Visit https://railway.app
3. Click "Deploy from GitHub repo"
4. Select this repository
5. Add environment variables in Railway dashboard
6. Done! ✅

### Method 2: Use CLI
```bash
./deploy-setup.sh
```

📖 **Full Guide:** [QUICKSTART.md](./QUICKSTART.md)

## 🛠️ Local Development

```bash
cd agent-login-app
npm install
npm start
```

Visit: http://localhost:3000

## 📡 Key Endpoints

- `GET /` - Login page
- `GET /toolbar` - Agent dashboard
- `POST /api/auth/login` - Authentication
- `GET /api/pbx/ivrflow` - IVR handler
- `POST /api/pbx/receive-call-notification` - Call events
- `WS /` - Real-time WebSocket

## 🔧 Required Environment Variables

```env
SESSION_SECRET=<generate-with-command-below>
NODE_ENV=production
```

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📚 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Fast deployment guide
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Detailed Railway docs
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Multi-platform options

## 🎉 Ready to Deploy?

Start here: **[QUICKSTART.md](./QUICKSTART.md)**