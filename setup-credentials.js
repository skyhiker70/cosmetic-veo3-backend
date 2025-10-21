#!/usr/bin/env node

/**
 * Railway 환경 변수에서 Google Service Account JSON을 파일로 저장
 */

const fs = require('fs');
const path = require('path');

function setupCredentials() {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
        console.log('⚠️  GOOGLE_APPLICATION_CREDENTIALS_JSON not found');
        console.log('⚠️  Assuming credentials are already set up');
        return;
    }

    try {
        // Parse JSON
        const credentials = JSON.parse(credentialsJson);
        
        // Save to file
        const credentialsPath = path.join(__dirname, 'service-account-key.json');
        fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
        
        // Set environment variable
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
        
        console.log('✅ Google credentials saved to:', credentialsPath);
        console.log('✅ GOOGLE_APPLICATION_CREDENTIALS set');
        
    } catch (error) {
        console.error('❌ Failed to setup credentials:', error.message);
        process.exit(1);
    }
}

// Run setup
setupCredentials();
