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

module.exports = {
    router,
    setStreamClientGetter
};
