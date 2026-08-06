/**
 * Gemini API Provider
 * Uses Google's official TypeScript SDK
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  Provider,
  ProviderStatus,
  SeekVisionOutput,
  VisionResult
} from '../types.js';

// Config directory
const CONFIG_DIR = path.join(os.homedir(), '.seek-vision');
const API_KEY_FILE = path.join(CONFIG_DIR, 'gemini_api_key.txt');

// Default prompt for structured extraction
const DEFAULT_PROMPT = `Analyze this image and provide structured JSON output with:
1. summary: one-paragraph description
2. ocr: {full_text: "all visible text", lines: ["line1", "line2"]}
3. layout: {regions: [{reading_order: 1, type: "title|paragraph|table|chart|code", text: "..."}]}
4. semantics: {scene: "...", intent: "...", entities: ["..."], relations: ["..."]}
5. visual: {colors: ["..."], style: "..."}
6. uncertainty: ["what was ambiguous"]

Return ONLY valid JSON, no markdown.`;

/**
 * Load API key from environment or config file
 */
function loadApiKey(): string | null {
  // Check environment variable
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) return envKey;

  // Check config file
  try {
    if (fs.existsSync(API_KEY_FILE)) {
      return fs.readFileSync(API_KEY_FILE, 'utf-8').trim();
    }
  } catch (error) {
    // Ignore file read errors
  }

  return null;
}

/**
 * Check if Gemini API is available
 */
export function checkGeminiStatus(): ProviderStatus {
  const apiKey = loadApiKey();
  
  if (!apiKey) {
    return {
      available: false,
      error: 'No API key found. Set GEMINI_API_KEY env var or run: seek-vision config set gemini-api.apiKey <key>'
    };
  }

  return {
    available: true,
    provider: 'gemini-api',
    has_key: true
  };
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * Extract image context using Gemini API
 */
export async function extractWithGemini(
  imagePath: string,
  prompt?: string,
  model: string = 'gemini-2.0-flash'
): Promise<SeekVisionOutput> {
  const apiKey = loadApiKey();
  
  if (!apiKey) {
    return {
      image: imagePath,
      provider: 'gemini-api',
      result: {
        summary: '',
        ocr: { full_text: '', lines: [] },
        layout: { regions: [] },
        semantics: { scene: '', intent: '', entities: [], relations: [] },
        visual: { colors: [], style: '' },
        uncertainty: ['No API key found']
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model,
        durationSeconds: 0
      }
    };
  }

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return {
      image: imagePath,
      provider: 'gemini-api',
      result: {
        summary: '',
        ocr: { full_text: '', lines: [] },
        layout: { regions: [] },
        semantics: { scene: '', intent: '', entities: [], relations: [] },
        visual: { colors: [], style: '' },
        uncertainty: [`Image file not found: ${imagePath}`]
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model,
        durationSeconds: 0
      }
    };
  }

  const startTime = Date.now();

  try {
    // Initialize client
    const genai = new GoogleGenAI({ apiKey });

    // Read image file
    const imageData = fs.readFileSync(imagePath);
    const mimeType = getMimeType(imagePath);

    // Generate content
    const response = await genai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageData.toString('base64')
              }
            },
            {
              text: prompt || DEFAULT_PROMPT
            }
          ]
        }
      ]
    });

    const duration = (Date.now() - startTime) / 1000;
    const text = response.text || '';

    // Try to parse JSON response
    let result: VisionResult;
    try {
      result = JSON.parse(text);
    } catch {
      // If not valid JSON, wrap in structured format
      result = {
        summary: text,
        ocr: { full_text: '', lines: [] },
        layout: { regions: [] },
        semantics: { scene: '', intent: '', entities: [], relations: [] },
        visual: { colors: [], style: '' },
        uncertainty: ['Response was not valid JSON']
      };
    }

    return {
      image: imagePath,
      provider: 'gemini-api',
      result,
      meta: {
        generatedAt: new Date().toISOString(),
        model,
        durationSeconds: Math.round(duration * 100) / 100
      }
    };

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    return {
      image: imagePath,
      provider: 'gemini-api',
      result: {
        summary: '',
        ocr: { full_text: '', lines: [] },
        layout: { regions: [] },
        semantics: { scene: '', intent: '', entities: [], relations: [] },
        visual: { colors: [], style: '' },
        uncertainty: [`Error: ${error instanceof Error ? error.message : String(error)}`]
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model,
        durationSeconds: Math.round(duration * 100) / 100
      }
    };
  }
}

/**
 * Save API key to config file
 */
export function saveApiKey(apiKey: string): void {
  // Create config directory if it doesn't exist
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Save API key
  fs.writeFileSync(API_KEY_FILE, apiKey, { mode: 0o600 });
}
