const Response = require('../lib/kookoo/response');
const openaiService = require('./openaiService');

/**
 * Simple Flow Execution Engine
 * Executes IVR flows and generates KooKoo XML responses
 */
class FlowEngine {
    constructor() {
        this.sessions = new Map(); // Store session state
    }

    /**
     * Get or create session for a call
     */
    getSession(callId) {
        if (!this.sessions.has(callId)) {
            this.sessions.set(callId, {
                callId,
                startTime: Date.now(),
                currentStep: 'start',
                conversationHistory: [],
                context: {}
            });
        }
        return this.sessions.get(callId);
    }

    /**
     * Clear session data
     */
    clearSession(callId) {
        this.sessions.delete(callId);
        console.info('[FlowEngine] Session cleared', { callId });
    }

    /**
     * Execute a simple speech flow
     * Flow: Greet → Listen → Understand Intent → Respond → Hangup
     */
    async executeSimpleSpeechFlow(params) {
        const { callId, event, data } = params;
        const session = this.getSession(callId);
        
        console.info('[FlowEngine] Executing speech flow', { 
            callId, 
            event, 
            currentStep: session.currentStep 
        });

        const response = new Response();

        try {
            switch (session.currentStep) {
                case 'start':
                    return this.handleStart(response, session);
                
                case 'listening':
                    return await this.handleSpeechInput(response, session, data);
                
                case 'responding':
                    return this.handleResponse(response, session);
                
                default:
                    return this.handleError(response, session);
            }
        } catch (error) {
            console.error('[FlowEngine] Flow execution error', { callId, error });
            return this.handleError(response, session, error.message);
        }
    }

    /**
     * Handle call start - greet and ask for input
     */
    handleStart(response, session) {
        console.info('[FlowEngine] Starting call flow', { callId: session.callId });
        
        // Greet the user
        response.addPlayText('Hello! Welcome to AI Agent Portal. How can I help you today?');
        
        // Collect speech input
        response.addCollectDtmf({
            maxDigits: 1,
            timeout: 5000,
            term: '#',
            playText: 'Please speak your request after the beep.',
            record: true,
            recordDuration: 10
        });
        
        session.currentStep = 'listening';
        
        return response.toXML();
    }

    /**
     * Handle speech input - transcribe and detect intent
     */
    async handleSpeechInput(response, session, data) {
        console.info('[FlowEngine] Processing speech input', { 
            callId: session.callId,
            data 
        });

        // Check if we have recorded audio
        if (!data || !data.recordUrl) {
            response.addPlayText('Sorry, I did not receive your input. Please try again.');
            response.addHangup();
            this.clearSession(session.callId);
            return response.toXML();
        }

        try {
            // In real implementation, fetch audio from data.recordUrl
            // For now, we'll simulate with a mock
            console.info('[FlowEngine] Audio recorded at:', data.recordUrl);
            
            // TODO: Download audio from recordUrl
            // const audioBuffer = await downloadAudio(data.recordUrl);
            // const { text } = await openaiService.speechToText(audioBuffer);
            
            // For testing, use DTMF or mock text
            const userText = data.digits || data.data || 'I want to check my account balance';
            
            console.info('[FlowEngine] User input:', userText);
            
            // Detect intent
            const intentResult = await openaiService.detectIntent(userText, [
                'check_balance',
                'make_payment',
                'speak_to_agent',
                'general_inquiry'
            ]);
            
            session.context.lastIntent = intentResult.intent;
            session.context.entities = intentResult.entities;
            
            // Generate conversational response
            const aiResponse = await openaiService.generateResponse(
                userText,
                session.conversationHistory,
                'You are a helpful customer service agent. Provide clear, concise responses suitable for phone conversation.'
            );
            
            session.conversationHistory.push(
                { role: 'user', content: userText },
                { role: 'assistant', content: aiResponse }
            );
            
            // Convert response to speech and play
            response.addPlayText(aiResponse);
            
            // Ask if they need anything else
            response.addPlayText('Is there anything else I can help you with?');
            
            response.addCollectDtmf({
                maxDigits: 1,
                timeout: 5000,
                prompt: 'Press 1 for yes, 2 for no',
                playText: 'Press 1 if you need more help, or 2 to end the call.'
            });
            
            session.currentStep = 'responding';
            
            return response.toXML();
            
        } catch (error) {
            console.error('[FlowEngine] Error processing speech:', error);
            response.addPlayText('Sorry, I encountered an error processing your request. Please try again later.');
            response.addHangup();
            this.clearSession(session.callId);
            return response.toXML();
        }
    }

    /**
     * Handle user response to continuation prompt
     */
    handleResponse(response, session) {
        const digits = session.context.lastDigits;
        
        if (digits === '1') {
            // User wants more help - restart flow
            session.currentStep = 'start';
            session.conversationHistory = [];
            return this.handleStart(response, session);
        } else {
            // User is done
            response.addPlayText('Thank you for calling. Goodbye!');
            response.addHangup();
            this.clearSession(session.callId);
            return response.toXML();
        }
    }

    /**
     * Handle errors
     */
    handleError(response, session, errorMessage = 'An error occurred') {
        console.error('[FlowEngine] Error in flow', { 
            callId: session.callId, 
            error: errorMessage 
        });
        
        response.addPlayText('Sorry, something went wrong. Please try again later.');
        response.addHangup();
        this.clearSession(session.callId);
        return response.toXML();
    }

    /**
     * Simple test flow without speech (using DTMF)
     */
    async executeTestFlow(params) {
        const { callId, event, data } = params;
        const session = this.getSession(callId);
        
        console.info('[FlowEngine] Executing test flow', { callId, event });

        const response = new Response();

        switch (event) {
            case 'NewCall':
                response.addPlayText('Welcome to AI Agent test. Press 1 for account balance, 2 for payment, 3 to speak to an agent.');
                response.addCollectDtmf({
                    maxDigits: 1,
                    timeout: 10000
                });
                break;

            case 'GotDTMF':
                const choice = data?.data || data?.digits;
                session.context.lastDigits = choice;
                
                let responseText = '';
                switch (choice) {
                    case '1':
                        responseText = 'Your account balance is $1,234.56';
                        break;
                    case '2':
                        responseText = 'To make a payment, please visit our website or mobile app';
                        break;
                    case '3':
                        responseText = 'Connecting you to an agent. Please hold.';
                        break;
                    default:
                        responseText = 'Invalid option. Please try again.';
                }
                
                // Use AI to enhance the response
                if (openaiService.enabled) {
                    try {
                        const enhancedResponse = await openaiService.generateResponse(
                            `User selected option ${choice}. Base response: ${responseText}`,
                            [],
                            'You are a professional IVR system. Make the response natural and friendly but concise (max 30 words).'
                        );
                        responseText = enhancedResponse;
                    } catch (error) {
                        console.warn('[FlowEngine] AI enhancement failed, using default response');
                    }
                }
                
                response.addPlayText(responseText);
                response.addPlayText('Thank you for calling. Goodbye!');
                response.addHangup();
                this.clearSession(callId);
                break;

            case 'Hangup':
            case 'Disconnect':
                this.clearSession(callId);
                response.addHangup();
                break;

            default:
                response.addPlayText('Thank you for calling.');
                response.addHangup();
                this.clearSession(callId);
        }

        return response.toXML();
    }
}

// Export singleton
module.exports = new FlowEngine();
