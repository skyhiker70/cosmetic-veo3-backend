const express = require('express');
const cors = require('cors');
const { generateVeo3Video } = require('./veoGenerator');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Cosmetic Video Generator API is running',
        engine: 'Google Vertex AI Veo 3',
        status: 'active'
    });
});

// Video generation endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { productName, concept } = req.body;

        // Validation
        if (!productName || !concept) {
            return res.status(400).json({ 
                error: 'productName and concept are required' 
            });
        }

        console.log(`📝 Generating video for: ${productName}`);
        console.log(`💡 Concept: ${concept}`);

        // Generate video with Veo 3
        const videoUrl = await generateVeo3Video(productName, concept);

        console.log(`✅ Video generated successfully`);

        res.json({
            success: true,
            videoUrl: videoUrl,
            productName: productName
        });

    } catch (error) {
        console.error('❌ Error generating video:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate video'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Veo 3 Video Generator running on port ${PORT}`);
    console.log(`🎬 Using Google Vertex AI Veo 3`);
    
    // Check environment variables
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION;
    const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    console.log(`📍 Project: ${project || '❌ NOT SET'}`);
    console.log(`🌍 Location: ${location || '❌ NOT SET'}`);
    console.log(`🔑 Credentials: ${hasCredentials ? '✅ SET' : '❌ NOT SET'}`);
    
    if (!project || !location || !hasCredentials) {
        console.warn('⚠️  WARNING: Missing required environment variables!');
        console.warn('   Please set: GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }
});
