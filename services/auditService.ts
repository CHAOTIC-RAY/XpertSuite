import { cleanBase64, getAi } from "./geminiService";
import { DesignCritique } from '../types';

export const analyzeDesign = async (images: string[]): Promise<DesignCritique> => {
  const ai = getAi();
  try {
    const parts: any[] = [];
    for (const img of images) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64(img)
            }
        });
    }
    
    parts.push({ 
        text: `Analyze this design (social media post/s or advertisement). Act as a world-class Design Director. 
        Evaluate the visual work based on: Composition, Typography, Color Harmony, Visual Hierarchy, and Brand Consistency.
        Pinpoint specific areas where the design can be improved.
        
        Return a valid JSON object with this exact structure:
        {
          "score": number (0-100),
          "summary": "A concise executive summary of the design quality and impact.",
          "strengths": ["List 2-3 strong points"],
          "weaknesses": ["List 2-3 weak points"],
          "improvements": ["List 3-5 specific, actionable improvements for the designer"]
        }
        Do not use markdown blocks or formatting. Just return the raw JSON string.` 
    });

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 2048 }
        }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No analysis generated");
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

export const generateHeatmap = async (image: string): Promise<string> => {
    const ai = getAi();
    const prompt = `
    Generate a highly accurate Visual Saliency Heatmap simulation for this design, mimicking a professional eye-tracking study.
    
    1. ANALYZE VISUAL HIERARCHY: Identify focal points based on high contrast, faces/eyes, large typography, and bright saturated colors.
    2. VISUALIZATION STYLE:
       - Transform the original image into a darkened Grayscale background (roughly 30-40% brightness) to reduce visual noise.
       - Overlay a smooth, nebulous Attention Heatmap using a 'Jet' or 'Turbo' color spectrum (Red = Maximum Attention/Focal Point, Yellow = High, Green = Medium, Blue = Low).
       - Ensure the "Hot Spots" (Red) align perfectly with the key elements (e.g., main headline, product hero, CTA button, faces).
       - The heatmap should look like a data visualization overlay, blending smoothly.
       - PRESERVE THE ASPECT RATIO of the original image.
    
    Return the final composite image.
    `;

    const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
        { text: prompt }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts }
        });

        const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        }
        throw new Error("Heatmap generation failed");
    } catch (e: any) {
        console.error("Heatmap error", e);
        throw new Error(e.message || "Heatmap generation failed");
    }
};