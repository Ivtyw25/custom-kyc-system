/* eslint-disable */
const path = require('path');
const faceDetectionPath = path.resolve(process.cwd(), 'node_modules/@mediapipe/face_detection/face_detection.js');
const faceDetection = require(faceDetectionPath);

module.exports = faceDetection;
module.exports.FaceDetection = faceDetection.FaceDetection || faceDetection;
