# AI Agent Portal - Implementation Guide
## Step-by-Step Build Instructions for Hackathons

This guide provides code templates and implementation steps to build the entire AI Agent Portal from scratch in one session.

---

## 🚀 Quick Start (30 minutes)

### Step 1: Project Initialization (5 min)

```bash
# Create project structure
mkdir -p ai-agent-portal/agent-login-app
cd ai-agent-portal/agent-login-app

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express ws axios openai fluent-ffmpeg @ffmpeg-installer/ffmpeg \
  express-session cookie-parser dotenv ejs xmldom

npm install --save-dev nodemon

# Create directory structure
mkdir -p src/{api,cache,lib/kookoo,middleware,routes,services,types,public/{css,js},views}
mkdir -p logs/stream
mkdir -p config
```

### Step 2: Create package.json Scripts

```json
{
  "name": "ai-agent-portal",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.x"
  }
}
```

### Step 3: Environment Configuration

Create `.env`:
```bash
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-random-secret-here
OPENAI_API_KEY=sk-your-key
ELEVENLABS_API_KEY=your-key
ELEVENLABS_MODEL_ID=eleven_flash_v2_5
```

---

## 📝 Core Service Templates

### Template 1: StreamServer.js

```javascript
const WebSocket = require('ws');

class StreamServer {
    constructor(server, streamClient) {
        this.streamClient = streamClient;
        this.connections = new Map();
        this.ucidToConnection = new Map();
        this.server = server;
        this.wss = new WebSocket.Server({ noServer: true });
        
        // Manual WebSocket upgrade
        this.server.on('upgrade', (request, socket, head) => {
            if (request.url !== '/ws') {
                socket.destroy();
                return;
            }
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, request);
            });
        });
        
        this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    }

    handleConnection(ws, req) {
        const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.connections.set(connectionId, ws);
        
        ws.on('message', (data) => this.handleMessage(ws, data, connectionId));
        ws.on('close', () => this.connections.delete(connectionId));
        
        ws.send(JSON.stringify({ type: 'connected', connectionId }));
    }

    handleMessage(ws, data, connectionId) {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.event === 'start' && message.ucid) {
                this.ucidToConnection.set(message.ucid, ws);
                this._lastSamples = this._lastSamples || new Map();
                this._lastSamples.set(message.ucid, 0);
            }
            
            if (message.event === 'stop' && message.ucid) {
                if (this._lastSamples) this._lastSamples.delete(message.ucid);
                setTimeout(() => {
                    this.ucidToConnection.delete(message.ucid);
                }, 10000);
            }
            
            if (this.streamClient) {
                this.streamClient.handleMessage(data);
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
    }

    async sendAudioToOzonetel(ucid, samples) {
        const ws = this.ucidToConnection.get(ucid);
        if (!ws || ws.readyState !== WebSocket.OPEN) return false;

        const cleanedSamples = this._removeDCOffset(samples);
        const smoothedSamples = this._applyCrossfade(ucid, cleanedSamples);
        
        const PACKET_SIZE = 400;
        for (let i = 0; i < smoothedSamples.length; i += PACKET_SIZE) {
            let chunk = smoothedSamples.slice(i, i + PACKET_SIZE);
            if (chunk.length < PACKET_SIZE) {
                chunk = this._applyFadeoutPadding(chunk, PACKET_SIZE);
            }
            
            if (chunk.length === PACKET_SIZE) {
                ws.send(JSON.stringify({
                    type: 'media',
                    ucid: ucid,
                    data: {
                        samples: chunk,
                        bitsPerSample: 16,
                        sampleRate: 8000,
                        channelCount: 1,
                        numberOfFrames: chunk.length,
                        type: 'data'
                    }
                }));
            }
        }
        
        if (smoothedSamples.length > 0) {
            this._lastSamples = this._lastSamples || new Map();
            this._lastSamples.set(ucid, smoothedSamples[smoothedSamples.length - 1]);
        }
        
        return true;
    }

    _removeDCOffset(samples) {
        const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
        return samples.map(sample => Math.round(sample - mean));
    }

    _applyCrossfade(ucid, samples) {
        if (!this._lastSamples) return samples;
        const lastSample = this._lastSamples.get(ucid) || 0;
        if (lastSample === 0) return samples;
        
        const result = [...samples];
        const fadeLength = Math.min(20, samples.length);
        for (let i = 0; i < fadeLength; i++) {
            const t = i / fadeLength;
            result[i] = Math.round(lastSample * (1 - t) + samples[i] * t);
        }
        return result;
    }

    _applyFadeoutPadding(samples, targetSize) {
        const result = [...samples];
        const paddingNeeded = targetSize - samples.length;
        const lastValue = samples[samples.length - 1] || 0;
        for (let i = 0; i < paddingNeeded; i++) {
            const t = i / paddingNeeded;
            result.push(Math.round(lastValue * (1 - t)));
        }
        return result;
    }
}

module.exports = StreamServer;
```

