const axios = require('axios');

/**
 * ElevenLabs Text-to-Speech Service
 * Converts text to high-quality speech using ElevenLabs API
 */
class ElevenLabsService {
    constructor() {
        this.apiKey = process.env.ELEVENLABS_API_KEY;
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        
        if (!this.apiKey) {
            console.warn('[ElevenLabs] ELEVENLABS_API_KEY not set - TTS features will be disabled');
            this.enabled = false;
            return;
        }
        
        // Default configuration
        this.config = {
            model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5', // Ultra-low latency (75ms)
            output_format: 'pcm_16000', // 16kHz PCM for easy conversion to 8kHz
            voice_settings: {
                stability: parseFloat(process.env.ELEVENLABS_STABILITY || '0.5'),
                similarity_boost: parseFloat(process.env.ELEVENLABS_SIMILARITY || '0.75'),
                style: parseFloat(process.env.ELEVENLABS_STYLE || '0'),
                use_speaker_boost: true
            }
        };
        
        // Voice mappings - map OpenAI-style voice names to ElevenLabs voice IDs
        this.voiceMap = {
            'alloy': process.env.ELEVENLABS_VOICE_ALLOY || 'pNInz6obpgDQGcFmaJgB', // Adam
            'echo': process.env.ELEVENLABS_VOICE_ECHO || 'TxGEqnHWrfWFTfGW9XjX', // Josh
            'fable': process.env.ELEVENLABS_VOICE_FABLE || 'XB0fDUnXU5powFXDhCwa', // Charlotte
            'onyx': process.env.ELEVENLABS_VOICE_ONYX || 'pqHfZKP75CvOlQylNhV4', // Bill
            'nova': process.env.ELEVENLABS_VOICE_NOVA || 'EXAVITQu4vr4xnSDxMaL', // Bella
            'shimmer': process.env.ELEVENLABS_VOICE_SHIMMER || 'ThT5KcBeYPX3keUQqHPh' // Dorothy
        };
        
        this.enabled = true;
        console.log('[ElevenLabs] Service initialized successfully', {
            model: this.config.model_id,
            output_format: this.config.output_format
        });
    }

