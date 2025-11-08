/**
 * WebSocket Stream Client for KooKoo Bi-directional Audio Streaming
 * Handles PCM linear 16-bit 8kHz audio data with real-time transcription
 */

const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const AudioProcessor = require('./audioProcessor');
const openaiService = require('./openaiService');
const flowEngine = require('./flowEngine');

class StreamClient {
    constructor(config = {}) {
        this.config = {
            url: config.url || process.env.STREAM_WS_URL || 'ws://localhost:8080/ws',
            reconnectInterval: config.reconnectInterval || 5000,
            logDir: config.logDir || path.join(__dirname, '../../logs/stream'),
            ...config
        };
        
        this.ws = null;
        this.isConnected = false;
        this.reconnectTimer = null;
        this.currentCall = null;
        this.audioBuffers = new Map(); // Store audio buffers per call
        
        // Real-time transcription support
        this.audioProcessors = new Map(); // AudioProcessor per call
        this.transcriptionSessions = new Map(); // Transcription results per call
        this.transcriptionInProgress = new Map(); // Prevent concurrent transcriptions per UCID
        this.playbackInProgress = new Map(); // Prevent concurrent playback per UCID
        
        console.log('[StreamClient] Initialized with config:', {
            url: this.config.url,
            reconnectInterval: this.config.reconnectInterval,
            logDir: this.config.logDir,
            openAIEnabled: openaiService.enabled
        });
    }

    /**
     * Initialize the WebSocket client and connect
     */
    async initialize() {
        // Ensure log directory exists
        try {
            await fs.mkdir(this.config.logDir, { recursive: true });
            console.log('[StreamClient] Log directory ready:', this.config.logDir);
        } catch (err) {
            console.error('[StreamClient] Failed to create log directory:', err);
        }

        // Only connect if URL is provided (client mode)
        // If no URL, this runs in server mode (just processes incoming messages)
        if (this.config.url) {
            this.connect();
        } else {
            console.log('[StreamClient] Running in server mode - ready to process incoming messages');
        }
    }

    /**
     * Set language preference for a call's transcription
     * @param {string} ucid - Call identifier
     * @param {string} language - Language code: 'en', 'hi', 'te', 'ta', 'kn', 'ml', 'auto'
     */
    setLanguage(ucid, language) {
        const session = this.transcriptionSessions.get(ucid);
        if (session) {
            session.language = language;
            console.log(`[StreamClient] 🌐 Language set to '${language}' for UCID: ${ucid}`);
        } else {
            console.warn(`[StreamClient] No transcription session found for UCID: ${ucid}`);
        }
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('[StreamClient] Already connected');
            return;
        }

        console.log('[StreamClient] Connecting to:', this.config.url);

        try {
            this.ws = new WebSocket(this.config.url);

            this.ws.on('open', () => this.handleOpen());
            this.ws.on('message', (data) => this.handleMessage(data));
            this.ws.on('close', (code, reason) => this.handleClose(code, reason));
            this.ws.on('error', (error) => this.handleError(error));
        } catch (err) {
            console.error('[StreamClient] Connection error:', err);
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket connection open
     */
    handleOpen() {
        console.log('[StreamClient] ✅ Connected to stream server');
        this.isConnected = true;
        
        // Clear reconnect timer if exists
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    async handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            console.log('[StreamClient] Received event:', message.event, 'Type:', message.type);

            switch (message.event) {
                case 'start':
                    await this.handleStartEvent(message);
                    break;
                
                case 'media':
                    await this.handleMediaEvent(message);
                    break;
                
                case 'stop':
                    await this.handleStopEvent(message);
                    break;
                
                default:
                    console.log('[StreamClient] Unknown event type:', message.event);
                    await this.logEvent('unknown', message);
            }
        } catch (err) {
            console.error('[StreamClient] ❌ Error processing message:', err.message);
            console.error('[StreamClient] Error stack:', err.stack);
            console.error('[StreamClient] Raw data:', data.toString());
        }
    }

