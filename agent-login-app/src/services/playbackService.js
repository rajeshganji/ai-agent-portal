/**
 * Playback Service
 * Manages audio playback queue and streaming to Ozonetel via WebSocket
 */

const openaiService = require('./openaiService');
const audioConverter = require('./audioConverter');

class PlaybackService {
    constructor() {
        this.playbackQueues = new Map(); // UCID → array of playback items
        this.playbackStates = new Map(); // UCID → { playing, currentIndex, paused }
        this.streamServer = null; // Will be set by server.js
        
        console.log('[PlaybackService] Initialized');
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
            console.log('[PlaybackService] 🎤 Converting text to speech...', {
                ucid,
                text: text.substring(0, 100),
                voice,
                language
            });

            // Step 1: Generate speech with OpenAI TTS
            const mp3Buffer = await openaiService.textToSpeech(text, voice);

            if (!mp3Buffer || mp3Buffer.length === 0) {
                console.error('[PlaybackService] No audio generated from TTS');
                return false;
            }

            // Step 2: Convert MP3 to PCM samples array
            const samples = await audioConverter.convertToSamplesArray(mp3Buffer);

            if (!samples || samples.length === 0) {
                console.error('[PlaybackService] No samples generated from conversion');
                return false;
            }

            // Step 3: Stream to Ozonetel
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

            console.log('[PlaybackService] 🔊 Playing audio to call', {
                ucid,
                totalSamples: samples.length,
                durationSeconds: (samples.length / 8000).toFixed(2)
            });

            // Initialize playback state
            this.playbackStates.set(ucid, {
                playing: true,
                totalSamples: samples.length,
                sentSamples: 0,
                startTime: Date.now()
            });

            // Send audio in chunks (160 samples = 20ms at 8kHz)
            const chunkSize = 160;
            let chunkNumber = 0;

            for (let i = 0; i < samples.length; i += chunkSize) {
                const state = this.playbackStates.get(ucid);
                
                // Check if playback was stopped
                if (!state || !state.playing) {
                    console.log('[PlaybackService] Playback stopped for', ucid);
                    break;
                }

                const chunk = samples.slice(i, i + chunkSize);
                
                // Send chunk via WebSocket
                const sent = await this.streamServer.sendAudioToOzonetel(ucid, chunk);
                
                if (!sent) {
                    console.error('[PlaybackService] Failed to send audio chunk', chunkNumber);
                    this.stopPlayback(ucid);
                    return false;
                }

                chunkNumber++;
                state.sentSamples = i + chunk.length;

                // Log progress every 50 chunks (~1 second)
                if (chunkNumber % 50 === 0) {
                    const progress = ((state.sentSamples / state.totalSamples) * 100).toFixed(1);
                    console.log(`[PlaybackService] Progress: ${progress}% (${chunkNumber} chunks sent)`);
                }

                // Small delay to prevent overwhelming (20ms per chunk)
                await this.delay(20);
            }

            // Playback complete
            const duration = Date.now() - this.playbackStates.get(ucid).startTime;
            console.log('[PlaybackService] ✅ Playback complete', {
                ucid,
                totalChunks: chunkNumber,
                durationMs: duration
            });

            this.playbackStates.delete(ucid);
            return true;

        } catch (error) {
            console.error('[PlaybackService] ❌ Error playing audio:', error.message);
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

                // Small pause between segments
                if (i < textSegments.length - 1) {
                    await this.delay(500);
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
