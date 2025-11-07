# Testing TTS Playback System

## Overview
Complete guide to test the TTS playback system that plays AI-generated responses back to Ozonetel callers over WebSocket.

## Architecture

```
Caller speaks
    ↓
Ozonetel WebSocket (incoming audio)
    ↓
StreamClient → AudioProcessor → Whisper STT
    ↓
Transcribed Text
    ↓
FlowEngine.executeConversationalFlow()
    ├─→ GPT-4: Detect Intent
    ├─→ GPT-4: Generate Response
    └─→ PlaybackService.playText()
            ├─→ OpenAI TTS (text → MP3)
            ├─→ AudioConverter (MP3 → PCM 8kHz)
            └─→ StreamServer.sendAudioToOzonetel()
                    ↓
            Ozonetel WebSocket (outbound audio)
                    ↓
            Caller hears response
```

## Components

### 1. AudioConverter
- **Location**: `src/services/audioConverter.js`
- **Purpose**: Convert MP3 to PCM format
- **Methods**:
  - `convertToPCM(mp3Buffer)` - MP3 → PCM 8kHz
  - `convertToSamplesArray(mp3Buffer)` - MP3 → samples array
  - `pcmToMulaw(pcmBuffer)` - PCM → μ-law encoding
  - `chunkAudio(buffer, size)` - Split for streaming

### 2. PlaybackService
- **Location**: `src/services/playbackService.js`
- **Purpose**: Manage audio playback queue and streaming
- **Methods**:
  - `playText(ucid, text, voice, language)` - TTS + playback
  - `playAudio(ucid, samples)` - Play PCM samples
  - `stopPlayback(ucid)` - Stop current playback
  - `isPlaying(ucid)` - Check playback status

### 3. StreamServer Enhancements
- **Location**: `src/services/streamServer.js`
- **New Methods**:
  - `sendAudioToOzonetel(ucid, samples)` - Send audio chunks
  - `sendControlMessage(ucid, command, params)` - Control messages
- **Tracks**: UCID → WebSocket connection mapping

### 4. FlowEngine Enhancements
- **Location**: `src/services/flowEngine.js`
- **New Methods**:
  - `executeConversationalFlow(ucid, text, options)` - Full AI conversation
  - `playGreeting(ucid, options)` - Multilingual greetings

## API Endpoints

### 1. Play Text as Speech
**Endpoint**: `POST /api/stream/play-text`

**Request**:
```json
{
  "ucid": "CALL_12345",
  "text": "Hello! How can I help you today?",
  "voice": "alloy",
  "language": "en"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Text playback started",
  "ucid": "CALL_12345",
  "textLength": 35,
  "voice": "alloy"
}
```

**Voices**: alloy, echo, fable, onyx, nova, shimmer

### 2. Stop Playback
**Endpoint**: `POST /api/stream/stop-playback`

**Request**:
```json
{
  "ucid": "CALL_12345"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Playback stopped for UCID: CALL_12345",
  "ucid": "CALL_12345"
}
```

### 3. Get Playback Status
**Endpoint**: `GET /api/stream/playback-status/:ucid`

**Response**:
```json
{
  "success": true,
  "ucid": "CALL_12345",
  "status": {
    "playing": true,
    "totalSamples": 80000,
    "sentSamples": 40000,
    "startTime": 1699350000000
  },
  "isPlaying": true
}
```

## Testing Steps

### Test 1: Simple Text Playback (Manual API Call)

1. **Start a call via Ozonetel** (note the UCID)

2. **Call the playback API**:
```bash
curl -X POST https://ai-agent-portal-production.up.railway.app/api/stream/play-text \
  -H "Content-Type: application/json" \
  -d '{
    "ucid": "YOUR_UCID_HERE",
    "text": "Hello! This is a test message from AI Agent Portal.",
    "voice": "alloy",
    "language": "en"
  }'
```

3. **Verify**:
   - ✅ You should hear the text spoken in the call
   - ✅ Check Railway logs for conversion progress
   - ✅ Look for "✅ Playback complete" message

