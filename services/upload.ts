export async function uploadToS3(file: File): Promise<string> {
    try {
        const response = await fetch("/api/s3-upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to get signed URL");
        }

        const { uploadUrl } = await response.json();
        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type,
            },
            body: file,
        });

        if (!uploadResponse.ok) {
            throw new Error("Failed to upload to S3");
        }

        return uploadUrl.split("?")[0];
    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
}
