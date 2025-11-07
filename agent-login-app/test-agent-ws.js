/**
 * Test /agent WebSocket Connection
 */

const WebSocket = require('ws');

const WS_URL = 'wss://ai-agent-portal-production.up.railway.app/agent';

console.log('Testing /agent WebSocket...');
console.log('Connecting to:', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ AGENT WebSocket CONNECTED!');
    
    // Send registration message
    ws.send(JSON.stringify({
        type: 'register',
        agentId: 'TEST123'
    }));
    
    setTimeout(() => ws.close(), 2000);
});

ws.on('message', (data) => {
    console.log('📨 Message:', data.toString());
});

ws.on('close', (code) => {
    console.log('Closed:', code);
    process.exit(code === 1000 ? 0 : 1);
});

ws.on('error', (error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