### Test 2: Conversational Flow (Automated)

**Setup**: Modify `StreamClient.handleStopEvent()` to trigger conversation

Add this code after transcription finalizes:

```javascript
// In streamClient.js, after finalizeTranscription()
if (finalText && finalText.length > 10) {
    const flowEngine = require('./flowEngine');
    
    // Execute conversational response
    await flowEngine.executeConversationalFlow(ucid, finalText, {
        language: session.language || 'en',
        voice: 'alloy'
    });
}
```

**Test Flow**:
1. Call Ozonetel number
2. Speak: "Hello, I need help with my account"
3. Wait for transcription
4. **Expected**: AI responds with helpful message
5. Verify caller hears response

### Test 3: Multilingual Playback

**Telugu**:
```bash
curl -X POST http://localhost:3000/api/stream/play-text \
  -H "Content-Type: application/json" \
  -d '{
    "ucid": "UCID_123",
    "text": "నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?",
    "voice": "alloy",
    "language": "te"
  }'
```

**Hindi**:
```bash
curl -X POST http://localhost:3000/api/stream/play-text \
  -H "Content-Type: application/json" \
  -d '{
    "ucid": "UCID_123",
    "text": "नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?",
    "voice": "alloy",
    "language": "hi"
  }'
```

### Test 4: Greeting on Call Start

**Option A - Manual API Call**:
```bash
curl -X POST http://localhost:3000/api/stream/play-text \
  -H "Content-Type: application/json" \
  -d '{
    "ucid": "NEW_CALL_UCID",
    "text": "Welcome to AI Agent Portal. I am listening. How can I help you?",
    "voice": "nova",
    "language": "en"
  }'
```

**Option B - Automated in streamClient.js**:
Add to `handleStartEvent()`:
```javascript
// After session creation
if (openaiService.enabled) {
    const flowEngine = require('./flowEngine');
    await flowEngine.playGreeting(ucid, {
        language: 'te',  // or session.language
        voice: 'alloy'
    });
}
```

### Test 5: Complete Conversational Loop

**Full Integration Test**:

1. Modify `StreamClient.finalizeTranscription()`:
```javascript
async finalizeTranscription(ucid) {
    // ... existing finalization code ...
    
    // After printing final transcription
    if (finalText && finalText.trim().length > 5) {
        console.log('[StreamClient] 🤖 Triggering conversational response...');
        
        const flowEngine = require('./flowEngine');
        await flowEngine.executeConversationalFlow(ucid, finalText, {
            language: session.language || 'en',
            voice: 'alloy'
        });
    }
}
```

2. Make a test call
3. Speak: "What is the weather today?"
4. Expected flow:
   - ✅ Transcription: "What is the weather today?"
   - ✅ Intent detection: "query"
   - ✅ GPT response: "I can help with that, but I don't have access to weather data..."
   - ✅ TTS conversion
   - ✅ Playback to caller

## Monitoring & Debugging

### Check Logs (Railway)

**Transcription logs**:
```
[StreamClient] 📝 Transcription received in 1234 ms
[StreamClient] Text: Hello I need help
```

**Playback logs**:
```
[PlaybackService] 🎤 Converting text to speech...
[AudioConverter] Converting MP3 to PCM...
[AudioConverter] ✅ Conversion complete
[PlaybackService] 🔊 Playing audio to call
[PlaybackService] Progress: 50.0% (25 chunks sent)
[PlaybackService] ✅ Playback complete
```

**Flow logs**:
```
[FlowEngine] 🤖 Executing conversational flow
[FlowEngine] 🎯 Detecting intent...
[FlowEngine] Intent detected: { intent: 'help', confidence: 0.95 }
[FlowEngine] 💬 Generating AI response...
[FlowEngine] 🔊 Playing response to caller...
[FlowEngine] ✅ Conversational flow completed successfully
```

### Common Issues

