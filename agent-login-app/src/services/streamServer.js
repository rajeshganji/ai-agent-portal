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

    handleMessage(ws, data, connectionId) {
        try {
            console.log('\n========== MESSAGE RECEIVED ==========');
            console.log(`[StreamServer] Connection ID: ${connectionId}`);
            console.log(`[StreamServer] Data type: ${typeof data}`);
            console.log(`[StreamServer] Data size: ${data.length} bytes`);
            console.log(`[StreamServer] Raw data (first 500 chars):`, data.toString().substring(0, 500));
            
            const message = JSON.parse(data.toString());
            console.log('[StreamServer] ✅ JSON parsed successfully');
            
            // Log Ozonetel-specific fields
            if (message.event) {
                console.log(`[StreamServer] 📡 Event: ${message.event}`);
            }
            if (message.type) {
                console.log(`[StreamServer] 📋 Type: ${message.type}`);
            }
            if (message.ucid) {
                console.log(`[StreamServer] 🔑 UCID: ${message.ucid}`);
            }
            
            // Log audio data info if present
            if (message.event === 'media' || message.type === 'media') {
                console.log('[StreamServer] 🎵 AUDIO DATA RECEIVED');
                if (message.data) {
                    console.log(`[StreamServer] Sample Rate: ${message.data.sampleRate}`);
                    console.log(`[StreamServer] Bits Per Sample: ${message.data.bitsPerSample}`);
                    console.log(`[StreamServer] Channel Count: ${message.data.channelCount}`);
                    console.log(`[StreamServer] Number of Frames: ${message.data.numberOfFrames}`);
                    console.log(`[StreamServer] Samples count: ${message.data.samples?.length || 0}`);
                    console.log(`[StreamServer] First 10 samples:`, message.data.samples?.slice(0, 10));
                }
            }
            
            console.log('[StreamServer] Full message structure:', JSON.stringify(message, null, 2).substring(0, 1000));
            console.log('=====================================\n');

            // Forward to StreamClient message handler
            if (this.streamClient) {
                console.log('[StreamServer] Forwarding to StreamClient...');
                this.streamClient.handleMessage(data);
            } else {
                console.warn('[StreamServer] ⚠️ No StreamClient available to handle message!');
            }

            // Handle commands from client
            if (message.command) {
                console.log('[StreamServer] Command received:', message.command);
                // Commands are handled by StreamClient
            }

        } catch (err) {
            console.error('[StreamServer] ❌ Error processing message:', err.message);
            console.error('[StreamServer] Raw data that failed:', data.toString().substring(0, 500));
            console.error('[StreamServer] Error stack:', err.stack);
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
