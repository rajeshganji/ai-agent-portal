const OpenAI = require('openai');
const logger = require('../lib/logger');
const fs = require('fs');
const path = require('path');

class OpenAIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        
        if (!this.apiKey) {
            console.warn('[OpenAI] OPENAI_API_KEY not set - speech features will be disabled');
            this.enabled = false;
            return;
        }
        
        this.client = new OpenAI({
            apiKey: this.apiKey
        });
        
        this.enabled = true;
        console.log('[OpenAI] Service initialized successfully');
    }

    /**
     * Convert speech audio to text using Whisper
     * @param {Buffer} audioBuffer - Audio file buffer (WAV, MP3, etc.)
     * @param {string} language - Language code (e.g., 'en', 'hi', 'auto' for detection)
     * @returns {Promise<{text: string, language: string}>}
     */
    async speechToText(audioBuffer, language = 'auto') {
        if (!this.enabled) {
            throw new Error('OpenAI service not enabled - check OPENAI_API_KEY');
        }

        try {
            const startTime = Date.now();
            console.log('[OpenAI] Converting speech to text...', { 
                bufferSize: audioBuffer.length,
                language 
            });
            
            // Create a blob from the buffer for FormData
            const blob = new Blob([audioBuffer], { type: 'audio/wav' });
            
            // Create file object from blob
            const file = new File([blob], 'audio.wav', { type: 'audio/wav' });
            
            const transcription = await this.client.audio.transcriptions.create({
                file: file,
                model: 'whisper-1',
                language: language === 'auto' ? undefined : language,
                response_format: 'verbose_json'
            });
            
            const duration = Date.now() - startTime;
            
            console.log('[OpenAI] Speech-to-text completed in', duration, 'ms', { 
                text: transcription.text,
                detectedLanguage: transcription.language,
                textLength: transcription.text.length
            });
            
            return {
                text: transcription.text,
                language: transcription.language || language
            };
        } catch (error) {
            console.error('[OpenAI] Speech-to-text error:', error.message);
            console.error('[OpenAI] Error details:', error.response?.data || error);
            throw error;
        }
    }

    /**
     * Detect intent from user text using GPT
     * @param {string} userText - User's spoken text
     * @param {Array<string>} possibleIntents - List of expected intents
     * @param {Object} context - Additional context for intent detection
     * @returns {Promise<{intent: string, confidence: number, entities: Object}>}
     */
    async detectIntent(userText, possibleIntents = [], context = {}) {
        if (!this.enabled) {
            throw new Error('OpenAI service not enabled - check OPENAI_API_KEY');
        }

        try {
            logger.info('[OpenAI] Detecting intent...', { userText, possibleIntents });
            
            const systemPrompt = `You are an intent detection system for an IVR (phone) application.
Analyze the user's spoken input and determine their intent.

${possibleIntents.length > 0 ? `Expected intents: ${possibleIntents.join(', ')}` : ''}

Respond ONLY with valid JSON in this format:
{
  "intent": "the_detected_intent",
  "confidence": 0.95,
  "entities": {
    "key": "value"
  }
}`;

            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userText }
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(response.choices[0].message.content);
            
            logger.info('[OpenAI] Intent detected', result);
            
            return {
                intent: result.intent || 'unknown',
                confidence: result.confidence || 0.5,
                entities: result.entities || {}
            };
        } catch (error) {
            logger.error('[OpenAI] Intent detection error:', error);
            throw error;
        }
    }

    /**
     * Convert text to speech using OpenAI TTS
     * @param {string} text - Text to convert to speech
     * @param {string} voice - Voice to use (alloy, echo, fable, onyx, nova, shimmer)
     * @param {string} model - TTS model (tts-1 or tts-1-hd)
     * @returns {Promise<Buffer>} Audio buffer
     */
    async textToSpeech(text, voice = 'alloy', model = 'tts-1') {
        if (!this.enabled) {
            throw new Error('OpenAI service not enabled - check OPENAI_API_KEY');
        }

        try {
            logger.info('[OpenAI] Converting text to speech...', { text, voice, model });
            
            const response = await this.client.audio.speech.create({
                model: model,
                voice: voice,
                input: text,
                response_format: 'mp3'
            });

            const buffer = Buffer.from(await response.arrayBuffer());
            
            logger.info('[OpenAI] Text-to-speech completed', { 
                textLength: text.length,
                audioSize: buffer.length 
            });
            
            return buffer;
        } catch (error) {
            logger.error('[OpenAI] Text-to-speech error:', error);
            throw error;
        }
    }

    /**
     * Generate conversational response using GPT
     * @param {string} userMessage - User's message
     * @param {Array} conversationHistory - Previous messages
     * @param {string} systemContext - System prompt/context
     * @returns {Promise<string>} AI response
     */
    async generateResponse(userMessage, conversationHistory = [], systemContext = '') {
        if (!this.enabled) {
            throw new Error('OpenAI service not enabled - check OPENAI_API_KEY');
        }

        try {
            logger.info('[OpenAI] Generating conversational response...', { userMessage });
            
            const messages = [
                { 
                    role: 'system', 
                    content: systemContext || 'You are a helpful assistant in a phone call. Keep responses concise and natural for voice interaction.' 
                },
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            const response = await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages,
                temperature: 0.7,
                max_tokens: 150
            });

            const reply = response.choices[0].message.content;
            
            logger.info('[OpenAI] Response generated', { reply });
            
            return reply;
        } catch (error) {
            logger.error('[OpenAI] Response generation error:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new OpenAIService();
