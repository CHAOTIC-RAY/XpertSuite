import { cleanBase64, ai } from "./geminiService";

export interface UpscaleOptions {
    scaleFactor: '2x' | '4x' | '6x' | '8x';
    upscaleModel: string;
    upscaleCreativityLevel?: number;
    upscaleSharpen?: number;
    upscaleDenoise?: number;
    faceRecovery?: boolean;
    textRecovery?: boolean;
    customPrompt?: string;
}

export const generateUpscale = async (image: string, options: UpscaleOptions): Promise<{ resultBase64: string }> => {
    const prompt = `Upscale this image. High resolution, 4k, sharp details. ${options.customPrompt || ''} 
                    Style: ${options.upscaleModel}. 
                    Creativity Level: ${options.upscaleCreativityLevel}.
                    Sharpen: ${options.upscaleSharpen}%, Denoise: ${options.upscaleDenoise}%.
                    ${options.faceRecovery ? 'Enhance faces.' : ''} ${options.textRecovery ? 'Enhance text clarity.' : ''}`;

    const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
        { text: prompt }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts }
        });

        const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return { resultBase64: `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}` };
        }
        throw new Error("Upscale failed.");
    } catch (e: any) {
        throw new Error(e.message || "Upscale failed");
    }
};
