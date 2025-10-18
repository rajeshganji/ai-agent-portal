Sure, here's the contents for the file: /agent-login-app/agent-login-app/src/routes/toolbar.ts

import { Router } from 'express';
import { getAgentStatus, updateAgentStatus } from '../api/status';

const router = Router();

// Route to get the agent's current status
router.get('/status', (req, res) => {
    const agentId = req.session.agentId; // Assuming agent ID is stored in session
    const status = getAgentStatus(agentId);
    res.json(status);
});

// Route to update the agent's status
router.post('/status', (req, res) => {
    const { status } = req.body;
    const agentId = req.session.agentId; // Assuming agent ID is stored in session
    updateAgentStatus(agentId, status);
    res.status(200).send('Status updated successfully');
});

export default router;