# Ozonetel Stream Data Flow

## 🔄 Complete Data Flow

```
Ozonetel PBX
    ↓ (WebSocket Connection - ws:// or wss://)
    ↓ Production: wss://ai-agent-portal-production.up.railway.app/ws
    ↓ Local Dev:  ws://localhost:3000/ws
    ↓
[StreamServer] (src/services/streamServer.js)
    ↓ (Receives JSON data)
    ↓ handleMessage()
    ↓ (Forwards to StreamClient)
    ↓
[StreamClient] (src/services/streamClient.js)
    ↓ handleMessage()
    ↓ (Parses JSON)
    ↓
    ├─► handleStartEvent()  → logs/stream/stream_events_*.jsonl
    ├─► handleMediaEvent()  → logs/stream/audio_*.json
    └─► handleStopEvent()   → logs/stream/stream_events_*.jsonl
```

## ✅ Protocol Support

**The server automatically supports BOTH protocols**:
- **ws://** - Unencrypted WebSocket (HTTP-based) - for local development
- **wss://** - Encrypted WebSocket (HTTPS-based) - for production

**Which protocol to use?**:
- **Railway (Production)**: Use `wss://ai-agent-portal-production.up.railway.app/ws`
- **Local Development**: Use `ws://localhost:3000/ws`
- **Ozonetel can try both** - the server will accept either protocol

**In logs, you'll see which protocol was used**:
```
[StreamServer] New connection from: 203.0.113.10 (wss://)  ← Secure connection
[StreamServer] New connection from: 192.168.1.100 (ws://)  ← Unencrypted connection
```

---

## 📁 Files That Read Ozonetel Data

### 1. **StreamServer** (`src/services/streamServer.js`)
**Purpose**: Receives WebSocket connections from Ozonetel

**Key Methods**:
- **Line 23**: `handleConnection()` - Accepts connection from Ozonetel
- **Line 34**: `console.log('[StreamServer] New connection from:', clientIp)` ← **CHECK THIS LOG**
- **Line 42**: `ws.on('message', (data) => this.handleMessage(ws, data, connectionId))` ← **RECEIVES DATA**
- **Line 61**: `handleMessage()` - Parses JSON and forwards to StreamClient

**What to look for in logs**:
```
[StreamServer] Connection attempt from: [Ozonetel Origin] (wss://)
[StreamServer] New connection from: [IP address] (wss://)
[StreamServer] Connection ID: conn_1234567890_abc123
[StreamServer] Received: start
[StreamServer] Received: media
```

---

### 2. **StreamClient** (`src/services/streamClient.js`)
**Purpose**: Processes the JSON events and saves to files

**Key Methods**:
- **Line 89**: `async handleMessage(data)` ← **PARSES JSON HERE**
  ```javascript
  const message = JSON.parse(data.toString());
  console.log('[StreamClient] Received event:', message.event, 'Type:', message.type);
  ```

- **Line 95-107**: Event router based on `message.event`
  ```javascript
  switch (message.event) {
      case 'start': await this.handleStartEvent(message);
      case 'media': await this.handleMediaEvent(message);
      case 'stop': await this.handleStopEvent(message);
  }
  ```

**What to look for in logs**:
```
[StreamClient] Received event: start Type: text
[StreamClient] 📞 Call Started
[StreamClient] UCID: xxxxx
[StreamClient] Received event: media Type: media
[StreamClient] 🎵 Media packets received: 100
```

---

## 🔍 How to Check if Ozonetel is Sending Data

### **Step 1: Check Railway Logs**

Go to Railway → Deployments → View Logs

Look for these indicators:

#### ✅ **Connection Successful**:
```
[StreamServer] WebSocket stream server ready at path: /ws
[StreamServer] Connection attempt from: undefined (or IP)
[StreamServer] New connection from: x.x.x.x
```

#### ✅ **Receiving Data**:
```
[StreamServer] Received: start
[StreamServer] Received: media
[StreamClient] Received event: start Type: text
[StreamClient] 📞 Call Started
[StreamClient] UCID: xxxxxxxxx
```

#### ❌ **No Connection**:
```
[StreamServer] WebSocket stream server ready at path: /ws
... (no connection logs)
```

#### ❌ **Connection but No Data**:
```
[StreamServer] New connection from: x.x.x.x
... (no "Received: " logs)
```

---

## 📊 JSON Data Format Expected

### **Start Event**:
```json
{
  "event": "start",
  "type": "text",
  "ucid": "unique-call-id",
  "did": "destination-number"
}
```
**Parsed at**: `streamClient.js:89` → `handleStartEvent()` at line 118

### **Media Event**:
```json
{
  "event": "media",
  "type": "media",
  "ucid": "unique-call-id",
  "data": {
    "samples": [1, 2, 3, ...],
    "bitsPerSample": 16,
    "sampleRate": 8000,
    "channelCount": 1,
    "numberOfFrames": 80,
    "type": "data"
  }
}
```
**Parsed at**: `streamClient.js:89` → `handleMediaEvent()` at line 143

