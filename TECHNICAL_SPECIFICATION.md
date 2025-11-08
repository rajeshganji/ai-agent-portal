# AI Agent Portal - Complete Technical Specification

**Project Type:** Real-time AI-Powered Voice Agent System for Telephony  
**Version:** 1.0.0  
**Last Updated:** November 7, 2025  
**Tech Stack:** Node.js, Express, WebSocket, OpenAI, ElevenLabs, Ozonetel

---

## 📋 Executive Summary

A production-ready AI voice agent system that handles inbound phone calls with real-time speech-to-text transcription, GPT-4 powered intent detection, and natural voice responses using ElevenLabs TTS. Integrated with Ozonetel telephony platform via WebSocket for bidirectional audio streaming.

### Key Capabilities
- Real-time speech transcription (Whisper API)
- AI-powered intent detection and responses (GPT-4)
- Ultra-low latency text-to-speech (ElevenLabs Flash v2.5 - 75ms)
- Silence detection and automatic transcription triggering
- Support for 32+ languages including Telugu, Tamil, Hindi
- WebSocket-based audio streaming with Ozonetel
- IVR flow designer with drag-and-drop UI

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Phone Call (Ozonetel)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket
                         │ (Bidirectional Audio)
┌────────────────────────▼────────────────────────────────────────┐
│                    AI Agent Portal (Node.js)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  StreamServer (WS)  →  StreamClient (Event Handler)      │   │
│  └────┬─────────────────────────────────────────────┬───────┘   │
│       │                                              │           │
│  ┌────▼─────────────┐                       ┌───────▼────────┐  │
│  │ AudioProcessor   │                       │  FlowEngine    │  │
│  │ - Silence detect │                       │  - Intent AI   │  │
│  │ - RMS analysis   │                       │  - Responses   │  │
│  └────┬─────────────┘                       └───────┬────────┘  │
│       │                                              │           │
│  ┌────▼──────────────────────────────────────────────▼───────┐  │
│  │              OpenAI Services (Whisper + GPT-4)            │  │
│  └────────────────────────────────────────┬──────────────────┘  │
│                                           │                     │
│  ┌────────────────────────────────────────▼──────────────────┐  │
│  │         ElevenLabs TTS (Flash v2.5 - 75ms latency)        │  │
│  └────────────────────────────────────────┬──────────────────┘  │
│                                           │                     │
│  ┌────────────────────────────────────────▼──────────────────┐  │
│  │  PlaybackService → AudioConverter (FFmpeg) → StreamServer │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Audio Processing Pipeline

```
INBOUND (Ozonetel → AI):
Phone Audio → WebSocket → PCM 8kHz → Buffer → RMS Analysis → 
Silence Detection (2s) → Transcription Trigger → Whisper API → 
Text → Intent Detection (GPT-4) → Response Generation

OUTBOUND (AI → Ozonetel):
Response Text → ElevenLabs TTS → PCM 16kHz → FFmpeg Downsample → 
PCM 8kHz Samples → DC Offset Removal → Crossfade → 
400-sample packets (50ms) → WebSocket → Phone Audio
```

---

## 🛠️ Technology Stack

### Core Framework
```json
{
  "runtime": "Node.js v22.x",
  "framework": "Express 4.x",
  "language": "JavaScript (ES6+)"
}
```

### Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "axios": "^1.6.0",
    "openai": "^4.20.0",
    "fluent-ffmpeg": "^2.1.2",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    "express-session": "^1.17.3",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.3.1",
    "ejs": "^3.1.9",
    "xmldom": "^0.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### External APIs
- **OpenAI**: Speech-to-Text (Whisper), Intent Detection (GPT-4), Response Generation
- **ElevenLabs**: Text-to-Speech (Flash v2.5 model)
- **Ozonetel**: Telephony platform (WebSocket integration)

---

## 📁 Project Structure

