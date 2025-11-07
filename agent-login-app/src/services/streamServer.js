/**
 * WebSocket Stream Server - Receives events from Ozonetel
 * This server accepts connections from Ozonetel and forwards events to StreamClient handlers
 */

const WebSocket = require('ws');

class StreamServer {
    constructor(server, streamClient) {
        this.streamClient = streamClient;
        this.connections = new Map();
        
        // Create WebSocket server on /ws path
        // Automatically supports both ws:// and wss:// based on the underlying server
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws',
            verifyClient: (info, callback) => {
                const protocol = info.secure ? 'wss' : 'ws';
                console.log('\n========== NEW WEBSOCKET CONNECTION ATTEMPT ==========');
                console.log(`[StreamServer] Protocol: ${protocol}://`);
                console.log(`[StreamServer] Origin: ${info.origin || 'NOT PROVIDED'}`);
                console.log(`[StreamServer] URL: ${info.req.url}`);
                console.log(`[StreamServer] Remote Address: ${info.req.socket.remoteAddress}`);
                console.log(`[StreamServer] Remote Port: ${info.req.socket.remotePort}`);
                console.log(`[StreamServer] User-Agent: ${info.req.headers['user-agent'] || 'NOT PROVIDED'}`);
                console.log(`[StreamServer] All Headers:`, JSON.stringify(info.req.headers, null, 2));
                
                // You can add validation logic here
                try {
                    // Example: Check if path is correct
                    if (info.req.url !== '/ws') {
                        console.log(`[StreamServer] ❌ REJECTING - Invalid path: ${info.req.url}`);
                        callback(false, 404, 'Not Found');
                        console.log('======================================================\n');
                        return;
                    }
                    
                    // Accept all connections - Ozonetel verified
                    console.log('[StreamServer] ✅ ACCEPTING CONNECTION - All checks passed');
                    console.log('======================================================\n');
                    callback(true);
                } catch (error) {
                    console.error('[StreamServer] ❌ REJECTING - Error during verification:', error.message);
                    console.error('[StreamServer] Error stack:', error.stack);
                    console.log('======================================================\n');
                    callback(false, 500, 'Internal Server Error');
                }
            }
        });

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        console.log('[StreamServer] WebSocket stream server ready at path: /ws');
        console.log('[StreamServer] Supports both ws:// (HTTP) and wss:// (HTTPS) connections');
    }

    handleConnection(ws, req) {
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
        console.log(`[StreamServer] Connection ID: ${connectionId}`);
        console.log(`[StreamServer] Total active connections: ${this.connections.size}`);
        console.log('[StreamServer] WebSocket ready state:', ws.readyState);
        console.log('=====================================================\n');

        ws.on('message', (data) => {
            console.log(`[StreamServer] ⚡ Message received on connection ${connectionId}`);
            console.log(`[StreamServer] Data type: ${typeof data}, Length: ${data.length} bytes`);
            this.handleMessage(ws, data, connectionId);
        });

        ws.on('close', (code, reason) => {
            console.log('\n========== WEBSOCKET CONNECTION CLOSED ==========');
            console.log('[StreamServer] Connection ID:', connectionId);
            console.log('[StreamServer] Close Code:', code);
            console.log('[StreamServer] Close Reason:', reason ? reason.toString() : 'No reason provided');
            console.log('[StreamServer] Client IP:', clientIp);
            console.log('[StreamServer] Time connected:', new Date().toISOString());
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
            console.log(`[StreamServer] Processing message from ${connectionId}`);
            console.log(`[StreamServer] Raw data (first 200 chars):`, data.toString().substring(0, 200));
            
            const message = JSON.parse(data.toString());
            console.log('[StreamServer] ✅ JSON parsed successfully');
            console.log('[StreamServer] Message event/type:', message.event || message.type);
            console.log('[StreamServer] Full message:', JSON.stringify(message, null, 2));

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
        return {
            activeConnections: this.connections.size,
            clients: Array.from(this.connections.keys())
        };
    }
}

module.exports = StreamServer;
