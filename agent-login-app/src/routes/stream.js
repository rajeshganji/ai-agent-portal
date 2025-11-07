const express = require('express');
const router = express.Router();

// Get stream client instance - will be set by server.js
let getStreamClient = null;

function setStreamClientGetter(getter) {
    getStreamClient = getter;
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

    // Validate language code
    const validLanguages = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'auto'];
    if (!validLanguages.includes(language)) {
        return res.status(400).json({
            success: false,
            error: `Invalid language code. Valid options: ${validLanguages.join(', ')}`
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

module.exports = {
    router,
    setStreamClientGetter
};
