/**
 * Seek Vision - TypeScript Types
 */

// Provider types
export type Provider = 'gemini-api' | 'antigravity-cli';

// Image input
export interface ImageInput {
  path: string;
  isUrl: boolean;
}

// OCR result
export interface OCRResult {
  full_text: string;
  lines: string[];
}

// Layout region
export interface LayoutRegion {
  reading_order: number;
  type: 'title' | 'paragraph' | 'table' | 'chart' | 'code' | 'list' | 'image' | 'other';
  text: string;
}

// Layout result
export interface LayoutResult {
  regions: LayoutRegion[];
}

// Semantics result
export interface SemanticsResult {
  scene: string;
  intent: string;
  entities: string[];
  relations: string[];
}

// Visual result
export interface VisualResult {
  colors: string[];
  style: string;
}

// Result object
export interface VisionResult {
  summary: string;
  ocr: OCRResult;
  layout: LayoutResult;
  semantics: SemanticsResult;
  visual: VisualResult;
  uncertainty: string[];
}

// Meta information
export interface MetaResult {
  generatedAt: string;
  model: string;
  durationSeconds: number;
}

// Final output
export interface SeekVisionOutput {
  image: string;
  provider: Provider;
  result: VisionResult;
  meta: MetaResult;
}

// Error output
export interface SeekVisionError {
  error: string;
  image?: string;
}

// Provider status
export interface ProviderStatus {
  available: boolean;
  provider?: Provider;
  has_key?: boolean;
  authenticated?: boolean;
  error?: string;
}

// Config
export interface Config {
  'gemini-api': {
    apiKey?: string;
  };
  'antigravity-cli': {
    installed?: boolean;
    authenticated?: boolean;
  };
}
