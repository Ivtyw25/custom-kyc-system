const path = require('path');

// Attempt to resolve the path to the face_detection.js file
// This is a workaround for Next.js build issues with @mediapipe/face_detection
const faceDetectionPath = path.join(process.cwd(), 'node_modules', '@mediapipe', 'face_detection', 'face_detection.js');

try {
    const faceDetection = require(faceDetectionPath);
    module.exports = faceDetection;
} catch (error) {
    console.error('Failed to load @mediapipe/face_detection shim:', error);
    module.exports = {};
}
