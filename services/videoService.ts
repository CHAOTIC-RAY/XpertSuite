import { cleanBase64, getAi, API_KEY } from "./geminiService";

export const TRANSITION_PRESETS: Record<string, string> = {
    'smart-morph': "Smoothly morph the first image into the second image. Keep the camera steady, focus on transforming the objects naturally. High quality, cinematic.",
    'dissolve': "Cinematic cross-dissolve fade from the first image to the second image. Slow, dreamlike atmosphere.",
    'pan-left': "Camera pans smoothly to the left, revealing the second image as if it were panoramic.",
    'pan-right': "Camera pans smoothly to the right, creating a continuous motion effect.",
    'zoom-in': "Cinematic slow zoom in, transitioning from the wide shot of the first image into the detail of the second image.",
    'zoom-out': "Cinematic slow zoom out, revealing the context of the second image.",
    'orbit': "Orbital camera movement, rotating around the subject to transition between angles."
};

export const generateVideoInterpolation = async (startImage: string, endImage: string | null, prompt: string | null, presetId?: string): Promise<string> => {
    const ai = getAi();
    try {
        const input: any = {
            model: 'veo-3.1-fast-generate-preview',
            image: {
                mimeType: 'image/jpeg',
                imageBytes: cleanBase64(startImage)
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        };

        // If end frame is provided, use it for interpolation
        if (endImage) {
            input.config.lastFrame = {
                mimeType: 'image/jpeg',
                imageBytes: cleanBase64(endImage)
            };
        }

        // Determine prompt: User Custom OR Preset OR Default
        let finalPrompt = "Smooth cinematic camera movement, high quality, photorealistic";
        
        if (prompt && prompt.trim().length > 0) {
            finalPrompt = prompt;
        } else if (presetId && TRANSITION_PRESETS[presetId]) {
            finalPrompt = TRANSITION_PRESETS[presetId];
        }

        input.prompt = finalPrompt;

        let operation = await ai.models.generateVideos(input);

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!videoUri) {
            throw new Error("No video URI returned from API");
        }

        // Return URL with API Key appended for access
        return `${videoUri}&key=${API_KEY}`;

    } catch (error: any) {
        console.error("Video Generation Error:", error);
        throw new Error(error.message || "Failed to generate video");
    }
};