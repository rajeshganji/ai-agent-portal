const express = require('express');
const path = require('path');
const session = require('express-session');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);

// WebSocket server setup
const wss = new WebSocket.Server({ server });
const agentConnections = new Map();

// Body parsing middleware - MUST come first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('[Debug] Request body:', {
            ...req.body,
            password: req.body.password ? '***' : undefined
        });
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

// Auth routes
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

// PBX routes
const pbxModule = require('./src/routes/pbx');
pbxModule.setAgentConnections(agentConnections);
app.use('/api/pbx', pbxModule.router);

// Monitor routes
console.log('[Server] Setting up monitoring routes');
const monitorModule = require('./src/routes/monitor.js');
monitorModule.setAgentConnections(agentConnections);
app.use('/api/monitor', monitorModule.router);

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
server.listen(PORT, () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[WebSocket] Server running at ws://localhost:${PORT}`);
    console.log('[Server] Available routes:');
    console.log('- GET  /');
    console.log('- GET  /toolbar');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/logout');
    console.log('- POST /api/pbx/call-notification');
    console.log('- POST /api/pbx/receive-call-notification');
    console.log('- GET  /api/pbx/ivrflow');
});

// Export for Vercel
module.exports = app;
