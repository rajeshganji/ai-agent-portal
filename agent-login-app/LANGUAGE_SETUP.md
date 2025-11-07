# Language Configuration for Transcription

## Problem
When using `auto` language detection, OpenAI Whisper may detect the correct language but output text in the wrong Unicode script. For example:
- Detects "Telugu" but outputs Malayalam/Tamil script
- Detects "Hindi" but outputs incorrect Unicode

## Solution
Explicitly set the language for each call instead of using auto-detection.

## Default Language

Set via environment variable:
```bash
DEFAULT_TRANSCRIPTION_LANGUAGE=te  # Telugu (default)
# or
DEFAULT_TRANSCRIPTION_LANGUAGE=hi  # Hindi
DEFAULT_TRANSCRIPTION_LANGUAGE=ta  # Tamil
DEFAULT_TRANSCRIPTION_LANGUAGE=en  # English
```

Add to Railway environment variables:
```
DEFAULT_TRANSCRIPTION_LANGUAGE=te
```

## Supported Languages

| Code | Language | Script |
|------|----------|--------|
| `en` | English | Latin |
| `hi` | Hindi | Devanagari |
| `te` | Telugu | Telugu |
| `ta` | Tamil | Tamil |
| `kn` | Kannada | Kannada |
| `ml` | Malayalam | Malayalam |
| `auto` | Auto-detect | ⚠️ May use wrong script |

## API Usage

### Set Language for a Call

**Endpoint:** `POST /api/stream/set-language`

**Request Body:**
```json
{
  "ucid": "CALL_ID_12345",
  "language": "te"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Language set to 'te' for UCID: CALL_ID_12345",
  "ucid": "CALL_ID_12345",
  "language": "te"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid language code. Valid options: en, hi, te, ta, kn, ml, auto"
}
```

## Usage Examples

### 1. Set Language When Call Starts (Recommended)

In your IVR flow or webhook handler:

```javascript
// When Ozonetel call starts
app.post('/ozonetel/webhook', async (req, res) => {
    const { ucid, customerLanguage } = req.body;
    
    // Set language based on customer preference
    await fetch('http://localhost:3000/api/stream/set-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ucid: ucid,
            language: customerLanguage || 'te' // Default to Telugu
        })
    });
    
    // Continue with IVR flow...
});
```

### 2. Dynamic Language Based on DID

```javascript
// Map DIDs to languages
const didLanguageMap = {
    '9140XXXXXX': 'te',  // Telugu DID
    '9140YYYYYY': 'hi',  // Hindi DID
    '9140ZZZZZZ': 'ta'   // Tamil DID
};

app.post('/ozonetel/webhook', async (req, res) => {
    const { ucid, did } = req.body;
    const language = didLanguageMap[did] || 'te';
    
    await setCallLanguage(ucid, language);
});
```

### 3. Let User Choose Language

```javascript
// In IVR menu
const ivrMenu = {
    prompt: "Press 1 for Telugu, 2 for Hindi, 3 for English",
    onInput: async (digit, ucid) => {
        const languageMap = {
            '1': 'te',
            '2': 'hi',
            '3': 'en'
        };
        
        await setCallLanguage(ucid, languageMap[digit] || 'te');
    }
};
```

## Programmatic Usage

If you have direct access to the streamClient:

```javascript
const streamClient = require('./src/services/streamClient');

// Set language for a specific call
streamClient.setLanguage('UCID_12345', 'te');
```

## Testing

```bash
# Test setting language
curl -X POST http://localhost:3000/api/stream/set-language \
  -H "Content-Type: application/json" \
  -d '{
    "ucid": "TEST_CALL_123",
    "language": "te"
  }'
```

## Railway Deployment

1. Add environment variable in Railway:
   ```
   DEFAULT_TRANSCRIPTION_LANGUAGE=te
   ```

2. Redeploy or restart the service

3. All new calls will use Telugu by default

## Troubleshooting

### Issue: Wrong Script/Unicode Output
- **Symptom:** Detects "Telugu" but shows Malayalam/Tamil text
- **Solution:** Set language to `te` explicitly instead of `auto`

### Issue: Poor Transcription Quality
- **Cause:** Wrong language set
- **Solution:** Verify the correct language code is being used

### Issue: API Returns 400 Error
- **Cause:** Invalid language code
- **Solution:** Use only supported codes: en, hi, te, ta, kn, ml, auto

## Best Practices

1. **Always set language explicitly** - Don't rely on auto-detection for Indic languages
2. **Set early** - Call `setLanguage()` immediately when the call starts
3. **Use environment variable** - Set `DEFAULT_TRANSCRIPTION_LANGUAGE` for your primary language
4. **Log language changes** - Track which language is being used for debugging
5. **Validate user input** - If users choose language, validate the input

## Example Integration

Complete example with error handling:

```javascript
async function initializeCallTranscription(ucid, customerLanguage) {
    try {
        const response = await fetch(`${process.env.API_URL}/api/stream/set-language`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ucid: ucid,
                language: customerLanguage || 'te'
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Failed to set language:', result.error);
            // Fallback: continue with default language
        } else {
            console.log(`Language set to ${result.language} for call ${ucid}`);
        }
    } catch (error) {
        console.error('Error setting language:', error);
        // Continue anyway - will use default language
    }
}
```
