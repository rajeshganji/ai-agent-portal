# Language Configuration for Transcription

## Important: Whisper Language Support

**OpenAI Whisper has LIMITED language code support.**

For **Indian languages** (Telugu, Tamil, Kannada, Malayalam):
- ✅ **Use `'en'`** - Whisper will auto-detect and transcribe correctly
- ❌ **Don't use** `'te'`, `'ta'`, `'kn'`, `'ml'` - These will cause `400 Language not supported` errors

**Why?** Whisper detects Indian languages automatically but doesn't accept their ISO codes.

## Problem
When using `'te'` or other Indian language codes, you get:
```
400 Language 'te' is not supported
```

## Solution
Use `'en'` or `'auto'` - Whisper will:
1. Auto-detect the actual language (Telugu, Tamil, etc.)
2. Output correct Unicode script
3. Set `detectedLanguage` in response

## Default Language

Set via environment variable:
```bash
DEFAULT_TRANSCRIPTION_LANGUAGE=en  # Recommended for Indian languages
# or
DEFAULT_TRANSCRIPTION_LANGUAGE=auto  # Let Whisper decide
```

Add to Railway environment variables:
```
DEFAULT_TRANSCRIPTION_LANGUAGE=en
```

## Supported Languages

### ✅ Whisper Directly Supports

| Code | Language | Use For |
|------|----------|---------|
| `en` | English | English + Indian languages (auto-detected) |
| `hi` | Hindi | Hindi (but 'en' also works) |
| `es` | Spanish | Spanish |
| `fr` | French | French |
| `de` | German | German |
| `it` | Italian | Italian |
| `pt` | Portuguese | Portuguese |
| `ru` | Russian | Russian |
| `ja` | Japanese | Japanese |
| `ko` | Korean | Korean |
| `zh` | Chinese | Chinese |
| `auto` | Auto-detect | Any language |

### ⚠️ NOT Directly Supported (Use 'en' or 'auto')

| Code | Language | What to Use Instead |
|------|----------|---------------------|
| `te` | Telugu | Use `'en'` - auto-detects Telugu |
| `ta` | Tamil | Use `'en'` - auto-detects Tamil |
| `kn` | Kannada | Use `'en'` - auto-detects Kannada |
| `ml` | Malayalam | Use `'en'` - auto-detects Malayalam |

## API Usage

### Set Language for a Call

**Endpoint:** `POST /api/stream/set-language`

**Request Body:**
```json
{
  "ucid": "CALL_ID_12345",
  "language": "en"
}
```

**For Indian Languages (Telugu, Tamil, etc.):**
```json
{
  "ucid": "CALL_ID_12345",
  "language": "en"  // Whisper will auto-detect Telugu/Tamil/etc
}
```

**Response:**
```json
{
  "success": true,
  "message": "Language set to 'en' for UCID: CALL_ID_12345",
  "ucid": "CALL_ID_12345",
  "language": "en"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid language code. Valid options: en, hi, es, fr, de, it, pt, ru, ja, ko, zh, auto"
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