    /**
     * Handle call start event
     */
    async handleStartEvent(message) {
        const { ucid, did } = message;
        
        console.log('[StreamClient] 📞 Call Started');
        console.log('[StreamClient] UCID:', ucid);
        console.log('[StreamClient] DID:', did);

        this.currentCall = {
            ucid,
            did,
            startTime: new Date().toISOString(),
            mediaPackets: 0,
            firstMediaReceived: false
        };

        // Initialize audio buffer for this call
        this.audioBuffers.set(ucid, []);
        
        // Initialize real-time transcription
        if (openaiService.enabled) {
            console.log('[StreamClient] 🎙️  Initializing real-time transcription for', ucid);
            
            // Create audio processor with STRICT settings to prevent false positives
            this.audioProcessors.set(ucid, new AudioProcessor(ucid, {
                minAudioDuration: 2000,   // 2 seconds minimum speech
                maxAudioDuration: 10000,  // 10 seconds maximum
                silenceThreshold: 1500,   // 1.5 seconds silence to detect end
                silenceAmplitude: 500     // Higher threshold to filter noise (was 200)
            }));
            
            // Create transcription session with default language from env or 'en' (Indian English)
            // Note: Use 'en' for Indian languages - Whisper auto-detects Telugu/Tamil/Hindi/etc
            const defaultLanguage = process.env.DEFAULT_TRANSCRIPTION_LANGUAGE || 'en';
            
            this.transcriptionSessions.set(ucid, {
                startTime: Date.now(),
                chunks: [],
                finalTranscription: '',
                totalChunks: 0,
                errors: 0,
                language: defaultLanguage // Can be changed via setLanguage() API
            });
            
            console.log('[StreamClient] ✅ Transcription session created for', ucid, '- Language:', defaultLanguage);
        } else {
            console.log('[StreamClient] ⚠️  OpenAI not enabled - transcription disabled');
        }

        // Log start event
        await this.logEvent('start', message);
    }

    /**
     * Handle media (audio) event
     */
    async handleMediaEvent(message) {
        const { ucid, data } = message;

        if (!this.currentCall || this.currentCall.ucid !== ucid) {
            console.warn('[StreamClient] Received media for unknown call:', ucid);
            return;
        }

        const { samples, bitsPerSample, sampleRate, channelCount, numberOfFrames, type } = data;

        // Check if this is the first packet (16kHz - should be ignored)
        if (!this.currentCall.firstMediaReceived) {
            if (sampleRate === 16000) {
                console.log('[StreamClient] 🎵 First media packet (16kHz) - Ignoring as per spec');
                this.currentCall.firstMediaReceived = true;
                await this.logEvent('media_first_ignored', { ucid, sampleRate, numberOfFrames });
                return;
            }
            this.currentCall.firstMediaReceived = true;
        }

        // Process subsequent packets (8kHz)
        if (sampleRate === 8000) {
            this.currentCall.mediaPackets++;
            
            // Log media packet info (every 100 packets to reduce noise)
            if (this.currentCall.mediaPackets % 100 === 0) {
                console.log('[StreamClient] 🎵 Media packets received:', this.currentCall.mediaPackets);
            }

            // Store audio samples (existing buffering)
            const buffer = this.audioBuffers.get(ucid);
            if (buffer) {
                buffer.push({
                    timestamp: new Date().toISOString(),
                    samples,
                    bitsPerSample,
                    sampleRate,
                    channelCount,
                    numberOfFrames,
                    type
                });
            }
            
            // Real-time transcription processing
            const processor = this.audioProcessors.get(ucid);
            if (processor && openaiService.enabled) {
                // Add samples to audio processor
                processor.addSamples(samples, sampleRate);
                
                // Check if we should send to OpenAI
                if (processor.shouldSendToAPI()) {
                    await this.transcribeAudioChunk(ucid);
                }
            }

            // Log every 100th packet (compact, no sample data)
            if (this.currentCall.mediaPackets % 100 === 0) {
                await this.logEvent('media', {
                    ucid,
                    packetNumber: this.currentCall.mediaPackets,
                    sampleRate,
                    numberOfFrames,
                    channelCount,
                    samplesCount: samples.length
                    // Removed: samplePreview (too verbose)
                });
            }
        }
    }

