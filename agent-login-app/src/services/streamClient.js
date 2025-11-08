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
     * Transcribe accumulated audio chunk using OpenAI Whisper
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
            
            // ✅ VALIDATION: Check if audio chunk is too short (likely junk/silence)
            if (processorInfo.durationMs < 1500) {
                console.warn('[StreamClient] ⚠️  Audio chunk too short (${processorInfo.durationMs}ms) - skipping transcription to avoid false positives');
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
            
            console.log(`[StreamClient] ✅ Audio validation passed: duration=${processorInfo.durationMs}ms, RMS=${rms.toFixed(2)}`);
            
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
            
            // ✅ VALIDATION: Check for minimum meaningful content (at least 3 characters)
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
                transcriptionTimeMs: transcriptionTime
            });
            session.totalChunks++;
            
            // Log transcription
            await this.logEvent('transcription_chunk', {
                ucid,
                chunkNumber: session.totalChunks,
                text,
                language,
                audioDurationMs: processorInfo.durationMs,
                transcriptionTimeMs: transcriptionTime
            });
            
            // ✅ IMMEDIATELY trigger conversational flow (generate AI response + playback)
            // This happens while call is still active, not at stop event!
            // But only if not already playing back
            if (text && text.trim().length > 0 && !this.playbackInProgress.get(ucid)) {
                console.log('[StreamClient] 🎯 Silence detected → Triggering IMMEDIATE playback', {
                    ucid,
                    textSnippet: text.substring(0, 80),
                    timestampMs: Date.now()
                });
                
                // Mark playback in progress
                this.playbackInProgress.set(ucid, true);
                
                try {
                    const flowStartTs = Date.now();
                    const flowResult = await flowEngine.executeConversationalFlow(ucid, text, { 
                        language: session.language || 'en' 
                    });
                    const flowElapsed = Date.now() - flowStartTs;
                    
                    console.log('[StreamClient] ✅ Conversational flow completed', { 
                        ucid, 
                        success: flowResult, 
                        elapsedMs: flowElapsed 
                    });
                } catch (flowErr) {
                    console.error('[StreamClient] ❌ Error in conversational flow:', flowErr);
                } finally {
                    // Clear playback flag so next chunk can trigger new playback
                    this.playbackInProgress.delete(ucid);
                }
            } else if (this.playbackInProgress.get(ucid)) {
                console.log('[StreamClient] ⏸️  Playback already in progress for', ucid, '- queuing text for later');
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
