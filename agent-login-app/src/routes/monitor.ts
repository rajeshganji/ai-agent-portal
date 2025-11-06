import express from 'express';
import { WebSocket } from 'ws';

const router = express.Router();
let agentConnections: Map<string, WebSocket>;

export const setAgentConnections = (connections: Map<string, WebSocket>) => {
    agentConnections = connections;
};

router.get('/agents', (req, res) => {
    console.log('[Monitor] Checking registered agents');
    const registeredAgents = Array.from(agentConnections.keys());
    console.log('[Monitor] Currently registered agents:', registeredAgents);
    res.json({
        totalAgents: registeredAgents.length,
        agents: registeredAgents,
        timestamp: new Date().toISOString()
    });
});

export { router };