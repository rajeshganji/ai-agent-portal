# OpenAI Speech Integration Setup

## Overview

The AI Agent Portal now supports intelligent speech-based IVR flows using OpenAI's APIs:

- **Whisper** - Speech-to-text transcription
- **GPT-4** - Intent detection and conversational responses  
- **TTS** - Text-to-speech audio generation

## Quick Setup

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-...`)

### 2. Set Environment Variable

**For Railway (Production):**
```bash
# Add in Railway dashboard → Variables
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**For Local Development:**
```bash
# Create .env file in agent-login-app/
echo "OPENAI_API_KEY=sk-your-actual-api-key-here" > .env
```

### 3. Test Integration

```bash
cd agent-login-app
node test-openai.js
```

You should see:
```
✅ OpenAI service is enabled
📋 Test 1: Intent Detection
  User says: "I want to check my account balance"
  ✅ Intent: check_balance
     Confidence: 95.0%
...
```

## Features

### 1. Intent Detection

Automatically understands what users want:

```javascript
const intentResult = await openaiService.detectIntent(
    'I want to check my balance',
    ['check_balance', 'make_payment', 'speak_to_agent']
);

// Returns: { intent: 'check_balance', confidence: 0.95, entities: {} }
```

### 2. Conversational Responses

Generates natural, context-aware responses:

```javascript
const response = await openaiService.generateResponse(
    'I want to check my balance',
    conversationHistory,
    'You are a helpful bank customer service agent'
);

// Returns: "I'd be happy to help you check your account balance..."
```

### 3. Text-to-Speech

Converts text to natural-sounding voice:

```javascript
const audioBuffer = await openaiService.textToSpeech(
    'Your balance is $1,234.56',
    'alloy' // voice: alloy, echo, fable, onyx, nova, shimmer
);
```

### 4. Speech-to-Text (Whisper)

Transcribes recorded audio:

```javascript
const { text, language } = await openaiService.speechToText(
    audioBuffer,
    'auto' // auto-detect language or specify 'en', 'hi', etc.
);
```

## IVR Flow Engine

### Test Flow (DTMF-based with AI enhancement)

```bash
# Test URL (after deploying)
curl "https://your-app.railway.app/api/pbx/ivrflow?event=NewCall&sid=test123"
```

Flow:
1. **Welcome** - AI-generated greeting
2. **Menu** - Press 1/2/3 options
3. **Response** - AI-enhanced responses based on selection
4. **Goodbye** - Natural hangup message

### Simple Speech Flow

```javascript
// In flowEngine.executeSimpleSpeechFlow()
// Flow: Greet → Listen → Understand → Respond → Hangup

1. User calls
2. System: "How can I help you today?"
3. User speaks: "I want to check my balance"
4. AI detects intent + generates response
5. System: "I'd be happy to help you check your balance..."
```

## Current Implementation

### Files Created

1. **`src/services/openaiService.js`**
   - OpenAI API wrapper
   - Speech-to-text, TTS, intent detection, chat

2. **`src/services/flowEngine.js`**
   - Flow execution engine
   - Session management
   - KooKoo XML generation

3. **`test-openai.js`**
   - Integration tests
   - Validates all OpenAI features

### Updated Files

1. **`src/routes/pbx.js`**
   - Now uses flowEngine with AI
   - Falls back to basic IVR if OpenAI unavailable

## Testing

### Local Test

```bash
# Set API key
export OPENAI_API_KEY=sk-...

# Run tests
node test-openai.js

# Start server
node server.js

# Test IVR endpoint
curl "http://localhost:3000/api/pbx/ivrflow?event=NewCall"
```

### Railway Test

```bash
# After setting OPENAI_API_KEY in Railway dashboard
curl "https://ai-agent-portal-production.up.railway.app/api/pbx/ivrflow?event=NewCall&sid=test123"
```

## Next Steps

### Phase 1: Basic Integration (Current)
- ✅ OpenAI service module
- ✅ Flow execution engine
- ✅ Test flow with AI enhancement
- ⏳ Full speech flow testing

### Phase 2: Designer Integration
- Add SpeechInput node (record audio)
- Add IntentDetection node (AI understanding)
- Add SpeechOutput node (TTS playback)
- Add ConversationNode (multi-turn dialog)

### Phase 3: Production Features
- Audio storage (S3/Railway volumes)
- Conversation logging
- Analytics dashboard
- A/B testing different prompts

## API Costs (OpenAI Pricing)

- **Whisper**: $0.006 / minute of audio
- **GPT-4o-mini**: $0.15 / 1M input tokens, $0.60 / 1M output tokens
- **TTS**: $15 / 1M characters

**Example cost per call** (2-minute conversation):
- Speech-to-text: $0.012
- Intent + Response (2-3 API calls): ~$0.001
- Text-to-speech (100 words): ~$0.001
- **Total**: ~$0.014 per call

## Troubleshooting

### API Key Not Working

```bash
# Verify key is set
echo $OPENAI_API_KEY

# Test with curl
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Rate Limits

OpenAI has rate limits:
- Free tier: 3 RPM (requests per minute)
- Paid tier 1: 3,500 RPM
- Add delays between requests if needed

### Audio Format Issues

KooKoo supports:
- WAV (recommended)
- MP3
- GSM

OpenAI TTS outputs MP3 by default (compatible).

## Support

For issues:
1. Check Railway logs: `railway logs`
2. Check OpenAI status: https://status.openai.com/
3. Review test output: `node test-openai.js`
