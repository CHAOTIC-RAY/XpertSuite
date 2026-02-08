import { cleanBase64, ai } from "./geminiService";

export const generateSVG = async (image: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
                    { text: "Trace this image and convert it to a simple, clean SVG code. Return ONLY the raw SVG xml string starting with <svg> and ending with </svg>. Do not use markdown blocks." }
                ]
            }
        });
        
        let svg = response.text?.trim() || '';
        // Clean up markdown code blocks if present
        svg = svg.replace(/^```xml/, '').replace(/^```svg/, '').replace(/^```/, '').replace(/```$/, '').trim();
        return svg;
    } catch { return ''; }
};
