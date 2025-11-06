const { Response, CollectDtmf } = require('./index');

class IVRFlow {
    constructor(params = {}) {
        this.sid = params.sid || '';
        this.event = params.event || '';
        this.data = params.data || '';
        this.response = new Response(this.sid);
    }

    /**
     * Process the IVR flow based on the event
     * @returns {Response} KooKoo response object
     */
    processFlow() {
        try {
            switch (this.event) {
                case '':
                case 'NewCall':
                    this.handleWelcomeMenu();
                    break;
                    
                case 'GotDTMF':
                    this.handleDtmfInput();
                    break;
                    
                case 'Hangup':
                case 'Disconnect':
                    console.log('[IVR] Call ended - SID:', this.sid);
                    this.response.addHangup();
                    break;
                    
                default:
                    console.log('[IVR] Unhandled event:', this.event);
                    this.handleWelcomeMenu();
            }
        } catch (error) {
            console.error('[IVR] Error in flow processing:', error);
            this.handleError(error);
        }

        return this.response;
    }

    /**
     * Handle welcome message and main menu
     */
    handleWelcomeMenu() {
        this.response.addPlayText('Welcome to AI Agent Portal',3);
    
        // Initialize WebSocket streaming for AI processing
        const wsUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
            ? `wss://${process.env.RAILWAY_PUBLIC_DOMAIN}/ws`
            : process.env.STREAM_WS_URL || 'wss://ai-agent-portal-production.up.railway.app/ws';
            
        this.response.addStream("520228", wsUrl, "true");
        
        // Alternative: Show menu for department selection
        // const dtmf = new CollectDtmf(1, '#', 5000);
        // dtmf.addPlayText('For Sales, press 1. For Support, press 2. For Billing, press 3. For all other inquiries, press 0.',3 );
        // this.response.addCollectDtmf(dtmf);
    }

    /**
     * Handle DTMF input and route to appropriate department
     */
    handleDtmfInput() {
        console.log('[IVR] Received DTMF:', this.data);
        
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
        
        if (selection) {
            this.response.addPlayText(`You selected ${selection.department}. Please wait while we connect you.`);
            
            // Use WebSocket streaming instead of direct dial
            const wsUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
                ? `wss://${process.env.RAILWAY_PUBLIC_DOMAIN}/ws`
                : process.env.STREAM_WS_URL || 'ws://ai-agent-portal-production.up.railway.app/ws';
                
            this.response.addStream(selection.number, wsUrl, 'true');
        } else {
            this.response.addPlayText('Invalid selection. Please try again.');
            this.handleWelcomeMenu();
        }
    }

    /**
     * Handle any errors in the IVR flow
     * @param {Error} error The error that occurred
     */
    handleError(error) {
        console.error('[IVR] Error:', error);
        this.response.addPlayText('Sorry, an error occurred. Please try again later.');
        this.response.addHangup();
    }
}

module.exports = IVRFlow;