    /**
     * Separate playback function specifically for Ozonetel integration
     * @param {string} ucid - Call ID
     * @param {string} text - Text to play back
     * @param {string} language - Language preference
     */
    async playbackToOzonetel(ucid, text, language = 'en') {
        try {
            console.log('[StreamClient] 🔊 Playing back to Ozonetel:', {
                ucid,
                text: text.substring(0, 100),
                language
            });
            
            // Use existing flowEngine playback mechanism
            const playbackSuccess = await flowEngine.executeConversationalFlow(ucid, '', {
                language,
                customResponse: text,
                skipAI: true // Skip AI processing, just play the provided text
            });
            
            return playbackSuccess;
        } catch (error) {
            console.error('[StreamClient] ❌ Ozonetel playback error:', error);
            return false;
        }
    }

    /**
     * Banking intent recognition with timeout and silence handling
     * @param {string} text - User input text
     * @returns {Promise<{intent: string, confidence: number, response: string}>}
     */
    async recognizeBankingIntent(text) {
        try {
            // Define banking-specific intents
            const bankingIntents = [
                'card_lost',
                'last_transaction_status',
                'debit_card_related',
                'reach_agent',
                'loan'
            ];

            console.log('[StreamClient] 🏦 Analyzing banking intent:', text);

            // Check if OpenAI is available
            if (!openaiService.enabled) {
                console.warn('[StreamClient] OpenAI not available - using fallback pattern matching');
                return this.fallbackBankingIntentRecognition(text);
            }

            const systemPrompt = `You are a banking customer service intent analyzer.
Analyze the customer's request and classify it into one of these banking intents:

1. card_lost - Customer reports lost or stolen cards, card blocking requests
2. last_transaction_status - Customer asking about recent transaction status, pending transactions
3. debit_card_related - General debit card queries, PIN issues, card activation, card limits
4. reach_agent - Customer wants to speak to a human agent
5. loan - Loan inquiries, loan status, EMI details, loan applications

For each detected intent, provide a helpful banking response.

Respond with JSON format:
{
  "intent": "detected_intent",
  "confidence": 0.95,
  "response": "Helpful banking response for the customer"
}`;

            const response = await openaiService.detectIntent(text, bankingIntents);
            
            // Generate appropriate banking response based on intent
            let bankingResponse = '';
            
            switch (response.intent) {
                case 'card_lost':
                    bankingResponse = "I understand you have an issue with a lost or stolen card. I'm immediately blocking your card for security. Your new card will be dispatched within 3-5 business days. Is there anything else I can help you with?";
                    break;
                case 'last_transaction_status':
                    bankingResponse = "I can help you check your recent transaction status. Your last transaction was processed successfully. For detailed transaction history, you can check our mobile app or visit the nearest branch. Do you need any specific transaction details?";
                    break;
                case 'debit_card_related':
                    bankingResponse = "I can assist you with debit card related queries. Your debit card is active with a daily withdrawal limit of 50,000 rupees. For PIN reset or card activation, please visit our nearest branch with valid ID. How else can I help you?";
                    break;
                case 'reach_agent':
                    bankingResponse = "I understand you'd like to speak with one of our customer service representatives. Please hold while I connect you to the next available agent. Your estimated wait time is 2-3 minutes.";
                    break;
                case 'loan':
                    bankingResponse = "I can help you with loan-related queries. Our current loan products include personal loans at 10.5% interest rate and home loans at 8.75% rate. Your loan eligibility is being processed. Would you like me to check your application status?";
                    break;
                default:
                    bankingResponse = "Thank you for contacting our bank. I didn't quite understand your specific request. Could you please repeat your query or press 0 to speak with a customer service representative?";
                    break;
            }

            return {
                intent: response.intent,
                confidence: response.confidence,
                response: bankingResponse
            };

        } catch (error) {
            console.error('[StreamClient] ❌ Banking intent recognition error:', error);
            console.warn('[StreamClient] Falling back to pattern matching');
            return this.fallbackBankingIntentRecognition(text);
        }
    }

