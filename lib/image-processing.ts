import sharp from "sharp";

interface BoundingBox {
    Left: number;
    Top: number;
    Width: number;
    Height: number;
}

export async function cropImage(buffer: Buffer, box: BoundingBox) {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0)
        throw new Error("Invalid image dimensions");

    const left = Math.max(0, Math.floor(box.Left * width));
    const top = Math.max(0, Math.floor(box.Top * height));
    const cropWidth = Math.min(width - left, Math.floor(box.Width * width));
    const cropHeight = Math.min(height - top, Math.floor(box.Height * height));

    return sharp(buffer)
        .extract({ left, top, width: cropWidth, height: cropHeight })
        .toBuffer();
}
