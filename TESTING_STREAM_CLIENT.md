# WebSocket Stream Client Testing Guide

## 🎯 Quick Answer to Your Questions

### 1. **Where should I configure STREAM_WS_URL?**

**LOCAL TESTING:**
```bash
export STREAM_WS_URL=ws://localhost:8080/ws
SESSION_SECRET=test123 node server.js
```

**RAILWAY (Production):**
- Go to Railway Dashboard → Variables
- Add: `STREAM_WS_URL=ws://your-stream-server:8080/ws`
- Add: `SESSION_SECRET=<generated-secret>`
- Add: `NODE_ENV=production`

### 2. **Is it auto-available with domain?**

**NO** - The WebSocket stream server URL is **NOT auto-generated**. You need to:

**Option A:** Get URL from **Ozonetel/KooKoo**
- Contact Ozonetel support
- Ask for your WebSocket streaming endpoint
- Format: `ws://stream.ozonetel.com:8080/ws` or `wss://stream.ozonetel.com/ws`

**Option B:** Host your own stream server (requires building one)

### 3. **Should I mention it in Railway?**

**YES** - You must add `STREAM_WS_URL` as an environment variable in Railway if you want streaming to work in production.

---

## 🧪 Testing Steps

### Step 1: Test with Mock Server (Locally)

#### Terminal 1: Start Mock Stream Server
```bash
cd agent-login-app
node test-stream-server.js
```

You should see:
```
🎤 Mock Stream Server started on ws://localhost:8080
📋 Test Instructions:
...
```

#### Terminal 2: Start Your Application
```bash
cd agent-login-app
SESSION_SECRET=test123 node server.js
```

You should see:
```
🎤 Initializing Stream Client...
[StreamClient] Connecting to: ws://localhost:8080/ws
✅ [StreamClient] Connected to stream server
```

#### Terminal 3: Check Status
```bash
curl http://localhost:3000/api/stream/status
```

Expected response:
```json
{
  "initialized": true,
  "connected": true,
  "url": "ws://localhost:8080/ws",
  "currentCall": {
    "ucid": "TEST123456789",
    "did": "9876543210",
    "startTime": "2025-11-06T...",
    "mediaPackets": 150
  },
  "readyState": 1
}
```

---

### Step 2: Verify Event Processing

#### Check Logs
```bash
# Watch event logs in real-time
tail -f agent-login-app/logs/stream/stream_events_2025-11-06.jsonl

# Check if audio was saved
ls -lh agent-login-app/logs/stream/audio_*.json
```

You should see:
```
stream_events_2025-11-06.jsonl  (event log)
audio_TEST123456789_1699270800000.json  (saved audio buffer)
```

#### View Audio Buffer
```bash
cat agent-login-app/logs/stream/audio_TEST123456789_*.json | head -50
```

---

### Step 3: Test Commands

#### Send Clear Buffer Command
```bash
curl -X POST http://localhost:3000/api/stream/clear-buffer
```

Expected response:
```json
{
  "success": true,
  "message": "Clear buffer command sent"
}
```

Check mock server terminal - you should see:
```
✅ Received clearBuffer command
```

#### Send Disconnect Command
```bash
curl -X POST http://localhost:3000/api/stream/disconnect-call
```

---

### Step 4: Test Audio Sending

```bash
curl -X POST http://localhost:3000/api/stream/send-audio \
  -H "Content-Type: application/json" \
  -d '{
    "ucid": "TEST123456789",
    "samples": [1,2,3,4,5,6,7,8,9,10]
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Audio data sent",
  "sampleCount": 10
}
```

Check mock server terminal:
```
✅ Received audio data from client: 10 samples
```

---

## 🚀 Railway Deployment Testing

### Step 1: Add Environment Variables in Railway

1. Go to: https://railway.app/project/your-project-id
2. Click: **Variables** tab
3. Add these variables:

```
STREAM_WS_URL=ws://your-actual-stream-server:8080/ws
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NODE_ENV=production
```

4. Click **Add** and wait for auto-redeploy

### Step 2: Check Railway Logs

