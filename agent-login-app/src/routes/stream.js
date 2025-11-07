const express = require('express');
const router = express.Router();

// Get stream client and playback service instances - will be set by server.js
let getStreamClient = null;
let getPlaybackService = null;

function setStreamClientGetter(getter) {
    getStreamClient = getter;
}

function setPlaybackServiceGetter(getter) {
    getPlaybackService = getter;
}

/**
 * Get stream client status
 */
router.get('/status', (req, res) => {
    const streamClient = getStreamClient ? getStreamClient() : null;
    
    if (!streamClient) {
        return res.json({
            initialized: false,
            message: 'Stream client not initialized'
        });
    }

    const status = streamClient.getStatus();
    res.json({
        initialized: true,
        ...status
    });
});

/**
 * Send clear buffer command
 */
router.post('/clear-buffer', (req, res) => {
    const streamClient = getStreamClient ? getStreamClient() : null;
    
    if (!streamClient) {
        return res.status(503).json({
            success: false,
            error: 'Stream client not initialized'
        });
    }

    const result = streamClient.clearBuffer();
    res.json({
        success: result,
        message: result ? 'Clear buffer command sent' : 'Failed to send command'
    });
});

/**
 * Send call disconnect command
 */
router.post('/disconnect-call', (req, res) => {
    const streamClient = getStreamClient ? getStreamClient() : null;
    
    if (!streamClient) {
        return res.status(503).json({
            success: false,
            error: 'Stream client not initialized'
        });
    }

    const result = streamClient.disconnectCall();
    res.json({
        success: result,
        message: result ? 'Call disconnect command sent' : 'Failed to send command'
    });
});

/**
 * Send audio data
 */
router.post('/send-audio', (req, res) => {
    const streamClient = getStreamClient ? getStreamClient() : null;
    
    if (!streamClient) {
        return res.status(503).json({
            success: false,
            error: 'Stream client not initialized'
        });
    }

    const { ucid, samples } = req.body;

    if (!ucid || !samples || !Array.isArray(samples)) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: ucid and samples (array)'
        });
    }

    const result = streamClient.sendAudio(ucid, { samples });
    res.json({
        success: result,
        message: result ? 'Audio data sent' : 'Failed to send audio',
        sampleCount: samples.length
    });
});

/**
 * Set language for transcription
 * POST /api/stream/set-language
 * Body: { ucid: string, language: 'en'|'hi'|'te'|'ta'|'kn'|'ml'|'auto' }
 */
router.post('/set-language', (req, res) => {
    const streamClient = getStreamClient ? getStreamClient() : null;
    
    if (!streamClient) {
        return res.status(503).json({
            success: false,
            error: 'Stream client not initialized'
        });
    }

    const { ucid, language } = req.body;

    if (!ucid || !language) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: ucid and language'
        });
    }

    // Validate language code - use Whisper-supported languages
    // Note: For Indian languages (Telugu, Tamil, etc), use 'en' - Whisper will auto-detect
    const validLanguages = ['en', 'hi', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'auto'];
    if (!validLanguages.includes(language)) {
        return res.status(400).json({
            success: false,
            error: `Invalid language code. Valid options: ${validLanguages.join(', ')}. For Indian languages (Telugu, Tamil, etc), use 'en' - Whisper will auto-detect.`
        });
    }

    try {
        streamClient.setLanguage(ucid, language);
        res.json({
            success: true,
            message: `Language set to '${language}' for UCID: ${ucid}`,
            ucid,
            language
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Play text as speech
 * POST /api/stream/play-text
 * Body: { ucid: string, text: string, voice?: string, language?: string }
 */
router.post('/play-text', async (req, res) => {
    const playbackService = getPlaybackService ? getPlaybackService() : null;
    
    if (!playbackService) {
        return res.status(503).json({
            success: false,
            error: 'Playback service not initialized'
        });
    }

    const { ucid, text, voice, language } = req.body;

    if (!ucid || !text) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: ucid and text'
        });
    }

    try {
        console.log('[API] Playing text for UCID:', ucid, '- Text:', text.substring(0, 50));
        
        const success = await playbackService.playText(
            ucid, 
            text, 
            voice || 'alloy',
            language || 'en'
        );
        
        if (success) {
            res.json({
                success: true,
                message: 'Text playback started',
                ucid,
                textLength: text.length,
                voice: voice || 'alloy'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to play text - check server logs'
            });
        }
    } catch (error) {
        console.error('[API] Play text error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Stop playback
 * POST /api/stream/stop-playback
 * Body: { ucid: string }
 */
router.post('/stop-playback', (req, res) => {
    const playbackService = getPlaybackService ? getPlaybackService() : null;
    
    if (!playbackService) {
        return res.status(503).json({
            success: false,
            error: 'Playback service not initialized'
        });
    }

    const { ucid } = req.body;

    if (!ucid) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: ucid'
        });
    }

    try {
        playbackService.stopPlayback(ucid);
        res.json({
            success: true,
            message: `Playback stopped for UCID: ${ucid}`,
            ucid
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get playback status
 * GET /api/stream/playback-status/:ucid
 */
router.get('/playback-status/:ucid', (req, res) => {
    const playbackService = getPlaybackService ? getPlaybackService() : null;
    
    if (!playbackService) {
        return res.status(503).json({
            success: false,
            error: 'Playback service not initialized'
        });
    }

    const { ucid } = req.params;
    const status = playbackService.getStatus(ucid);
    
    res.json({
        success: true,
        ucid,
        status: status || { playing: false },
        isPlaying: playbackService.isPlaying(ucid)
    });
});

module.exports = {
    router,
    setStreamClientGetter,
    setPlaybackServiceGetter
};
