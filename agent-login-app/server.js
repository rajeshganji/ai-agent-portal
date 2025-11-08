// Initialize enhanced logger first (before any other imports)
const logger = require('./src/lib/logger');
logger.initialize();

const express = require('express');
const path = require('path');
const session = require('express-session');
const WebSocket = require('ws');
const helmet = require('helmet');
const cors = require('cors');
const securityConfig = require('./config/security');
const StreamClient = require('./src/services/streamClient');
const StreamServer = require('./src/services/streamServer');
const playbackService = require('./src/services/playbackService');

// Validate critical environment variables
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: SESSION_SECRET environment variable is not set!');
    console.error('Please set SESSION_SECRET in Railway dashboard.');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

const app = express();
const server = require('http').createServer(app);

// DISABLED: WebSocket server for agent connections - focusing on /ws (audio stream) first
/*
const wss = new WebSocket.Server({ 
    server,
    path: '/agent',  // Separate path for agent connections
    verifyClient: (info, callback) => {
        // Add WebSocket origin verification if needed
        const origin = info.origin;
        console.log('[WebSocket-Agent] Connection attempt from:', origin);
        callback(true); // Accept all for now, add verification in production
    }
});
*/
const agentConnections = new Map();

// Trust proxy - Important for Railway deployment
app.set('trust proxy', 1);

// Security Headers - Apply helmet first
app.use(securityConfig.helmetConfig);

// CORS - Apply before other middleware
app.use(cors(securityConfig.corsConfig));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration with enhanced security
app.use(session(securityConfig.sessionConfig));

