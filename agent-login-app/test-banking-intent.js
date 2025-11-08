/**
 * Test Banking Intent Recognition System
 * Demonstrates the enhanced streamClient functionality for banking use case
 */

require('dotenv').config();
const StreamClient = require('./src/services/streamClient');

async function testBankingIntents() {
    console.log('🏦 Testing Banking Intent Recognition System');
    console.log('=' .repeat(60));
    
    const streamClient = new StreamClient({
        url: null // Server mode for testing
    });
    
    // Initialize the client
    await streamClient.initialize();
    
    // Test banking queries
    const testQueries = [
        "I lost my debit card and need to block it immediately",
        "Can you tell me the status of my last transaction",
        "My debit card is not working at the ATM",
        "I want to speak to a customer service agent",
        "What are the current loan interest rates",
        "I need help with my account balance",
        "My credit card was stolen yesterday"
    ];
    
    console.log('Testing various banking queries:\n');
    
    for (let i = 0; i < testQueries.length; i++) {
        const query = testQueries[i];
        console.log(`Query ${i + 1}: "${query}"`);
        
        try {
            const result = await streamClient.recognizeBankingIntent(query);
            
            console.log(`├─ Intent: ${result.intent}`);
            console.log(`├─ Confidence: ${result.confidence}`);
            console.log(`└─ Response: ${result.response.substring(0, 100)}...`);
            
        } catch (error) {
            console.log(`├─ Error: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
    
    console.log('🎯 Banking Intent Recognition Test Completed!');
    console.log('\n📋 Summary of Banking Intents:');
    console.log('• card_lost - Lost/stolen cards, blocking requests');
    console.log('• last_transaction_status - Recent transaction queries'); 
    console.log('• debit_card_related - General debit card issues');
    console.log('• reach_agent - Request to speak with human agent');
    console.log('• loan - Loan inquiries and applications');
    
    console.log('\n⏰ Timeout Features:');
    console.log('• Max 10 seconds for user input');
    console.log('• 3 seconds of silence triggers processing');
    console.log('• Separate Ozonetel playback function');
    console.log('• Real-time intent recognition and response');
}

// Run the test
if (require.main === module) {
    testBankingIntents().catch(console.error);
}

module.exports = testBankingIntents;