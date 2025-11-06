const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// Body parsing middleware - MUST come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
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

// Security headers middleware
app.use((req, res, next) => {
    // Content Security Policy - Development friendly
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' * data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval'; " +
        "script-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' * data: blob: 'unsafe-inline'; " +
        "img-src 'self' * data: blob:; " +
        "font-src 'self' * data: blob:; " +
        "connect-src 'self' * data: blob: ws: wss:;"
    );
    
    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
            console.log(`[Static] Serving JavaScript file with proper MIME type: ${filePath}`);
        }
    }
}));

// Parse JSON bodies
app.use(express.json());

// Debug middleware for all requests
app.use((req, res, next) => {
    console.log('[Debug] Incoming request:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

try {
    // Import routes and middleware
    const authRoutes = require('./src/routes/auth');
    console.log('[Debug] Auth routes loaded successfully');
    
    // API routes
    app.use('/api/auth', authRoutes);
    console.log('[Debug] Auth routes mounted at /api/auth');
} catch (error) {
    console.error('[Error] Failed to load auth routes:', error);
}

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes with enhanced logging
app.get('/', (req, res) => {
    console.log('[Route] Rendering login page');
    res.render('login', { error: null });
});

app.get('/toolbar', (req, res, next) => {
    console.log('[Route] Accessing toolbar');
    try {
        // Create dummy agent data for demonstration
        const agent = {
            agentName: 'Agent',
            agentStatus: 'AVAILABLE'
        };
        
        console.log('[Debug] Toolbar view path:', path.join(__dirname, 'views', 'toolbar.ejs'));
        console.log('[Debug] Views directory:', app.get('views'));
        
        if (!res.headersSent) {
            res.render('toolbar', { agent: agent }, (err, html) => {
                if (err) {
                    console.error('[Error] Failed to render toolbar:', err);
                    return next(err);
                }
                res.send(html);
            });
        }
    } catch (error) {
        console.error('[Error] Failed to process toolbar request:', error);
        next(error);
    }
});

// 404 handler
app.use((req, res, next) => {
    console.log(`[404] Not Found: ${req.url}`);
    res.status(404).render('login', { error: 'Page not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Error]', err.stack);
    res.status(500).render('login', { error: 'Internal server error' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[Server] Static files served from: ${path.join(__dirname, 'public')}`);
});