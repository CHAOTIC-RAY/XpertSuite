import { cleanBase64, ai } from "./geminiService";
import { Type } from "@google/genai";

export const detectImageAngle = async (image: string): Promise<{yaw: number, pitch: number}> => {
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
    const prompt = `Novel View Synthesis Task.
              Input: Reference product image.
              Task: Generate a high-fidelity view of the EXACT SAME object from a new camera angle.
              Target Geometry: Azimuth (Yaw) ${yaw} degrees, Elevation (Pitch) ${pitch} degrees.
              Strict Guidelines:
              1. Identity Preservation: Do not alter the object's design, logo, label text, colors, or proportions.
              2. Rotation Accuracy: Yaw ${yaw}°, Pitch ${pitch}°.
              3. Background: Neutral studio background.
              4. Style: Photorealistic, 8k resolution.`;

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
            return { resultBase64: `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}` };
        }
        throw new Error("Angle generation failed.");
    } catch (e: any) {
        throw new Error(e.message || "Angle generation failed");
    }
};
