# Ozonetel WebSocket Integration Guide

## 🎯 **Your WebSocket URL for Ozonetel**

```
wss://ai-agent-portal-production.up.railway.app/ws
```

### **URL Details:**
- **Protocol:** `wss://` (Secure WebSocket)
- **Domain:** `ai-agent-portal-production.up.railway.app`
- **Path:** `/ws`
- **Port:** Not needed (Railway handles automatically)

---

## 📧 **What to Send to Ozonetel Support**

### **Email Template:**

```
Subject: WebSocket Streaming Endpoint Configuration

Hi Ozonetel Team,

We would like to enable WebSocket streaming for our account. Please configure our system to send streaming events to:

WebSocket URL: wss://ai-agent-portal-production.up.railway.app/ws

Technical Details:
- Protocol: WSS (Secure WebSocket)
- Message Format: JSON
- Audio Format: PCM Linear 16-bit, 8kHz, Mono

Expected Events:
1. Start Event - When call begins
2. Media Event - Audio data packets
3. Stop Event - When call ends

Our system is ready to receive these events in the format specified in your bi-directional streaming documentation.

Please confirm once the configuration is complete.

Best regards,
[Your Name]
```

---

## 🔧 **Railway Configuration**

### **Required Environment Variables:**

Go to Railway Dashboard → Variables and set:

```bash
# Required
SESSION_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NODE_ENV=production

# Optional - Only if YOU need to connect to Ozonetel's server
# (In most cases, you DON'T need this - Ozonetel connects to YOU)
# STREAM_WS_URL=wss://stream.ozonetel.com/ws
```

### **Important:**
- **DO NOT set `STREAM_WS_URL`** unless Ozonetel tells you they have a server YOU need to connect to
- In the standard setup, Ozonetel connects TO your server at `/ws`

---

## 🎭 **Two Modes of Operation**

### **Mode 1: Ozonetel Connects to You (Standard - Recommended)**

```
┌─────────────────┐         wss://         ┌──────────────────┐
│   Ozonetel      │─────────────────────►  │  Your Server     │
│   (Client)      │   Sends Events         │  (Server)        │
│                 │                        │  /ws endpoint    │
└─────────────────┘                        └──────────────────┘
```

**Your URL:** `wss://ai-agent-portal-production.up.railway.app/ws`

**Railway Config:**
- `SESSION_SECRET=xxx`
- `NODE_ENV=production`
- **NO** `STREAM_WS_URL` needed

**This is the standard setup!**

---

### **Mode 2: You Connect to Ozonetel (Alternative)**

```
┌─────────────────┐        wss://          ┌──────────────────┐
│  Your Server    │─────────────────────►  │   Ozonetel       │
│  (Client)       │   Requests Events      │   (Server)       │
└─────────────────┘                        └──────────────────┘
```

**Ozonetel provides URL:** `wss://stream.ozonetel.com/ws`

**Railway Config:**
- `SESSION_SECRET=xxx`
- `NODE_ENV=production`
- `STREAM_WS_URL=wss://stream.ozonetel.com/ws` ← Set this

**Only use this if Ozonetel tells you to!**

---

## 📊 **Events Your Server Will Receive**

### **1. Start Event (Call Begins)**
```json
{
  "event": "start",
  "type": "text",
  "ucid": "unique-call-id",
  "did": "destination-number"
}
```

### **2. Media Event (Audio Data)**

**First Packet (16kHz - Ignored):**
```json
{
  "event": "media",
  "type": "media",
  "ucid": "unique-call-id",
  "data": {
    "samples": [array of audio samples],
    "bitsPerSample": 16,
    "sampleRate": 16000,
    "channelCount": 1,
    "numberOfFrames": 160,
    "type": "data"
  }
}
```

**Subsequent Packets (8kHz - Processed):**
```json
{
  "event": "media",
  "type": "media",
  "ucid": "unique-call-id",
  "data": {
    "samples": [array of audio samples],
    "bitsPerSample": 16,
    "sampleRate": 8000,
    "channelCount": 1,
    "numberOfFrames": 80,
    "type": "data"
  }
}
```

### **3. Stop Event (Call Ends)**
```json
{
  "event": "stop",
  "type": "text",
  "ucid": "unique-call-id",
  "did": "destination-number"
}
```

---

## ✅ **Testing After Ozonetel Configuration**

### **1. Check Railway Logs**

In Railway Dashboard → Deployments → View Logs

Look for:
```
🎙️  Initializing Stream Server (for Ozonetel)...
[StreamServer] WebSocket stream server ready at path: /ws
[StreamServer] Ready to receive events at: wss://your-domain/ws
```

### **2. Test Connection**

Ask Ozonetel to send a test call or event. You should see:
```
[StreamServer] New connection from: [Ozonetel IP]
[StreamServer] Received: start
[StreamServer] Received: media
```

### **3. Check Logs**

```bash
# Via Railway Dashboard - see logs in real-time
# Or SSH to check files (if enabled)
tail -f logs/stream/stream_events_*.jsonl
```

---

## 🔍 **Verification Checklist**

Before contacting Ozonetel:
- [ ] Railway app deployed successfully
- [ ] `SESSION_SECRET` set in Railway
- [ ] `NODE_ENV=production` set
- [ ] No 502 errors when accessing domain
- [ ] Server logs show "WebSocket stream server ready"
- [ ] `/ws` endpoint is available

After Ozonetel configures:
- [ ] Ozonetel confirms configuration complete
- [ ] Test call generates events
- [ ] Logs show incoming connections
- [ ] Events being saved to log files
- [ ] Audio data being captured

---

## 🆘 **Troubleshooting**

### **Issue: Ozonetel can't connect**

**Check:**
1. Railway app is running (no 502 errors)
2. Railway logs show stream server initialized
3. Firewall/security settings allow WebSocket
4. Provided correct URL (with `wss://` and `/ws`)

**Test manually:**
```bash
# Test if WebSocket endpoint is accessible
wscat -c wss://ai-agent-portal-production.up.railway.app/ws

# If you don't have wscat:
npm install -g wscat
```

### **Issue: Connection established but no events**

**Check:**
1. Ozonetel configured for your account
2. Test call being made to configured number
3. Railway logs for incoming messages
4. Check `logs/stream/` for event files

---

## 📞 **Questions to Ask Ozonetel**

When you contact Ozonetel, confirm:

1. **Do you provide a WebSocket server, or do we?**
   - If they provide: Ask for their URL
   - If you provide: Give them your URL

2. **What authentication is required?**
   - API keys?
   - IP whitelist?
   - Token in headers?

3. **Which numbers should send events?**
   - All numbers in account?
   - Specific DIDs?

4. **Testing procedure:**
   - How to test the integration?
   - Test call number?

---

## 🎉 **Summary**

**For Standard Setup (Recommended):**

1. ✅ Railway URL: `wss://ai-agent-portal-production.up.railway.app/ws`
2. ✅ Send this URL to Ozonetel
3. ✅ Set only `SESSION_SECRET` and `NODE_ENV` in Railway
4. ✅ Wait for Ozonetel to configure
5. ✅ Test with a call
6. ✅ Check logs for events

**You're ready to go!** 🚀
