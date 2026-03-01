import { cleanBase64, getAi } from "./geminiService";

export interface StyleOptions {
    stylePreset: string;
    customPrompt?: string;
    referenceImage?: string;
    styleStrength?: number; // 1-100
}

export const generateStyleTransfer = async (image: string, options: StyleOptions): Promise<{ resultBase64: string }> => {
    const ai = getAi();
    // We use Gemini 2.5 Flash Image for better accessibility and reliable performance
    const model = 'gemini-2.5-flash-image';
    
    const strength = options.styleStrength || 50;
    
    let guidance = "";
    if (strength < 30) {
        guidance = "SUBTLE RETOUCHING. Change only lighting and color grading. Keep textures and materials exactly as they are. Do not alter geometry.";
    } else if (strength < 70) {
        guidance = "BALANCED STYLE TRANSFER. Apply the artistic style, textures, and lighting of the style prompt. However, STRICTLY PRESERVE the shape, outline, and perspective of the original object. The object must remain recognizable.";
    } else {
        guidance = "HEAVY STYLIZATION. You may reimagine the materials and textures completely to match the style (e.g. turning a photo into a sketch or 3D clay render). However, keep the general composition and subject placement.";
    }

    const prompt = `
    TASK: Artistic Style Transfer.
    
    INPUT CONTEXT:
    1. IMAGE 1: The "Content Image". Use this as the structural foundation. ${guidance}
    ${options.referenceImage ? '2. IMAGE 2: The "Style Reference". Transfer the color palette, brushwork/rendering style, and lighting vibe of this image onto Image 1.' : ''}
    
    TARGET STYLE DESCRIPTION:
    ${options.stylePreset}
    ${options.customPrompt ? `Additional Details: ${options.customPrompt}` : ''}
    
    OUTPUT REQUIREMENTS:
    - High fidelity, 8k resolution.
    - If the style is photorealistic, ensure realistic shadows and reflections.
    - If the style is artistic (sketch, clay), apply the effect consistently across the whole image.
    `;
    
    const parts: any[] = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } }
    ];

    if (options.referenceImage) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(options.referenceImage) } });
    }

    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts }
        });

        const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return { resultBase64: `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}` };
        }
        throw new Error("Style transfer failed.");
    } catch (e: any) {
        throw new Error(e.message || "Style transfer failed");
    }
};