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
                console.log(`[StreamServer] Connection attempt from: ${info.origin} (${protocol}://)`);
                console.log(`[StreamServer] Request URL: ${info.req.url}`);
                // TODO: Add authentication/verification for Ozonetel
                callback(true);
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
        console.log(`[StreamServer] New connection from: ${clientIp} (${protocol}://)`);

        // Generate connection ID
        const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.connections.set(connectionId, ws);
        console.log(`[StreamServer] Connection ID: ${connectionId}`);
        console.log(`[StreamServer] Total active connections: ${this.connections.size}`);

        ws.on('message', (data) => {
            console.log(`[StreamServer] ⚡ Message received on connection ${connectionId}`);
            console.log(`[StreamServer] Data type: ${typeof data}, Length: ${data.length} bytes`);
            this.handleMessage(ws, data, connectionId);
        });

        ws.on('close', () => {
            console.log('[StreamServer] 🔌 Connection closed:', connectionId);
            console.log('[StreamServer] Remaining connections:', this.connections.size - 1);
            this.connections.delete(connectionId);
        });

        ws.on('error', (error) => {
            console.error('[StreamServer] ❌ WebSocket error on', connectionId, ':', error.message);
        });

        ws.on('ping', () => {
            console.log('[StreamServer] 💓 Ping received from', connectionId);
        });

        ws.on('pong', () => {
            console.log('[StreamServer] 💓 Pong received from', connectionId);
        });

        // Send acknowledgment
        ws.send(JSON.stringify({
            type: 'connected',
            connectionId,
            timestamp: new Date().toISOString()
        }));
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
