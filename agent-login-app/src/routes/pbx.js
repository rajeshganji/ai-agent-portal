const express = require('express');
const router = express.Router();
const IVRFlow = require('../lib/kookoo/ivrflow');
const flowEngine = require('../services/flowEngine');

// Import WebSocket connections from server
let agentConnections;
function setAgentConnections(connections) {
    agentConnections = connections;
}

// AI-Powered IVR Flow Handler with OpenAI - Public API
router.get('/ivrflow', async (req, res) => {
    const requestTimestamp = new Date().toISOString();
    const requestStartTime = Date.now();
    
    console.log(`[PBX] ==================== INCOMING IVR REQUEST ====================`);
    console.log(`[PBX] ${requestTimestamp} - New IVR request received`);
    console.log(`[PBX] Method: ${req.method}`);
    console.log(`[PBX] URL: ${req.originalUrl}`);
    console.log(`[PBX] Query Parameters:`, JSON.stringify(req.query, null, 2));
    console.log(`[PBX] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[PBX] User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
    console.log(`[PBX] Remote IP: ${req.ip || req.connection.remoteAddress || 'Unknown'}`);
    console.log(`[PBX] =============================================================`);
    
    try {
        // Extract call parameters
        const callId = req.query.sid || req.query.cid || `call_${Date.now()}`;
        const event = req.query.event || 'NewCall';
        const data = req.query.data || req.query;
        
        console.log(`[PBX] ${new Date().toISOString()} - 🔄 Processing call parameters:`);
        console.log(`[PBX] - Call ID: ${callId}`);
        console.log(`[PBX] - Event: ${event}`);
        console.log(`[PBX] - Data:`, JSON.stringify(data, null, 2));
        
        console.log(`[PBX] ${new Date().toISOString()} - 🤖 Executing flow engine...`);
        
        // Use flow engine with OpenAI integration
        const xmlResponse = await flowEngine.executeTestFlow({
            callId,
            event,
            data
        });
        
        const processingDuration = Date.now() - requestStartTime;
        
        console.log(`[PBX] ${new Date().toISOString()} - ✅ Flow engine completed in ${processingDuration}ms`);
        console.log(`[PBX] ==================== OUTGOING XML RESPONSE ====================`);
        console.log(`[PBX] Response Timestamp: ${new Date().toISOString()}`);
        console.log(`[PBX] Response Size: ${xmlResponse.length} characters`);
        console.log(`[PBX] Processing Duration: ${processingDuration}ms`);
        console.log(`[PBX] XML Response Body:`);
        console.log(xmlResponse);
        console.log(`[PBX] ====================== END XML RESPONSE =====================`);
        
        // Send XML response
        res.set('Content-Type', 'text/xml');
        res.send(xmlResponse);
        
        console.log(`[PBX] ${new Date().toISOString()} - 📤 XML response sent successfully`);
        
    } catch (error) {
        const errorTimestamp = new Date().toISOString();
        const errorDuration = Date.now() - requestStartTime;
        
        console.error(`[PBX] ${errorTimestamp} - ❌ ERROR in flow processing after ${errorDuration}ms:`);
        console.error(`[PBX] Error message: ${error.message}`);
        console.error(`[PBX] Error stack:`, error.stack);
        console.error(`[PBX] Request details - Call ID: ${req.query.sid}, Event: ${req.query.event}`);
        
        // Fallback to basic IVR
        console.log(`[PBX] ${new Date().toISOString()} - 🔄 Falling back to basic IVR flow...`);
        
        const ivrFlow = new IVRFlow({
            sid: req.query.sid,
            event: req.query.event,
            data: req.query.data
        });
        
        const response = ivrFlow.processFlow();
        
        console.log(`[PBX] ${new Date().toISOString()} - 📤 Sending fallback IVR response`);
        response.send(res);
    }
});

// Receive call notification from PBX - Public API (no authentication required)
router.post('/receive-call-notification', (req, res) => {
    console.log('[PBX] Received call notification from PBX:');
    console.log('[PBX] Headers:', req.headers);
    console.log('[PBX] Body:', JSON.stringify(req.body, null, 2));
    console.log('[PBX] Query:', req.query);
    
    // Get agentId from query parameter
    const agentId = req.query.agentId;
    
    if (!agentId) {
        console.error('[PBX] Missing agentId in query parameter');
        return res.status(400).json({
            success: false,
            error: 'Missing agentId in query parameter',
            message: 'Please provide agentId as query parameter: ?agentId=xxx'
        });
    }
    
    // Log all received data
    const receivedData = {
        timestamp: new Date().toISOString(),
        agentId: agentId,
        callData: req.body,
        query: req.query,
        headers: req.headers
    };
    
    console.log('[PBX] Complete received data:', JSON.stringify(receivedData, null, 2));
    
    // Get agent's WebSocket connection
    const ws = agentConnections.get(agentId);
    if (!ws) {
        console.error(`[PBX] Agent ${agentId} not connected via WebSocket`);
        return res.status(404).json({
            success: false,
            error: 'Agent not connected',
            agentId: agentId,
            message: 'Agent is not connected via WebSocket'
        });
    }
    
    try {
        // Determine agent status based on event
        let agentStatusChange = 'ready';
        if (req.body.event === 'ANSWERED') {
            agentStatusChange = 'busy';
        } else if (req.body.event === 'RINGING' || req.body.status === 'ringing') {
            agentStatusChange = 'incoming';
        }else if (req.body.event === 'HANGUP' || req.body.status === 'hangup') {
            agentStatusChange = 'released';
        }

        // Prepare caller information
        const caller = {
            phoneNo: req.body.caller_number || req.body.ani || 'Unknown',
            callId: req.body.ucid || req.body.sid || req.body.reportingId || 'Unknown',
            name: req.body.caller_name || 'Unknown Caller',
            calledNumber: req.body.called_number || req.body.dialled_number || '',
            did: req.body.did || req.body.did_number || '',
            event: req.body.event || '',
            status: req.body.status || req.body.originate_status || '',
            timestamp: req.body.timestamp || req.body.start_time || '',
        };
        
        // Send notification to agent via WebSocket
        ws.send(JSON.stringify({
            type: 'incoming_call',
            data: {
                caller: caller,
                agentStatusChange: agentStatusChange,
                rawData: req.body
            }
        }));
        
        console.log(`[PBX] Successfully sent notification to agent ${agentId}`);
        res.json({
            success: true,
            message: 'Call notification sent to agent successfully',
            agentId: agentId,
            receivedAt: receivedData.timestamp
        });
    } catch (err) {
        console.error('[PBX] Error sending notification to agent:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification to agent',
            details: err.message,
            agentId: agentId
        });
    }
});

// Handle incoming call notifications
router.post('/call-notification', async (req, res) => {
    const { agentId, caller, agentStatusChange } = req.body;
    
    console.log('[PBX] Received call notification:', {
        agentId,
        caller,
        agentStatusChange
    });

    // Validate required fields
    if (!agentId || !caller || !agentStatusChange) {
        console.error('[PBX] Missing required fields in notification');
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['agentId', 'caller', 'agentStatusChange']
        });
    }
    
    // Get agent's WebSocket connection
    const ws = agentConnections.get(agentId);
    if (!ws) {
        console.error(`[PBX] Agent ${agentId} not connected`);
        return res.status(404).json({ 
            error: 'Agent not connected',
            agentId
        });
    }
    
    try {
        // Send notification to agent
        ws.send(JSON.stringify({
            type: 'incoming_call',
            data: {
                caller: {
                    phoneNo: caller.phoneNo,
                    callId: caller.callId,
                    name: caller.name
                },
                agentStatusChange
            }
        }));
        
        console.log(`[PBX] Successfully sent notification to agent ${agentId}`);
        res.json({ 
            success: true, 
            message: 'Notification sent to agent',
            agentId
        });
    } catch (err) {
        console.error('[PBX] Error sending notification:', err);
        res.status(500).json({ 
            error: 'Failed to send notification',
            details: err.message
        });
    }
});

module.exports = {
    router,
    setAgentConnections
};