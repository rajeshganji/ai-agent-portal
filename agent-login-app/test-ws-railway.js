/**
 * Test WebSocket connection to Railway deployment
 */

const WebSocket = require('ws');

// Replace with your actual Railway domain
const RAILWAY_DOMAIN = 'ai-agent-portal-production.up.railway.app';
const WS_URL = `wss://${RAILWAY_DOMAIN}/ws`;

console.log('🧪 Testing WebSocket connection to Railway...');
console.log('URL:', WS_URL);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ WebSocket connected successfully!');
    
    // Send a test message
    ws.send(JSON.stringify({
        event: 'start',
        ucid: 'TEST123456789',
        did: '520228'
    }));
    
    console.log('📤 Sent test start message');
});

ws.on('message', (data) => {
    console.log('📨 Received:', data.toString());
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed: ${code} - ${reason || 'No reason'}`);
});

// Auto-close after 5 seconds
setTimeout(() => {
    console.log('🔚 Closing test connection...');
    ws.close();
    process.exit(0);
}, 5000);