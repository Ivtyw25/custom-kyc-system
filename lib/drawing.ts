export const drawOverlay = (
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    predictions: any[],
    isStable: boolean
) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        const pred = predictions[0];
        const { x, y, width, height } = pred;

        // Calculate corners (x, y are center in Roboflow usually)
        const xMin = x - width / 2;
        const yMin = y - height / 2;

        const color = isStable ? "#00FF00" : "#FFFFFF";

        // Draw corners
        const cornerLength = 40;
        const lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";

        ctx.beginPath();
        // Top Left
        ctx.moveTo(xMin, yMin + cornerLength);
        ctx.lineTo(xMin, yMin);
        ctx.lineTo(xMin + cornerLength, yMin);

        // Top Right
        ctx.moveTo(xMin + width - cornerLength, yMin);
        ctx.lineTo(xMin + width, yMin);
        ctx.lineTo(xMin + width, yMin + cornerLength);

        // Bottom Right
        ctx.moveTo(xMin + width, yMin + height - cornerLength);
        ctx.lineTo(xMin + width, yMin + height);
        ctx.lineTo(xMin + width - cornerLength, yMin + height);

        // Bottom Left
        ctx.moveTo(xMin + cornerLength, yMin + height);
        ctx.lineTo(xMin, yMin + height);
        ctx.lineTo(xMin, yMin + height - cornerLength);

        ctx.stroke();
    }
};
