/**
 * Audio Converter Service
 * Converts OpenAI TTS MP3 output to PCM format compatible with Ozonetel
 */

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { Readable } = require('stream');

ffmpeg.setFfmpegPath(ffmpegPath);

class AudioConverter {
    constructor() {
        console.log('[AudioConverter] Initialized with ffmpeg at:', ffmpegPath);
    }

    /**
     * Convert MP3 buffer to PCM 8kHz mono
     * @param {Buffer} mp3Buffer - MP3 audio buffer from OpenAI TTS
     * @returns {Promise<Buffer>} - PCM audio buffer (16-bit signed, 8kHz, mono)
     */
    async convertToPCM(mp3Buffer) {
        return new Promise((resolve, reject) => {
            try {
                const startTime = Date.now();
                console.log('[AudioConverter] Converting MP3 to PCM...', {
                    inputSize: mp3Buffer.length
                });

                const chunks = [];
                const readableStream = new Readable();
                readableStream.push(mp3Buffer);
                readableStream.push(null);

                ffmpeg(readableStream)
                    .audioFrequency(8000)        // 8kHz sample rate
                    .audioChannels(1)            // Mono
                    .audioCodec('pcm_s16le')     // 16-bit signed little-endian PCM
                    .format('s16le')             // Raw PCM output
                    .on('error', (err) => {
                        console.error('[AudioConverter] Conversion error:', err.message);
                        reject(new Error(`FFmpeg conversion failed: ${err.message}`));
                    })
                    .on('end', () => {
                        const pcmBuffer = Buffer.concat(chunks);
                        const duration = Date.now() - startTime;
                        
                        console.log('[AudioConverter] ✅ Conversion complete', {
                            outputSize: pcmBuffer.length,
                            durationMs: duration,
                            audioLengthSeconds: (pcmBuffer.length / (8000 * 2)).toFixed(2)
                        });
                        
                        resolve(pcmBuffer);
                    })
                    .pipe()
                    .on('data', (chunk) => {
                        chunks.push(chunk);
                    });

            } catch (error) {
                console.error('[AudioConverter] Setup error:', error);
                reject(error);
            }
        });
    }

    /**
     * Convert PCM buffer to μ-law (G.711) encoding
     * @param {Buffer} pcmBuffer - 16-bit PCM buffer
     * @returns {Buffer} - μ-law encoded buffer
     */
    pcmToMulaw(pcmBuffer) {
        console.log('[AudioConverter] Converting PCM to μ-law...', {
            inputSize: pcmBuffer.length
        });

        const mulawBuffer = Buffer.alloc(pcmBuffer.length / 2);
        
        for (let i = 0; i < pcmBuffer.length; i += 2) {
            // Read 16-bit signed sample
            const sample = pcmBuffer.readInt16LE(i);
            
            // Convert to μ-law
            mulawBuffer[i / 2] = this.linearToMulaw(sample);
        }

        console.log('[AudioConverter] ✅ μ-law conversion complete', {
            outputSize: mulawBuffer.length
        });

        return mulawBuffer;
    }

    /**
     * Convert 16-bit linear PCM sample to μ-law
     * @param {number} sample - 16-bit signed PCM sample
     * @returns {number} - μ-law encoded byte
     */
    linearToMulaw(sample) {
        const MULAW_MAX = 0x1FFF;
        const MULAW_BIAS = 33;
        
        let sign = (sample >> 8) & 0x80;
        if (sign !== 0) sample = -sample;
        if (sample > MULAW_MAX) sample = MULAW_MAX;
        
        sample = sample + MULAW_BIAS;
        let exponent = this.getExponent(sample);
        let mantissa = (sample >> (exponent + 3)) & 0x0F;
        let mulawByte = ~(sign | (exponent << 4) | mantissa);
        
        return mulawByte & 0xFF;
    }

    /**
     * Get exponent for μ-law encoding
     * @param {number} value - Input value
     * @returns {number} - Exponent
     */
    getExponent(value) {
        let exp = 0;
        if (value > 0) {
            while (value > 32) {
                value >>= 1;
                exp++;
            }
        }
        return exp;
    }

    /**
     * Split audio buffer into chunks for streaming
     * @param {Buffer} audioBuffer - Audio buffer
     * @param {number} chunkSize - Size of each chunk in bytes (default: 160 bytes = 20ms at 8kHz)
     * @returns {Array<Buffer>} - Array of audio chunks
     */
    chunkAudio(audioBuffer, chunkSize = 160) {
        console.log('[AudioConverter] Chunking audio...', {
            totalSize: audioBuffer.length,
            chunkSize,
            totalChunks: Math.ceil(audioBuffer.length / chunkSize)
        });

        const chunks = [];
        for (let i = 0; i < audioBuffer.length; i += chunkSize) {
            const chunk = audioBuffer.slice(i, i + chunkSize);
            chunks.push(chunk);
        }

        console.log('[AudioConverter] ✅ Chunking complete', {
            chunks: chunks.length
        });

        return chunks;
    }

    /**
     * Convert MP3 to PCM samples array (for Ozonetel format)
     * @param {Buffer} mp3Buffer - MP3 audio buffer
     * @returns {Promise<Array<number>>} - Array of PCM samples
     */
    async convertToSamplesArray(mp3Buffer) {
        try {
            const pcmBuffer = await this.convertToPCM(mp3Buffer);
            
            // Convert buffer to array of 16-bit samples
            const samples = [];
            for (let i = 0; i < pcmBuffer.length; i += 2) {
                samples.push(pcmBuffer.readInt16LE(i));
            }

            console.log('[AudioConverter] ✅ Converted to samples array', {
                totalSamples: samples.length,
                durationSeconds: (samples.length / 8000).toFixed(2)
            });

            return samples;
        } catch (error) {
            console.error('[AudioConverter] Conversion to samples failed:', error);
            throw error;
        }
    }

    /**
     * Get audio duration from PCM buffer
     * @param {Buffer} pcmBuffer - PCM buffer
     * @param {number} sampleRate - Sample rate (default: 8000)
     * @returns {number} - Duration in seconds
     */
    getDuration(pcmBuffer, sampleRate = 8000) {
        // PCM 16-bit = 2 bytes per sample
        const numSamples = pcmBuffer.length / 2;
        return numSamples / sampleRate;
    }
}

// Export singleton instance
module.exports = new AudioConverter();