#### Issue 1: No audio heard in call
**Symptom**: API returns success but caller hears nothing
**Causes**:
- UCID not mapped to WebSocket connection
- WebSocket connection closed
- Wrong audio format

**Debug**:
```bash
# Check connection mapping
curl http://localhost:3000/api/monitor/ws-status

# Check playback status
curl http://localhost:3000/api/stream/playback-status/UCID_123
```

**Fix**:
- Verify UCID matches active call
- Check WebSocket is still connected
- Ensure call hasn't ended

#### Issue 2: FFmpeg conversion fails
**Symptom**: "FFmpeg conversion failed" error
**Causes**:
- FFmpeg not installed
- Invalid MP3 buffer

**Debug**:
Check logs for:
```
[AudioConverter] Setup error: ...
[AudioConverter] Conversion error: ...
```

**Fix**:
```bash
# Verify FFmpeg is available
npm list @ffmpeg-installer/ffmpeg
```

#### Issue 3: Choppy audio or gaps
**Symptom**: Audio plays but has gaps or sounds robotic
**Causes**:
- Network latency
- Chunk delay too high
- Buffer underrun

**Debug**:
Adjust chunk delay in `playbackService.js`:
```javascript
// Reduce from 20ms to 10ms
await this.delay(10);
```

#### Issue 4: OpenAI quota exceeded
**Symptom**: "You exceeded your current quota"
**Fix**: Add billing at https://platform.openai.com/account/billing

## Performance Metrics

**Expected Latencies**:
- TTS generation: 1-3 seconds
- MP3 → PCM conversion: 0.1-0.5 seconds
- Playback streaming: Real-time (160 samples every 20ms)
- **Total round-trip**: 2-4 seconds (user stops speaking → hears response)

**Audio Specifications**:
- Sample Rate: 8000 Hz
- Bit Depth: 16-bit signed
- Channels: Mono (1)
- Encoding: PCM (linear) or μ-law
- Chunk Size: 160 samples = 20ms

## Next Steps

1. **Auto-trigger playback after transcription** ✅ (add to handleStopEvent)
2. **Add interruption handling** (detect speech during playback)
3. **Cache common responses** (pre-convert frequently used phrases)
4. **Add playback queue** (queue multiple responses)
5. **Implement streaming TTS** (reduce latency with streaming)
6. **Add error fallbacks** (play pre-recorded messages on API failures)

## Production Checklist

Before deploying to production:

- [ ] Set `DEFAULT_TRANSCRIPTION_LANGUAGE` in Railway
- [ ] Add OpenAI billing/credits
- [ ] Test with actual Ozonetel numbers
- [ ] Monitor Railway logs for errors
- [ ] Set up error alerting
- [ ] Test all supported languages (en, hi, te, ta)
- [ ] Test with different voices
- [ ] Verify audio quality on real calls
- [ ] Load test (multiple concurrent calls)
- [ ] Set up monitoring dashboard

## API Usage Examples

### Node.js/JavaScript
```javascript
const response = await fetch('https://your-domain.railway.app/api/stream/play-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        ucid: callId,
        text: 'Thank you for calling!',
        voice: 'alloy',
        language: 'en'
    })
});

const result = await response.json();
console.log('Playback started:', result.success);
```

### Python
```python
import requests

response = requests.post(
    'https://your-domain.railway.app/api/stream/play-text',
    json={
        'ucid': call_id,
        'text': 'Thank you for calling!',
        'voice': 'alloy',
        'language': 'en'
    }
)

print('Success:', response.json()['success'])
```

### cURL
```bash
curl -X POST https://your-domain.railway.app/api/stream/play-text \
  -H "Content-Type: application/json" \
  -d '{"ucid":"123","text":"Hello!","voice":"alloy"}'
```

## Support

For issues or questions:
1. Check Railway logs: `railway logs --tail`
2. Review LANGUAGE_SETUP.md for transcription config
3. Check STREAM_IMPLEMENTATION.md for WebSocket details
4. Monitor /api/monitor/ws-status for connection status
