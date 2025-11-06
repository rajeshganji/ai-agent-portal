const express = require('express');
const router = express.Router();
const userStore = require('../services/userStore');

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log('[Auth] Accessing route:', req.method, req.path);
    console.log('[Auth] Session:', req.session);
    next();
});

// Login route
router.post('/login', async (req, res) => {
    const { username, agentId, password } = req.body;
    console.log('[Auth] Login attempt for user:', username);

    try {
        const user = await userStore.findByCredentials(username, agentId, password);
        
        if (!user) {
            console.log('[Auth] Login failed for user:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Store user in session
        req.session.user = user;
        console.log('[Auth] Login successful for user:', username);
        
        res.json({
            success: true,
            user: {
                username: user.username,
                name: user.name,
                status: user.status
            }
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    const username = req.session?.user?.username;
    console.log('[Auth] Logout request for user:', username);
    
    req.session.destroy(err => {
        if (err) {
            console.error('[Auth] Logout error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        console.log('[Auth] Logout successful for user:', username);
        res.json({ success: true });
    });
});

// Get current user status
router.get('/status', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const status = await userStore.getUserStatus(req.session.user.username);
    res.json({ status });
});

// Update user status
router.put('/status', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { status } = req.body;
    const success = await userStore.updateUserStatus(req.session.user.username, status);
    
    if (success) {
        res.json({ status });
    } else {
        res.status(400).json({ error: 'Failed to update status' });
    }
});

module.exports = router;