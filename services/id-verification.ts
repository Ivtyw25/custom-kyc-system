export async function detectId(imageBlob: Blob) {
    const formData = new FormData();
    formData.append("image", imageBlob);

    const res = await fetch("/api/detect-id", {
        method: "POST",
        body: formData,
    });
    return res.json();
}

export async function cropId(imageBlob: Blob, boundingBox: any) {
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
