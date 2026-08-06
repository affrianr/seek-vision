/**
 * Antigravity CLI Provider
 * Uses Google's Antigravity CLI for vision extraction
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import {
  Provider,
  ProviderStatus,
  SeekVisionOutput,
  VisionResult
} from '../types.js';

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
 * Check if Antigravity CLI is installed and authenticated
 */
export function checkAntigravityStatus(): ProviderStatus {
  try {
    // Check if agy is installed
    execSync('agy --version', { stdio: 'ignore' });
    
    // Check if authenticated
    try {
      const output = execSync('agy auth status', { 
        encoding: 'utf-8',
        timeout: 10000
      });
      
      const authenticated = output.toLowerCase().includes('logged in');
      
      return {
        available: true,
        provider: 'antigravity-cli',
        authenticated
      };
    } catch {
      return {
        available: false,
        error: 'Antigravity CLI not authenticated. Run: agy'
      };
    }
  } catch {
    return {
      available: false,
      error: 'Antigravity CLI not installed. Install: curl -fsSL https://antigravity.google/cli/install.sh | bash'
    };
  }
}

/**
 * Extract image context using Antigravity CLI
 */
export function extractWithAntigravity(
  imagePath: string,
  prompt?: string
): SeekVisionOutput {
  const startTime = Date.now();

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return {
      image: imagePath,
      provider: 'antigravity-cli',
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
        model: 'antigravity',
        durationSeconds: 0
      }
    };
  }

  try {
    // Build command
    const cmd = `agy ask --image "${imagePath}" --prompt "${(prompt || DEFAULT_PROMPT).replace(/"/g, '\\"')}"`;
    
    // Execute command
    const output = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 60000
    });

    const duration = (Date.now() - startTime) / 1000;

    // Try to parse JSON response
    let result: VisionResult;
    try {
      result = JSON.parse(output);
    } catch {
      // If not valid JSON, wrap in structured format
      result = {
        summary: output,
        ocr: { full_text: '', lines: [] },
        layout: { regions: [] },
        semantics: { scene: '', intent: '', entities: [], relations: [] },
        visual: { colors: [], style: '' },
        uncertainty: ['Response was not valid JSON']
      };
    }

    return {
      image: imagePath,
      provider: 'antigravity-cli',
      result,
      meta: {
        generatedAt: new Date().toISOString(),
        model: 'antigravity',
        durationSeconds: Math.round(duration * 100) / 100
      }
    };

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    return {
      image: imagePath,
      provider: 'antigravity-cli',
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
        model: 'antigravity',
        durationSeconds: Math.round(duration * 100) / 100
      }
    };
  }
}