// Security logging middleware
app.use((req, res, next) => {
    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };
    
    // Only log body for non-sensitive routes
    if (req.body && Object.keys(req.body).length > 0 && !req.url.includes('/auth/')) {
        console.log('[Request]', logData);
    } else {
        console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - IP: ${logData.ip}`);
    }
    
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Auth middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        console.log('[Auth] Unauthorized access attempt');
        return res.redirect('/?error=unauthorized');
    }
    next();
};

// DISABLED: WebSocket connection handling for agents - focusing on /ws (audio stream) first
/*
wss.on('connection', (ws, req) => {
    console.log('[WebSocket-Agent] New agent connection');
    
    // Track message statistics
    ws.messageCount = 0;
    ws.totalBytesReceived = 0;
    
    ws.on('message', (message) => {
        ws.messageCount++;
        ws.totalBytesReceived += message.length;
        
        try {
            const data = JSON.parse(message.toString());
            console.log('[WebSocket-Agent] Received message:', data);
            
            if (data.type === 'register') {
                const agentId = data.agentId;
                console.log(`[WebSocket-Agent] Registering agent ${agentId}`);
                
                if (!agentId) {
                    console.error('[WebSocket-Agent] No agentId provided in registration');
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'No agentId provided'
                    }));
                    return;
                }

                agentConnections.set(agentId, ws);
                console.log(`[WebSocket-Agent] Agent ${agentId} successfully registered`);
                console.log('[WebSocket-Agent] Current connections:', Array.from(agentConnections.keys()));
                
                ws.send(JSON.stringify({
                    type: 'registration_success',
                    message: 'Successfully registered for call notifications',
                    agentId: agentId
                }));
            }
        } catch (err) {
            console.error('[WebSocket-Agent] Error processing message:', err);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message'
            }));
        }
    });
    
    ws.on('close', () => {
        // Remove agent from connections
        for (const [agentId, connection] of agentConnections.entries()) {
            if (connection === ws) {
                agentConnections.delete(agentId);
                console.log(`[WebSocket-Agent] Agent ${agentId} disconnected`);
                break;
            }
        }
    });
});
*/

// Auth routes with strict rate limiting
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', securityConfig.rateLimiters.auth, authRoutes);

// PBX routes with rate limiting
const pbxModule = require('./src/routes/pbx');
pbxModule.setAgentConnections(agentConnections);
app.use('/api/pbx/ivrflow', securityConfig.rateLimiters.ivr);
app.use('/api/pbx/receive-call-notification', securityConfig.rateLimiters.pbxWebhook);
app.use('/api/pbx', pbxModule.router);

// Monitor routes with general rate limiting
console.log('[Server] Setting up monitoring routes');
const monitorModule = require('./src/routes/monitor.js');
monitorModule.setAgentConnections(agentConnections);
app.use('/api/monitor', securityConfig.rateLimiters.general, monitorModule.router);

console.log('[Server] Setting up stream routes');
const streamModule = require('./src/routes/stream.js');
app.use('/api/stream', securityConfig.rateLimiters.general, streamModule.router);

// Serve IVR Designer static assets FIRST (before API routes) with enhanced CSP
console.log('[Server] Setting up IVR Designer static files');
app.use('/ivr-designer', securityConfig.ivrDesignerCSP, express.static(path.join(__dirname, 'ivr-designer/dist'), {
    fallthrough: true, // CRITICAL: Let non-existent files fall through to next middleware
    setHeaders: (res, filepath) => {
        // Ensure correct MIME types for assets
        if (filepath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filepath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        // Override CSP headers for better media support
        if (filepath.endsWith('index.html')) {
            res.setHeader('Content-Security-Policy', 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: blob:; " +
                "media-src 'self' data: blob:; " +
                "font-src 'self' data:; " +
                "connect-src 'self' ws: wss:; " +
                "object-src 'none'; " +
                "base-uri 'self';"
            );
        }
    }
}));

// CRITICAL: Handle /ws route for WebSocket upgrade
// This prevents Express from returning 404/400 during upgrade handshake
app.get('/ws', (req, res, next) => {
    console.log('[Server] /ws route hit - checking for WebSocket upgrade');
    console.log('[Server] Headers:', req.headers);
    
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        console.log('[Server] ✅ WebSocket upgrade request detected - allowing through');
        // Don't send a response - let the upgrade handler take over
        // The 'upgrade' event on server will handle this
        return;
    }
    
    console.log('[Server] ❌ Not a WebSocket upgrade request');
    res.status(400).send('WebSocket upgrades only');
});

// IVR Designer routes (for hackathon demo)
console.log('[Server] Setting up IVR Designer routes');
const ivrDesignerRoutes = require('./src/routes/ivr-designer');
app.use('/api/ivr/designer', securityConfig.rateLimiters.general, ivrDesignerRoutes);

// WebSocket Status API - Get connection details
app.get('/api/ws/status', (req, res) => {
    try {
        // This will be populated after streamServer is initialized
        const streamServerStatus = global.streamServer ? global.streamServer.getStatus() : null;
        
        // Agent WebSocket connections (on /agent path)
        const agentStatus = {
            activeConnections: agentConnections.size,
            connections: Array.from(agentConnections.entries()).map(([id, ws]) => ({
                id,
                readyState: ws.readyState,
                readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
                messageCount: ws.messageCount || 0,
                totalBytesReceived: ws.totalBytesReceived || 0
            }))
        };
        
        // Ozonetel WebSocket connections (on /ws path)
        const ozonetelStatus = streamServerStatus || {
            activeConnections: 0,
            clients: []
        };
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            websockets: {
                agent: agentStatus,
                ozonetel: ozonetelStatus,
                totalConnections: agentStatus.activeConnections + ozonetelStatus.activeConnections
            }
        });
    } catch (error) {
        console.error('[API] Error getting WebSocket status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// IVR Designer flow editor route (no auth for hackathon demo)
app.get('/ivr/designer/flow/:id?', (req, res) => {
    const flowId = req.params.id || 'new';
    console.log(`[IVR Designer] Opening flow editor for: ${flowId}`);
    
    // Set enhanced CSP headers for IVR Designer
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "media-src 'self' data: blob:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' ws: wss:; " +
        "object-src 'none'; " +
        "base-uri 'self';"
    );
    
    res.sendFile(path.join(__dirname, 'ivr-designer/dist/index.html'));
});

// Main routes
app.get('/', (req, res) => {
    res.render('login', { error: null });
});

app.get('/toolbar', requireAuth, (req, res) => {
    console.log('[Route] Accessing toolbar with session:', req.session);
    const agentId = req.session.user.agentId;
    console.log('[Route] Using agentId for toolbar:', agentId);
    res.render('toolbar', { 
        agent: {
            agentName: req.session.user.name,
            agentStatus: req.session.user.status,
            id: agentId,
            role: req.session.user.role
        }
    });
});

// IVR Designer SPA catch-all route - Must be AFTER static assets but BEFORE 404
// This handles all client-side routes like /ivr-designer/flows, /ivr-designer/designer, etc.
app.get('/ivr-designer/*', (req, res) => {
    console.log(`[IVR Designer] SPA route: ${req.url}`);
    
    // Set enhanced CSP headers for IVR Designer
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; " +
        "media-src 'self' data: blob:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' ws: wss:; " +
        "object-src 'none'; " +
        "base-uri 'self';"
    );
    
    res.sendFile(path.join(__dirname, 'ivr-designer/dist/index.html'));
});

// 404 handler
app.use((req, res) => {
    console.log(`[404] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;

console.log('=================================');
console.log('🚀 Starting AI Agent Portal');
console.log('=================================');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('Session Secret:', process.env.SESSION_SECRET ? '✓ Set' : '✗ Not Set');
console.log('=================================');

// Initialize Stream Client
let streamClient = null;
let streamServer = null;

// Export streamClient getter for routes
const getStreamClient = () => streamClient;

// Note: Upgrade handling is now done by StreamServer for /ws path
// The /agent WebSocket server handles its own upgrades

async function startServer() {
    console.log('=================================');
    console.log('🎤 Initializing Stream Client...');
    console.log('=================================');
    
    streamClient = new StreamClient({
        url: null, // Not connecting to external server, handling incoming connections
        reconnectInterval: 5000,
        logDir: path.join(__dirname, 'logs/stream')
    });
    
    // Initialize (creates log directory, doesn't connect since url is null)
    await streamClient.initialize();
    console.log('[StreamClient] Stream client ready to process events');
    
    console.log('=================================');
    console.log('🎙️  Initializing Stream Server (for Ozonetel)...');
    console.log('=================================');
    
    // Initialize StreamServer with StreamClient handler BEFORE server.listen()
    streamServer = new StreamServer(server, streamClient);
    global.streamServer = streamServer; // Store globally for status API
    console.log('[Server] ✅ StreamServer constructor completed');
    console.log('[Server] ✅ StreamServer instance:', !!streamServer);
    console.log('[Server] ✅ StreamServer.wss:', !!streamServer.wss);
    console.log('[StreamServer] Ready to receive events at: /ws');
    console.log('[StreamServer] StreamClient connected for message processing');
    
    // Link PlaybackService to StreamServer for audio output
    playbackService.setStreamServer(streamServer);
    console.log('[PlaybackService] Linked to StreamServer for audio playback');

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ [Server] Running at http://0.0.0.0:${PORT}`);
    console.log(`✅ [WebSocket-AudioStream] Ozonetel audio streaming at ws://0.0.0.0:${PORT}/ws`);
    // console.log(`✅ [WebSocket-Agent] Agent connections at ws://0.0.0.0:${PORT}/agent`); // DISABLED
    console.log('[Server] Available routes:');
    console.log('- GET  /');
    console.log('- GET  /toolbar');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/logout');
    console.log('- POST /api/pbx/call-notification');
    console.log('- POST /api/pbx/receive-call-notification');
    console.log('- GET  /api/pbx/ivrflow');
    console.log('=================================');
    console.log('🎉 Server is ready!');
    console.log('=================================');
    
    // Set stream client and playback service getters for routes
    streamModule.setStreamClientGetter(getStreamClient);
    streamModule.setPlaybackServiceGetter(() => playbackService);
    console.log('[Routes] Stream client and playback service linked to API endpoints');
});
}

// Start the server
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📛 SIGTERM signal received: closing HTTP server');
    if (streamClient) {
        console.log('[StreamClient] Disconnecting stream client...');
        streamClient.disconnect();
    }
    server.close(() => {
        console.log('✅ HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('📛 SIGINT signal received: closing HTTP server');
    if (streamClient) {
        console.log('[StreamClient] Disconnecting stream client...');
        streamClient.disconnect();
    }
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

// Export for Vercel
module.exports = app;
