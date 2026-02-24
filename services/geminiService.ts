import { GoogleGenAI } from "@google/genai";

// Retrieve API Key with fallback to localStorage (for Settings Modal support)
export const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('chaoticx_api_key');
    if (stored && stored.trim().length > 0) return stored.trim();
  }
  return process.env.API_KEY || '';
};

export const API_KEY = getApiKey();

// Initialize the client
export const ai = new GoogleGenAI({ apiKey: API_KEY });

// Shared Helper: Clean Base64 string
export const cleanBase64 = (str: string) => str.replace(/^data:image\/\w+;base64,/, '');

// Shared Helper: Client-side compression
export const compressAndResizeImage = async (base64: string, maxDimension: number = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = (e) => reject(e);
  });
};