### **Stop Event**:
```json
{
  "event": "stop",
  "type": "text",
  "ucid": "unique-call-id",
  "did": "destination-number"
}
```
**Parsed at**: `streamClient.js:89` → `handleStopEvent()` at line 207

---

## 🧪 Testing Checklist

### **1. Check WebSocket Server is Running**
```bash
curl -I https://ai-agent-portal-production.up.railway.app
# Should return 200 OK
```

### **2. Check Logs for Stream Server Initialization**
Railway Logs should show:
```
[StreamServer] WebSocket stream server ready at path: /ws
[StreamServer] Supports both ws:// (HTTP) and wss:// (HTTPS) connections
[StreamServer] Ready to receive events at: /ws
```

### **3. Test WebSocket Connection**

**Using wscat (install with: `npm install -g wscat`)**:

```bash
# Test with wss:// (secure - recommended for production)
wscat -c wss://ai-agent-portal-production.up.railway.app/ws

# Test with ws:// (if Ozonetel tries unencrypted)
wscat -c ws://ai-agent-portal-production.up.railway.app/ws

# For local development
wscat -c ws://localhost:3000/ws
```

Expected log output when connection succeeds:
```
[StreamServer] Connection attempt from: [origin] (wss://)
[StreamServer] New connection from: [IP] (wss://)
[StreamServer] Connection ID: conn_1234567890_abc123
```

Expected response:
```json
{"type":"connected","connectionId":"conn_xxx","timestamp":"2025-11-06..."}
```

### **4. Send Test Event**
In wscat, type:
```json
{"event":"start","type":"text","ucid":"TEST123","did":"9876543210"}
```

Should see in Railway logs:
```
[StreamServer] Received: start
[StreamClient] Received event: start Type: text
[StreamClient] 📞 Call Started
```

### **5. Check Log Files**
If data is received, files will be created:
```
agent-login-app/logs/stream/
├── stream_events_2025-11-06.jsonl
└── audio_TEST123_xxx.json
```

---

## 🐛 Troubleshooting

### **Issue: No Connection Logs**

**Possible Causes**:
1. Ozonetel not configured with correct URL
2. Firewall blocking connection
3. Wrong WebSocket path

**Solution**:
- Verify URL: `wss://ai-agent-portal-production.up.railway.app/ws`
- Check Railway is running (no 502 errors)
- Verify Ozonetel configuration

### **Issue: Connection but No Data**

**Check**:
```javascript
// streamServer.js:59 - handleMessage()
console.log('[StreamServer] Received:', message.event || message.type);
```

If you see connection but no "Received:" logs:
- Ozonetel connected but not sending events
- Check if test call was made
- Verify Ozonetel configured to send events

### **Issue: JSON Parse Error**

**Check logs for**:
```
[StreamClient] Error processing message: ...
[StreamClient] Raw data: ...
```

This means data format is incorrect. Compare with expected format above.

---

## 📝 Add Debug Logging

To see raw data, add to `streamServer.js:59`:

```javascript
handleMessage(ws, data, connectionId) {
    try {
        // ADD THIS LINE
        console.log('[StreamServer] Raw data received:', data.toString());
        
        const message = JSON.parse(data.toString());
        console.log('[StreamServer] Received:', message.event || message.type);
        
        // ... rest of code
    }
}
```

To see all message details, add to `streamClient.js:89`:

```javascript
async handleMessage(data) {
    try {
        const message = JSON.parse(data.toString());
        
        // ADD THIS LINE
        console.log('[StreamClient] Full message:', JSON.stringify(message, null, 2));
        
        console.log('[StreamClient] Received event:', message.event, 'Type:', message.type);
        // ... rest of code
    }
}
```

---

## 🎯 Quick Verification Commands

### **Check Railway Deployment**:
```bash
curl -I https://ai-agent-portal-production.up.railway.app
```

### **Test WebSocket**:
```bash
wscat -c wss://ai-agent-portal-production.up.railway.app/ws
```

### **View Railway Logs**:
Go to: https://railway.app/project/[your-project]/deployments

### **Check Stream Status API**:
```bash
curl https://ai-agent-portal-production.up.railway.app/api/stream/status
```

---

## ✅ Summary

**Files that read Ozonetel data**:
1. **`src/services/streamServer.js`** - Line 40: receives WebSocket messages
2. **`src/services/streamClient.js`** - Line 89: parses JSON data

**Where JSON is parsed**:
- **StreamServer** Line 59: `JSON.parse(data.toString())`
- **StreamClient** Line 89: `JSON.parse(data.toString())`

**What to check in Railway logs**:
- `[StreamServer] New connection from:` → Ozonetel connected
- `[StreamServer] Received:` → Data being sent
- `[StreamClient] Received event:` → Data being processed
- `[StreamClient] 📞 Call Started` → Events being handled

**If not seeing these logs** → Ozonetel hasn't connected or isn't sending data yet.
