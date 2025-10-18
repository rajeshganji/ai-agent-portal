const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'agent-portal-secret',
    resave: false,
    saveUninitialized: false
}));

// Routes
app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, agentId, password } = req.body;
    
    // Mock authentication - replace with real auth later
    if (username === 'agent' && password === 'password') {
        const agentData = {
            agentId: agentId,
            agentName: username,
            agentStatus: 'AVAILABLE'
        };
        
        cache.set(agentId, agentData);
        req.session.agent = agentData;
        res.json({ success: true, agent: agentData });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.get('/toolbar', (req, res) => {
    if (!req.session.agent) {
        return res.redirect('/');
    }
    res.render('toolbar', { agent: req.session.agent });
});

app.post('/updateStatus', (req, res) => {
    const { status } = req.body;
    if (req.session.agent) {
        req.session.agent.agentStatus = status;
        cache.set(req.session.agent.agentId, req.session.agent);
        res.json({ success: true, agent: req.session.agent });
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/logout', (req, res) => {
    if (req.session.agent) {
        cache.del(req.session.agent.agentId);
        req.session.destroy();
    }
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});