Save as: `src/services/streamServer.js`

---

### Template 2: ElevenLabsService.js

```javascript
const axios = require('axios');

class ElevenLabsService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        this.enabled = !!this.apiKey;
        
        this.config = {
            model_id: 'eleven_flash_v2_5',
            output_format: 'pcm_16000'
        };
        
        this.voiceMap = {
            'alloy': 'pNInz6obpgDQGcFmaJgB',
            'echo': 'TxGEqnHWrfWFTfGW9XjX',
            'fable': 'XB0fDUnXU5powFXDhCwa'
        };
    }

    async textToSpeech(text, voice = 'alloy', language = null) {
        if (!this.enabled) throw new Error('ElevenLabs not configured');
        
        const voiceId = this.voiceMap[voice] || this.voiceMap['alloy'];
        const normalizedLanguage = this._normalizeLanguageCode(language);
        
        const payload = {
            text: text,
            model_id: this.config.model_id
        };
        
        if (normalizedLanguage) payload.language_code = normalizedLanguage;
        
        const response = await axios.post(
            `${this.baseUrl}/text-to-speech/${voiceId}`,
            payload,
            {
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                params: {
                    output_format: this.config.output_format,
                    optimize_streaming_latency: 3
                },
                responseType: 'arraybuffer'
            }
        );
        
        return Buffer.from(response.data);
    }

    _normalizeLanguageCode(language) {
        if (!language || language.length === 2) return language?.toLowerCase();
        
        const map = {
            'english': 'en', 'hindi': 'hi', 'telugu': 'te',
            'tamil': 'ta', 'spanish': 'es', 'french': 'fr'
        };
        
        return map[language.toLowerCase()] || null;
    }
}

module.exports = new ElevenLabsService();
```

Save as: `src/services/elevenlabsService.js`

---

### Template 3: AudioConverter.js

```javascript
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { Readable } = require('stream');

ffmpeg.setFfmpegPath(ffmpegPath);

class AudioConverter {
    async convertPCMToSamplesArray(pcmBuffer, inputSampleRate = 16000) {
        if (inputSampleRate === 8000) {
            const samples = [];
            for (let i = 0; i < pcmBuffer.length; i += 2) {
                samples.push(pcmBuffer.readInt16LE(i));
            }
            return samples;
        }

        return new Promise((resolve, reject) => {
            const chunks = [];
            const readableStream = new Readable();
            readableStream.push(pcmBuffer);
            readableStream.push(null);

            ffmpeg(readableStream)
                .inputFormat('s16le')
                .inputOptions([`-ar ${inputSampleRate}`, '-ac 1'])
                .audioFrequency(8000)
                .audioChannels(1)
                .audioCodec('pcm_s16le')
                .format('s16le')
                .on('error', reject)
                .on('end', () => {
                    const resampled = Buffer.concat(chunks);
                    const samples = [];
                    for (let i = 0; i < resampled.length; i += 2) {
                        samples.push(resampled.readInt16LE(i));
                    }
                    resolve(samples);
                })
                .pipe()
                .on('data', (chunk) => chunks.push(chunk));
        });
    }

    async convertToSamplesArray(audioBuffer, format = 'pcm', sampleRate = 16000) {
        if (format === 'pcm') {
            return await this.convertPCMToSamplesArray(audioBuffer, sampleRate);
        }
        throw new Error('Unsupported format');
    }
}

module.exports = new AudioConverter();
```

Save as: `src/services/audioConverter.js`

---

### Template 4: Server.js (Main Entry)

```javascript
require('dotenv').config();
const express = require('express');
const http = require('http');
const StreamServer = require('./src/services/streamServer');
const StreamClient = require('./src/services/streamClient');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.static('src/public'));

// Routes
app.get('/', (req, res) => {
    res.send('AI Agent Portal - Running');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize WebSocket
const streamClient = new StreamClient();
const streamServer = new StreamServer(server, streamClient);

// Inject dependencies
streamClient.setStreamServer(streamServer);
const playbackService = require('./src/services/playbackService');
playbackService.setStreamServer(streamServer);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
```

