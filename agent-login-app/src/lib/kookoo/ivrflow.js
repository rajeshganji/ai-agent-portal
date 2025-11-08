const { Response, CollectDtmf } = require('./index');

class IVRFlow {
    constructor(params = {}) {
        this.sid = params.sid || '';
        this.event = params.event || '';
        this.data = params.data || '';
        this.response = new Response(this.sid);
        this.timestamp = new Date().toISOString();
        
        // 📝 LOG: Constructor with full request details
        console.log(`[IVR] ${this.timestamp} - New IVR Flow initiated`);
        console.log(`[IVR] SID: ${this.sid}`);
        console.log(`[IVR] Event: ${this.event}`);
        console.log(`[IVR] Data: ${JSON.stringify(this.data)}`);
        console.log(`[IVR] Full Params:`, JSON.stringify(params, null, 2));
    }

    /**
     * Process the IVR flow based on the event
     * @returns {Response} KooKoo response object
     */
    processFlow() {
        const flowStartTime = Date.now();
        console.log(`[IVR] ${new Date().toISOString()} - 🚀 Processing flow for event: ${this.event}`);
        
        try {
            switch (this.event) {
                case '':
                case 'NewCall':
                    console.log(`[IVR] ${new Date().toISOString()} - Handling NewCall/Welcome`);
                    this.handleWelcomeMenu();
                    break;
                    
                case 'GotDTMF':
                    console.log(`[IVR] ${new Date().toISOString()} - Handling DTMF input`);
                    this.handleDtmfInput();
                    break;
                    
                case 'Hangup':
                case 'Disconnect':
                    console.log(`[IVR] ${new Date().toISOString()} - Call ended - SID: ${this.sid}`);
                    this.response.addHangup();
                    break;
                    
                default:
                    console.log(`[IVR] ${new Date().toISOString()} - ⚠️  Unhandled event: ${this.event}`);
                    this.handleWelcomeMenu();
            }
            
            // 📝 LOG: Final XML response
            const xmlResponse = this.response.getXML();
            const flowDuration = Date.now() - flowStartTime;
            
            console.log(`[IVR] ${new Date().toISOString()} - ✅ Flow processing completed in ${flowDuration}ms`);
            console.log(`[IVR] ==================== FINAL XML RESPONSE ====================`);
            console.log(`[IVR] SID: ${this.sid}`);
            console.log(`[IVR] Event: ${this.event}`);
            console.log(`[IVR] Timestamp: ${new Date().toISOString()}`);
            console.log(`[IVR] XML Response:`);
            console.log(xmlResponse);
            console.log(`[IVR] ================= END XML RESPONSE (${xmlResponse.length} chars) =================`);
            
            return this.response;
            
        } catch (error) {
            console.error(`[IVR] ${new Date().toISOString()} - ❌ Error in flow processing:`, error);
            console.error(`[IVR] Error stack:`, error.stack);
            this.handleError(error);
            
            // Log error response XML too
            const errorXml = this.response.getXML();
            console.log(`[IVR] ==================== ERROR XML RESPONSE ====================`);
            console.log(errorXml);
            console.log(`[IVR] ================= END ERROR XML RESPONSE =================`);
            
            return this.response;
        }
    }