```
ai-agent-portal/
├── agent-login-app/
│   ├── package.json
│   ├── server.js                          # Main entry point
│   ├── app.js                             # Express app configuration
│   │
│   ├── src/
│   │   ├── app.ts                         # TypeScript app entry
│   │   │
│   │   ├── api/                           # API endpoints
│   │   │   ├── auth.ts                    # Authentication API
│   │   │   └── status.ts                  # Status endpoints
│   │   │
│   │   ├── cache/                         # Cache management
│   │   │   └── store.ts                   # In-memory store
│   │   │
│   │   ├── lib/                           # Libraries
│   │   │   ├── logger.js                  # Logging utility
│   │   │   └── kookoo/                    # KooKoo IVR library
│   │   │       ├── index.js               # Main exports
│   │   │       ├── response.js            # XML response builder
│   │   │       ├── ivrflow.js             # IVR flow handler
│   │   │       └── collect-dtmf.js        # DTMF collection
│   │   │
│   │   ├── middleware/                    # Express middleware
│   │   │   └── auth.js                    # Authentication middleware
│   │   │
│   │   ├── routes/                        # API routes
│   │   │   ├── auth.js                    # Auth routes
│   │   │   ├── pbx.js                     # PBX/IVR routes
│   │   │   ├── stream.js                  # WebSocket stream routes
│   │   │   ├── monitor.ts                 # Monitoring routes
│   │   │   ├── toolbar.ts                 # Toolbar routes
│   │   │   └── ivr-designer.js            # IVR designer routes
│   │   │
│   │   ├── services/                      # Business logic services
│   │   │   ├── audioConverter.js          # Audio format conversion
│   │   │   ├── audioProcessor.js          # RMS analysis, silence detection
│   │   │   ├── elevenlabsService.js       # ElevenLabs TTS integration
│   │   │   ├── openaiService.js           # OpenAI API integration
│   │   │   ├── playbackService.js         # Audio playback management
│   │   │   ├── flowEngine.js              # Conversational flow engine
│   │   │   ├── streamClient.js            # WebSocket client handler
│   │   │   ├── streamServer.js            # WebSocket server
│   │   │   └── userStore.js               # User data management
│   │   │
│   │   ├── types/                         # TypeScript types
│   │   │   ├── index.ts                   # Shared types
│   │   │   └── monitor.d.ts               # Monitor types
│   │   │
│   │   ├── public/                        # Static assets
│   │   │   ├── css/
│   │   │   │   ├── styles.css
│   │   │   │   └── toolbar.css
│   │   │   └── js/
│   │   │       ├── auth.js
│   │   │       ├── login.js
│   │   │       └── toolbar.js
│   │   │
│   │   └── views/                         # EJS templates
│   │       ├── login.ejs
│   │       ├── dashboard.ejs
│   │       └── toolbar.ejs
│   │
│   ├── ivr-designer/                      # React IVR Designer
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       ├── components/
│   │       │   ├── FlowCanvas.jsx         # React Flow canvas
│   │       │   ├── NodePalette.jsx        # Node selection
│   │       │   ├── NodeProperties.jsx     # Node configuration
│   │       │   ├── Toolbar.jsx            # Top toolbar
│   │       │   └── nodes/                 # Custom node types
│   │       │       ├── PlayTextNode.jsx
│   │       │       ├── CollectInputNode.jsx
│   │       │       ├── ConditionalNode.jsx
│   │       │       └── APICallNode.jsx
│   │       └── store/
│   │           └── flowStore.js           # Zustand state management
│   │
│   ├── config/                            # Configuration
│   │   └── security.js                    # Security settings
│   │
│   ├── logs/                              # Log files
│   │   └── stream/                        # Stream event logs
│   │
│   └── views/                             # Additional views
│       ├── login.html
│       └── toolbar.html
│
├── Procfile                               # Railway deployment
├── railway.json                           # Railway config
├── vercel.json                            # Vercel config
├── .env.example                           # Environment variables template
└── package.json                           # Root package.json
```

---

## 🔧 Core Services Implementation

### 1. StreamServer (WebSocket Server)

**File:** `src/services/streamServer.js`

**Purpose:** Receives events from Ozonetel, manages WebSocket connections, sends audio packets back.

**Key Features:**
- Manual upgrade handling for `/ws` endpoint
- UCID-to-connection mapping
- Audio packet transmission (400 samples @ 8kHz)
- DC offset removal, crossfade, fade-out padding

**Critical Methods:**
```javascript
class StreamServer {
  constructor(server, streamClient)
  handleConnection(ws, req)
  handleMessage(ws, data, connectionId)
  async sendAudioToOzonetel(ucid, samples)
  _removeDCOffset(samples)
  _applyCrossfade(ucid, samples)
  _applyFadeoutPadding(samples, targetSize)
}
```