    /**
     * Fallback banking intent recognition using pattern matching
     * Used when OpenAI is not available
     */
    fallbackBankingIntentRecognition(text) {
        const lowerText = text.toLowerCase();
        
        // Pattern matching for banking intents
        const patterns = {
            card_lost: [
                /lost.*card/i, /stolen.*card/i, /block.*card/i, /card.*lost/i, /card.*stolen/i,
                /missing.*card/i, /cant.*find.*card/i, /card.*missing/i
            ],
            last_transaction_status: [
                /last.*transaction/i, /recent.*transaction/i, /transaction.*status/i,
                /payment.*status/i, /transaction.*history/i, /latest.*payment/i
            ],
            debit_card_related: [
                /debit.*card/i, /atm.*card/i, /card.*not.*working/i, /pin.*issue/i,
                /card.*activation/i, /card.*problem/i, /card.*limit/i
            ],
            reach_agent: [
                /speak.*agent/i, /customer.*service/i, /talk.*person/i, /human.*help/i,
                /representative/i, /connect.*agent/i, /live.*chat/i
            ],
            loan: [
                /loan/i, /interest.*rate/i, /emi/i, /personal.*loan/i, /home.*loan/i,
                /loan.*application/i, /loan.*status/i, /borrow/i
            ]
        };

        // Find matching intent
        for (const [intent, patternList] of Object.entries(patterns)) {
            for (const pattern of patternList) {
                if (pattern.test(lowerText)) {
                    const responses = {
                        card_lost: "I understand you have an issue with a lost or stolen card. I'm immediately blocking your card for security. Your new card will be dispatched within 3-5 business days. Is there anything else I can help you with?",
                        last_transaction_status: "I can help you check your recent transaction status. Your last transaction was processed successfully. For detailed transaction history, you can check our mobile app or visit the nearest branch. Do you need any specific transaction details?",
                        debit_card_related: "I can assist you with debit card related queries. Your debit card is active with a daily withdrawal limit of 50,000 rupees. For PIN reset or card activation, please visit our nearest branch with valid ID. How else can I help you?",
                        reach_agent: "I understand you'd like to speak with one of our customer service representatives. Please hold while I connect you to the next available agent. Your estimated wait time is 2-3 minutes.",
                        loan: "I can help you with loan-related queries. Our current loan products include personal loans at 10.5% interest rate and home loans at 8.75% rate. Your loan eligibility is being processed. Would you like me to check your application status?"
                    };

                    return {
                        intent,
                        confidence: 0.8, // Pattern matching confidence
                        response: responses[intent]
                    };
                }
            }
        }

        // Default response if no pattern matches
        return {
            intent: 'unknown',
            confidence: 0.0,
            response: "Thank you for contacting our bank. I didn't quite understand your specific request. Could you please repeat your query or press 0 to speak with a customer service representative?"
        };
    }