    /**
     * Handle welcome message and main menu
     */
    handleWelcomeMenu() {
        console.log(`[IVR] ${new Date().toISOString()} - 🏠 Building welcome menu response`);
        
        this.response.addPlayText('Welcome to AI Agent Portal',3);
        console.log(`[IVR] ${new Date().toISOString()} - Added PlayText: "Welcome to AI Agent Portal"`);
    
        // Initialize WebSocket streaming for AI processing
        const wsUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
            ? `wss://${process.env.RAILWAY_PUBLIC_DOMAIN}/ws`
            : process.env.STREAM_WS_URL || 'wss://ai-agent-portal-production.up.railway.app/ws';
            
        console.log(`[IVR] ${new Date().toISOString()} - 📡 WebSocket URL determined: ${wsUrl}`);
        console.log(`[IVR] ${new Date().toISOString()} - Environment check:`);
        console.log(`[IVR] - RAILWAY_PUBLIC_DOMAIN: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'NOT SET'}`);
        console.log(`[IVR] - STREAM_WS_URL: ${process.env.STREAM_WS_URL || 'NOT SET'}`);
        
        this.response.addStream("520228", wsUrl, "true");
        console.log(`[IVR] ${new Date().toISOString()} - ✅ Added Stream: DID=520228, URL=${wsUrl}, Mode=true`);
        
        // Alternative: Show menu for department selection
        // const dtmf = new CollectDtmf(1, '#', 5000);
        // dtmf.addPlayText('For Sales, press 1. For Support, press 2. For Billing, press 3. For all other inquiries, press 0.',3 );
        // this.response.addCollectDtmf(dtmf);
    }

    /**
     * Handle DTMF input and route to appropriate department
     */
    handleDtmfInput() {
        console.log(`[IVR] ${new Date().toISOString()} - 📞 Handling DTMF input: ${this.data}`);
        
        const routingMap = {
          1: {
            department: "Sales",
            number: "1234567890",
          },
          2: {
            department: "Support",
            number: "9491593431",
          },
          3: {
            department: "Billing",
            number: "5555555555",
          },
          0: {
            department: "Customer Service",
            number: "9985392390",
          },
        };

        const selection = routingMap[this.data];
        console.log(`[IVR] ${new Date().toISOString()} - Routing lookup result:`, selection || 'INVALID SELECTION');
        
        if (selection) {
            const message = `You selected ${selection.department}. Please wait while we connect you.`;
            console.log(`[IVR] ${new Date().toISOString()} - ✅ Valid selection: ${selection.department}`);
            console.log(`[IVR] ${new Date().toISOString()} - Adding PlayText: "${message}"`);
            
            this.response.addPlayText(message);
            
            // Use WebSocket streaming instead of direct dial
            const wsUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
                ? `wss://${process.env.RAILWAY_PUBLIC_DOMAIN}/ws`
                : process.env.STREAM_WS_URL || 'wss://ai-agent-portal-production.up.railway.app/ws';
                
            console.log(`[IVR] ${new Date().toISOString()} - 📡 WebSocket URL for routing: ${wsUrl}`);
            console.log(`[IVR] ${new Date().toISOString()} - Adding Stream: DID=${selection.number}, Department=${selection.department}`);
            
            this.response.addStream(selection.number, wsUrl, 'true');
        } else {
            console.log(`[IVR] ${new Date().toISOString()} - ❌ Invalid selection: ${this.data}`);
            console.log(`[IVR] ${new Date().toISOString()} - Adding error message and returning to main menu`);
            
            this.response.addPlayText('Invalid selection. Please try again.');
            this.handleWelcomeMenu();
        }
    }

    /**
     * Handle any errors in the IVR flow
     * @param {Error} error The error that occurred
     */
    handleError(error) {
        console.error(`[IVR] ${new Date().toISOString()} - 💥 ERROR in IVR flow:`);
        console.error(`[IVR] Error message: ${error.message}`);
        console.error(`[IVR] Error stack:`, error.stack);
        console.error(`[IVR] SID: ${this.sid}`);
        console.error(`[IVR] Event: ${this.event}`);
        console.error(`[IVR] Data: ${JSON.stringify(this.data)}`);
        
        const errorMessage = 'Sorry, an error occurred. Please try again later.';
        console.log(`[IVR] ${new Date().toISOString()} - Adding error response: "${errorMessage}"`);
        
        this.response.addPlayText(errorMessage);
        this.response.addHangup();
        
        console.log(`[IVR] ${new Date().toISOString()} - ☎️  Added Hangup after error`);
    }
}

module.exports = IVRFlow;