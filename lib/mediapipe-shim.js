/* eslint-disable */
const faceDetection = require('../node_modules/@mediapipe/face_detection/face_detection.js');

module.exports = faceDetection;
module.exports.FaceDetection = faceDetection.FaceDetection || faceDetection;
