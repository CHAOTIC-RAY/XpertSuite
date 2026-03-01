import { cleanBase64, getAi } from "./geminiService";
import { Type } from "@google/genai";

export const detectImageAngle = async (image: string): Promise<{yaw: number, pitch: number}> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
                { text: "Estimate the camera angle relative to the object. Return JSON with 'yaw' (0-360) and 'pitch' (-90 to 90)." }
            ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    yaw: { type: Type.NUMBER },
                    pitch: { type: Type.NUMBER }
                }
            }
        }
    });
    
    if (response.text) {
        const json = JSON.parse(response.text);
        return { yaw: json.yaw || 0, pitch: json.pitch || 0 };
    }
    return { yaw: 0, pitch: 0 };
  } catch (error) {
    console.error("Error detecting angle:", error);
    return { yaw: 0, pitch: 0 };
  }
};

export const generateAngleView = async (image: string, yaw: number, pitch: number): Promise<{ resultBase64: string }> => {
    const ai = getAi();
    const prompt = `
    NOVEL VIEW SYNTHESIS - STRICT GEOMETRY CONTROL.
    
    INPUT: Reference image of a product.
    TASK: Rotate the object to match the specific target camera angle.
    
    TARGET ANGLE PARAMETERS:
    - Azimuth (Yaw): ${yaw} degrees (0° is Front, 90° is Right Profile, 180° is Back, 270° is Left Profile).
    - Elevation (Pitch): ${pitch} degrees (0° is Eye Level, 90° is Top Down view, -90° is Bottom Up view).
    
    REQUIREMENTS:
    1. EXACT ROTATION: The output MUST correspond to the requested Yaw/Pitch. Do not output a generic angle.
    2. IDENTITY PRESERVATION: The object details (logos, textures, shape) must match the input exactly.
    3. BACKGROUND: Keep it clean/neutral to focus on the object geometry.
    4. QUALITY: Photorealistic, 8k resolution, precise geometry.
    `;

    const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
        { text: prompt }
    ];

    try {
        // Used gemini-2.5-flash-image for reliable spatial manipulation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts }
        });

        const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return { resultBase64: `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}` };
        }
        throw new Error("Angle generation failed.");
    } catch (e: any) {
        throw new Error(e.message || "Angle generation failed");
    }
};