**WebSocket Message Format (Outbound):**
```json
{
  "type": "media",
  "ucid": "call_id",
  "data": {
    "samples": [array of 400 Int16 values],
    "bitsPerSample": 16,
    "sampleRate": 8000,
    "channelCount": 1,
    "numberOfFrames": 400,
    "type": "data"
  }
}
```

---

### 2. StreamClient (Event Handler)

**File:** `src/services/streamClient.js`

**Purpose:** Processes incoming WebSocket events (start, media, stop), manages audio buffering, triggers transcription.

**Key Features:**
- Event routing (start, media, stop)
- Audio buffering per UCID
- Transcription triggering on silence
- Concurrency control (prevents duplicate transcriptions)

**Event Handlers:**
```javascript
class StreamClient {
  handleMessage(data)
  handleStartEvent(message)
  handleMediaEvent(message)
  handleStopEvent(message)
  async transcribeAudioChunk(ucid, audioBuffer)
  async finalizeTranscription(ucid)
}
```

**Concurrency Maps:**
```javascript
transcriptionInProgress = new Map()  // UCID → boolean
playbackInProgress = new Map()        // UCID → boolean
```

---

### 3. AudioProcessor (Silence Detection)

**File:** `src/services/audioProcessor.js`

**Purpose:** Buffers incoming audio, performs RMS analysis, detects silence, determines when to transcribe.

**Key Features:**
- RMS-based audio activity detection
- Configurable silence threshold (2 seconds)
- Buffer management (min 3s, max 8s)

**Configuration:**
```javascript
{
  minAudioDuration: 3000,      // 3 seconds
  maxAudioDuration: 8000,      // 8 seconds
  silenceThreshold: 2000,      // 2 seconds
  silenceAmplitude: 200,       // RMS threshold
  sampleRate: 8000
}
```

**Core Logic:**
```javascript
// Trigger transcription when:
1. Silent for 2+ seconds (prioritized)
2. OR reached max duration (8s)
3. OR reached min duration (3s) and silent
```

---

### 4. OpenAI Service

**File:** `src/services/openaiService.js`

**Purpose:** Integrates Whisper (STT), GPT-4 (intent/response).

**Methods:**
```javascript
class OpenAIService {
  async speechToText(audioBuffer, language)
  async detectIntent(userText, possibleIntents, context)
  async generateResponse(userMessage, conversationHistory, systemContext)
  async textToSpeech(text, voice, model)  // Legacy, not used
}
```

**Whisper Configuration:**
```javascript
{
  model: 'whisper-1',
  language: 'en',  // Auto-detects Telugu/Tamil/Hindi
  response_format: 'verbose_json'
}
```

**GPT Configuration:**
```javascript
{
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 150
}
```

---

### 5. ElevenLabs Service

**File:** `src/services/elevenlabsService.js`

**Purpose:** Ultra-low latency text-to-speech using ElevenLabs Flash v2.5.

**Configuration:**
```javascript
{
  model_id: 'eleven_flash_v2_5',      // 75ms latency
  output_format: 'pcm_16000',         // 16kHz PCM
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0,
    use_speaker_boost: true
  }
}
```

**Voice Mapping:**
```javascript
{
  'alloy': 'pNInz6obpgDQGcFmaJgB',    // Adam
  'echo': 'TxGEqnHWrfWFTfGW9XjX',    // Josh
  'fable': 'XB0fDUnXU5powFXDhCwa',   // Charlotte
  'onyx': 'pqHfZKP75CvOlQylNhV4',    // Bill
  'nova': 'EXAVITQu4vr4xnSDxMaL',    // Bella
  'shimmer': 'ThT5KcBeYPX3keUQqHPh' // Dorothy
}
```

**Language Normalization:**
- Converts full names to ISO 639-1 codes
- 'english' → 'en', 'hindi' → 'hi', 'telugu' → 'te', etc.

---

### 6. Audio Converter

**File:** `src/services/audioConverter.js`

**Purpose:** Convert audio formats using FFmpeg.

**Key Operations:**
```javascript
// 16kHz PCM → 8kHz PCM
async convertPCMToSamplesArray(pcmBuffer, inputSampleRate)

// MP3 → 8kHz PCM (legacy)
async convertToPCM(mp3Buffer)

// PCM → μ-law encoding
pcmToMulaw(pcmBuffer)
```

