const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex AI with credentials from environment
function initializeVertexAI() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!projectId) {
        throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
    }

    if (!credentialsJson) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set');
    }

    let credentials;
    try {
        credentials = JSON.parse(credentialsJson);
    } catch (error) {
        throw new Error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: ' + error.message);
    }

    console.log('🔧 Initializing Vertex AI...');
    console.log(`   Project: ${projectId}`);
    console.log(`   Location: ${location}`);
    console.log(`   Service Account: ${credentials.client_email || 'unknown'}`);

    const vertexAI = new VertexAI({
        project: projectId,
        location: location,
        googleAuthOptions: {
            credentials: credentials
        }
    });

    return vertexAI;
}

// Generate video prompt from product info
function generateVideoPrompt(productName, concept) {
    return `Create a luxurious cosmetic product video for "${productName}".

Concept: ${concept}

Visual style:
- Premium, high-end aesthetic with soft lighting
- Elegant product showcase with smooth camera movements
- Sophisticated color palette matching luxury cosmetics
- Clean, minimalist background with subtle textures
- Product should be the focal point with beautiful reflections
- Cinematic quality with depth of field
- Soft, dreamy atmosphere

Camera work:
- Slow, graceful camera movements
- Close-up shots revealing product details
- Elegant panning and rotation
- Professional product photography style

Mood: Luxurious, elegant, sophisticated, premium beauty brand`;
}

// Generate video using Veo 3
async function generateVeo3Video(productName, concept) {
    try {
        console.log('🎬 Starting Veo 3 video generation...');
        
        const vertexAI = initializeVertexAI();
        const generativeVisionModel = vertexAI.preview.getGenerativeModel({
            model: 'veo-001',
        });

        const prompt = generateVideoPrompt(productName, concept);
        console.log('📝 Prompt created');

        const request = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.8,
                topP: 0.95,
            }
        };

        console.log('⏳ Calling Veo 3 API (this may take 2-3 minutes)...');
        const result = await generativeVisionModel.generateContent(request);
        
        console.log('📦 Response received');
        
        // Extract video URL from response
        const response = result.response;
        
        if (!response || !response.candidates || response.candidates.length === 0) {
            throw new Error('No video generated in response');
        }

        const candidate = response.candidates[0];
        
        // Check for video in different possible locations in the response
        let videoUrl = null;
        
        // Method 1: Check parts for fileData
        if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.fileData && part.fileData.fileUri) {
                    videoUrl = part.fileData.fileUri;
                    break;
                }
                if (part.videoMetadata && part.videoMetadata.videoUri) {
                    videoUrl = part.videoMetadata.videoUri;
                    break;
                }
            }
        }

        // Method 2: Check if there's a direct video field
        if (!videoUrl && candidate.videoUrl) {
            videoUrl = candidate.videoUrl;
        }

        // Method 3: Check metadata
        if (!videoUrl && response.metadata && response.metadata.videoUrl) {
            videoUrl = response.metadata.videoUrl;
        }

        if (!videoUrl) {
            console.error('Response structure:', JSON.stringify(response, null, 2));
            throw new Error('Video URL not found in response');
        }

        console.log('✅ Video URL extracted:', videoUrl);
        return videoUrl;

    } catch (error) {
        console.error('❌ Veo 3 generation error:', error);
        
        // Provide more specific error messages
        if (error.message.includes('GOOGLE_CLOUD_PROJECT')) {
            throw new Error('Google Cloud project ID is not configured. Please set GOOGLE_CLOUD_PROJECT environment variable.');
        }
        if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS_JSON')) {
            throw new Error('Google Cloud credentials are not configured. Please set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.');
        }
        if (error.message.includes('permission')) {
            throw new Error('Permission denied. Please ensure the service account has Vertex AI User role.');
        }
        if (error.message.includes('quota')) {
            throw new Error('API quota exceeded. Please check your Google Cloud quota limits.');
        }
        
        throw new Error(`Veo 3 API error: ${error.message}`);
    }
}

module.exports = {
    generateVeo3Video
};
