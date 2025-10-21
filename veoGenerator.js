const { VertexAI } = require('@google-cloud/vertexai');
const axios = require('axios');

// Style definitions for Veo 3 prompts
const STYLES = {
    minimal: 'minimalist cinematography, clean aesthetic, white space, elegant and simple',
    luxury: 'luxury commercial style, premium look, sophisticated lighting, gold accents, high-end feel',
    natural: 'natural organic look, botanical elements, earthy tones, sustainable aesthetic, soft natural lighting',
    vibrant: 'vibrant colorful energy, dynamic movement, bold colors, eye-catching visuals'
};

const COLORS = {
    nude: 'nude beige color palette, warm neutral tones, natural skin tones',
    taupe: 'taupe gray tones, warm gray palette, sophisticated neutrals',
    sage: 'sage green tones, muted green palette, calming natural colors',
    mauve: 'mauve pink tones, dusty rose palette, soft purple-pink hues',
    slate: 'slate gray tones, cool gray palette, modern neutral colors',
    cream: 'cream beige tones, soft ivory palette, warm vanilla hues'
};

async function generateVideo(concept, style, color, mood, sessionId) {
    try {
        // Get credentials from environment
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        
        if (!projectId) {
            throw new Error('GOOGLE_CLOUD_PROJECT environment variable not set');
        }

        // Build video prompt
        const styleDesc = STYLES[style] || STYLES.minimal;
        const colorDesc = COLORS[color] || COLORS.nude;
        const moodDesc = mood < 50 ? 'cute, playful, friendly atmosphere' : 'sophisticated, elegant, refined mood';

        const videoPrompt = `Professional cosmetic product commercial video for ${concept}. 
${styleDesc}. ${colorDesc}. ${moodDesc}.
Cinematic 8-second video showing: product hero shot with smooth camera movement, close-up of texture and details, elegant presentation with soft lighting.
Vertical 9:16 format for Instagram Reels. High quality, professional commercial look, beauty photography style.`;

        console.log(`  🎬 Video Prompt: ${videoPrompt.substring(0, 100)}...`);

        // Initialize Vertex AI
        const vertexAI = new VertexAI({
            project: projectId,
            location: location
        });

        // Generate video with Veo 3
        console.log('  📡 Calling Veo 3 API...');
        
        const generativeModel = vertexAI.preview.getGenerativeModel({
            model: 'veo-003'
        });

        const request = {
            contents: [{
                role: 'user',
                parts: [{
                    text: videoPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };

        const result = await generativeModel.generateContent(request);
        const response = result.response;
        
        // Extract video URL from response
        let videoUrl = null;
        
        if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    if (part.videoMetadata && part.videoMetadata.videoUri) {
                        videoUrl = part.videoMetadata.videoUri;
                        break;
                    }
                    // Alternative: check for inline data
                    if (part.inlineData && part.inlineData.mimeType === 'video/mp4') {
                        // Return base64 or temporary URL
                        videoUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }
        }

        if (!videoUrl) {
            // Fallback: check response text for URL
            const responseText = JSON.stringify(response);
            const urlMatch = responseText.match(/(https?:\/\/[^\s"]+\.mp4)/);
            if (urlMatch) {
                videoUrl = urlMatch[1];
            } else {
                throw new Error('No video URL found in Veo 3 response');
            }
        }

        console.log(`  ✅ Video generated: ${videoUrl.substring(0, 50)}...`);
        
        return videoUrl;

    } catch (error) {
        console.error('❌ Veo 3 generation failed:', error);
        throw new Error(`Veo 3 generation failed: ${error.message}`);
    }
}

module.exports = { generateVideo };
