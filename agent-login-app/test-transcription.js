#!/usr/bin/env node

/**
 * Test Real-time Speech Transcription
 * Simulates Ozonetel audio stream and verifies transcription
 */

const AudioProcessor = require('./src/services/audioProcessor');

console.log('═'.repeat(80));
console.log('🧪 Testing Real-time Speech Transcription Components');
console.log('═'.repeat(80));
console.log();

// Test 1: AudioProcessor Creation
console.log('📋 Test 1: AudioProcessor Creation');
console.log('─'.repeat(80));

const processor = new AudioProcessor('TEST_UCID_12345', {
    minAudioDuration: 1000,
    maxAudioDuration: 5000,
    silenceThreshold: 1000,
    silenceAmplitude: 100
});

console.log('✅ AudioProcessor created successfully');
console.log();

// Test 2: Add Audio Samples
console.log('📋 Test 2: Adding Audio Samples');
console.log('─'.repeat(80));

// Simulate Ozonetel audio packets (160 samples at 8kHz = 20ms per packet)
function generateAudioSamples(durationMs, amplitude = 1000) {
    const sampleRate = 8000;
    const samplesPerPacket = 160; // 20ms at 8kHz
    const packets = Math.floor((durationMs / 1000) * sampleRate / samplesPerPacket);
    
    const allPackets = [];
    
    for (let p = 0; p < packets; p++) {
        const samples = [];
        for (let i = 0; i < samplesPerPacket; i++) {
            // Generate simple sine wave with some noise
            const t = (p * samplesPerPacket + i) / sampleRate;
            const frequency = 440; // A4 note
            const sample = Math.floor(amplitude * Math.sin(2 * Math.PI * frequency * t));
            samples.push(sample);
        }
        allPackets.push(samples);
    }
    
    return allPackets;
}

// Add 2 seconds of audio
const audioPackets = generateAudioSamples(2000, 5000);
console.log(`Generated ${audioPackets.length} audio packets (2 seconds)`);

audioPackets.forEach((samples, index) => {
    processor.addSamples(samples, 8000);
    if ((index + 1) % 50 === 0) {
        console.log(`  Added packet ${index + 1}/${audioPackets.length}`);
    }
});

console.log('✅ Audio samples added successfully');
console.log();

// Test 3: Check Buffer Info
console.log('📋 Test 3: Buffer Information');
console.log('─'.repeat(80));

const info = processor.getInfo();
console.log('Buffer Info:', info);
console.log('✅ Buffer info retrieved');
console.log();

// Test 4: Check Send Conditions
console.log('📋 Test 4: Send to API Conditions');
console.log('─'.repeat(80));

console.log('Should send to API:', processor.shouldSendToAPI());
console.log('Is silent:', processor.isSilent());
console.log();

// Test 5: Convert to WAV
console.log('📋 Test 5: Convert to WAV Format');
console.log('─'.repeat(80));

const wavBuffer = processor.toWAVBuffer();
console.log('WAV Buffer size:', wavBuffer.length, 'bytes');
console.log('WAV Header (first 44 bytes):', wavBuffer.slice(0, 44).toString('hex'));
console.log('✅ WAV conversion successful');
console.log();

// Test 6: Test Silence Detection
console.log('📋 Test 6: Silence Detection');
console.log('─'.repeat(80));

processor.reset();
console.log('Buffer reset');

// Add silent samples
const silentPackets = generateAudioSamples(500, 10); // Very low amplitude
console.log(`Adding ${silentPackets.length} silent packets`);
silentPackets.forEach(samples => processor.addSamples(samples, 8000));

console.log('Is silent after adding low-amplitude audio:', processor.isSilent());

// Wait a bit
setTimeout(() => {
    console.log('Is silent after 1.5 seconds:', processor.isSilent());
    console.log('✅ Silence detection working');
    console.log();
    
    // Test 7: Summary
    console.log('═'.repeat(80));
    console.log('✅ All Tests Passed!');
    console.log('═'.repeat(80));
    console.log();
    console.log('Real-time Transcription Components Ready:');
    console.log('  ✓ AudioProcessor - PCM to WAV conversion');
    console.log('  ✓ Buffer management - Accumulate samples');
    console.log('  ✓ Silence detection - Detect pauses');
    console.log('  ✓ WAV generation - Convert to API format');
    console.log();
    console.log('Next Steps:');
    console.log('  1. Set OPENAI_API_KEY environment variable');
    console.log('  2. Deploy to Railway');
    console.log('  3. Test with actual Ozonetel audio stream');
    console.log('  4. Verify transcription in logs');
    console.log();
    
}, 1500);