    /**
     * Convert text to speech using ElevenLabs API
     * @param {string} text - Text to convert to speech
     * @param {string} voice - Voice name (alloy, echo, fable, onyx, nova, shimmer)
     * @param {string} language - Language code (optional, auto-detected)
     * @returns {Promise<Buffer>} - PCM audio buffer
     */
    async textToSpeech(text, voice = 'alloy', language = null) {
        if (!this.enabled) {
            throw new Error('ElevenLabs service not enabled - check ELEVENLABS_API_KEY');
        }

        try {
            const startTime = Date.now();
            
            // Get voice ID from mapping
            const voiceId = this.voiceMap[voice] || this.voiceMap['alloy'];
            
            // Normalize language code to 2-letter ISO 639-1 format
            // ElevenLabs expects: 'en', 'hi', 'te', etc. (not 'english', 'hindi', etc.)
            const normalizedLanguage = this._normalizeLanguageCode(language);
            
            console.log('[ElevenLabs] Converting text to speech...', { 
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                voice,
                voiceId,
                originalLanguage: language,
                normalizedLanguage,
                model: this.config.model_id
            });

            // Prepare request payload
            const payload = {
                text: text,
                model_id: this.config.model_id,
                voice_settings: this.config.voice_settings
            };

            // Add language code if specified and valid
            if (normalizedLanguage) {
                payload.language_code = normalizedLanguage;
            }

            // Make API request
            const response = await axios.post(
                `${this.baseUrl}/text-to-speech/${voiceId}`,
                payload,
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    params: {
                        output_format: this.config.output_format,
                        optimize_streaming_latency: 3 // Max latency optimization
                    },
                    responseType: 'arraybuffer'
                }
            );

            const audioBuffer = Buffer.from(response.data);
            const duration = Date.now() - startTime;
            
            console.log('[ElevenLabs] Text-to-speech completed', { 
                textLength: text.length,
                audioSize: audioBuffer.length,
                duration: `${duration}ms`,
                format: this.config.output_format
            });
            
            return audioBuffer;

        } catch (error) {
            console.error('[ElevenLabs] Text-to-speech error:', error.message);
            
            if (error.response) {
                console.error('[ElevenLabs] Error status:', error.response.status);
                console.error('[ElevenLabs] Error data:', error.response.data?.toString() || error.response.data);
            }
            
            throw error;
        }
    }

    /**
     * Get available voices from ElevenLabs
     * @returns {Promise<Array>} - List of available voices
     */
    async getVoices() {
        if (!this.enabled) {
            throw new Error('ElevenLabs service not enabled - check ELEVENLABS_API_KEY');
        }

        try {
            const response = await axios.get(`${this.baseUrl}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey
                }
            });

            console.log('[ElevenLabs] Retrieved voices:', response.data.voices.length);
            return response.data.voices;

        } catch (error) {
            console.error('[ElevenLabs] Error fetching voices:', error.message);
            throw error;
        }
    }

    /**
     * Convert text to speech with streaming (for real-time applications)
     * @param {string} text - Text to convert
     * @param {string} voice - Voice name
     * @param {Function} onChunk - Callback for each audio chunk
     * @returns {Promise<void>}
     */
    async textToSpeechStream(text, voice = 'alloy', onChunk) {
        if (!this.enabled) {
            throw new Error('ElevenLabs service not enabled - check ELEVENLABS_API_KEY');
        }

        try {
            const voiceId = this.voiceMap[voice] || this.voiceMap['alloy'];
            
            console.log('[ElevenLabs] Starting streaming TTS...', {
                text: text.substring(0, 50),
                voice,
                voiceId
            });

            const payload = {
                text: text,
                model_id: this.config.model_id,
                voice_settings: this.config.voice_settings
            };

            const response = await axios.post(
                `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
                payload,
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        output_format: this.config.output_format,
                        optimize_streaming_latency: 3
                    },
                    responseType: 'stream'
                }
            );

            // Handle streaming chunks
            response.data.on('data', (chunk) => {
                if (onChunk) {
                    onChunk(chunk);
                }
            });

            return new Promise((resolve, reject) => {
                response.data.on('end', () => {
                    console.log('[ElevenLabs] Streaming completed');
                    resolve();
                });
                response.data.on('error', (error) => {
                    console.error('[ElevenLabs] Streaming error:', error);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('[ElevenLabs] Streaming TTS error:', error.message);
            throw error;
        }
    }

    /**
     * Normalize language code to ISO 639-1 format (2-letter code)
     * @param {string} language - Language code or name
     * @returns {string|null} - Normalized 2-letter code or null
     * @private
     */
    _normalizeLanguageCode(language) {
        if (!language) return null;
        
        // If already 2 letters, return as-is
        if (language.length === 2) {
            return language.toLowerCase();
        }
        
        // Map common language names/codes to ISO 639-1
        const languageMap = {
            'english': 'en',
            'hindi': 'hi',
            'telugu': 'te',
            'tamil': 'ta',
            'kannada': 'kn',
            'malayalam': 'ml',
            'spanish': 'es',
            'french': 'fr',
            'german': 'de',
            'italian': 'it',
            'portuguese': 'pt',
            'russian': 'ru',
            'japanese': 'ja',
            'korean': 'ko',
            'chinese': 'zh',
            'arabic': 'ar',
            'dutch': 'nl',
            'turkish': 'tr',
            'filipino': 'fil',
            'polish': 'pl',
            'swedish': 'sv',
            'bulgarian': 'bg',
            'romanian': 'ro',
            'czech': 'cs',
            'greek': 'el',
            'finnish': 'fi',
            'croatian': 'hr',
            'malay': 'ms',
            'slovak': 'sk',
            'danish': 'da',
            'ukrainian': 'uk',
            'hungarian': 'hu',
            'norwegian': 'no',
            'vietnamese': 'vi'
        };
        
        const normalized = languageMap[language.toLowerCase()];
        
        if (!normalized) {
            console.warn('[ElevenLabs] Unknown language:', language, '- will let ElevenLabs auto-detect');
            return null;
        }
        
        return normalized;
    }
}

// Export singleton instance
module.exports = new ElevenLabsService();
