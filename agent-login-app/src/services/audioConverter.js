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
     * Convert PCM buffer (from ElevenLabs or other sources) to 8kHz samples array
     * @param {Buffer} pcmBuffer - PCM audio buffer (16-bit signed)
     * @param {number} inputSampleRate - Input sample rate (default: 16000)
     * @returns {Promise<Array<number>>} - Array of PCM samples at 8kHz
     */
    async convertPCMToSamplesArray(pcmBuffer, inputSampleRate = 16000) {
        try {
            console.log('[AudioConverter] Converting PCM to 8kHz samples array...', {
                inputSize: pcmBuffer.length,
                inputSampleRate
            });

            // If already 8kHz, just convert to array
            if (inputSampleRate === 8000) {
                const samples = [];
                for (let i = 0; i < pcmBuffer.length; i += 2) {
                    samples.push(pcmBuffer.readInt16LE(i));
                }
                
                console.log('[AudioConverter] ✅ PCM already 8kHz, converted to array', {
                    totalSamples: samples.length
                });
                
                return samples;
            }

            // Otherwise, resample to 8kHz using ffmpeg
            return new Promise((resolve, reject) => {
                const chunks = [];
                const readableStream = new Readable();
                readableStream.push(pcmBuffer);
                readableStream.push(null);

                ffmpeg(readableStream)
                    .inputFormat('s16le')
                    .inputOptions([
                        `-ar ${inputSampleRate}`,
                        '-ac 1'
                    ])
                    .audioFrequency(8000)
                    .audioChannels(1)
                    .audioCodec('pcm_s16le')
                    .format('s16le')
                    .on('error', (err) => {
                        console.error('[AudioConverter] PCM resampling error:', err.message);
                        reject(new Error(`FFmpeg resampling failed: ${err.message}`));
                    })
                    .on('end', () => {
                        const resampled = Buffer.concat(chunks);
                        
                        // Convert to samples array
                        const samples = [];
                        for (let i = 0; i < resampled.length; i += 2) {
                            samples.push(resampled.readInt16LE(i));
                        }
                        
                        console.log('[AudioConverter] ✅ PCM resampled to 8kHz', {
                            totalSamples: samples.length,
                            durationSeconds: (samples.length / 8000).toFixed(2)
                        });
                        
                        resolve(samples);
                    })
                    .pipe()
                    .on('data', (chunk) => {
                        chunks.push(chunk);
                    });
            });
        } catch (error) {
            console.error('[AudioConverter] PCM conversion failed:', error);
            throw error;
        }
    }

    /**
     * Convert MP3/PCM buffer to array of PCM samples (16-bit signed integers)
     * @param {Buffer} audioBuffer - MP3 or PCM audio buffer
     * @param {string} format - Audio format: 'mp3' or 'pcm'
     * @param {number} sampleRate - Sample rate for PCM input (default: 16000)
     * @returns {Promise<Array<number>>} - Array of PCM samples at 8kHz
     */
    async convertToSamplesArray(audioBuffer, format = 'mp3', sampleRate = 16000) {
        try {
            if (format === 'pcm') {
                // ElevenLabs PCM format - convert directly
                return await this.convertPCMToSamplesArray(audioBuffer, sampleRate);
            } else {
                // MP3 format (OpenAI) - convert via ffmpeg
                const pcmBuffer = await this.convertToPCM(audioBuffer);
                
                // Convert buffer to array of 16-bit samples
                const samples = [];
                for (let i = 0; i < pcmBuffer.length; i += 2) {
                    samples.push(pcmBuffer.readInt16LE(i));
                }

                console.log('[AudioConverter] ✅ Converted MP3 to samples array', {
                    totalSamples: samples.length,
                    durationSeconds: (samples.length / 8000).toFixed(2)
                });

                return samples;
            }
        } catch (error) {
            console.error('[AudioConverter] Conversion to samples failed:', error);
            throw error;
        }
    }    /**
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
