#!/usr/bin/env node

/**
 * Test OpenAI Service Integration
 * Tests speech-to-text, intent detection, and text-to-speech
 */

require('dotenv').config();
const openaiService = require('./src/services/openaiService');
const fs = require('fs');
const path = require('path');

async function testOpenAI() {
    console.log('='.repeat(60));
    console.log('🧪 Testing OpenAI Service Integration');
    console.log('='.repeat(60));
    console.log();

    if (!openaiService.enabled) {
        console.error('❌ OpenAI service not enabled!');
        console.error('Please set OPENAI_API_KEY environment variable.');
        console.error();
        console.error('Add to Railway:');
        console.error('OPENAI_API_KEY=sk-...');
        console.error();
        console.error('Or create .env file locally with:');
        console.error('OPENAI_API_KEY=sk-...');
        process.exit(1);
    }

    console.log('✅ OpenAI service is enabled');
    console.log();

    // Test 1: Intent Detection
    console.log('📋 Test 1: Intent Detection');
    console.log('-'.repeat(60));
    
    const testPhrases = [
        'I want to check my account balance',
        'How do I make a payment?',
        'I need to speak with a customer service agent',
        'What are your business hours?'
    ];

    for (const phrase of testPhrases) {
        try {
            console.log(`\n  User says: "${phrase}"`);
            
            const intentResult = await openaiService.detectIntent(phrase, [
                'check_balance',
                'make_payment',
                'speak_to_agent',
                'general_inquiry',
                'business_hours'
            ]);
            
            console.log(`  ✅ Intent: ${intentResult.intent}`);
            console.log(`     Confidence: ${(intentResult.confidence * 100).toFixed(1)}%`);
            if (Object.keys(intentResult.entities).length > 0) {
                console.log(`     Entities:`, intentResult.entities);
            }
        } catch (error) {
            console.error(`  ❌ Error:`, error.message);
        }
    }

    console.log();
    console.log();

    // Test 2: Conversational Response
    console.log('💬 Test 2: Conversational Response Generation');
    console.log('-'.repeat(60));
    
    try {
        const userMessage = 'I want to check my account balance';
        console.log(`\n  User: "${userMessage}"`);
        
        const response = await openaiService.generateResponse(
            userMessage,
            [],
            'You are a helpful customer service agent for a bank. Provide clear, concise responses.'
        );
        
        console.log(`  🤖 AI: "${response}"`);
    } catch (error) {
        console.error(`  ❌ Error:`, error.message);
    }

    console.log();
    console.log();

    // Test 3: Text-to-Speech
    console.log('🔊 Test 3: Text-to-Speech');
    console.log('-'.repeat(60));
    
    try {
        const text = 'Hello! Welcome to AI Agent Portal. How can I help you today?';
        console.log(`\n  Converting to speech: "${text}"`);
        
        const audioBuffer = await openaiService.textToSpeech(text, 'alloy');
        
        // Save to file for testing
        const outputPath = path.join(__dirname, 'test-tts-output.mp3');
        fs.writeFileSync(outputPath, audioBuffer);
        
        console.log(`  ✅ Audio generated: ${audioBuffer.length} bytes`);
        console.log(`  💾 Saved to: ${outputPath}`);
        console.log(`  🎧 Play with: afplay ${outputPath} (macOS) or open ${outputPath}`);
    } catch (error) {
        console.error(`  ❌ Error:`, error.message);
    }

    console.log();
    console.log();

    // Test 4: Multi-turn Conversation
    console.log('🗣️  Test 4: Multi-turn Conversation');
    console.log('-'.repeat(60));
    
    try {
        const conversation = [
            'I want to check my balance',
            'What about my savings account?',
            'Can I transfer money between accounts?'
        ];
        
        const conversationHistory = [];
        
        for (const userMsg of conversation) {
            console.log(`\n  User: "${userMsg}"`);
            
            const aiResponse = await openaiService.generateResponse(
                userMsg,
                conversationHistory,
                'You are a helpful bank customer service agent. Keep responses concise (max 30 words).'
            );
            
            console.log(`  🤖 AI: "${aiResponse}"`);
            
            conversationHistory.push(
                { role: 'user', content: userMsg },
                { role: 'assistant', content: aiResponse }
            );
        }
    } catch (error) {
        console.error(`  ❌ Error:`, error.message);
    }

    console.log();
    console.log('='.repeat(60));
    console.log('✅ OpenAI Integration Tests Complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Test with actual phone call via KooKoo/Ozonetel');
    console.log('2. Add speech recording and playback to IVR flow');
    console.log('3. Enhance designer with speech-specific nodes');
    console.log();
}

// Run tests
testOpenAI().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