Save as: `server.js`

---

## 🔧 Minimal Implementation (For Hackathon Demo)

### Quick Demo Version (4 core files)

**1. server.js** (as above)

**2. streamServer.js** (minimal)
```javascript
const WebSocket = require('ws');

class StreamServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ noServer: true });
        this.connections = new Map();
        
        server.on('upgrade', (req, socket, head) => {
            if (req.url === '/ws') {
                this.wss.handleUpgrade(req, socket, head, (ws) => {
                    this.wss.emit('connection', ws, req);
                });
            }
        });
        
        this.wss.on('connection', (ws) => {
            ws.on('message', (data) => {
                console.log('Received:', data.toString());
            });
        });
    }
}

module.exports = StreamServer;
```

**3. package.json**
```json
{
  "name": "ai-agent-hackathon",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "dotenv": "^16.3.1"
  }
}
```

**4. .env**
```
PORT=3000
NODE_ENV=development
```

### Deploy to Railway

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
gh repo create ai-agent-hackathon --public
git push origin main

# Deploy to Railway
railway init
railway up
```

---

## 🎯 Progressive Implementation Levels

### Level 1: Basic WebSocket (1 hour)
✅ Express server  
✅ WebSocket connection  
✅ Message echo  

### Level 2: Audio Streaming (2 hours)
✅ Receive audio packets  
✅ Buffer management  
✅ Send audio back  

### Level 3: AI Integration (3 hours)
✅ OpenAI Whisper (STT)  
✅ ElevenLabs (TTS)  
✅ Basic conversation  

### Level 4: Production Ready (6 hours)
✅ Silence detection  
✅ Audio quality (DC offset, crossfade)  
✅ Error handling  
✅ Logging  
✅ Deployment  

---

## 📦 Deployment Package

### Files to Include in GitHub Repo

```
ai-agent-portal/
├── README.md
├── TECHNICAL_SPECIFICATION.md
├── IMPLEMENTATION_GUIDE.md (this file)
├── .gitignore
├── package.json
├── server.js
├── .env.example
└── src/
    └── services/
        ├── streamServer.js
        ├── streamClient.js
        ├── elevenlabsService.js
        ├── audioConverter.js
        └── playbackService.js
```

### .gitignore
```
node_modules/
.env
logs/
*.log
.DS_Store
```

---

## 🎓 Hackathon Tips

### Time Management
- **0-30 min:** Setup project, install dependencies
- **30-90 min:** Implement core WebSocket server
- **90-150 min:** Add AI integrations (OpenAI, ElevenLabs)
- **150-210 min:** Audio processing and quality
- **210-270 min:** Testing and deployment
- **270-300 min:** Demo preparation, slides

### Demo Script
1. Show architecture diagram
2. Make a test call
3. Speak → Show transcription
4. Show AI response generation
5. Hear voice response
6. Highlight key features (latency, quality, multilingual)

### Common Pitfalls
❌ Don't implement UI first (backend-heavy project)  
❌ Don't optimize prematurely  
❌ Don't skip error handling  
✅ Do focus on core audio flow  
✅ Do test with real calls early  
✅ Do have backup recordings  

---

## 🏆 Hackathon Judging Criteria Alignment

### Innovation (30%)
- Real-time AI voice agents
- Ultra-low latency TTS (75ms)
- Multilingual support (32+ languages)

### Technical Complexity (30%)
- WebSocket bidirectional streaming
- Audio signal processing (DC offset, crossfade)
- AI orchestration (Whisper + GPT + ElevenLabs)

### Usability (20%)
- Simple phone call interface
- Natural conversation flow
- IVR designer UI

### Scalability (20%)
- Stateless architecture
- Horizontal scaling ready
- Cloud deployment (Railway)

---

## 📞 Support Resources

### During Hackathon
- Reference: TECHNICAL_SPECIFICATION.md
- Code templates: This guide
- Quick fixes: Check common issues section
- API docs: OpenAI, ElevenLabs official docs

### After Hackathon
- Production deployment guide
- Scaling strategies
- Cost optimization
- Security hardening

---

**Ready to build?** Start with `server.js` and progressively add features! 🚀

Good luck at your hackathon! 🎉
