export const drawOverlay = (
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    predictions: any,
    isStable: boolean
) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions && typeof predictions.x === 'number') {
        const { x, y, width, height } = predictions;

        const padding = 20;
        const x1 = x - width / 2;
        const y1 = y - height / 2 - padding;
        const x2 = x + width / 2;
        const y2 = y + height / 2 + padding;

        const color = isStable ? "#00FF00" : "#FF0000";

        // Draw corners
        const cornerLength = 20;
        const lineWidth = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";

        ctx.beginPath();
        // Top Left
        ctx.moveTo(x1, y1 + cornerLength);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 + cornerLength, y1);

        // Top Right
        ctx.moveTo(x2 - cornerLength, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y1 + cornerLength);

        // Bottom Right
        ctx.moveTo(x2, y2 - cornerLength);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2 - cornerLength, y2);

        // Bottom Left
        ctx.moveTo(x1 + cornerLength, y2);
        ctx.lineTo(x1, y2);
        ctx.lineTo(x1, y2 - cornerLength);

        ctx.stroke();
    }
};
