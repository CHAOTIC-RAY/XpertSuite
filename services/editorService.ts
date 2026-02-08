import { cleanBase64, ai } from "./geminiService";

export interface EditOptions {
    editInstruction: string;
    maskImage?: string; // Base64
    textEditMode?: boolean;
    isRemoveBg?: boolean;
}

export const generateEdit = async (image: string, options: EditOptions): Promise<{ resultBase64: string }> => {
    let prompt = "";
    if (options.isRemoveBg) {
        prompt = "Remove the background. Return the object on a white background (or transparent if supported).";
    } else {
        prompt = `Edit this image. Instruction: ${options.editInstruction}. Maintain style and realism.`;
        if (options.textEditMode) prompt += " Replace text in the image matching the style.";
    }

    const parts: any[] = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } }
    ];

    if (options.maskImage) {
        parts.push({ inlineData: { mimeType: 'image/png', data: cleanBase64(options.maskImage) } });
        prompt += " Use the provided mask for inpainting.";
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
