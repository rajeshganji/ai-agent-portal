#!/usr/bin/env node

/**
 * Test IVR XML Request/Response Logging
 * Simulates Ozonetel PBX calling your IVR endpoint
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const IVR_ENDPOINT = `${BASE_URL}/api/pbx/ivrflow`;

console.log('🧪 Testing IVR XML Request/Response Logging');
console.log('===========================================');
console.log(`Target URL: ${IVR_ENDPOINT}`);
console.log('');

// Test scenarios
const testScenarios = [
    {
        name: 'New Call (Welcome)',
        params: {
            sid: 'TEST_CALL_001',
            event: 'NewCall',
            cid: '9876543210',
            called_number: '520228',
            caller_id: '9876543210'
        }
    },
    {
        name: 'DTMF Input - Sales (1)',
        params: {
            sid: 'TEST_CALL_001',
            event: 'GotDTMF',
            data: '1',
            cid: '9876543210'
        }
    },
    {
        name: 'DTMF Input - Support (2)',
        params: {
            sid: 'TEST_CALL_002',
            event: 'GotDTMF',
            data: '2',
            cid: '9876543210'
        }
    },
    {
        name: 'Invalid DTMF Input (9)',
        params: {
            sid: 'TEST_CALL_003',
            event: 'GotDTMF',
            data: '9',
            cid: '9876543210'
        }
    },
    {
        name: 'Call Hangup',
        params: {
            sid: 'TEST_CALL_001',
            event: 'Hangup',
            cid: '9876543210'
        }
    }
];

async function runTest(scenario) {
    console.log(`\n📞 Testing: ${scenario.name}`);
    console.log(`📝 Parameters:`, JSON.stringify(scenario.params, null, 2));
    
    try {
        const startTime = Date.now();
        
        const response = await axios.get(IVR_ENDPOINT, {
            params: scenario.params,
            headers: {
                'User-Agent': 'Test-IVR-Client/1.0',
                'X-Test-Scenario': scenario.name
            }
        });
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ Response received in ${duration}ms`);
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        console.log(`📏 Content-Length: ${response.data.length} characters`);
        console.log(`📄 Content-Type: ${response.headers['content-type']}`);
        console.log(`📋 XML Response:`);
        console.log('---');
        console.log(response.data);
        console.log('---');
        
        return { success: true, duration, response: response.data };
        
    } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
        
        if (error.response) {
            console.log(`📊 Status: ${error.response.status} ${error.response.statusText}`);
            console.log(`📋 Error Response:`, error.response.data);
        } else if (error.request) {
            console.log(`🌐 Network Error: No response received`);
            console.log(`🔗 Check if server is running at: ${BASE_URL}`);
        } else {
            console.log(`⚙️  Request Setup Error: ${error.message}`);
        }
        
        return { success: false, error: error.message };
    }
}

async function runAllTests() {
    console.log(`🚀 Running ${testScenarios.length} test scenarios...`);
    
    const results = [];
    
    for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        const result = await runTest(scenario);
        results.push({ scenario: scenario.name, ...result });
        
        // Wait between tests
        if (i < testScenarios.length - 1) {
            console.log('⏱️  Waiting 1 second before next test...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}/${testScenarios.length}`);
    console.log(`❌ Failed: ${failed}/${testScenarios.length}`);
    
    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.scenario}: ${r.error}`);
        });
    }
    
    if (successful > 0) {
        console.log('\n⚡ Performance:');
        const successfulResults = results.filter(r => r.success);
        const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successful;
        console.log(`   - Average response time: ${avgDuration.toFixed(2)}ms`);
    }
    
    console.log('\n🔍 Check server logs for detailed XML request/response logging!');
}

// Run tests
runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
});