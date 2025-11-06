const express = require('express');
const path = require('path');
const session = require('express-session');
const WebSocket = require('ws');
const helmet = require('helmet');
const cors = require('cors');
const securityConfig = require('./config/security');

// Validate critical environment variables
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: SESSION_SECRET environment variable is not set!');
    console.error('Please set SESSION_SECRET in Railway dashboard.');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

const app = express();
const server = require('http').createServer(app);

// WebSocket server setup with security
const wss = new WebSocket.Server({ 
    server,
    verifyClient: (info, callback) => {
        // Add WebSocket origin verification if needed
        const origin = info.origin;
        console.log('[WebSocket] Connection attempt from:', origin);
        callback(true); // Accept all for now, add verification in production
    }
});
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

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('[WebSocket] New connection attempt');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('[WebSocket] Received message:', data);
            
            if (data.type === 'register') {
                const agentId = data.agentId;
                console.log(`[WebSocket] Registering agent ${agentId}`);
                
                if (!agentId) {
                    console.error('[WebSocket] No agentId provided in registration');
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'No agentId provided'
                    }));
                    return;
                }

                agentConnections.set(agentId, ws);
                console.log(`[WebSocket] Agent ${agentId} successfully registered`);
                console.log('[WebSocket] Current connections:', Array.from(agentConnections.keys()));
                
                ws.send(JSON.stringify({
                    type: 'registration_success',
                    message: 'Successfully registered for call notifications',
                    agentId: agentId
                }));
            }
        } catch (err) {
            console.error('[WebSocket] Error processing message:', err);
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
                console.log(`[WebSocket] Agent ${agentId} disconnected`);
                break;
            }
        }
    });
});

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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ [Server] Running at http://0.0.0.0:${PORT}`);
    console.log(`✅ [WebSocket] Server running at ws://0.0.0.0:${PORT}`);
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
    server.close(() => {
        console.log('✅ HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('📛 SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

// Export for Vercel
module.exports = app;
