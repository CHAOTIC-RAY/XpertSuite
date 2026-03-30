import { cleanBase64, getAi } from "./geminiService";

export interface EditOptions {
    editInstruction: string;
    maskImage?: string; // Base64
    textEditMode?: boolean;
    isRemoveBg?: boolean;
    isExpand?: boolean;
    sourceImages?: string[];
}

export const generateEdit = async (image: string, options: EditOptions): Promise<{ resultBase64: string }> => {
    const ai = getAi();
    let prompt = "";
    const model = options.isExpand ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

    if (options.isRemoveBg) {
        prompt = "Remove the background of the main object. Return the object on a clean white background.";
    } else if (options.isExpand) {
        prompt = "Generatively expand this image. The first image is the source, and the second image is a mask where WHITE areas indicate where new content should be generated to fill the space, and BLACK areas must be preserved exactly. Match the textures, lighting, and style of the original image to create a seamless extension. Fill the entire expanded area realistically.";
    } else {
        prompt = `Edit this image. Instruction: ${options.editInstruction}. Maintain style and realism.`;
        if (options.textEditMode) prompt += " Replace text in the image matching the style.";
        
        if (options.sourceImages && options.sourceImages.length > 0) {
            prompt += `\n\nREFERENCE DATA: You have been provided with ${options.sourceImages.length} original source images following the main image. Refer to these to preserve product identity.`;
        }
    }

    const parts: any[] = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } }
    ];

    if (options.maskImage) {
        parts.push({ inlineData: { mimeType: 'image/png', data: cleanBase64(options.maskImage) } });
        if (!options.isExpand) prompt += " The second image is a mask where white indicates the area to edit.";
    }

    if (options.sourceImages && options.sourceImages.length > 0) {
        options.sourceImages.forEach(src => {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(src) } });
        });
    }

    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: options.isExpand ? {
                imageConfig: {
                    imageSize: "1K",
                    aspectRatio: "1:1" // This is just a hint, the output will match the input dimensions
                }
            } : undefined
        });

        // For image models, we need to find the image part
        const candidate = response.candidates?.[0];
        if (!candidate) throw new Error("No response from AI");

        const generatedPart = candidate.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return { resultBase64: `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}` };
        }
        
        // Sometimes it might return text if it fails or has a safety block
        if (candidate.content?.parts?.find(p => p.text)) {
            const text = candidate.content.parts.find(p => p.text)?.text;
            throw new Error(`AI returned text instead of image: ${text}`);
        }

        throw new Error("Edit failed - no image generated.");
    } catch (e: any) {
        console.error("Editor Service Error:", e);
        let message = e.message || "Edit failed";
        try {
            const parsed = JSON.parse(message);
            if (parsed.error?.message) message = parsed.error.message;
        } catch (inner) {
            // Not JSON, keep original message
        }
        throw new Error(message);
    }
};