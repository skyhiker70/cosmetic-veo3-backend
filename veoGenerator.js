const { GoogleAuth } = require('google-auth-library');

// Initialize Google Auth with credentials from environment
function getAuthClient() {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJson) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set');
    }

    let credentials;
    try {
        credentials = JSON.parse(credentialsJson);
    } catch (error) {
        throw new Error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: ' + error.message);
    }

    console.log('🔧 Initializing Google Auth...');
    console.log(`   Service Account: ${credentials.client_email || 'unknown'}`);

    const auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    return auth;
}

// Generate video prompt from product info
function generateVideoPrompt(productName, concept) {
    return `Create a luxurious cosmetic product video for "${productName}".

${concept}

Visual style: Premium high-end aesthetic with soft lighting, elegant product showcase with smooth camera movements, sophisticated color palette matching luxury cosmetics, clean minimalist background with subtle textures, product as focal point with beautiful reflections, cinematic quality with depth of field, soft dreamy atmosphere.

Camera work: Slow graceful movements, close-up shots revealing product details, elegant panning and rotation, professional product photography style.

Mood: Luxurious, elegant, sophisticated, premium beauty brand.`;
}

// Poll operation status
async function pollOperation(auth, projectId, location, operationId, maxAttempts = 60) {
    const client = await auth.getClient();
    const modelId = 'veo-3.1-generate-preview';
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await client.request({
                url: url,
                method: 'POST',
                data: {
                    operationName: operationId
                }
            });

            const data = response.data;
            
            if (data.done) {
                console.log('✅ Operation completed');
                
                if (data.response && data.response.videos && data.response.videos.length > 0) {
                    const videoUrl = data.response.videos[0].gcsUri;
                    console.log('🎬 Video URL:', videoUrl);
                    return videoUrl;
                }
                
                throw new Error('No video in response');
            }

            console.log(`⏳ Attempt ${attempt + 1}/${maxAttempts}: Still generating...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            
        } catch (error) {
            if (attempt === maxAttempts - 1) {
                throw error;
            }
            console.log(`⚠️ Polling error (attempt ${attempt + 1}), retrying...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    throw new Error('Video generation timed out');
}

// Generate video using Veo 3.1
async function generateVeo3Video(productName, concept) {
    try {
        console.log('🎬 Starting Veo 3.1 video generation...');
        
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

        if (!projectId) {
            throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
        }

        const auth = getAuthClient();
        const client = await auth.getClient();
        
        const prompt = generateVideoPrompt(productName, concept);
        console.log('📝 Prompt created');

        const modelId = 'veo-3.1-generate-preview';
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;

        const requestBody = {
            instances: [
                {
                    prompt: prompt
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "16:9",
                personGeneration: "allow_adult"
            }
        };

        console.log('📡 Sending request to Veo 3.1 API...');
        const response = await client.request({
            url: url,
            method: 'POST',
            data: requestBody
        });

        const operationName = response.data.name;
        console.log('✅ Request accepted, operation:', operationName);

        // Extract operation ID
        const operationId = operationName;
        
        console.log('⏳ Polling for completion (this takes 2-3 minutes)...');
        const videoUrl = await pollOperation(auth, projectId, location, operationId);

        return videoUrl;

    } catch (error) {
        console.error('❌ Veo 3.1 generation error:', error);
        
        if (error.response) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        
        // Provide more specific error messages
        if (error.message.includes('GOOGLE_CLOUD_PROJECT')) {
            throw new Error('Google Cloud project ID is not configured');
        }
        if (error.message.includes('GOOGLE_APPLICATION_CREDENTIALS_JSON')) {
            throw new Error('Google Cloud credentials are not configured');
        }
        if (error.message.includes('403') || error.message.includes('permission')) {
            throw new Error('Permission denied. Please ensure Vertex AI API is enabled and service account has Vertex AI User role');
        }
        if (error.message.includes('404')) {
            throw new Error('Veo 3.1 model not found. Please ensure you have access to Veo 3.1 preview');
        }
        if (error.message.includes('quota')) {
            throw new Error('API quota exceeded');
        }
        
        throw new Error(`Veo 3.1 API error: ${error.message}`);
    }
}

module.exports = {
    generateVeo3Video
};