In Railway dashboard, click **Deployments** → **View Logs**

Look for:
```
🎤 Initializing Stream Client...
[StreamClient] Connecting to: ws://...
```

**If connected:**
```
✅ [StreamClient] Connected to stream server
```

**If NOT connected:**
```
⚠️ WebSocket error: Stream server not available, will retry...
```

### Step 3: Test Railway Deployment

```bash
# Check status from Railway
curl https://ai-agent-portal-production.up.railway.app/api/stream/status

# Expected if connected:
{
  "initialized": true,
  "connected": true,
  "url": "ws://your-server:8080/ws",
  "currentCall": null,
  "readyState": 1
}
```

---

## 📋 Configuration Checklist

### Local Testing
- [ ] Mock stream server running on port 8080
- [ ] Application server running on port 3000
- [ ] `STREAM_WS_URL` set (or using default)
- [ ] `SESSION_SECRET` set
- [ ] Status API returns `connected: true`
- [ ] Logs directory created
- [ ] Events being logged

### Railway Production
- [ ] `STREAM_WS_URL` set in Railway Variables
- [ ] `SESSION_SECRET` set in Railway Variables
- [ ] `NODE_ENV=production` set
- [ ] Application deployed successfully
- [ ] Check Railway logs for connection status
- [ ] Test status endpoint
- [ ] Verify no 502 errors

---

## 🔍 Troubleshooting

### Issue: "Stream server not available"

**Causes:**
1. `STREAM_WS_URL` not set or incorrect
2. Stream server is down
3. Firewall blocking connection
4. Wrong protocol (ws vs wss)

**Solutions:**
```bash
# Check environment variable
echo $STREAM_WS_URL

# Test connection manually
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" \
  http://localhost:8080/ws

# For Railway, check Variables tab
```

### Issue: "readyState: 3" (CLOSED)

**Solution:**
- Check if `STREAM_WS_URL` is correct
- Verify stream server is running
- Check Railway logs for connection errors

### Issue: No logs being created

**Solution:**
```bash
# Ensure logs directory exists
mkdir -p agent-login-app/logs/stream

# Check permissions
ls -ld agent-login-app/logs/stream

# Check application has write access
```

---

## 📞 Getting Stream Server URL from Ozonetel

**Contact:** Ozonetel/KooKoo Support

**Ask for:**
1. WebSocket streaming endpoint URL
2. Format: `ws://` or `wss://`
3. Port number (usually 8080)
4. Any authentication requirements
5. Testing credentials if available

**Example URLs:**
```
ws://stream.ozonetel.com:8080/ws
wss://stream.ozonetel.com/ws
ws://your-subdomain.ozonetel.com:8080/ws
```

---

## ✅ Success Indicators

### Your stream client is working if:

1. ✅ Server logs show: `✅ [StreamClient] Connected to stream server`
2. ✅ Status API returns: `"connected": true`
3. ✅ Status API returns: `"readyState": 1`
4. ✅ Log files are being created in `logs/stream/`
5. ✅ Events are being logged to `.jsonl` file
6. ✅ Audio buffers saved when calls end
7. ✅ No reconnection attempts in logs

### Your stream client is NOT working if:

1. ❌ Logs show: `⚠️ WebSocket error`
2. ❌ Status API returns: `"connected": false`
3. ❌ Status API returns: `"readyState": 3`
4. ❌ Logs show: `Scheduling reconnect in 5000 ms`
5. ❌ No log files created
6. ❌ Continuous reconnection attempts

---

## 🎉 Summary

**To test locally:**
```bash
# Terminal 1
node test-stream-server.js

# Terminal 2
SESSION_SECRET=test123 node server.js

# Terminal 3
curl http://localhost:3000/api/stream/status
```

**For Railway:**
1. Get stream URL from Ozonetel
2. Add `STREAM_WS_URL` in Railway Variables
3. Add `SESSION_SECRET` in Railway Variables
4. Deploy and check logs

**The domain is NOT auto-configured** - you must provide the `STREAM_WS_URL` manually!
