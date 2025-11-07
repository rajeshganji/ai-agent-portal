# Real-time Speech-to-Text Architecture Plan
## Ozonetel → OpenAI Whisper Streaming Integration

---

## 📋 CURRENT STATE ANALYSIS

### What We Have Now:

1. **StreamServer** (`src/services/streamServer.js`)
   - Receives WebSocket connections on `/ws` path ✅
   - Handles incoming JSON messages from Ozonetel ✅
   - Forwards messages to StreamClient ✅
   - Logs audio data info (sampleRate, samples, etc.) ✅

2. **StreamClient** (`src/services/streamClient.js`)
   - Processes Ozonetel events: `start`, `media`, `stop` ✅
   - Buffers audio samples in memory ✅
   - Stores audio per call (ucid) ✅
   - Logs events to files ✅

3. **OpenAI Service** (`src/services/openaiService.js`)
   - Has `speechToText()` method ✅
   - Currently expects **complete audio file** ❌
   - Not streaming-ready yet ❌

### Ozonetel Data Format (from logs):

```json
{
  "event": "media",
  "type": "media",
  "ucid": "UNIQUE_CALL_ID",
  "data": {
    "samples": [12, -45, 67, ...],      // Raw PCM samples (array of numbers)
    "bitsPerSample": 16,                 // 16-bit audio
    "sampleRate": 8000,                  // 8kHz (second packet onwards)
    "channelCount": 1,                   // Mono
    "numberOfFrames": 160,               // Number of samples in this packet
    "type": "audio/l16"                  // Linear PCM 16-bit
  }
}
```

**Key Points:**
- ✅ First packet is 16kHz (ignored per spec)
- ✅ Subsequent packets are 8kHz PCM audio
- ✅ Samples arrive as **array of numbers** (not base64)
- ✅ Packets arrive every ~20ms (160 frames at 8kHz = 20ms)

---

## 🎯 PROPOSED ARCHITECTURE

### Goal:
Stream Ozonetel audio → OpenAI Whisper API in real-time → Get transcription chunks → Log results

### Architecture Flow:

```
┌─────────────┐         WebSocket          ┌──────────────────┐
│  Ozonetel   │ ─────── JSON packets ─────→│  StreamServer    │
│   (Phone)   │        /ws endpoint         │  (Express+WS)    │
└─────────────┘                             └────────┬─────────┘
                                                     │
                                                     ↓ Forward message
                                            ┌────────┴─────────┐
                                            │  StreamClient    │
                                            │  - Buffer audio  │
                                            │  - Detect events │
                                            └────────┬─────────┘
                                                     │
                        ┌────────────────────────────┼────────────────────────────┐
                        │                            │                            │
                        ↓                            ↓                            ↓
                 [start event]                [media event]                [stop event]
                        │                            │                            │
                        ↓                            ↓                            ↓
                ┌───────────────┐          ┌─────────────────┐          ┌─────────────────┐
                │ Init session  │          │  Audio Streamer │          │ Finalize & close│
                │ - Create UCID │          │  - Accumulate   │          │ - Get final text│
                │ - Start timer │          │  - Send to API  │          │ - Log result    │
                └───────────────┘          └────────┬────────┘          └─────────────────┘
                                                    │
                                                    ↓
                                        ┌───────────────────────┐
                                        │  Audio Buffer Manager │
                                        │  ───────────────────  │
                                        │  1. Convert samples   │
                                        │     → WAV format      │
                                        │  2. Accumulate chunks │
                                        │  3. Detect silence    │
                                        │  4. Send when ready   │
                                        └──────────┬────────────┘
                                                   │
                                                   ↓
                                        ┌──────────────────────┐
                                        │  OpenAI Whisper API  │
                                        │  ──────────────────  │
                                        │  Method: POST        │
                                        │  Model: whisper-1    │
                                        │  Format: WAV/MP3     │
                                        └──────────┬───────────┘
                                                   │
                                                   ↓
                                        ┌──────────────────────┐
                                        │  Transcription       │
                                        │  { text, language }  │
                                        └──────────────────────┘
```

---

## 🔧 IMPLEMENTATION PLAN (Step by Step)

### **Step 1: Audio Buffer Processor**
Create new module: `src/services/audioProcessor.js`

**Purpose:**
- Convert Ozonetel PCM samples → WAV format
- Accumulate audio chunks
- Detect silence periods
- Prepare audio for OpenAI API

