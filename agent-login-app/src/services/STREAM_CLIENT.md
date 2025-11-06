# WebSocket Stream Client

This module implements a WebSocket client for bi-directional audio streaming with KooKoo/Ozonetel IVR system.

## Features

- **Automatic Connection**: Connects to stream server on application startup
- **Auto-Reconnect**: Automatically reconnects if connection is lost
- **Event Handling**: Processes all stream events (start, media, stop)
- **Audio Logging**: Saves audio packets to file for processing
- **Command Support**: Supports clearBuffer and callDisconnect commands

## Configuration

Set the following environment variable:

```bash
STREAM_WS_URL=ws://your-stream-server:8080/ws
```

If not set, defaults to `ws://localhost:8080/ws`

## Events Handled

### 1. Start Event
Received when a call starts:
```json
{
  "event": "start",
  "type": "text",
  "ucid": "xxxxx",
  "did": "xxxxxx"
}
```

### 2. Media Event (First Packet - 16kHz)
The first media packet is at 16kHz and should be ignored:
```json
{
  "event": "media",
  "type": "media",
  "ucid": "xxxxxxxxxxxxx",
  "data": {
    "samples": [-5, -2, 2, 3, ...],
    "bitsPerSample": 16,
    "sampleRate": 16000,
    "channelCount": 1,
    "numberOfFrames": 160,
    "type": "data"
  }
}
```

### 3. Media Event (Subsequent Packets - 8kHz)
All subsequent packets are at 8kHz and should be processed:
```json
{
  "event": "media",
  "type": "media",
  "ucid": "111XXXXXXXX71",
  "data": {
    "samples": [8, 8, 8, ...],
    "bitsPerSample": 16,
    "sampleRate": 8000,
    "channelCount": 1,
    "numberOfFrames": 80,
    "type": "data"
  }
}
```

### 4. Stop Event
Received when a call ends:
```json
{
  "event": "stop",
  "type": "text",
  "ucid": "xxxxx",
  "did": "xxxxx"
}
```

## API Routes

### Get Stream Status
```bash
GET /api/stream/status
```

Response:
```json
{
  "initialized": true,
  "connected": true,
  "url": "ws://localhost:8080/ws",
  "currentCall": {
    "ucid": "123456789",
    "did": "9876543210",
    "startTime": "2025-11-06T10:30:00.000Z",
    "mediaPackets": 150
  },
  "readyState": 1
}
```

### Send Clear Buffer Command
```bash
POST /api/stream/clear-buffer
```

Response:
```json
{
  "success": true,
  "message": "Clear buffer command sent"
}
```

### Send Call Disconnect Command
```bash
POST /api/stream/disconnect-call
```

Response:
```json
{
  "success": true,
  "message": "Call disconnect command sent"
}
```

### Send Audio Data
```bash
POST /api/stream/send-audio
Content-Type: application/json

{
  "ucid": "123456789",
  "samples": [1, 2, 3, 4, 5, ...]
}
```

Response:
```json
{
  "success": true,
  "message": "Audio data sent",
  "sampleCount": 80
}
```

## Audio Data Format

- **Format**: PCM Linear 16-bit
- **Sample Rate**: 8000 Hz
- **Channels**: 1 (Mono)
- **Bits Per Sample**: 16

## Log Files

All events and audio data are logged to:
```
agent-login-app/logs/stream/
├── stream_events_2025-11-06.jsonl    # Event log (one JSON per line)
└── audio_123456789_1699270800000.json # Audio buffer per call
```

## Usage in IVR Flow

To initiate streaming in your IVR flow:

```javascript
const Response = require('../lib/kookoo/response');

const response = new Response();

// For SIP-based streaming
response.addStream('sipNumber', 'ws://your-server:8080/ws', 'true');

// This generates:
// <response>
//   <stream is_sip='true' url='ws://your-server:8080/ws'>sipNumber</stream>
// </response>

response.send(res);
```

## Architecture

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│  Stream Server  │◄──────────────────────────►│  Stream Client   │
│  (Ozonetel)     │                            │  (This App)      │
└─────────────────┘                            └──────────────────┘
                                                        │
                                                        │ Logs to
                                                        ▼
                                                ┌──────────────────┐
                                                │   Log Files      │
                                                │   - Events       │
                                                │   - Audio Data   │
                                                └──────────────────┘
```

## Future Enhancements

This is the foundation for building a speech processing flow. Future features will include:

1. **Speech-to-Text**: Convert audio samples to text
2. **AI Processing**: Process text with AI agents
3. **Text-to-Speech**: Convert AI responses back to audio
4. **Real-time Streaming**: Send audio back to caller in real-time

## Notes

- The client automatically reconnects if connection is lost
- First media packet (16kHz) is ignored as per specification
- Audio buffers are saved when call ends
- All events are logged with timestamps
- Connection status can be checked via API
