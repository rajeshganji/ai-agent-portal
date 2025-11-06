const express = require('express');
const router = express.Router();

let agentConnections;

const setAgentConnections = (connections) => {
    agentConnections = connections;
};

router.get('/agents', (req, res) => {
    console.log('[Monitor] Checking registered agents');
    
    if (!agentConnections) {
        return res.status(500).json({
            error: 'Agent connections not initialized'
        });
    }

    const registeredAgents = Array.from(agentConnections.entries()).map(([agentId, ws]) => ({
        agentId,
        status: ws.readyState === ws.OPEN ? 'connected' : 'disconnected',
        lastConnected: new Date().toISOString()
    }));

    console.log('[Monitor] Currently registered agents:', registeredAgents);
    
    res.json({
        totalAgents: registeredAgents.length,
        agents: registeredAgents,
        timestamp: new Date().toISOString()
    });
});

// Export both the router and the setter function
module.exports = {
    router,
    setAgentConnections
};