# Quick Start: ElevenLabs Migration

## Immediate Action Required

The system now uses **ElevenLabs** for text-to-speech. To enable TTS functionality:

### 1. Get Your API Key (5 minutes)

1. Visit: https://elevenlabs.io/sign-up
2. Create a free account (no credit card required for trial)
3. Go to Profile → Settings → API Keys
4. Copy your API key

### 2. Add to Railway Environment Variables

**Option A: Via Railway Dashboard**
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add new variable:
   - Name: `ELEVENLABS_API_KEY`
   - Value: `your_api_key_here`
5. Click "Deploy"

**Option B: Via Railway CLI**
```bash
railway variables set ELEVENLABS_API_KEY=your_api_key_here
```

### 3. Deploy

The deployment will happen automatically when you add the environment variable, or trigger manually:

```bash
git push railway main
```

### 4. Test

Once deployed, test with a phone call:
1. Speak into the phone
2. Wait for silence (2 seconds)
3. AI should respond with **high-quality, low-latency speech**

## What Changed?

### Before (OpenAI TTS)
- Latency: ~500ms
- Format: MP3 → conversion overhead
- Cost: Higher
- Quality: Good

### After (ElevenLabs)
- Latency: **75ms** ⚡
- Format: PCM (direct) → faster
- Cost: **50% cheaper**
- Quality: **Excellent** 🎯

## Free Tier Limits

ElevenLabs free tier includes:
- **10,000 characters/month**
- All voices available
- Commercial license

Approximately:
- ~200 average responses
- ~50 conversations

## Optional: Customize Voices

Want different voices? Add these to Railway variables:

```bash
# Use Flash v2.5 model (recommended for phone calls)
ELEVENLABS_MODEL_ID=eleven_flash_v2_5

# Fine-tune voice characteristics
ELEVENLABS_STABILITY=0.5        # Higher = more consistent
ELEVENLABS_SIMILARITY=0.75      # Voice accuracy
ELEVENLABS_STYLE=0              # Exaggeration level
```

## Verify It's Working

Check Railway logs for:

```
[ElevenLabs] Service initialized successfully
[ElevenLabs] Converting text to speech...
[ElevenLabs] Text-to-speech completed { duration: '85ms' }
```

## Troubleshooting

### "ElevenLabs service not enabled"
➡️ Add `ELEVENLABS_API_KEY` to Railway variables

### "Unauthorized" or 401 error
➡️ Check API key is correct (should start with a long string)
➡️ Verify account is active at https://elevenlabs.io

### Need help?
- Full documentation: `ELEVENLABS_SETUP.md`
- ElevenLabs docs: https://elevenlabs.io/docs
- Check Railway logs for errors

## Monitoring Usage

Track your usage at: https://elevenlabs.io/usage

You'll see:
- Characters used
- Remaining quota
- Request history

## Next Steps

1. ✅ Add `ELEVENLABS_API_KEY` to Railway
2. ✅ Verify deployment logs show ElevenLabs initialized
3. ✅ Test with a phone call
4. 📊 Monitor usage dashboard
5. 🎨 (Optional) Customize voices with your own clones

---

**Ready to upgrade?** Just add your API key and deploy! 🚀
