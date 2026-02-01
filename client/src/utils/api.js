/**
 * API Service for Signature Verification Backend
 * Base URL: http://localhost:8000
 */

const API_BASE_URL = 'http://localhost:8000';

/**
 * Check if the backend server is healthy
 */
export async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        return {
            isHealthy: data.status === 'healthy',
            modelLoaded: data.model_loaded,
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Health check failed:', error);
        return { isHealthy: false, modelLoaded: false, error: error.message };
    }
}

/**
 * Predict if a signature is genuine or forged
 * @param {File|Blob} imageFile - The signature image to analyze
 * @returns {Promise<Object>} Prediction result with confidence
 */
export async function predictSignature(imageFile) {
    try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Prediction failed');
        }

        const data = await response.json();

        return {
            success: true,
            prediction: data.prediction, // "GENUINE" or "FORGED"
            confidence: data.confidence, // 0-100
            probability: data.probability,
            details: data.details,
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Prediction error:', error);
        return {
            success: false,
            error: error.message,
            // Fallback to mock data if server unavailable
            prediction: Math.random() > 0.3 ? 'GENUINE' : 'FORGED',
            confidence: (70 + Math.random() * 29).toFixed(1),
            isMock: true
        };
    }
}

/**
 * Verify a test signature against a reference signature
 * @param {File|Blob} referenceFile - Known genuine signature
 * @param {File|Blob} testFile - Signature to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifySignature(referenceFile, testFile) {
    try {
        const formData = new FormData();
        formData.append('reference', referenceFile);
        formData.append('test', testFile);

        const response = await fetch(`${API_BASE_URL}/verify`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Verification failed');
        }

        const data = await response.json();

        return {
            success: true,
            match: data.match,
            similarityScore: data.similarity_score,
            reference: data.reference,
            test: data.test,
            verdict: data.verdict, // "VERIFIED" or "REJECTED"
            timestamp: data.timestamp
        };
    } catch (error) {
        console.error('Verification error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get information about the loaded model
 */
export async function getModelInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/model/info`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Model info error:', error);
        return { status: 'error', message: error.message };
    }
}

/**
 * Reload the model on the server
 */
export async function reloadModel() {
    try {
        const response = await fetch(`${API_BASE_URL}/model/reload`, {
            method: 'POST'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Model reload error:', error);
        return { status: 'error', message: error.message };
    }
}

/**
 * Convert a base64 data URL to a Blob for upload
 * @param {string} dataUrl - Base64 data URL (e.g., from FileReader)
 * @returns {Blob} Image blob
 */
export function dataUrlToBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

/**
 * Generate mock analysis data for feature breakdown
 * @returns {Object} Mock stroke, fluidity, and slant data
 */
export function generateMockAnalysis() {
    return {
        strokePressure: {
            start: 75 + Math.random() * 20,
            mid: 80 + Math.random() * 17,
            end: 75 + Math.random() * 20
        },
        fluidity: 85 + Math.random() * 13,
        slantAngle: Math.floor(Math.random() * 30) - 5
    };
}
