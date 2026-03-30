import { cleanBase64, getAi } from "./geminiService";

export interface BulkMockupOptions {
    furnitureType: string;
    material: string;
    lighting: string;
    customPrompt: string;
    preserveDetails: boolean;
    decorateRoom: boolean;
    pillowCount?: number;
    accuracy: number;
}

export const generateBaseImage = async (prompt: string): Promise<string> => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "3:4",
                    imageSize: "1K"
                }
            }
        });

        const candidate = response.candidates?.[0];
        if (!candidate) throw new Error("No response from AI");

        const generatedPart = candidate.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        }
        
        if (candidate.content?.parts?.find(p => p.text)) {
            const text = candidate.content.parts.find(p => p.text)?.text;
            throw new Error(`AI returned text instead of image: ${text}`);
        }

        throw new Error("Failed to generate base image.");
    } catch (e: any) {
        console.error("Generate Base Image Error:", e);
        let message = e.message || "Failed to generate base image";
        try {
            const parsed = JSON.parse(message);
            if (parsed.error?.message) message = parsed.error.message;
        } catch (inner) {}
        throw new Error(message);
    }
};
export const detectPillowCount = async (image: string): Promise<number> => {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
                    { text: "Count the number of pillows in this image. Return only the number as an integer." }
                ]
            }
        });
        const text = response.text?.trim();
        const count = parseInt(text || '0', 10);
        return isNaN(count) ? 0 : count;
    } catch (error) {
        console.error("Error detecting pillow count:", error);
        return 0;
    }
};

export const applyPatternToFurniture = async (baseImage: string, patternImage: string, options: BulkMockupOptions): Promise<string> => {
    const ai = getAi();
    
    let prompt = `You are an expert product visualizer and 3D texturing AI. Your task is to apply the design, pattern, or texture from the SECOND image onto the main ${options.furnitureType} in the FIRST image.
    
Material finish: ${options.material}.
Lighting: ${options.lighting}.
Accuracy Level: ${options.accuracy}%.
${options.customPrompt ? `Additional instructions: ${options.customPrompt}` : ''}

CRITICAL INSTRUCTIONS:
- The FIRST image is the base scene. The SECOND image contains the exact design/pattern to apply.
- You MUST copy the design PERFECTLY from the second image. This is a strict requirement.
- EXACT COLOR MATCHING: The colors, scale, and details of the pattern must match the second image exactly. Do not hallucinate new colors.
- IMPORTANT: If the second image is a full product design (like a bed set, mattress, or apparel), DO NOT just tile it as a seamless texture. You must map the specific parts of the design to the corresponding parts of the ${options.furnitureType} (e.g., map the pillow design to the pillows, the duvet design to the duvet, the mattress pattern to the mattress).
${options.pillowCount ? `- PILLOW COUNT: Ensure the generated mockup has exactly ${options.pillowCount} pillows, matching the pillow count detected in the pattern sample.` : ''}
- Only replace the surface texture/color/design of the ${options.furnitureType}.
- Do not change the underlying shape or structure of the base furniture.`;

    if (options.decorateRoom) {
        prompt += `\n- DECORATE THE ROOM: Modify the surrounding room decor, props, wall colors, and background to perfectly complement the aesthetic, mood, and color palette of the new pattern/texture. Keep the room's general layout but change its styling to match the new design.`;
    } else {
        prompt += `\n- Keep the original background exactly the same.`;
    }

    if (options.preserveDetails) {
        prompt += `\n- PERFECTLY PRESERVE all original lighting, shadows, folds, creases, and structural geometry of the furniture. The new design must wrap realistically around these details.`;
    }

    const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(baseImage) } },
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(patternImage) } },
        { text: prompt }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: { parts }
        });

        const candidate = response.candidates?.[0];
        if (!candidate) throw new Error("No response from AI");

        const generatedPart = candidate.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        }
        
        if (candidate.content?.parts?.find(p => p.text)) {
            const text = candidate.content.parts.find(p => p.text)?.text;
            throw new Error(`AI returned text instead of image: ${text}`);
        }

        throw new Error("Pattern application failed - no image generated.");
    } catch (e: any) {
        console.error("Mockup Service Error:", e);
        let message = e.message || "Pattern application failed";
        try {
            const parsed = JSON.parse(message);
            if (parsed.error?.message) message = parsed.error.message;
        } catch (inner) {}
        throw new Error(message);
    }
};