**FFmpeg Resampling:**
```javascript
ffmpeg(inputStream)
  .inputFormat('s16le')
  .inputOptions([`-ar ${inputSampleRate}`, '-ac 1'])
  .audioFrequency(8000)
  .audioChannels(1)
  .audioCodec('pcm_s16le')
  .format('s16le')
```

---

### 7. Playback Service

**File:** `src/services/playbackService.js`

**Purpose:** Manage TTS playback, audio streaming.

**Methods:**
```javascript
async playText(ucid, text, voice, language)
async playAudio(ucid, samples)
async playTextSequence(ucid, textArray, voice, language)
```

**Optimization:**
- Single batch send (no chunking loop)
- StreamServer handles 400-sample packetization
- Eliminates jitter and async overhead

---

### 8. Flow Engine

**File:** `src/services/flowEngine.js`

**Purpose:** Orchestrate conversational AI flow.

**Main Flow:**
```javascript
async executeConversationalFlow(ucid, userText, options) {
  1. Detect intent (GPT-4)
  2. Generate response (GPT-4)
  3. Play response (ElevenLabs → Audio)
  4. Handle errors gracefully
}
```

**Session Management:**
```javascript
{
  callId: 'ucid',
  startTime: timestamp,
  currentStep: 'start',
  conversationHistory: [],
  context: {}
}
```

---

## 🔐 Environment Variables

**File:** `.env.example`

```bash
# Server
NODE_ENV=production
PORT=3000
SESSION_SECRET=generate-random-secret-here

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# OpenAI (STT + GPT)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# ElevenLabs (TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_MODEL_ID=eleven_flash_v2_5
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY=0.75
ELEVENLABS_STYLE=0

# Custom Voice IDs (optional)
ELEVENLABS_VOICE_ALLOY=pNInz6obpgDQGcFmaJgB
ELEVENLABS_VOICE_ECHO=TxGEqnHWrfWFTfGW9XjX
ELEVENLABS_VOICE_FABLE=XB0fDUnXU5powFXDhCwa
```

---

## 🚀 Deployment Configuration

### Railway (Recommended)

**File:** `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd agent-login-app && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**File:** `Procfile`
```
web: cd agent-login-app && npm start
```

**File:** `agent-login-app/nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ['nodejs-22_x', 'ffmpeg']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build || true']

[start]
cmd = 'npm start'
```

---

## 📊 Audio Specifications

### Ozonetel Format Requirements

```yaml
Format: PCM (16-bit signed little-endian)
Sample Rate: 8000 Hz
Channels: 1 (Mono)
Packet Size: 400 samples
Packet Duration: 50ms (400 ÷ 8000 = 0.05s)
Bit Depth: 16-bit
Transport: WebSocket (JSON messages)
```

### Audio Quality Enhancements

**DC Offset Removal:**
```javascript
// Centers audio at zero to eliminate clicks
const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
return samples.map(sample => Math.round(sample - mean));
```

**Crossfade (2.5ms):**
```javascript
// Smooth transitions between packets
const fadeLength = 20;  // 20 samples @ 8kHz = 2.5ms
for (let i = 0; i < fadeLength; i++) {
  const t = i / fadeLength;
  result[i] = Math.round(lastSample * (1 - t) + samples[i] * t);
}
```

**Fade-out Padding:**
```javascript
// Prevents clicks at end of audio
for (let i = 0; i < paddingNeeded; i++) {
  const t = i / paddingNeeded;
  const fadedValue = Math.round(lastValue * (1 - t));
  result.push(fadedValue);
}
```

---

## 🎯 Performance Metrics

```yaml
ElevenLabs TTS Latency: ~75ms (Flash v2.5)
FFmpeg Resampling: ~10-20ms
Audio Packetization: <5ms
Total Response Latency: ~90-100ms
Packet Rate: 20 packets/second (50ms each)
Bandwidth: ~12.8 KB/s per call
Silence Detection: 2 seconds
Max Audio Buffer: 8 seconds
Transcription Accuracy: >95% (Whisper)
```

---

## 🔄 Complete Call Flow

### 1. Call Start
```
Phone rings → Ozonetel answers → WebSocket 'start' event → 
StreamClient.handleStartEvent() → Initialize AudioProcessor → 
Map UCID to connection → Ready to receive audio
```

### 2. Audio Streaming (Inbound)
```
Caller speaks → Ozonetel sends 'media' events → 
StreamClient.handleMediaEvent() → AudioProcessor.appendAudio() → 
RMS analysis → Silence detection → Buffer management
```

### 3. Silence Detected
```
2 seconds silence → shouldSendToAPI() = true → 
StreamClient.transcribeAudioChunk() → Whisper API → 
Text transcription → executeConversationalFlow()
```

### 4. AI Processing
```
Transcribed text → GPT-4 intent detection → 
Generate appropriate response → FlowEngine.executeConversationalFlow() → 
ElevenLabs TTS
```

### 5. Audio Playback (Outbound)
```
ElevenLabs PCM 16kHz → AudioConverter (FFmpeg) → PCM 8kHz samples → 
PlaybackService.playAudio() → StreamServer.sendAudioToOzonetel() → 
DC offset removal → Crossfade → 400-sample packets → 
WebSocket JSON → Ozonetel → Caller hears response
```

### 6. Call End
```
Caller hangs up / timeout → Ozonetel 'stop' event → 
StreamClient.handleStopEvent() → Finalize transcription → 
Clear buffers → Delete UCID mapping (delayed 10s) → Complete
```

---

## 🧪 Testing Strategy

### 1. Unit Tests (Recommended)

```javascript
// Test audio processor silence detection
describe('AudioProcessor', () => {
  test('detects silence after 2 seconds', () => {
    // Generate silent audio
    // Verify shouldSendToAPI() returns true
  });
});

