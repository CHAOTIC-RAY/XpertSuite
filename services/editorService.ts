import { cleanBase64, ai } from "./geminiService";

export interface EditOptions {
    editInstruction: string;
    maskImage?: string; // Base64
    textEditMode?: boolean;
    isRemoveBg?: boolean;
    sourceImages?: string[];
}

export const generateEdit = async (image: string, options: EditOptions): Promise<{ resultBase64: string }> => {
    let prompt = "";
    if (options.isRemoveBg) {
        prompt = "Remove the background. Return the object on a white background (or transparent if supported).";
    } else {
        prompt = `Edit this image. Instruction: ${options.editInstruction}. Maintain style and realism.`;
        if (options.textEditMode) prompt += " Replace text in the image matching the style.";
        
        if (options.sourceImages && options.sourceImages.length > 0) {
            prompt += `\n\nREFERENCE DATA: You have been provided with ${options.sourceImages.length} original source images following the main image. If the user refers to "the original", "the source", "product A", etc., refer to these images to recover details or fix hallucinations. Preserve the original product identity from these sources.`;
        }
    }

    const parts: any[] = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } }
    ];

    if (options.maskImage) {
        parts.push({ inlineData: { mimeType: 'image/png', data: cleanBase64(options.maskImage) } });
        prompt += " Use the provided mask for inpainting.";
    }

    // Append source images context if available and not removing background
    if (options.sourceImages && options.sourceImages.length > 0 && !options.isRemoveBg) {
        options.sourceImages.forEach(src => {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(src) } });
        });
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
        throw new Error("Edit failed.");
    } catch (e: any) {
        throw new Error(e.message || "Edit failed");
    }
};