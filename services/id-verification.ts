export async function detectId(imageBlob: Blob, side: "front" | "back") {
    const formData = new FormData();
    formData.append("image", imageBlob);
    formData.append("side", side);

    const res = await fetch("/api/detect-id", {
        method: "POST",
        body: formData,
    });
    return res.json();
}

interface BoundingBox {
    Left: number;
    Top: number;
    Width: number;
    Height: number;
}

export async function cropId(imageBlob: Blob, boundingBox: BoundingBox) {
    const formData = new FormData();
    formData.append("image", imageBlob);
    formData.append("boundingBox", JSON.stringify(boundingBox));

    const res = await fetch("/api/crop-id", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Cropping failed");
    return res.blob();
}
