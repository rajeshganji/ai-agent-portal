# ElevenLabs Text-to-Speech Integration

This document explains the ElevenLabs TTS integration for high-quality, low-latency speech synthesis.

## Overview

The system now uses **ElevenLabs** for text-to-speech instead of OpenAI TTS, providing:
- **Ultra-low latency**: 75ms with Flash v2.5 model
- **High-quality voices**: Professional voice cloning and natural speech
- **Multilingual support**: 32+ languages
- **Better telephony format**: Direct PCM output optimized for phone calls

## Setup

### 1. Get ElevenLabs API Key

1. Sign up at [https://elevenlabs.io](https://elevenlabs.io)
2. Go to your profile settings
3. Copy your API key
4. Add to `.env` file:

```bash
ELEVENLABS_API_KEY=your_api_key_here
```

### 2. Configure Model (Optional)

Choose the best model for your use case:

```bash
# Ultra-low latency (75ms) - Best for real-time phone calls
ELEVENLABS_MODEL_ID=eleven_flash_v2_5

# High quality with low latency (250-300ms)
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5

# Highest quality (for non-real-time)
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

**Recommended for telephony**: `eleven_flash_v2_5`

### 3. Voice Configuration

The service maps OpenAI-style voice names to ElevenLabs voices:

| Voice Name | ElevenLabs Voice | Characteristics |
|------------|------------------|-----------------|
| `alloy` | Adam | Professional male |
| `echo` | Josh | Warm male |
| `fable` | Charlotte | Clear female |
| `onyx` | Bill | Deep male |
| `nova` | Bella | Friendly female |
| `shimmer` | Dorothy | Pleasant female |

#### Custom Voice IDs

You can override default voices with your own cloned voices:

1. Clone or create a voice at [https://elevenlabs.io/app/voices](https://elevenlabs.io/app/voices)
2. Copy the Voice ID
3. Add to `.env`:

```bash
ELEVENLABS_VOICE_ALLOY=your_custom_voice_id_here
```

### 4. Voice Settings (Optional)

Fine-tune voice characteristics:

```bash
# Stability (0.0 - 1.0): Higher = more consistent, Lower = more expressive
ELEVENLABS_STABILITY=0.5

# Similarity Boost (0.0 - 1.0): How closely to match the voice
ELEVENLABS_SIMILARITY=0.75

# Style (0.0 - 1.0): Exaggeration of the style
ELEVENLABS_STYLE=0
```

## Audio Flow

### Previous (OpenAI):
```
Text → OpenAI TTS → MP3 → FFmpeg → PCM 8kHz → Ozonetel
```

### Current (ElevenLabs):
```
Text → ElevenLabs TTS → PCM 16kHz → FFmpeg → PCM 8kHz → Ozonetel
```

**Benefits**:
- Faster processing (no MP3 encoding/decoding overhead)
- Lower latency (75ms model)
- Better telephony quality (PCM optimized format)

## API Usage

### Basic Text-to-Speech

```javascript
const elevenlabsService = require('./services/elevenlabsService');

// Convert text to speech
const audioBuffer = await elevenlabsService.textToSpeech(
    'Hello, how can I help you today?',
    'alloy',  // voice
    'en'      // language (optional)
);
```

### Voice Options

```javascript
// Female voices
await elevenlabsService.textToSpeech(text, 'nova');     // Friendly
await elevenlabsService.textToSpeech(text, 'fable');    // Clear
await elevenlabsService.textToSpeech(text, 'shimmer');  // Pleasant

// Male voices
await elevenlabsService.textToSpeech(text, 'alloy');    // Professional
await elevenlabsService.textToSpeech(text, 'echo');     // Warm
await elevenlabsService.textToSpeech(text, 'onyx');     // Deep
```

### Language Support

ElevenLabs auto-detects language, but you can specify:

```javascript
// Telugu
await elevenlabsService.textToSpeech('నమస్కారం', 'alloy', 'te');

// Hindi
await elevenlabsService.textToSpeech('नमस्ते', 'alloy', 'hi');

// Tamil
await elevenlabsService.textToSpeech('வணக்கம்', 'alloy', 'ta');
```

**Supported Languages**: English, Spanish, French, German, Hindi, Japanese, Chinese, Korean, Portuguese, Italian, Dutch, Turkish, Filipino, Polish, Swedish, Bulgarian, Romanian, Arabic, Czech, Greek, Finnish, Croatian, Malay, Slovak, Danish, Tamil, Ukrainian, Russian, Hungarian, Norwegian, Vietnamese

## Output Format

ElevenLabs returns **PCM 16kHz** audio, which is then:
1. Resampled to **8kHz** (telephony standard)
2. Converted to **16-bit signed samples**
3. Sent in **400-sample packets** (50ms chunks)
4. Streamed to Ozonetel via WebSocket

## Performance Characteristics

| Model | Latency | Quality | Use Case |
|-------|---------|---------|----------|
| Flash v2.5 | 75ms | Good | Real-time phone calls |
| Turbo v2.5 | 250-300ms | High | Interactive voice |
| Multilingual v2 | 500ms+ | Excellent | Pre-recorded messages |

## Error Handling

The service gracefully handles errors:

```javascript
try {
    const audio = await elevenlabsService.textToSpeech(text, voice);
} catch (error) {
    console.error('TTS failed:', error.message);
    // Fallback: Use pre-recorded message or retry
}
```

## Cost Optimization

ElevenLabs charges per character:

1. **Monitor usage**: Check dashboard at [https://elevenlabs.io/usage](https://elevenlabs.io/usage)
2. **Optimize prompts**: Keep responses concise
3. **Cache common phrases**: Store frequently used audio
4. **Use appropriate model**: Flash v2.5 is 50% cheaper than v2

## Testing

Test the integration:

```javascript
// Test basic TTS
const testAudio = await elevenlabsService.textToSpeech(
    'This is a test message',
    'alloy'
);
console.log('Audio generated:', testAudio.length, 'bytes');

// Get available voices
const voices = await elevenlabsService.getVoices();
console.log('Available voices:', voices.map(v => v.name));
```

## Troubleshooting

### "ElevenLabs service not enabled"
- Check `ELEVENLABS_API_KEY` is set in `.env`
- Verify API key is valid at [https://elevenlabs.io/app/settings](https://elevenlabs.io/app/settings)

### "Voice not found"
- Check voice ID is correct
- Use `getVoices()` to list available voices

### "Audio quality issues"
- Adjust `ELEVENLABS_STABILITY` (higher = more consistent)
- Try different voice or model
- Check input text for special characters

### "High latency"
- Use `eleven_flash_v2_5` model
- Set `optimize_streaming_latency=3` (enabled by default)
- Check network connection to ElevenLabs API

## Migration from OpenAI

The integration maintains backward compatibility:

- Same voice names (`alloy`, `echo`, `fable`, etc.)
- Same API interface in `playbackService.playText()`
- No changes needed in `flowEngine` or other services

**OpenAI is still used for**:
- Speech-to-Text (Whisper)
- Intent detection (GPT)
- Conversational responses (GPT)

## References

- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [API Reference](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Voice Library](https://elevenlabs.io/community)
- [Pricing](https://elevenlabs.io/pricing/api)
