const express = require('express');
const router = express.Router();

// In-memory cache for flows (for hackathon demo)
const flowsCache = new Map();
let flowIdCounter = 1;

// Get all flows
router.get('/flows', (req, res) => {
    const flows = Array.from(flowsCache.values()).map(flow => ({
        id: flow.id,
        name: flow.name,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
        nodeCount: flow.nodes?.length || 0
    }));
    
    res.json({ flows });
});

// Get specific flow
router.get('/flows/:id', (req, res) => {
    const flow = flowsCache.get(req.params.id);
    
    if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
    }
    
    res.json(flow);
});

// Create new flow
router.post('/flows', (req, res) => {
    const { name, nodes, edges } = req.body;
    
    const flowId = `flow_${flowIdCounter++}`;
    const flow = {
        id: flowId,
        name: name || 'Untitled Flow',
        nodes: nodes || [],
        edges: edges || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    flowsCache.set(flowId, flow);
    
    console.log(`[IVR Designer] Flow created: ${flowId} - ${flow.name}`);
    res.json({ success: true, id: flowId, flow });
});

// Update flow
router.put('/flows/:id', (req, res) => {
    const flowId = req.params.id;
    const existingFlow = flowsCache.get(flowId);
    
    if (!existingFlow) {
        return res.status(404).json({ error: 'Flow not found' });
    }
    
    const { name, nodes, edges } = req.body;
    const updatedFlow = {
        ...existingFlow,
        name: name || existingFlow.name,
        nodes: nodes || existingFlow.nodes,
        edges: edges || existingFlow.edges,
        updatedAt: new Date().toISOString()
    };
    
    flowsCache.set(flowId, updatedFlow);
    
    console.log(`[IVR Designer] Flow updated: ${flowId}`);
    res.json({ success: true, flow: updatedFlow });
});

// Delete flow
router.delete('/flows/:id', (req, res) => {
    const flowId = req.params.id;
    
    if (!flowsCache.has(flowId)) {
        return res.status(404).json({ error: 'Flow not found' });
    }
    
    flowsCache.delete(flowId);
    
    console.log(`[IVR Designer] Flow deleted: ${flowId}`);
    res.json({ success: true, message: 'Flow deleted' });
});

// Test flow
router.post('/test', (req, res) => {
    const { nodes, edges } = req.body;
    
    // Basic validation
    if (!nodes || nodes.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Flow has no nodes'
        });
    }
    
    // Find start node (node with no incoming edges)
    const nodeIds = new Set(nodes.map(n => n.id));
    const targetIds = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !targetIds.has(n.id));
    
    if (startNodes.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No start node found (all nodes have incoming connections)'
        });
    }
    
    if (startNodes.length > 1) {
        return res.json({
            success: true,
            warning: 'Multiple start nodes found. Only one should exist.',
            startNodes: startNodes.map(n => ({ id: n.id, type: n.type }))
        });
    }
    
    // Check for disconnected nodes
    const connectedNodes = new Set();
    edges.forEach(e => {
        connectedNodes.add(e.source);
        connectedNodes.add(e.target);
    });
    
    const disconnectedNodes = nodes.filter(n => !connectedNodes.has(n.id) && n.id !== startNodes[0].id);
    
    res.json({
        success: true,
        message: 'Flow validation passed',
        stats: {
            nodeCount: nodes.length,
            edgeCount: edges.length,
            startNode: startNodes[0],
            disconnectedNodes: disconnectedNodes.length > 0 ? disconnectedNodes.map(n => ({ id: n.id, type: n.type })) : []
        }
    });
});

// Validate flow
router.post('/validate', (req, res) => {
    const { nodes, edges } = req.body;
    const errors = [];
    const warnings = [];
    
    // Check if flow has nodes
    if (!nodes || nodes.length === 0) {
        errors.push('Flow must have at least one node');
    }
    
    // Validate each node
    nodes.forEach(node => {
        switch (node.type) {
            case 'playText':
                if (!node.data.text || node.data.text.trim() === '') {
                    errors.push(`PlayText node (${node.id}) has no text`);
                }
                break;
            case 'playAudio':
                if (!node.data.audioUrl || node.data.audioUrl.trim() === '') {
                    errors.push(`PlayAudio node (${node.id}) has no audio URL`);
                }
                break;
            case 'findIntent':
                if (!node.data.prompt || node.data.prompt.trim() === '') {
                    errors.push(`FindIntent node (${node.id}) has no prompt`);
                }
                if (!node.data.intents || node.data.intents.length === 0) {
                    errors.push(`FindIntent node (${node.id}) has no intents defined`);
                }
                break;
            case 'conditional':
                if (!node.data.condition || node.data.condition.trim() === '') {
                    warnings.push(`Conditional node (${node.id}) has no condition`);
                }
                break;
            case 'transfer':
                if (!node.data.phoneNumber || node.data.phoneNumber.trim() === '') {
                    errors.push(`Transfer node (${node.id}) has no phone number`);
                }
                break;
        }
    });
    
    res.json({
        valid: errors.length === 0,
        errors,
        warnings
    });
});

module.exports = router;