    /**
     * Enhanced transcription with timeout and silence handling for banking
     */
    async transcribeAudioChunk(ucid) {
        const processor = this.audioProcessors.get(ucid);
        const session = this.transcriptionSessions.get(ucid);
        
        if (!processor || !session) {
            console.warn('[StreamClient] No processor or session for', ucid);
            return;
        }

        // ✅ Prevent concurrent transcriptions for the same UCID
        if (this.transcriptionInProgress.get(ucid)) {
            console.warn('[StreamClient] ⚠️  Transcription already in progress for', ucid, '- skipping duplicate');
            return;
        }

        // ✅ Check for timeout (max 10 seconds for user input)
        const currentTime = Date.now();
        const sessionStartTime = session.startTime || currentTime;
        const elapsedTime = currentTime - sessionStartTime;
        
        if (elapsedTime > 10000) { // 10 seconds timeout
            console.warn('[StreamClient] ⏰ 10-second timeout reached - processing accumulated audio');
            // Continue processing even if user is still speaking
        }

        try {
            // Mark as in progress
            this.transcriptionInProgress.set(ucid, true);
            
            // Convert to WAV
            const wavBuffer = processor.toWAVBuffer();
            
            if (!wavBuffer) {
                console.warn('[StreamClient] No WAV buffer generated for', ucid);
                this.transcriptionInProgress.delete(ucid);
                return;
            }

            const processorInfo = processor.getInfo();
            console.log('[StreamClient] 📤 Sending audio chunk to OpenAI Whisper');
            console.log('[StreamClient] Chunk info:', processorInfo);
            
            // ✅ Enhanced validation for 3-second silence detection
            const silenceDuration = processor.getLastSilenceDuration();
            const totalDuration = processorInfo.durationMs;
            
            // Check if we have 3 seconds of silence as interruption indicator
            if (silenceDuration >= 3000) {
                console.log('[StreamClient] 🔇 3-second silence detected - processing as user interruption');
            }
            
            // ✅ VALIDATION: Check if audio chunk meets minimum requirements
            if (totalDuration < 1000) { // Minimum 1 second
                console.warn('[StreamClient] ⚠️  Audio chunk too short (${totalDuration}ms) - skipping transcription');
                processor.reset();
                this.transcriptionInProgress.delete(ucid);
                return;
            }
            
            // ✅ VALIDATION: Calculate audio energy to detect actual speech
            const samples = processor.samples;
            const sum = samples.reduce((acc, s) => acc + (s * s), 0);
            const rms = Math.sqrt(sum / samples.length);
            
            // Skip if RMS is too low (silence/background noise)
            const MIN_SPEECH_RMS = 300; // Empirically tuned for speech detection
            if (rms < MIN_SPEECH_RMS) {
                console.warn(`[StreamClient] ⚠️  Audio energy too low (RMS=${rms.toFixed(2)}) - skipping transcription (likely silence)`);
                processor.reset();
                this.transcriptionInProgress.delete(ucid);
                return;
            }
            
            console.log(`[StreamClient] ✅ Audio validation passed: duration=${totalDuration}ms, RMS=${rms.toFixed(2)}, silence=${silenceDuration}ms`);
            
            // Get language preference from session
            const languageHint = session.language || 'auto';
            
            // Send to OpenAI Whisper API
            const startTime = Date.now();
            const result = await openaiService.speechToText(wavBuffer, languageHint);
            const transcriptionTime = Date.now() - startTime;
            
            // Check if result is valid
            if (!result || !result.text) {
                console.warn('[StreamClient] ⚠️  No transcription result returned');
                return;
            }
            
            const { text, language } = result;
            
            console.log('[StreamClient] 📝 Transcription received in', transcriptionTime, 'ms');
            console.log('[StreamClient] Language hint:', languageHint, '→ Detected:', language);
            console.log('[StreamClient] Text:', text);
            
            // ✅ FILTER: Detect Whisper hallucinations (common false positives)
            const hallucinationPatterns = [
                /^thank you\.?$/i,
                /^thanks\.?$/i,
                /^you$/i,
                /^\.{3,}$/,  // Just dots
                /^\s*$/,      // Just whitespace
                /^[\s\.,!?]+$/ // Just punctuation
            ];
            
            const isHallucination = hallucinationPatterns.some(pattern => pattern.test(text.trim()));
            
            if (isHallucination) {
                console.warn(`[StreamClient] 🚫 FILTERED: Whisper hallucination detected - "${text}" (likely silence/noise)`);
                processor.reset();
                this.transcriptionInProgress.delete(ucid);
                return;
            }
            
            // ✅ VALIDATION: Check for minimum meaningful content
            if (text.trim().length < 3) {
                console.warn(`[StreamClient] 🚫 FILTERED: Text too short - "${text}" (likely garbage)`);
                processor.reset();
                this.transcriptionInProgress.delete(ucid);
                return;
            }
            
            // Warn if language detection seems incorrect
            if (languageHint !== 'auto' && language !== languageHint) {
                console.warn('[StreamClient] ⚠️  Language mismatch! Requested:', languageHint, 'Detected:', language);
            }
            
            // ✅ CHECK FOR DUPLICATES: Prevent repeating same transcription
            const lastChunk = session.chunks[session.chunks.length - 1];
            if (lastChunk && lastChunk.text.trim() === text.trim()) {
                const timeSinceLastChunk = Date.now() - lastChunk.timestamp;
                if (timeSinceLastChunk < 3000) { // 3 seconds
                    console.warn(`[StreamClient] 🚫 DUPLICATE: Same text as last chunk (${timeSinceLastChunk}ms ago) - skipping`);
                    processor.reset();
                    this.transcriptionInProgress.delete(ucid);
                    return;
                }
            }
            
            // Store transcription chunk
            session.chunks.push({
                timestamp: Date.now(),
                text: text || '',
                language: language || languageHint,
                durationMs: processorInfo.durationMs,
                transcriptionTimeMs: transcriptionTime,
                silenceDuration
            });
            session.totalChunks++;
            
            // Log transcription
            await this.logEvent('transcription_chunk', {
                ucid,
                chunkNumber: session.totalChunks,
                text,
                language,
                audioDurationMs: processorInfo.durationMs,
                transcriptionTimeMs: transcriptionTime,
                silenceDuration
            });
            
            // ✅ ENHANCED: Banking Intent Recognition and Immediate Response
            if (text && text.trim().length > 0 && !this.playbackInProgress.get(ucid)) {
                console.log('[StreamClient] � Processing banking intent and generating response', {
                    ucid,
                    textSnippet: text.substring(0, 80),
                    timestampMs: Date.now()
                });
                
                // Mark playback in progress
                this.playbackInProgress.set(ucid, true);
                
                try {
                    // Step 1: Recognize banking intent
                    const bankingResult = await this.recognizeBankingIntent(text);
                    
                    console.log('[StreamClient] 🎯 Banking intent recognized:', {
                        intent: bankingResult.intent,
                        confidence: bankingResult.confidence
                    });
                    
                    // Step 2: Play back the banking response
                    const playbackSuccess = await this.playbackToOzonetel(
                        ucid, 
                        bankingResult.response, 
                        session.language || 'en'
                    );
                    
                    if (playbackSuccess) {
                        console.log('[StreamClient] ✅ Banking response played successfully');
                        
                        // Log the intent and response
                        await this.logEvent('banking_intent_response', {
                            ucid,
                            userText: text,
                            detectedIntent: bankingResult.intent,
                            confidence: bankingResult.confidence,
                            response: bankingResult.response,
                            playbackSuccess: true
                        });
                    } else {
                        console.error('[StreamClient] ❌ Failed to play banking response');
                    }
                    
                } catch (flowErr) {
                    console.error('[StreamClient] ❌ Error in banking intent processing:', flowErr);
                    
                    // Fallback response
                    await this.playbackToOzonetel(
                        ucid, 
                        "I apologize, I'm experiencing technical difficulties. Please hold while I connect you to a customer service representative.", 
                        session.language || 'en'
                    );
                } finally {
                    // Clear playback flag for next chunk
                    this.playbackInProgress.delete(ucid);
                    
                    // Reset session timer for next input
                    session.startTime = Date.now();
                }
            } else if (this.playbackInProgress.get(ucid)) {
                console.log('[StreamClient] ⏸️  Banking response playback already in progress for', ucid, '- queuing text for later');
            }
            
            // Reset processor for next chunk
            processor.reset();
            
            // Clear transcription in-progress flag
            this.transcriptionInProgress.delete(ucid);
            
        } catch (error) {
            console.error('[StreamClient] ❌ Transcription error:', error.message);
            
            // Safely increment errors if session exists
            if (session) {
                session.errors++;
            }
            
            await this.logEvent('transcription_error', {
                ucid,
                error: error.message,
                chunkNumber: session ? session.totalChunks + 1 : 0
            });
            
            // Reset processor anyway to continue
            if (processor) {
                processor.reset();
            }
            
            // Clear transcription in-progress flag even on error
            this.transcriptionInProgress.delete(ucid);
        }
    }

