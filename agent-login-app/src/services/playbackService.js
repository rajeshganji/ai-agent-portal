/**
 * Playback Service
 * Manages audio playback queue and streaming to Ozonetel via WebSocket
 */

const elevenlabsService = require('./elevenlabsService');
const audioConverter = require('./audioConverter');

class PlaybackService {
    constructor() {
        this.playbackQueues = new Map(); // UCID → array of playback items
        this.playbackStates = new Map(); // UCID → { playing, currentIndex, paused }
        this.streamServer = null; // Will be set by server.js
        
        console.log('[PlaybackService] Initialized with ElevenLabs TTS');
    }

    /**
     * Set stream server reference for sending audio
     */
    setStreamServer(server) {
        this.streamServer = server;
        console.log('[PlaybackService] StreamServer reference set');
    }

    /**
     * Play text as audio (TTS + conversion + streaming)
     * @param {string} ucid - Call ID
     * @param {string} text - Text to convert to speech
     * @param {string} voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
     * @param {string} language - Language code for TTS
     * @returns {Promise<boolean>} - Success status
     */
    async playText(ucid, text, voice = 'alloy', language = 'en') {
        try {
            console.log('[PlaybackService] 🎤 Converting text to speech with ElevenLabs...', {
                ucid,
                text: text.substring(0, 100),
                voice,
                language
            });

            // Step 1: Generate speech with ElevenLabs TTS (returns PCM 16kHz)
            const pcmBuffer = await elevenlabsService.textToSpeech(text, voice, language);

            if (!pcmBuffer || pcmBuffer.length === 0) {
                console.error('[PlaybackService] No audio generated from TTS');
                return false;
            }

            // Step 2: Convert PCM 16kHz to 8kHz samples array
            const samples = await audioConverter.convertToSamplesArray(pcmBuffer, 'pcm', 16000);

            if (!samples || samples.length === 0) {
                console.error('[PlaybackService] No samples generated from conversion');
                return false;
            }

            console.log('[PlaybackService] ✅ Audio ready for streaming', {
                totalSamples: samples.length,
                durationSeconds: (samples.length / 8000).toFixed(2),
                packets: Math.ceil(samples.length / 400)
            });

            // Step 3: Stream to Ozonetel (single batch - no chunking loop)
            return await this.playAudio(ucid, samples);

        } catch (error) {
            console.error('[PlaybackService] ❌ Error playing text:', error.message);
            return false;
        }
    }

    /**
     * Play audio samples directly
     * @param {string} ucid - Call ID
     * @param {Array<number>} samples - PCM audio samples
     * @returns {Promise<boolean>} - Success status
     */
    async playAudio(ucid, samples) {
        try {
            if (!this.streamServer) {
                console.error('[PlaybackService] StreamServer not initialized');
                return false;
            }

            console.log('[PlaybackService] 🔊 Streaming audio to call', {
                ucid,
                totalSamples: samples.length,
                durationSeconds: (samples.length / 8000).toFixed(2),
                packets: Math.ceil(samples.length / 400)
            });

            // Initialize playback state
            this.playbackStates.set(ucid, {
                playing: true,
                totalSamples: samples.length,
                sentSamples: 0,
                startTime: Date.now()
            });

            // Send entire audio buffer at once - streamServer handles 400-sample packetization
            // This eliminates jitter and allows smooth continuous streaming
            const sent = await this.streamServer.sendAudioToOzonetel(ucid, samples);
            
            if (!sent) {
                console.error('[PlaybackService] Failed to send audio');
                this.stopPlayback(ucid);
                return false;
            }

            // Playback complete
            const duration = Date.now() - this.playbackStates.get(ucid).startTime;
            console.log('[PlaybackService] ✅ Audio streamed successfully', {
                ucid,
                totalSamples: samples.length,
                packets: Math.ceil(samples.length / 400),
                durationMs: duration
            });

            this.stopPlayback(ucid);
            return true;

        } catch (error) {
            console.error('[PlaybackService] Error playing audio:', error);
            this.stopPlayback(ucid);
            return false;
        }
    }

    /**
     * Queue audio for playback (for future enhancement)
     * @param {string} ucid - Call ID
     * @param {Object} item - Playback item { type: 'text'|'audio', content: string|Buffer }
     */
    queueAudio(ucid, item) {
        if (!this.playbackQueues.has(ucid)) {
            this.playbackQueues.set(ucid, []);
        }

        this.playbackQueues.get(ucid).push(item);
        
        console.log('[PlaybackService] Audio queued', {
            ucid,
            queueLength: this.playbackQueues.get(ucid).length
        });
    }

    /**
     * Stop playback for a call
     * @param {string} ucid - Call ID
     */
    stopPlayback(ucid) {
        const state = this.playbackStates.get(ucid);
        
        if (state) {
            state.playing = false;
            console.log('[PlaybackService] 🛑 Playback stopped for', ucid);
        }

        this.playbackQueues.delete(ucid);
    }

    /**
     * Check if playback is active for a call
     * @param {string} ucid - Call ID
     * @returns {boolean}
     */
    isPlaying(ucid) {
        const state = this.playbackStates.get(ucid);
        return state ? state.playing : false;
    }

    /**
     * Get playback status
     * @param {string} ucid - Call ID
     * @returns {Object|null}
     */
    getStatus(ucid) {
        return this.playbackStates.get(ucid) || null;
    }

    /**
     * Clear all playback state (call ended)
     * @param {string} ucid - Call ID
     */
    clearCall(ucid) {
        this.playbackQueues.delete(ucid);
        this.playbackStates.delete(ucid);
        console.log('[PlaybackService] Cleared state for', ucid);
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Play multiple text segments in sequence
     * @param {string} ucid - Call ID
     * @param {Array<string>} textSegments - Array of text to speak
     * @param {string} voice - Voice to use
     * @returns {Promise<boolean>}
     */
    async playTextSequence(ucid, textSegments, voice = 'alloy') {
        try {
            console.log('[PlaybackService] Playing sequence', {
                ucid,
                segments: textSegments.length
            });

            for (let i = 0; i < textSegments.length; i++) {
                const text = textSegments[i];
                console.log(`[PlaybackService] Segment ${i + 1}/${textSegments.length}:`, text);

                const success = await this.playText(ucid, text, voice);
                
                if (!success) {
                    console.error('[PlaybackService] Sequence failed at segment', i + 1);
                    return false;
                }
            }

            console.log('[PlaybackService] ✅ Sequence complete');
            return true;

        } catch (error) {
            console.error('[PlaybackService] Sequence error:', error);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new PlaybackService();
