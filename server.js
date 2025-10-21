const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { generateVideo } = require('./veoGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Veo 3 Video Generator is running',
        version: '2.0.0'
    });
});

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
    const { concept, style, color, mood } = req.body;
    
    if (!concept) {
        return res.status(400).json({ error: 'Concept is required' });
    }

    const sessionId = uuidv4();
    console.log(`[${sessionId}] Starting Veo 3 generation for: "${concept}"`);
    console.log(`[${sessionId}] Style: ${style}, Color: ${color}, Mood: ${mood}`);

    try {
        // Generate video with Veo 3
        console.log(`[${sessionId}] Generating video with Veo 3...`);
        const videoUrl = await generateVideo(concept, style, color, mood, sessionId);
        
        console.log(`[${sessionId}] ✅ Video generation completed!`);
        
        res.json({
            success: true,
            sessionId,
            videoUrl,
            concept,
            style,
            color,
            mood,
            generatedBy: 'Google Veo 3',
            message: 'Video generated successfully with AI'
        });

    } catch (error) {
        console.error(`[${sessionId}] ❌ Error:`, error.message);
        res.status(500).json({ 
            error: 'Video generation failed', 
            message: error.message,
            sessionId
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Veo 3 Video Generator running on port ${PORT}`);
    console.log(`🎬 Using Google Vertex AI Veo 3`);
    
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
        console.warn('⚠️  WARNING: GOOGLE_CLOUD_PROJECT not set');
    }
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn('⚠️  WARNING: GOOGLE_APPLICATION_CREDENTIALS not set');
    }
});