**Functions:**
```javascript
class AudioProcessor {
  constructor(ucid) {
    this.ucid = ucid;
    this.audioChunks = [];      // Store raw samples
    this.silenceThreshold = 500; // Milliseconds of silence
    this.lastAudioTime = Date.now();
  }

  // Add incoming audio samples
  addSamples(samples, sampleRate) { }

  // Convert accumulated samples to WAV buffer
  toWAVBuffer() { }

  // Detect if silence (no audio for X ms)
  isSilent() { }

  // Clear buffers
  reset() { }
}
```

---

### **Step 2: Enhanced StreamClient**
Modify: `src/services/streamClient.js`

**Changes:**
```javascript
// Add at top
const AudioProcessor = require('./audioProcessor');
const openaiService = require('./openaiService');

class StreamClient {
  constructor() {
    // ... existing code ...
    this.audioProcessors = new Map(); // One processor per call
    this.transcriptionSessions = new Map(); // Store transcriptions
  }

  async handleStartEvent(message) {
    const { ucid } = message;
    
    // Create audio processor for this call
    this.audioProcessors.set(ucid, new AudioProcessor(ucid));
    this.transcriptionSessions.set(ucid, {
      startTime: Date.now(),
      chunks: [],
      finalTranscription: ''
    });
    
    console.log(`[StreamClient] 🎙️ Started transcription session for ${ucid}`);
  }

  async handleMediaEvent(message) {
    const { ucid, data } = message;
    const { samples, sampleRate } = data;
    
    // Get audio processor
    const processor = this.audioProcessors.get(ucid);
    if (!processor) return;
    
    // Add samples to buffer
    processor.addSamples(samples, sampleRate);
    
    // Check if we have enough audio OR silence detected
    if (processor.shouldSendToAPI()) {
      await this.transcribeAudioChunk(ucid);
    }
  }

  async transcribeAudioChunk(ucid) {
    const processor = this.audioProcessors.get(ucid);
    const session = this.transcriptionSessions.get(ucid);
    
    // Convert to WAV
    const wavBuffer = processor.toWAVBuffer();
    
    console.log(`[StreamClient] 📤 Sending ${wavBuffer.length} bytes to Whisper API`);
    
    // Send to OpenAI
    const { text, language } = await openaiService.speechToText(wavBuffer);
    
    console.log(`[StreamClient] 📝 Transcription: "${text}"`);
    
    // Store result
    session.chunks.push({
      timestamp: Date.now(),
      text,
      language
    });
    
    // Reset buffer for next chunk
    processor.reset();
  }

  async handleStopEvent(message) {
    const { ucid } = message;
    
    // Send any remaining audio
    if (this.audioProcessors.has(ucid)) {
      await this.transcribeAudioChunk(ucid);
    }
    
    // Get final transcription
    const session = this.transcriptionSessions.get(ucid);
    const finalText = session.chunks.map(c => c.text).join(' ');
    
    console.log('═'.repeat(60));
    console.log(`[StreamClient] 🎯 FINAL TRANSCRIPTION for ${ucid}`);
    console.log(`[StreamClient] Duration: ${Date.now() - session.startTime}ms`);
    console.log(`[StreamClient] Chunks: ${session.chunks.length}`);
    console.log(`[StreamClient] Text: "${finalText}"`);
    console.log('═'.repeat(60));
    
    // Clean up
    this.audioProcessors.delete(ucid);
    this.transcriptionSessions.delete(ucid);
    
    // Close WebSocket (as requested)
    // Note: WebSocket is managed by StreamServer, not here
  }
}
```

---

### **Step 3: Silence Detection**

**Strategy:**
1. Track timestamp of last non-silent packet
2. If no audio for X ms → trigger transcription
3. Configurable threshold (e.g., 1000ms)

**Implementation:**
```javascript
class AudioProcessor {
  isSilent() {
    const now = Date.now();
    const silenceDuration = now - this.lastAudioTime;
    return silenceDuration > this.silenceThreshold;
  }

  shouldSendToAPI() {
    // Send if:
    // 1. We have enough audio (e.g., 3 seconds)
    // 2. OR silence detected
    const hasEnoughAudio = this.audioChunks.length > 24000; // 3 sec at 8kHz
    const silenceDetected = this.isSilent();
    
    return hasEnoughAudio || silenceDetected;
  }
}
```

---

### **Step 4: OpenAI Streaming Enhancement**
Modify: `src/services/openaiService.js`

**Current Issue:**
- `speechToText()` writes temp file to disk
- Not efficient for streaming

**Better Approach:**
```javascript
async speechToText(audioBuffer, language = 'auto') {
  // Create FormData with buffer directly (no temp file)
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), 'audio.wav');
  formData.append('model', 'whisper-1');
  if (language !== 'auto') formData.append('language', language);
  
  // Send to API
  const response = await this.client.audio.transcriptions.create(formData);
  
  return {
    text: response.text,
    language: response.language || language
  };
}
```

