export async function uploadFile(file: File, prefix: string, sessionId: string) {
    const rawExtension = file.type.split("/")[1];
    const extension = rawExtension === "jpeg" ? "jpg" : rawExtension;
    const fileName = `${sessionId}/${prefix}.${extension}`;

    const res = await fetch("/api/s3-upload", {
        method: "POST",
        body: JSON.stringify({ fileName, fileType: file.type }),
    });

    if (!res.ok) {
        throw new Error(`Failed to get upload URL for ${fileName}`);
    }

    const { uploadUrl } = await res.json();

    const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
    });

    if (!uploadRes.ok) {
        console.error(`Failed to upload file to S3: ${uploadRes.status} ${uploadRes.statusText}`);
        throw new Error(`Failed to upload ${fileName} to S3`);
    }

    return fileName;
};


export async function compareFaces(idFrontKey: string, selfieKey: string) {
    const res = await fetch("/api/verify-identity/compare-faces", {
        method: "POST",
        body: JSON.stringify({ idFrontKey, selfieKey }),
    });
    return res.json();
}