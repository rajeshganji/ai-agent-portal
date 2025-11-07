/**
 * Test WebSocket Connection to Railway
 * This verifies if the WebSocket server accepts connections correctly
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'wss://ai-agent-portal-production.up.railway.app/ws';

console.log('='.repeat(60));
console.log('🧪 Testing WebSocket Connection');
console.log('='.repeat(60));
console.log('Connecting to:', WS_URL);
console.log('');

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('WebSocket state:', ws.readyState, '(1 = OPEN)');
    console.log('');
    
    // Send test message
    const testMessage = {
        event: 'test',
        type: 'test',
        ucid: 'TEST123456789',
        timestamp: new Date().toISOString(),
        message: 'Test connection from test client'
    };
    
    console.log('📤 Sending test message:', JSON.stringify(testMessage, null, 2));
    ws.send(JSON.stringify(testMessage));
    
    // Send fake media message
    setTimeout(() => {
        const mediaMessage = {
            event: 'media',
            type: 'media',
            ucid: 'TEST123456789',
            data: {
                samples: [-5, -2, 2, 3, -3, -8, -10, -8, -7, -6],
                bitsPerSample: 16,
                sampleRate: 16000,
                channelCount: 1,
                numberOfFrames: 10,
                type: 'data'
            }
        };
        
        console.log('📤 Sending test media message');
        ws.send(JSON.stringify(mediaMessage));
        
        // Close after 2 seconds
        setTimeout(() => {
            console.log('');
            console.log('🔌 Closing connection...');
            ws.close(1000, 'Test complete');
        }, 2000);
    }, 1000);
});

ws.on('message', (data) => {
    console.log('');
    console.log('📨 RECEIVED MESSAGE FROM SERVER:');
    try {
        const parsed = JSON.parse(data.toString());
        console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log(data.toString());
    }
});

ws.on('close', (code, reason) => {
    console.log('');
    console.log('❌ CONNECTION CLOSED');
    console.log('Close code:', code);
    console.log('Close reason:', reason.toString() || 'No reason provided');
    console.log('');
    
    const closeCodes = {
        1000: 'Normal Closure',
        1001: 'Going Away',
        1002: 'Protocol Error',
        1003: 'Unsupported Data',
        1006: 'Abnormal Closure',
        1011: 'Internal Error'
    };
    
    if (closeCodes[code]) {
        console.log('Meaning:', closeCodes[code]);
    }
    
    console.log('='.repeat(60));
    process.exit(code === 1000 ? 0 : 1);
});

ws.on('error', (error) => {
    console.error('');
    console.error('❌ WEBSOCKET ERROR:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code || 'N/A');
    console.error('');
    console.error('Full error:', error);
    console.error('='.repeat(60));
});

ws.on('ping', () => {
    console.log('💓 Received PING from server');
});

ws.on('pong', () => {
    console.log('💓 Received PONG from server');
});

// Timeout if connection doesn't establish in 10 seconds
setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
        console.error('');
        console.error('⏰ CONNECTION TIMEOUT - Failed to connect in 10 seconds');
        console.error('Current state:', ws.readyState);
        console.error('='.repeat(60));
        ws.terminate();
        process.exit(1);
    }
}, 10000);
