/**
 * WebSocket Stream Client for KooKoo Bi-directional Audio Streaming
 * Handles PCM linear 16-bit 8kHz audio data
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

class StreamClient {
    constructor(config = {}) {
        this.config = {
            url: config.url || process.env.STREAM_WS_URL || 'ws://localhost:8080/ws',
            reconnectInterval: config.reconnectInterval || 5000,
            logDir: config.logDir || path.join(__dirname, '../../logs/stream'),
            ...config
        };
        
        this.ws = null;
        this.isConnected = false;
        this.reconnectTimer = null;
        this.currentCall = null;
        this.audioBuffers = new Map(); // Store audio buffers per call
        
        console.log('[StreamClient] Initialized with config:', {
            url: this.config.url,
            reconnectInterval: this.config.reconnectInterval,
            logDir: this.config.logDir
        });
    }

    /**
     * Initialize the WebSocket client and connect
     */
    async initialize() {
        // Ensure log directory exists
        try {
            await fs.mkdir(this.config.logDir, { recursive: true });
            console.log('[StreamClient] Log directory ready:', this.config.logDir);
        } catch (err) {
            console.error('[StreamClient] Failed to create log directory:', err);
        }

        // Connect to WebSocket server
        this.connect();
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('[StreamClient] Already connected');
            return;
        }

        console.log('[StreamClient] Connecting to:', this.config.url);

        try {
            this.ws = new WebSocket(this.config.url);

            this.ws.on('open', () => this.handleOpen());
            this.ws.on('message', (data) => this.handleMessage(data));
            this.ws.on('close', (code, reason) => this.handleClose(code, reason));
            this.ws.on('error', (error) => this.handleError(error));
        } catch (err) {
            console.error('[StreamClient] Connection error:', err);
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket connection open
     */
    handleOpen() {
        console.log('[StreamClient] ✅ Connected to stream server');
        this.isConnected = true;
        
        // Clear reconnect timer if exists
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    async handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            console.log('[StreamClient] Received event:', message.event, 'Type:', message.type);

            switch (message.event) {
                case 'start':
                    await this.handleStartEvent(message);
                    break;
                
                case 'media':
                    await this.handleMediaEvent(message);
                    break;
                
                case 'stop':
                    await this.handleStopEvent(message);
                    break;
                
                default:
                    console.log('[StreamClient] Unknown event type:', message.event);
                    await this.logEvent('unknown', message);
            }
        } catch (err) {
            console.error('[StreamClient] Error processing message:', err);
            console.error('[StreamClient] Raw data:', data.toString());
        }
    }

    /**
     * Handle call start event
     */
    async handleStartEvent(message) {
        const { ucid, did } = message;
        
        console.log('[StreamClient] 📞 Call Started');
        console.log('[StreamClient] UCID:', ucid);
        console.log('[StreamClient] DID:', did);

        this.currentCall = {
            ucid,
            did,
            startTime: new Date().toISOString(),
            mediaPackets: 0,
            firstMediaReceived: false
        };

        // Initialize audio buffer for this call
        this.audioBuffers.set(ucid, []);

        // Log start event
        await this.logEvent('start', message);
    }

    /**
     * Handle media (audio) event
     */
    async handleMediaEvent(message) {
        const { ucid, data } = message;

        if (!this.currentCall || this.currentCall.ucid !== ucid) {
            console.warn('[StreamClient] Received media for unknown call:', ucid);
            return;
        }

        const { samples, bitsPerSample, sampleRate, channelCount, numberOfFrames, type } = data;

        // Check if this is the first packet (16kHz - should be ignored)
        if (!this.currentCall.firstMediaReceived) {
            if (sampleRate === 16000) {
                console.log('[StreamClient] 🎵 First media packet (16kHz) - Ignoring as per spec');
                this.currentCall.firstMediaReceived = true;
                await this.logEvent('media_first_ignored', { ucid, sampleRate, numberOfFrames });
                return;
            }
            this.currentCall.firstMediaReceived = true;
        }

        // Process subsequent packets (8kHz)
        if (sampleRate === 8000) {
            this.currentCall.mediaPackets++;
            
            // Log media packet info (every 100 packets to reduce noise)
            if (this.currentCall.mediaPackets % 100 === 0) {
                console.log('[StreamClient] 🎵 Media packets received:', this.currentCall.mediaPackets);
            }

            // Store audio samples
            const buffer = this.audioBuffers.get(ucid);
            if (buffer) {
                buffer.push({
                    timestamp: new Date().toISOString(),
                    samples,
                    bitsPerSample,
                    sampleRate,
                    channelCount,
                    numberOfFrames,
                    type
                });
            }

            // Log every 100th packet
            if (this.currentCall.mediaPackets % 100 === 0) {
                await this.logEvent('media', {
                    ucid,
                    packetNumber: this.currentCall.mediaPackets,
                    sampleRate,
                    numberOfFrames,
                    samplesCount: samples.length,
                    samplePreview: samples.slice(0, 10) // First 10 samples
                });
            }
        }
    }

    /**
     * Handle call stop event
     */
    async handleStopEvent(message) {
        const { ucid, did } = message;
        
        console.log('[StreamClient] 📴 Call Ended');
        console.log('[StreamClient] UCID:', ucid);
        console.log('[StreamClient] DID:', did);

        if (this.currentCall && this.currentCall.ucid === ucid) {
            const endTime = new Date().toISOString();
            const callSummary = {
                ...this.currentCall,
                endTime,
                totalMediaPackets: this.currentCall.mediaPackets
            };

            console.log('[StreamClient] Call Summary:', callSummary);

            // Save audio buffer to file
            await this.saveAudioBuffer(ucid);

            // Log stop event
            await this.logEvent('stop', { ...message, summary: callSummary });

            // Cleanup
            this.audioBuffers.delete(ucid);
            this.currentCall = null;
        }
    }

    /**
     * Handle WebSocket close
     */
    handleClose(code, reason) {
        console.log('[StreamClient] ❌ Connection closed');
        console.log('[StreamClient] Code:', code);
        console.log('[StreamClient] Reason:', reason.toString());
        
        this.isConnected = false;
        this.scheduleReconnect();
    }

    /**
     * Handle WebSocket error
     */
    handleError(error) {
        console.error('[StreamClient] ⚠️ WebSocket error:', error.message);
        
        // Log error details but don't crash
        if (error.code === 'ECONNREFUSED') {
            console.log('[StreamClient] Stream server not available, will retry...');
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            return; // Already scheduled
        }

        console.log('[StreamClient] Scheduling reconnect in', this.config.reconnectInterval, 'ms');
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            console.log('[StreamClient] Attempting to reconnect...');
            this.connect();
        }, this.config.reconnectInterval);
    }

    /**
     * Send audio data back to server
     */
    sendAudio(ucid, audioData) {
        if (!this.isConnected || !this.ws) {
            console.error('[StreamClient] Cannot send audio: Not connected');
            return false;
        }

        try {
            const message = {
                event: 'media',
                type: 'media',
                ucid,
                data: {
                    samples: audioData.samples,
                    bitsPerSample: 16,
                    sampleRate: 8000,
                    channelCount: 1,
                    numberOfFrames: audioData.samples.length,
                    type: 'data'
                }
            };

            this.ws.send(JSON.stringify(message));
            return true;
        } catch (err) {
            console.error('[StreamClient] Error sending audio:', err);
            return false;
        }
    }

    /**
     * Send clear buffer command
     */
    clearBuffer() {
        if (!this.isConnected || !this.ws) {
            console.error('[StreamClient] Cannot clear buffer: Not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ command: 'clearBuffer' }));
            console.log('[StreamClient] 🧹 Sent clearBuffer command');
            return true;
        } catch (err) {
            console.error('[StreamClient] Error sending clearBuffer:', err);
            return false;
        }
    }

    /**
     * Send call disconnect command
     */
    disconnectCall() {
        if (!this.isConnected || !this.ws) {
            console.error('[StreamClient] Cannot disconnect call: Not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ command: 'callDisconnect' }));
            console.log('[StreamClient] 📴 Sent callDisconnect command');
            return true;
        } catch (err) {
            console.error('[StreamClient] Error sending callDisconnect:', err);
            return false;
        }
    }

    /**
     * Log event to file
     */
    async logEvent(eventType, data) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                eventType,
                data
            };

            const filename = `stream_events_${new Date().toISOString().split('T')[0]}.jsonl`;
            const filepath = path.join(this.config.logDir, filename);

            await fs.appendFile(filepath, JSON.stringify(logEntry) + '\n');
        } catch (err) {
            console.error('[StreamClient] Error logging event:', err);
        }
    }

    /**
     * Save audio buffer to file
     */
    async saveAudioBuffer(ucid) {
        try {
            const buffer = this.audioBuffers.get(ucid);
            if (!buffer || buffer.length === 0) {
                console.log('[StreamClient] No audio buffer to save for UCID:', ucid);
                return;
            }

            const filename = `audio_${ucid}_${Date.now()}.json`;
            const filepath = path.join(this.config.logDir, filename);

            const audioData = {
                ucid,
                timestamp: new Date().toISOString(),
                totalPackets: buffer.length,
                packets: buffer
            };

            await fs.writeFile(filepath, JSON.stringify(audioData, null, 2));
            console.log('[StreamClient] 💾 Saved audio buffer:', filename);
            console.log('[StreamClient] Total packets:', buffer.length);
        } catch (err) {
            console.error('[StreamClient] Error saving audio buffer:', err);
        }
    }

    /**
     * Get current connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            url: this.config.url,
            currentCall: this.currentCall,
            readyState: this.ws ? this.ws.readyState : null
        };
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        console.log('[StreamClient] Disconnecting...');
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        this.currentCall = null;
        this.audioBuffers.clear();
    }
}

module.exports = StreamClient;
