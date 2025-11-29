export const createLivenessSession = async (sessionId: string) => {
    console.log("Creating liveness session for:", sessionId);
    const response = await fetch('/api/face-liveness/create-session', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Failed to create session");
    }
    return data;
};

export const getLivenessResults = async (livenessSessionId: string) => {
    console.log("Analysis complete. Fetching results...");
    const response = await fetch('/api/face-liveness/get-results', {
        method: 'POST',
        body: JSON.stringify({ livenessSessionId }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to get results");
    }

    console.log("Liveness results:", data);
    return data;
};
