import { cleanBase64, ai } from "./geminiService";

export interface StyleOptions {
    stylePreset: string;
    customPrompt?: string;
    referenceImage?: string;
}

export const generateStyleTransfer = async (image: string, options: StyleOptions): Promise<{ resultBase64: string }> => {
    const prompt = `Style Transfer. Apply this style: ${options.stylePreset}. ${options.customPrompt || ''}`;
    
    const parts: any[] = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } }
    ];

    if (options.referenceImage) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(options.referenceImage) } });
    }

    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
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
