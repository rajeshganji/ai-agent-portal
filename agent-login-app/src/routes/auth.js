const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userStore = require('../services/userStore');

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log('[Auth] Accessing route:', req.method, req.path);
    next();
});

// Login route with validation
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('agentId').trim().notEmpty().withMessage('Agent ID is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('[Auth] Validation errors:', errors.array());
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }

    const { username, agentId, password } = req.body;
    console.log('[Auth] Login attempt for user:', username, 'agentId:', agentId);

    try {
        const user = await userStore.findByCredentials(username, agentId, password);
        
        if (!user) {
            console.log('[Auth] Login failed for user:', username);
            // Security: Use generic message to prevent username enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Regenerate session to prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                console.error('[Auth] Session regeneration error:', err);
                return res.status(500).json({ error: 'Session error' });
            }

            // Store user in session
            req.session.user = user;
            console.log('[Auth] Login successful for user:', username);
            
            res.json({
                success: true,
                user: {
                    username: user.username,
                    name: user.name,
                    status: user.status,
                    agentId: user.agentId
                }
            });
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

// Update user status with validation
router.put('/status', [
    body('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['ready', 'incoming', 'busy', 'acw', 'pause']).withMessage('Invalid status value')
], async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }

    const { status } = req.body;
    const success = await userStore.updateUserStatus(req.session.user.username, status);
    
    if (success) {
        // Update session
        req.session.user.status = status;
        res.json({ 
            success: true,
            status 
        });
    } else {
        res.status(400).json({ error: 'Failed to update status' });
    }
});

module.exports = router;