---

## 🎛️ CONFIGURATION

### Tunable Parameters:

```javascript
const CONFIG = {
  // Audio buffering
  MIN_AUDIO_DURATION: 1000,        // Min 1 second before sending
  MAX_AUDIO_DURATION: 5000,        // Max 5 seconds, send anyway
  
  // Silence detection
  SILENCE_THRESHOLD: 1000,         // 1 second of silence → send
  SILENCE_AMPLITUDE: 100,          // Samples below this = silence
  
  // API settings
  WHISPER_MODEL: 'whisper-1',
  WHISPER_LANGUAGE: 'auto',        // or 'en', 'hi', etc.
  
  // Logging
  LOG_AUDIO_CHUNKS: true,
  LOG_TRANSCRIPTIONS: true
};
```

---

## 📊 DATA FLOW EXAMPLE

### Scenario: User says "Hello, I want to check my balance"

```
Time    | Event        | Data
--------|--------------|--------------------------------------------------
0ms     | start        | ucid=12345, Create AudioProcessor
20ms    | media        | 160 samples (8kHz) → buffer
40ms    | media        | 160 samples → buffer
60ms    | media        | 160 samples → buffer
...     | ...          | ...
1000ms  | media        | 8000 samples total (1 second of "Hello")
1020ms  | (silence)    | Silence detected → Send to API
1100ms  | API response | text: "Hello"
1120ms  | media        | User continues "I want to..."
2000ms  | media        | 8000 more samples
2020ms  | (silence)    | Send to API
2100ms  | API response | text: "I want to check my balance"
2200ms  | stop         | Combine: "Hello I want to check my balance"
        |              | Log final transcription
        |              | Close WebSocket ❌ (for now)
```

---

## 🚨 QUESTIONS TO DISCUSS

### **Question 1: Audio Chunking Strategy**
**Option A: Time-based**
- Send every 2-3 seconds regardless
- ✅ Predictable
- ❌ May cut words mid-sentence

**Option B: Silence-based**
- Send when 1 second silence detected
- ✅ Natural word boundaries
- ❌ May wait too long

**Option C: Hybrid** (RECOMMENDED)
- Send after 3 seconds OR 1 second silence, whichever comes first
- ✅ Balance of both
- ✅ Best user experience

**Your preference?**

---

### **Question 2: When to Send to OpenAI?**

Current plan: Send incrementally (stream chunks)
- ✅ Real-time transcription
- ✅ Lower latency
- ❌ Multiple API calls (costs more)
- ❌ May miss context between chunks

Alternative: Send all at once at end
- ✅ Better accuracy (full context)
- ✅ Single API call
- ❌ No real-time feedback
- ❌ Higher latency

**Which approach?**

---

### **Question 3: Error Handling**

What if OpenAI API fails?
1. **Retry logic?** (max 3 retries)
2. **Store audio for later?** (save to disk)
3. **Continue without transcription?** (just log error)

**Your preference?**

---

### **Question 4: WebSocket Closure**

You mentioned: "close the web-socket for now"

**When exactly?**
- After `stop` event? ✅
- After final transcription? ✅
- Immediately or after delay?
- Who closes? (Server or client?)

---

### **Question 5: Parallel Processing**

You mentioned: "send ozonetel data parallel to openapi"

**Clarification:**
1. Do you mean send audio chunks while call is still ongoing? (Real-time streaming)
2. Or process multiple calls simultaneously? (Parallel calls)

I assume **Real-time streaming** - correct?

---

## 📝 NEXT STEPS (AFTER DISCUSSION)

1. ✅ **Discuss & finalize** above questions
2. 🔨 **Implement** AudioProcessor module
3. 🔨 **Enhance** StreamClient with transcription logic
4. 🔨 **Update** OpenAI service for streaming
5. 🧪 **Test** with Ozonetel test data
6. 📊 **Log** results and verify accuracy
7. 🚀 **Deploy** to Railway with OPENAI_API_KEY

---

## 💡 MY RECOMMENDATIONS

Based on best practices:

1. **Chunking:** Hybrid (3 sec OR 1 sec silence)
2. **Sending:** Incremental chunks (real-time)
3. **Errors:** Retry 2x, then log and continue
4. **Closure:** Close after `stop` event + final transcription logged
5. **Processing:** Real-time streaming (parallel to call)

**Does this align with your vision?**

---

Let me know your thoughts on the questions above, and I'll implement accordingly! 🚀
