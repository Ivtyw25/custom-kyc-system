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

export async function uploadFile(file: File, prefix: string, sessionId: string) {
    const fileName = `${sessionId}/${prefix}.${file.type.split("/")[1]}`;
    const res = await fetch("/api/s3-upload", {
        method: "POST",
        body: JSON.stringify({ fileName, fileType: file.type }),
    });
    const { uploadUrl } = await res.json();
    await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    return fileName;
};


export async function compareFaces(idFrontKey: string, selfieKey: string) {
    const res = await fetch("/api/verify-identity/compare-faces", {
        method: "POST",
        body: JSON.stringify({ idFrontKey, selfieKey }),
    });
    return res.json();
}