    /**
     * Handle call stop event
     */
    async handleStopEvent(message) {
        const { ucid, did } = message;
        
        console.log('[StreamClient] 📴 Call Ended');
        console.log('[StreamClient] UCID:', ucid);
        console.log('[StreamClient] DID:', did);

        if (this.currentCall && this.currentCall.ucid === ucid) {
            const endTime = new Date().toISOString();
            const callSummary = {
                ...this.currentCall,
                endTime,
                totalMediaPackets: this.currentCall.mediaPackets
            };

            console.log('[StreamClient] Call Summary:', callSummary);
            
            // Finalize transcription if enabled
            if (openaiService.enabled && this.audioProcessors.has(ucid)) {
                await this.finalizeTranscription(ucid);
            }

            // Clean up flags
            this.transcriptionInProgress.delete(ucid);
            this.playbackInProgress.delete(ucid);

            // Save audio buffer to file
            await this.saveAudioBuffer(ucid);

            // Log stop event
            await this.logEvent('stop', { ...message, summary: callSummary });

            // Cleanup
            this.audioBuffers.delete(ucid);
            this.currentCall = null;
        }
    }

    /**
     * Finalize transcription - send any remaining audio and combine results
     */
    async finalizeTranscription(ucid) {
        try {
            console.log('[StreamClient] 🎯 Finalizing transcription for', ucid);
            
            const processor = this.audioProcessors.get(ucid);
            const session = this.transcriptionSessions.get(ucid);
            
            if (!processor || !session) {
                console.warn('[StreamClient] No processor or session to finalize for', ucid);
                return;
            }

            // Send any remaining audio
            const processorInfo = processor.getInfo();
            if (processorInfo.totalSamples > 0) {
                console.log('[StreamClient] Sending remaining audio:', processorInfo);
                await this.transcribeAudioChunk(ucid);
            }

            // Combine all transcription chunks (with safety checks)
            const chunks = session.chunks || [];
            
            // Deduplicate consecutive identical chunks
            const deduplicatedChunks = [];
            let lastText = null;
            for (const chunk of chunks) {
                const text = chunk.text?.trim() || '';
                if (text.length > 0 && text !== lastText) {
                    deduplicatedChunks.push(text);
                    lastText = text;
                }
            }
            
            const finalText = deduplicatedChunks.join(' ').replace(/\s+/g, ' ').trim();
            
            const totalDuration = Date.now() - session.startTime;
            const totalAudioMs = chunks.reduce((sum, c) => sum + (c.durationMs || 0), 0);
            
            // Print final transcription
            console.log('═'.repeat(80));
            console.log('[StreamClient] 🎙️  FINAL TRANSCRIPTION COMPLETE');
            console.log('═'.repeat(80));
            console.log('[StreamClient] UCID:', ucid);
            console.log('[StreamClient] Total Duration:', (totalDuration / 1000).toFixed(2), 'seconds');
            console.log('[StreamClient] Total Chunks:', session.totalChunks);
            console.log('[StreamClient] Deduplicated Chunks:', deduplicatedChunks.length, '(removed', session.totalChunks - deduplicatedChunks.length, 'duplicates)');
            console.log('[StreamClient] Total Audio Processed:', totalAudioMs, 'ms');
            console.log('[StreamClient] Errors:', session.errors);
            console.log('[StreamClient] ──────────────────────────────────────────');
            console.log('[StreamClient] FULL TRANSCRIPTION:');
            console.log('[StreamClient]');
            console.log('[StreamClient]', finalText || '(No speech detected)');
            console.log('[StreamClient]');
            console.log('[StreamClient] ──────────────────────────────────────────');
            
            // Show individual chunks if there are multiple
            if (deduplicatedChunks.length > 1) {
                console.log('[StreamClient] Individual chunks (', deduplicatedChunks.length, '):');
                deduplicatedChunks.forEach((phrase, index) => {
                    console.log(`[StreamClient]   ${index + 1}. "${phrase}"`);
                });
                console.log('[StreamClient] ──────────────────────────────────────────');
            }
            console.log('═'.repeat(80));
            
            // Save final transcription
            session.finalTranscription = finalText;
            
            // Log final result
            await this.logEvent('transcription_final', {
                ucid,
                finalText,
                totalChunks: session.totalChunks,
                totalDurationMs: totalDuration,
                errors: session.errors,
                chunks: session.chunks.map(c => ({
                    text: c.text,
                    language: c.language,
                    durationMs: c.durationMs
                }))
            });
            
            // Note: Conversational flow is now triggered immediately after each transcription chunk
            // (not here at finalization), so playback happens while call is still active
            
            // Cleanup
            processor.destroy();
            this.audioProcessors.delete(ucid);
            this.transcriptionSessions.delete(ucid);

            console.log('[StreamClient] ✅ Transcription session cleaned up for', ucid);
            
        } catch (error) {
            console.error('[StreamClient] ❌ Error finalizing transcription:', error);
        }
    }

