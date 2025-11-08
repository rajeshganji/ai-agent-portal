# Banking Intent Recognition System

## Overview
Enhanced AI Agent Portal with specialized banking intent recognition and real-time audio processing for Ozonetel integration.

## 🏦 Banking Intents Supported

### 1. **card_lost**
- **Purpose**: Lost or stolen card scenarios
- **Examples**: 
  - "I lost my debit card"
  - "My credit card was stolen"
  - "Block my card immediately"
- **Response**: Immediate card blocking confirmation with new card dispatch timeline

### 2. **last_transaction_status**
- **Purpose**: Recent transaction inquiries
- **Examples**:
  - "What's my last transaction status"
  - "Is my payment processed"
  - "Check recent transactions"
- **Response**: Transaction status confirmation with mobile app guidance

### 3. **debit_card_related**
- **Purpose**: General debit card issues
- **Examples**:
  - "My debit card is not working"
  - "ATM card PIN issue"
  - "Card activation help"
- **Response**: Card status info with limits and branch visit guidance

### 4. **reach_agent**
- **Purpose**: Request human assistance
- **Examples**:
  - "I want to speak to an agent"
  - "Connect me to customer service"
  - "Need human help"
- **Response**: Agent connection with estimated wait time

### 5. **loan**
- **Purpose**: Loan-related inquiries
- **Examples**:
  - "What are loan interest rates"
  - "Check my loan application"
  - "Personal loan details"
- **Response**: Current loan products with interest rates and eligibility status

## ⏰ Timeout & Silence Handling

### Audio Processing Rules
- **Maximum Input Duration**: 10 seconds
- **Silence Detection**: 3 seconds of silence triggers processing
- **Minimum Speech**: 1 second required for valid input
- **Audio Quality**: RMS energy validation prevents noise processing

### Processing Flow
```
User Speech → Audio Buffer → Silence Detection → Intent Recognition → Banking Response → Ozonetel Playback
     ↓              ↓              ↓                    ↓                    ↓                ↓
   Max 10s      Real-time       3s quiet          OpenAI GPT-4         Contextual        ElevenLabs
                buffering       = process         Classification        Banking          TTS + Stream
```

## 🔧 Technical Implementation

### Key Functions

#### `playbackToOzonetel(ucid, text, language)`
Separate function for Ozonetel audio playback:
- Handles TTS conversion via ElevenLabs
- Manages audio streaming to call
- Language-specific voice selection
- Error handling and fallback responses

#### `recognizeBankingIntent(text)`
Banking-specific intent classifier:
- Uses OpenAI GPT-4 for intent detection
- Returns structured response with confidence
- Provides contextual banking responses
- Handles unknown intents gracefully

#### `transcribeAudioChunk(ucid)`
Enhanced audio processing:
- 10-second timeout enforcement
- 3-second silence detection
- Audio quality validation (RMS energy)
- Hallucination filtering
- Duplicate prevention

### Audio Quality Filters
1. **Duration Validation**: Minimum 1 second speech
2. **Energy Detection**: RMS > 300 for valid speech
3. **Hallucination Filter**: Removes common Whisper false positives
4. **Duplicate Prevention**: Avoids repeating same responses
5. **Silence Tracking**: Monitors quiet periods for interruption detection

## 🚀 Usage Examples

### Start Banking Session
```javascript
// Initialize streamClient with banking config
const streamClient = new StreamClient({
    url: 'ws://localhost:8080/ws',
    logDir: './logs/banking'
});

await streamClient.initialize();
```

### Process Banking Intent
```javascript
// When user speech is detected
const result = await streamClient.recognizeBankingIntent(userText);

// Play response back to caller
await streamClient.playbackToOzonetel(
    ucid, 
    result.response, 
    'en'
);
```

### Testing Banking Intents
```bash
# Run banking intent test
node test-banking-intent.js
```

## 📊 Monitoring & Logging

### Event Logging
- `transcription_chunk`: Real-time transcription results
- `banking_intent_response`: Intent detection and responses
- `ozonetel_playback`: Audio streaming events
- `timeout_triggered`: 10-second timeout events
- `silence_detected`: 3-second silence events

### Log Location
```
logs/stream/
├── stream_events_2025-11-08.jsonl
├── banking_intent_2025-11-08.jsonl
└── audio_UCID_timestamp.json
```

## 🔐 Environment Configuration

```bash
# Required for banking system
OPENAI_API_KEY=sk-your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key
STREAM_WS_URL=ws://ozonetel-server:8080/ws
DEFAULT_TRANSCRIPTION_LANGUAGE=en
ECHO_MODE=false
```

## 🎯 Banking Response Quality

### Response Characteristics
- **Concise**: Under 50 words for phone interaction
- **Professional**: Banking-appropriate language
- **Actionable**: Clear next steps provided
- **Empathetic**: Customer-focused tone
- **Secure**: Security-conscious responses for sensitive topics

### Example Responses

**Card Lost**: "I understand you have an issue with a lost or stolen card. I'm immediately blocking your card for security. Your new card will be dispatched within 3-5 business days."

**Transaction Status**: "I can help you check your recent transaction status. Your last transaction was processed successfully. For detailed history, check our mobile app."

**Agent Request**: "I understand you'd like to speak with one of our representatives. Please hold while I connect you. Estimated wait time is 2-3 minutes."

## 🔄 Integration with Ozonetel

### WebSocket Communication
- Real-time bidirectional audio streaming
- PCM 8kHz 16-bit audio format
- 400-sample packet processing
- Automatic reconnection handling

### Call Flow Integration
1. **Call Start**: Initialize transcription session
2. **Audio Stream**: Process incoming PCM packets
3. **Intent Detection**: Classify banking requests
4. **Response Generation**: Create contextual responses  
5. **Audio Playback**: Stream TTS back to caller
6. **Call End**: Clean up resources and log session

This system provides a complete banking customer service experience with intelligent intent recognition and natural language responses.