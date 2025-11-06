const authMiddleware = {
    // Ensure user is authenticated
    requireAuth: (req, res, next) => {
        if (req.session && req.session.user) {
            console.log('[Auth] User authenticated:', req.session.user.username);
            return next();
        }
        console.log('[Auth] Unauthorized access attempt');
        res.status(401).json({ error: 'Unauthorized' });
    },

    // Add user data to response locals if available
    populateUser: (req, res, next) => {
        if (req.session && req.session.user) {
            res.locals.user = req.session.user;
        }
        next();
    }
};

module.exports = authMiddleware;