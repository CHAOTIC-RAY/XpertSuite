import { cleanBase64, ai } from "./geminiService";
import { RoomType, AngleType, AspectRatio, LightingOptions } from '../types';

export const detectProductType = async (image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
          { text: "Identify the main product in this image. Return only the product name (e.g. 'Coffee Maker', 'Sneakers'). Keep it short." }
        ]
      }
    });
    return response.text?.trim() || 'Product';
  } catch (error) {
    console.error("Error detecting product:", error);
    return 'Product';
  }
};

export const suggestRoomSettings = async (image: string, label: string): Promise<RoomType> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(image) } },
          { text: `Analyze this ${label} and suggest the best room environment for a product photo. 
                   Choose exactly one from this list: 
                   'Modern Living Room', 'Cozy Bedroom', 'Elegant Dining Area', 'Modern Kitchen', 'Professional Studio', 'Luxury Toilet / Bathroom', 'Construction Site', 'Minimalist 3D Podium Stage'.
                   Return only the string.` }
        ]
      }
    });
    
    const text = response.text?.trim();
    if (text?.includes('Living')) return RoomType.LIVING_ROOM;
    if (text?.includes('Bedroom')) return RoomType.BEDROOM;
    if (text?.includes('Dining')) return RoomType.DINING;
    if (text?.includes('Kitchen')) return RoomType.KITCHEN;
    if (text?.includes('Toilet') || text?.includes('Bathroom')) return RoomType.TOILET;
    if (text?.includes('Construction')) return RoomType.CONSTRUCTION;
    if (text?.includes('Stage') || text?.includes('Podium')) return RoomType.STAGE;
    
    return RoomType.STUDIO;
  } catch (error) {
    console.error("Error suggesting room:", error);
    return RoomType.STUDIO;
  }
};

export interface SceneGenOptions {
  roomType: RoomType | null;
  customPrompt?: string;
  angleMode?: AngleType;
  customAngle?: { yaw: number; pitch: number };
  aspectRatio: AspectRatio;
  lighting?: LightingOptions;
  antiDuplicateStrength?: 'low' | 'medium' | 'high';
  fidelityMode?: 'off' | 'medium' | 'high';
  productLabel?: string;
  fullVisibilityMode?: boolean;
  referenceImage?: string;
  isAlphaMode?: boolean;
}

export const generateScene = async (images: string[], options: SceneGenOptions): Promise<{ resultBase64: string }> => {
    // Select model based on fidelity toggle
    const modelName = options.fidelityMode === 'high' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    // START PROMPT CONSTRUCTION
    let prompt = `Professional Product Photography, 8k Resolution, Photorealistic, Octane Render. `;
    
    // 1. Alpha/ISO Mode Handling (White Background)
    if (options.isAlphaMode) {
        prompt += `
        IMPORTANT: ISOLATION MODE.
        Generate the object(s) on a SOLID PURE WHITE BACKGROUND (Hex #FFFFFF).
        NO shadows, NO props, NO environment.
        The output must be a clean cut-out ready image.
        `;
    } else {
        prompt += ` Room/Environment: ${options.roomType || 'Professional Studio'}. `;
    }

    // 2. Composition Logic (Group vs Single)
    if (options.fullVisibilityMode && images.length > 1) {
        prompt += `
        GROUP SHOT COMPOSITION:
        - Wide Angle Lens.
        - Ensure ALL ${images.length} items are fully visible within the frame.
        - Arrange them aesthetically (e.g., side-by-side or artistic cluster) but DO NOT overlap significantly.
        - DO NOT CROP any item. Keep safe margins around the composition.
        `;
    } else {
        // Single Item Focus
        prompt += `
        HERO SHOT COMPOSITION:
        - Center the product perfectly in the frame.
        - Focus on the product details.
        - Use a shallow depth of field to separate from background (unless Alpha mode).
        `;
    }

    // 3. User Customization
    if (options.customPrompt) prompt += ` Details: ${options.customPrompt}.`;
    if (options.productLabel) prompt += ` Subject: ${options.productLabel}.`;

    // 4. Strictness/Hallucination Control
    if (options.antiDuplicateStrength === 'high') {
        prompt += ` STRICT INSTRUCTION: Maintain the exact identity, shape, and structure of the input product(s). Do not add imaginary parts.`;
    }

    // 5. Camera Angle
    if (options.angleMode === AngleType.CUSTOM && options.customAngle) {
        prompt += ` Camera Angle: Yaw ${options.customAngle.yaw}°, Pitch ${options.customAngle.pitch}°.`;
    }
    
    // 6. Lighting
    if (options.lighting) {
        prompt += ` Lighting: Brightness ${options.lighting.brightness}%, Temperature ${options.lighting.temperature > 50 ? 'Warm Golden Hour' : 'Cool Studio White'}.`;
    }
    
    // 7. Reference Logic
    if (options.referenceImage) {
        prompt += " Use the second image as a strict style and lighting reference.";
    }

    const parts: any[] = [];
    for (const img of images) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(img) } });
    }

    if (options.referenceImage) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64(options.referenceImage) } });
    }

    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
                imageConfig: modelName === 'gemini-3-pro-image-preview' && options.aspectRatio ? {
                    aspectRatio: options.aspectRatio === AspectRatio.SQUARE ? "1:1" :
                                 options.aspectRatio === AspectRatio.LANDSCAPE ? "16:9" :
                                 options.aspectRatio === AspectRatio.PORTRAIT ? "3:4" : "1:1"
                } : undefined
            }
        });

        const generatedPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return { resultBase64: `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}` };
        }
        throw new Error("No image generated.");
    } catch (e: any) {
        console.error("Scene Gen Error", e);
        throw new Error(e.message || "Scene generation failed");
    }
};