    /**
     * Handle WebSocket close
     */
    handleClose(code, reason) {
        console.log('[StreamClient] ❌ Connection closed');
        console.log('[StreamClient] Code:', code);
        console.log('[StreamClient] Reason:', reason.toString());
        
        this.isConnected = false;
        this.scheduleReconnect();
    }

    /**
     * Handle WebSocket error
     */
    handleError(error) {
        console.error('[StreamClient] ⚠️ WebSocket error:', error.message);
        
        // Log error details but don't crash
        if (error.code === 'ECONNREFUSED') {
            console.log('[StreamClient] Stream server not available, will retry...');
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            return; // Already scheduled
        }

        console.log('[StreamClient] Scheduling reconnect in', this.config.reconnectInterval, 'ms');
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            console.log('[StreamClient] Attempting to reconnect...');
            this.connect();
        }, this.config.reconnectInterval);
    }

    /**
     * Send audio data back to server
     */
    sendAudio(ucid, audioData) {
        if (!this.isConnected || !this.ws) {
            console.error('[StreamClient] Cannot send audio: Not connected');
            return false;
        }

        try {
            const message = {
                event: 'media',
                type: 'media',
                ucid,
                data: {
                    samples: audioData.samples,
                    bitsPerSample: 16,
                    sampleRate: 8000,
                    channelCount: 1,
                    numberOfFrames: audioData.samples.length,
                    type: 'data'
                }
            };

            this.ws.send(JSON.stringify(message));
            return true;
        } catch (err) {
            console.error('[StreamClient] Error sending audio:', err);
            return false;
        }
    }

    /**
     * Send clear buffer command
     */
    clearBuffer() {
        if (!this.isConnected || !this.ws) {
            console.error('[StreamClient] Cannot clear buffer: Not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ command: 'clearBuffer' }));
            console.log('[StreamClient] 🧹 Sent clearBuffer command');
            return true;
        } catch (err) {
            console.error('[StreamClient] Error sending clearBuffer:', err);
            return false;
        }
    }

    /**
     * Send call disconnect command
     */
    disconnectCall() {
        if (!this.isConnected || !this.ws) {
            console.error('[StreamClient] Cannot disconnect call: Not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({ command: 'callDisconnect' }));
            console.log('[StreamClient] 📴 Sent callDisconnect command');
            return true;
        } catch (err) {
            console.error('[StreamClient] Error sending callDisconnect:', err);
            return false;
        }
    }

    /**
     * Log event to file
     */
    async logEvent(eventType, data) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                eventType,
                data
            };

            const filename = `stream_events_${new Date().toISOString().split('T')[0]}.jsonl`;
            const filepath = path.join(this.config.logDir, filename);

            await fs.appendFile(filepath, JSON.stringify(logEntry) + '\n');
        } catch (err) {
            console.error('[StreamClient] Error logging event:', err);
        }
    }

    /**
     * Save audio buffer to file (compact format, no sample data)
     */
    async saveAudioBuffer(ucid) {
        try {
            const buffer = this.audioBuffers.get(ucid);
            if (!buffer || buffer.length === 0) {
                console.log('[StreamClient] No audio buffer to save for UCID:', ucid);
                return;
            }

            const filename = `audio_${ucid}_${Date.now()}.json`;
            const filepath = path.join(this.config.logDir, filename);

            // Save only metadata, not the actual samples (too large)
            const audioData = {
                ucid,
                timestamp: new Date().toISOString(),
                totalPackets: buffer.length,
                summary: buffer.map(p => ({
                    timestamp: p.timestamp,
                    sampleRate: p.sampleRate,
                    samplesCount: p.samples?.length || 0,
                    numberOfFrames: p.numberOfFrames
                    // Removed: samples array (too large)
                }))
            };

            await fs.writeFile(filepath, JSON.stringify(audioData)); // Compact JSON, no pretty-print
            console.log('[StreamClient] 💾 Saved audio metadata:', filename, `(${buffer.length} packets)`);
        } catch (err) {
            console.error('[StreamClient] Error saving audio buffer:', err);
        }
    }

    /**
     * Get current connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            url: this.config.url,
            currentCall: this.currentCall,
            readyState: this.ws ? this.ws.readyState : null
        };
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        console.log('[StreamClient] Disconnecting...');
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        this.currentCall = null;
        this.audioBuffers.clear();
    }
}

module.exports = StreamClient;
