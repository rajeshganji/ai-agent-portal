/**
 * Mock WebSocket Stream Server for Testing
 * This simulates the KooKoo/Ozonetel stream server
 */

const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log('🎤 Mock Stream Server started on ws://localhost:' + PORT);

wss.on('connection', (ws) => {
    console.log('✅ Client connected');

    // Send start event after 1 second
    setTimeout(() => {
        const startEvent = {
            event: 'start',
            type: 'text',
            ucid: 'TEST123456789',
            did: '9876543210'
        };
        console.log('📤 Sending start event:', startEvent);
        ws.send(JSON.stringify(startEvent));
    }, 1000);

    // Send first media packet (16kHz - should be ignored)
    setTimeout(() => {
        const firstMedia = {
            event: 'media',
            type: 'media',
            ucid: 'TEST123456789',
            data: {
                samples: Array(160).fill(0).map(() => Math.floor(Math.random() * 20) - 10),
                bitsPerSample: 16,
                sampleRate: 16000,
                channelCount: 1,
                numberOfFrames: 160,
                type: 'data'
            }
        };
        console.log('📤 Sending first media (16kHz)');
        ws.send(JSON.stringify(firstMedia));
    }, 2000);

    // Send multiple 8kHz media packets
    let packetCount = 0;
    const mediaInterval = setInterval(() => {
        packetCount++;
        const media = {
            event: 'media',
            type: 'media',
            ucid: 'TEST123456789',
            data: {
                samples: Array(80).fill(0).map(() => Math.floor(Math.random() * 20) - 10),
                bitsPerSample: 16,
                sampleRate: 8000,
                channelCount: 1,
                numberOfFrames: 80,
                type: 'data'
            }
        };
        
        if (packetCount % 50 === 0) {
            console.log(`📤 Sent ${packetCount} media packets (8kHz)`);
        }
        
        ws.send(JSON.stringify(media));

        // Stop after 200 packets (simulating ~25 seconds of audio)
        if (packetCount >= 200) {
            clearInterval(mediaInterval);
            
            // Send stop event
            setTimeout(() => {
                const stopEvent = {
                    event: 'stop',
                    type: 'text',
                    ucid: 'TEST123456789',
                    did: '9876543210'
                };
                console.log('📤 Sending stop event:', stopEvent);
                ws.send(JSON.stringify(stopEvent));
            }, 1000);
        }
    }, 100); // Send every 100ms

    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📥 Received from client:', data);

            if (data.command === 'clearBuffer') {
                console.log('✅ Received clearBuffer command');
            } else if (data.command === 'callDisconnect') {
                console.log('✅ Received callDisconnect command');
                ws.close();
            } else if (data.event === 'media') {
                console.log('✅ Received audio data from client:', data.data.samples.length, 'samples');
            }
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    });

    ws.on('close', () => {
        console.log('❌ Client disconnected');
        clearInterval(mediaInterval);
    });

    ws.on('error', (error) => {
        console.error('⚠️ WebSocket error:', error);
    });
});

console.log('');
console.log('📋 Test Instructions:');
console.log('1. Start your application with: SESSION_SECRET=test123 node server.js');
console.log('2. Your StreamClient should connect automatically');
console.log('3. Watch logs in both terminals');
console.log('4. Check status: curl http://localhost:3000/api/stream/status');
console.log('5. Check logs: tail -f agent-login-app/logs/stream/stream_events_*.jsonl');
console.log('');
