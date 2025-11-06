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
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws',
            verifyClient: (info, callback) => {
                console.log('[StreamServer] Connection attempt from:', info.origin);
                // TODO: Add authentication/verification for Ozonetel
                callback(true);
            }
        });

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        console.log('[StreamServer] WebSocket stream server ready at path: /ws');
    }

    handleConnection(ws, req) {
        const clientIp = req.socket.remoteAddress;
        console.log('[StreamServer] New connection from:', clientIp);

        // Generate connection ID
        const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.connections.set(connectionId, ws);

        ws.on('message', (data) => {
            this.handleMessage(ws, data, connectionId);
        });

        ws.on('close', () => {
            console.log('[StreamServer] Connection closed:', connectionId);
            this.connections.delete(connectionId);
        });

        ws.on('error', (error) => {
            console.error('[StreamServer] WebSocket error:', error);
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
            const message = JSON.parse(data.toString());
            console.log('[StreamServer] Received:', message.event || message.type);

            // Forward to StreamClient message handler
            if (this.streamClient) {
                this.streamClient.handleMessage(data);
            }

            // Handle commands from client
            if (message.command) {
                console.log('[StreamServer] Command received:', message.command);
                // Commands are handled by StreamClient
            }

        } catch (err) {
            console.error('[StreamServer] Error processing message:', err);
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
