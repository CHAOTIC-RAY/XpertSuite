// Add global declaration for ImageTracer
declare global {
  interface Window {
    ImageTracer: {
      imageToSVG: (
        source: string, 
        callback: (svgstr: string) => void, 
        options?: any
      ) => void;
    };
    pdfjsLib: any;
  }
}

export interface DesignCritique {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}

export interface GeneratedImage {
  id: string;
  originalUrl: string;
  sourceImages?: string[]; // For group shots
  resultUrl: string;
  prompt: string;
  type: 'mockup' | 'remove-bg' | 'upscale' | 'angle' | 'edit' | 'smartedited' | 'style-transfer' | 'video' | 'pdf-analysis';
  timestamp: number;
  fidelityScore?: number;
  modelUsed?: string;
  isFallback?: boolean;
}

export enum RoomType {
  AUTO = 'Auto Detect',
  LIVING_ROOM = 'Modern Living Room',
  BEDROOM = 'Cozy Bedroom',
  DINING = 'Elegant Dining Area',
  KITCHEN = 'Modern Kitchen',
  STUDIO = 'Professional Studio',
  WHITE_BG = 'Plain White Background with Soft Shadows',
  TOILET = 'Luxury Toilet / Bathroom',
  CONSTRUCTION = 'Construction Site',
  STAGE = 'Minimalist 3D Podium Stage'
}

export enum AngleType {
  AI_BEST = 'AI Best Angle',
  MATCH_INPUT = 'Match Input Angle',
  CUSTOM = 'Custom Angle'
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  SOCIAL_PORTRAIT = '4:5', // 1080x1350
  LANDSCAPE = '16:9',
  WIDE = '21:9'
}

export interface LightingOptions {
  brightness: number; // 0-100
  temperature: number; // 0 (Cool) - 100 (Warm)
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GenerationOptions {
  roomType: RoomType | null;
  customPrompt: string;
  angleMode: AngleType;
  customAngle?: { yaw: number; pitch: number };
  aspectRatio: AspectRatio;
  lighting?: LightingOptions;
  action: 'generate' | 'remove-bg' | 'upscale';
  referenceImage?: string;
  antiDuplicateStrength?: 'low' | 'medium' | 'high';
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DetectedObject {
  name: string;
  box_2d: BoundingBox;
  outline?: Point[]; // Polygon points normalized 0-1
}

export interface VerificationResult {
  isMatch: boolean;
  score: number;
  reason: string;
}

// PDF Interface
export interface PdfDocument {
  id: string;
  name: string;
  content: string; // Extracted Text
  pageCount: number;
  fileSize: string;
  originalFile: File; // Reference for visual rendering
}