// Test audio conversion
describe('AudioConverter', () => {
  test('converts 16kHz PCM to 8kHz', async () => {
    // Create 16kHz buffer
    // Convert and verify output is 8kHz
  });
});
```

### 2. Integration Tests

```javascript
// Test complete transcription flow
describe('Speech Flow', () => {
  test('transcribes audio and generates response', async () => {
    // Mock Whisper API
    // Mock GPT-4 API
    // Mock ElevenLabs API
    // Verify complete flow
  });
});
```

### 3. Load Testing

```bash
# Simulate multiple concurrent calls
artillery quick --count 10 --num 50 wss://your-domain/ws
```

---

## 🔧 Implementation Checklist

### Phase 1: Foundation (Day 1)
- [ ] Initialize Node.js project
- [ ] Install dependencies (express, ws, axios, openai, ffmpeg)
- [ ] Set up project structure (src/, routes/, services/)
- [ ] Configure environment variables
- [ ] Implement basic Express server
- [ ] Set up WebSocket server (StreamServer)

### Phase 2: Audio Pipeline (Day 2)
- [ ] Implement AudioProcessor (RMS, silence detection)
- [ ] Implement AudioConverter (FFmpeg integration)
- [ ] Create StreamClient (event handlers)
- [ ] Test audio buffering and processing

### Phase 3: AI Integration (Day 3)
- [ ] Integrate OpenAI Whisper (STT)
- [ ] Integrate OpenAI GPT-4 (intent/response)
- [ ] Integrate ElevenLabs (TTS)
- [ ] Implement language normalization
- [ ] Test end-to-end AI flow

### Phase 4: Services Layer (Day 4)
- [ ] Implement PlaybackService
- [ ] Implement FlowEngine
- [ ] Add concurrency control (Maps)
- [ ] Implement audio quality enhancements (DC offset, crossfade)
- [ ] Test complete conversational flow

### Phase 5: UI & Routes (Day 5)
- [ ] Create authentication routes
- [ ] Implement IVR designer (React + React Flow)
- [ ] Build monitoring dashboard
- [ ] Add logging and error handling

### Phase 6: Testing & Deployment (Day 6)
- [ ] Unit tests for core services
- [ ] Integration tests for API flows
- [ ] Load testing for WebSocket
- [ ] Deploy to Railway
- [ ] Configure DNS and SSL
- [ ] Test with actual Ozonetel calls

---

## 🐛 Common Issues & Solutions

### Issue 1: Audio Jitter/Slow Playback
**Cause:** Chunking loop with async overhead  
**Solution:** Send entire audio buffer at once, let StreamServer packetize

### Issue 2: Clicking Sounds in Audio
**Cause:** DC offset, abrupt packet boundaries  
**Solution:** Implement DC offset removal, crossfade, fade-out padding

### Issue 3: Duplicate Transcriptions
**Cause:** Concurrent transcription calls  
**Solution:** Use transcriptionInProgress Map with flags

### Issue 4: ElevenLabs "unsupported_language"
**Cause:** Sending full language name instead of ISO code  
**Solution:** Normalize 'english' → 'en' via language map

### Issue 5: "No active connection for UCID"
**Cause:** UCID mapping deleted before playback completes  
**Solution:** Delay UCID deletion by 10 seconds on stop event

### Issue 6: Silence Not Detected
**Cause:** minAudioDuration check blocks silence trigger  
**Solution:** Prioritize silence detection in shouldSendToAPI()

---

## 📈 Scaling Considerations

### Horizontal Scaling
```yaml
Load Balancer: Nginx/HAProxy
App Instances: Multiple Node.js processes
Session Store: Redis (for sticky sessions)
WebSocket: Socket.io with Redis adapter
```

### Caching Strategy
```javascript
// Cache TTS responses for common phrases
const ttsCache = new Map();
const cacheKey = `${text}_${voice}_${language}`;
if (ttsCache.has(cacheKey)) {
  return ttsCache.get(cacheKey);
}
```

### Rate Limiting
```javascript
// Prevent API abuse
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // Max requests per window
});
```

---

## 🔒 Security Best Practices

### 1. API Key Protection
```javascript
// Never commit .env files
// Use environment variables
// Rotate keys regularly
```

### 2. WebSocket Authentication
```javascript
// Verify origin
// Use API keys or tokens
// Implement CORS properly
```

### 3. Input Validation
```javascript
// Sanitize all user inputs
// Validate audio buffer sizes
// Check UCID format
```

### 4. Rate Limiting
```javascript
// Limit API calls per IP
// Throttle concurrent connections
// Monitor for abuse
```

---

## 📚 API Documentation

### WebSocket Events (Inbound)

**Start Event:**
```json
{
  "event": "start",
  "ucid": "35862521565594762",
  "timestamp": "2025-11-07T12:00:00Z",
  "caller": "+1234567890",
  "callee": "+0987654321"
}
```

**Media Event:**
```json
{
  "event": "media",
  "ucid": "35862521565594762",
  "data": {
    "samples": [array of Int16],
    "bitsPerSample": 16,
    "sampleRate": 8000,
    "channelCount": 1,
    "numberOfFrames": 400,
    "type": "data"
  }
}
```

**Stop Event:**
```json
{
  "event": "stop",
  "ucid": "35862521565594762",
  "timestamp": "2025-11-07T12:05:00Z",
  "reason": "caller_hangup"
}
```

### REST API Endpoints

```
POST   /api/auth/login              # User authentication
POST   /api/auth/logout             # User logout
GET    /api/status                  # Service health check
GET    /api/monitor/active-calls    # Active call monitoring
POST   /pbx/ivrflow                 # IVR flow handler
GET    /ivr-designer                # IVR designer UI
```

---

## 🎓 Learning Resources

### Documentation
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI GPT-4 API](https://platform.openai.com/docs/guides/gpt)
- [ElevenLabs TTS API](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

### Tutorials
- Building Real-time Voice Applications
- WebSocket Best Practices
- Audio Processing with Node.js
- AI Agent Design Patterns

---

## 📝 License & Credits

```
MIT License

Copyright (c) 2025 AI Agent Portal

Built with:
- OpenAI (Whisper, GPT-4)
- ElevenLabs (Flash v2.5)
- Ozonetel (Telephony Platform)
- FFmpeg (Audio Processing)
- Node.js + Express
```

---

## 🎯 Quick Start Commands

```bash
# Clone and setup
git clone <repository>
cd ai-agent-portal/agent-login-app
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Development
npm run dev

# Production
npm start

# Deploy to Railway
railway up
railway env set OPENAI_API_KEY=sk-xxx
railway env set ELEVENLABS_API_KEY=xxx
```

---

## 📞 Support & Contact

For hackathon support or implementation questions:
- Create an issue in the repository
- Check existing documentation
- Review code comments
- Test with provided examples

---

**Document Version:** 1.0.0  
**Last Updated:** November 7, 2025  
**Status:** Production Ready  
**Tested:** ✅ Railway, Ozonetel Integration  

**Ready for:** Hackathons, POCs, Production Deployment
