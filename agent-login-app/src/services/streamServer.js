/**
 * WebSocket Stream Server - Receives events from Ozonetel
 * This server accepts connections from Ozonetel and forwards events to StreamClient handlers
 */

const WebSocket = require('ws');

class StreamServer {
    constructor(server, streamClient) {
        console.log('[StreamServer] 🚀 CONSTRUCTOR CALLED - Initializing...');
        this.streamClient = streamClient;
        this.connections = new Map();
        this.ucidToConnection = new Map(); // Map UCID to WebSocket connection
        this.server = server;
        
        console.log('[StreamServer] Creating WebSocket.Server with noServer mode');
        
        // Create WebSocket server in noServer mode - handle upgrades manually
        this.wss = new WebSocket.Server({ 
            noServer: true
        });
        
        console.log('[StreamServer] WebSocket.Server created in noServer mode');
        console.log('[StreamServer] Setting up manual upgrade handler on HTTP server...');
        
        // Manually handle upgrade requests BEFORE Express middleware
        this.server.on('upgrade', (request, socket, head) => {
            console.log('[StreamServer] 📡 UPGRADE EVENT RECEIVED!');
            console.log('[StreamServer] Request URL:', request.url);
            console.log('[StreamServer] Request headers:', request.headers);
            
            // Only handle /ws path
            if (request.url !== '/ws') {
                console.log('[StreamServer] ❌ Destroying socket - not /ws path:', request.url);
                socket.destroy();
                return;
            }
            
            console.log('[StreamServer] ✅ Handling upgrade for /ws');
            
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                console.log('[StreamServer] 🎯 handleUpgrade callback - emitting connection');
                this.wss.emit('connection', ws, request);
            });
        });
        
        // Handle connection events
        this.wss.on('connection', (ws, req) => {
            console.log('[StreamServer] 🎯 CONNECTION EVENT FIRED!');
            console.log('[StreamServer] Request URL:', req.url);
            this.handleConnection(ws, req);
        });
        
        this.wss.on('error', (error) => {
            console.error('[StreamServer] ❌ WebSocket Server Error:', error);
        });

        console.log('[StreamServer] ✅ WebSocket stream server ready with manual upgrade handling for /ws');
    }

    handleConnection(ws, req) {
        console.log('[StreamServer] 🔵 handleConnection() called');
        const clientIp = req.socket.remoteAddress;
        const protocol = req.connection.encrypted ? 'wss' : 'ws';
        
        console.log('\n========== WEBSOCKET CONNECTION ESTABLISHED ==========');
        console.log(`[StreamServer] Protocol: ${protocol}://`);
        console.log(`[StreamServer] Client IP: ${clientIp}`);
        console.log(`[StreamServer] Client Port: ${req.socket.remotePort}`);
        console.log(`[StreamServer] Request Method: ${req.method}`);
        console.log(`[StreamServer] Request URL: ${req.url}`);
        console.log(`[StreamServer] HTTP Version: ${req.httpVersion}`);
        console.log(`[StreamServer] User-Agent: ${req.headers['user-agent'] || 'NOT PROVIDED'}`);
        console.log(`[StreamServer] Connection headers:`, JSON.stringify(req.headers, null, 2));

        // Generate connection ID
        const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.connections.set(connectionId, ws);
        
        // Track message statistics
        ws.messageCount = 0;
        ws.totalBytesReceived = 0;
        
        console.log(`[StreamServer] Connection ID: ${connectionId}`);
        console.log(`[StreamServer] Total active connections: ${this.connections.size}`);
        console.log('[StreamServer] WebSocket ready state:', ws.readyState);
        console.log('[StreamServer] Max payload size: 100 MB');
        console.log('=====================================================\n');

        ws.on('message', (data) => {
            ws.messageCount++;
            ws.totalBytesReceived += data.length;
            console.log(`[StreamServer] ⚡ Message #${ws.messageCount} received on connection ${connectionId}`);
            console.log(`[StreamServer] This message size: ${data.length} bytes`);
            console.log(`[StreamServer] Total bytes received: ${ws.totalBytesReceived} bytes`);
            this.handleMessage(ws, data, connectionId);
        });

        ws.on('close', (code, reason) => {
            console.log('\n========== WEBSOCKET CONNECTION CLOSED ==========');
            console.log('[StreamServer] Connection ID:', connectionId);
            console.log('[StreamServer] Close Code:', code);
            console.log('[StreamServer] Close Reason:', reason ? reason.toString() : 'No reason provided');
            console.log('[StreamServer] Client IP:', clientIp);
            console.log('[StreamServer] Time connected:', new Date().toISOString());
            console.log('[StreamServer] Messages received:', ws.messageCount || 0);
            console.log('[StreamServer] Total bytes received:', ws.totalBytesReceived || 0);
            console.log('[StreamServer] Remaining connections:', this.connections.size - 1);
            
            // Log standard close codes
            const closeCodes = {
                1000: 'Normal Closure',
                1001: 'Going Away',
                1002: 'Protocol Error',
                1003: 'Unsupported Data',
                1005: 'No Status Received',
                1006: 'Abnormal Closure',
                1007: 'Invalid frame payload data',
                1008: 'Policy Violation',
                1009: 'Message too big',
                1010: 'Missing Extension',
                1011: 'Internal Error',
                1012: 'Service Restart',
                1013: 'Try Again Later',
                1014: 'Bad Gateway',
                1015: 'TLS Handshake'
            };
            
            if (closeCodes[code]) {
                console.log(`[StreamServer] Close Code Meaning: ${closeCodes[code]}`);
            }
            
            console.log('================================================\n');
            this.connections.delete(connectionId);
        });

        ws.on('error', (error) => {
            console.error('\n========== WEBSOCKET ERROR ==========');
            console.error('[StreamServer] Connection ID:', connectionId);
            console.error('[StreamServer] Client IP:', clientIp);
            console.error('[StreamServer] Error Type:', error.name);
            console.error('[StreamServer] Error Message:', error.message);
            console.error('[StreamServer] Error Code:', error.code || 'N/A');
            console.error('[StreamServer] Error Stack:', error.stack);
            console.error('[StreamServer] WebSocket State:', ws.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');
            console.error('====================================\n');
        });

        ws.on('ping', () => {
            console.log('[StreamServer] 💓 Ping received from', connectionId);
        });

        ws.on('pong', () => {
            console.log('[StreamServer] 💓 Pong received from', connectionId);
        });

        // Send acknowledgment
        console.log(`[StreamServer] Sending connection acknowledgment to ${connectionId}`);
        try {
            ws.send(JSON.stringify({
                type: 'connected',
                connectionId,
                timestamp: new Date().toISOString(),
                message: 'Connected to AI Agent Portal WebSocket Server'
            }));
            console.log(`[StreamServer] ✅ Acknowledgment sent successfully to ${connectionId}`);
            console.log('\n========== CONNECTION FULLY ESTABLISHED AND READY ==========');
            console.log('[StreamServer] Connection is now ready to receive messages');
            console.log('[StreamServer] Waiting for Ozonetel stream events...');
            console.log('===========================================================\n');
        } catch (error) {
            console.error(`[StreamServer] ❌ Failed to send acknowledgment to ${connectionId}:`, error.message);
            console.error('[StreamServer] This may cause the connection to fail');
        }
    }

    /**
     * Send audio samples to Ozonetel via WebSocket
     * @param {string} ucid - Call ID
     * @param {Array<number>} samples - PCM audio samples
     * @returns {Promise<boolean>} - Success status
     */
    async sendAudioToOzonetel(ucid, samples) {
        try {
            const ws = this.ucidToConnection.get(ucid);
            
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.error('[StreamServer] ❌ No active connection for UCID:', ucid);
                return false;
            }

            // Create media event message (matching Ozonetel format)
            const mediaMessage = {
                event: 'media',
                ucid: ucid,
                type: 'audio/x-mulaw',
                media: {
                    samples: samples,
                    sampleRate: 8000,
                    numberOfFrames: samples.length,
                    channelCount: 1
                }
            };

            // Send to Ozonetel
            ws.send(JSON.stringify(mediaMessage));
            
            return true;

        } catch (error) {
            console.error('[StreamServer] ❌ Error sending audio to Ozonetel:', error.message);
            return false;
        }
    }

    /**
     * Send a control message to Ozonetel
     * @param {string} ucid - Call ID
     * @param {string} command - Command type
     * @param {Object} params - Additional parameters
     * @returns {boolean} - Success status
     */
    sendControlMessage(ucid, command, params = {}) {
        try {
            const ws = this.ucidToConnection.get(ucid);
            
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.error('[StreamServer] No active connection for UCID:', ucid);
                return false;
            }

            const message = {
                event: 'control',
                ucid: ucid,
                command: command,
                ...params
            };

            ws.send(JSON.stringify(message));
            console.log('[StreamServer] 📤 Control message sent:', command);
            
            return true;

        } catch (error) {
            console.error('[StreamServer] Error sending control message:', error);
            return false;
        }
    }

    handleMessage(ws, data, connectionId) {
        try {
            const message = JSON.parse(data.toString());
            
            // Track UCID to connection mapping for outbound audio
            if (message.event === 'start' && message.ucid) {
                this.ucidToConnection.set(message.ucid, ws);
                ws.currentUcid = message.ucid;
                console.log('[StreamServer] 📌 Mapped UCID to connection:', message.ucid);
            }
            
            // Clean up mapping on stop
            if (message.event === 'stop' && message.ucid) {
                this.ucidToConnection.delete(message.ucid);
                console.log('[StreamServer] 🗑️  Removed UCID mapping:', message.ucid);
            }
            
            // Compact logging - only log important events
            if (message.event === 'start' || message.event === 'stop') {
                console.log(`[StreamServer] 📡 ${message.event.toUpperCase()} - UCID: ${message.ucid}`);
            } else if (message.event === 'media') {
                // Only log every 100th media packet to reduce noise
                if (!this._mediaPacketCount) this._mediaPacketCount = {};
                if (!this._mediaPacketCount[message.ucid]) this._mediaPacketCount[message.ucid] = 0;
                this._mediaPacketCount[message.ucid]++;
                
                if (this._mediaPacketCount[message.ucid] % 100 === 0) {
                    console.log(`[StreamServer] 🎵 MEDIA packet #${this._mediaPacketCount[message.ucid]} - UCID: ${message.ucid}, frames: ${message.data?.numberOfFrames}, rate: ${message.data?.sampleRate}Hz`);
                }
            } else {
                // Log other events compactly
                console.log(`[StreamServer] Event: ${message.event || message.type}, UCID: ${message.ucid}`);
            }

            // Forward to StreamClient message handler
            if (this.streamClient) {
                this.streamClient.handleMessage(data);
            } else {
                console.warn('[StreamServer] ⚠️ No StreamClient available to handle message!');
            }

        } catch (err) {
            console.error('[StreamServer] ❌ Error processing message:', err.message);
            console.error('[StreamServer] Raw data (first 200 chars):', data.toString().substring(0, 200));
        }
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
    }

    getStatus() {
        const connections = [];
        this.connections.forEach((ws, connectionId) => {
            connections.push({
                id: connectionId,
                readyState: ws.readyState,
                readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
                messageCount: ws.messageCount || 0,
                totalBytesReceived: ws.totalBytesReceived || 0
            });
        });
        
        return {
            activeConnections: this.connections.size,
            connections: connections
        };
    }
}

module.exports = StreamServer;
