const { Response, CollectDtmf } = require('./lib/kookoo');

// Example usage in an Express route handler
function handleIncomingCall(req, res) {
    // Create a new response
    const response = new Response(req.query.sid);
    
    // Add welcome message
    response.addPlayText('Welcome to our service');
    
    // Create DTMF collector for menu options
    const dtmf = new CollectDtmf(1, '#', 5000);
    dtmf.addPlayText('Press 1 for sales, 2 for support, or 3 to speak with an agent');
    
    // Add the DTMF collector to the response
    response.addCollectDtmf(dtmf);
    
    // Send the XML response
    response.send(res);
}

// Example of making an outbound call
function makeOutboundCall(req, res) {
    const response = new Response();
    
    // Dial a number
    response.addDial('1234567890', {
        record: 'true',
        timeout: '30000',
        caller_id: '9876543210'
    });
    
    response.send(res);
}

// Example of setting up a conference
function setupConference(req, res) {
    const response = new Response();
    
    response.addConference('conf123', {
        record: 'true',
        caller_id: '9876543210'
    });
    
    response.send(res);
}

module.exports = {
    handleIncomingCall,
    makeOutboundCall,
    setupConference
};