/**
 * Seek Vision - Main Entry Point
 * Vision bridge for text-only models
 */

import { Provider, SeekVisionOutput, ProviderStatus } from './types.js';
import { checkGeminiStatus, extractWithGemini } from './providers/gemini.js';
import { checkAntigravityStatus, extractWithAntigravity } from './providers/antigravity.js';

// Re-export types
export * from './types.js';

// Version
export const VERSION = '1.0.0';

// Provider status cache
let providerStatusCache: Record<Provider, ProviderStatus> | null = null;

/**
 * Check status of all providers
 */
export function checkProviders(): Record<Provider, ProviderStatus> {
  if (providerStatusCache) {
    return providerStatusCache;
  }

  providerStatusCache = {
    'gemini-api': checkGeminiStatus(),
    'antigravity-cli': checkAntigravityStatus()
  };

  return providerStatusCache;
}

/**
 * Get first available provider
 */
export function getAvailableProvider(): Provider | null {
  const status = checkProviders();
  
  // Try Gemini first
  if (status['gemini-api'].available) {
    return 'gemini-api';
  }
  
  // Try Antigravity
  if (status['antigravity-cli'].available && status['antigravity-cli'].authenticated) {
    return 'antigravity-cli';
  }
  
  return null;
}

/**
 * Extract image context
 */
export async function extract(
  imagePath: string,
  provider?: Provider,
  prompt?: string,
  model?: string
): Promise<SeekVisionOutput> {
  // Auto-detect provider if not specified
  if (!provider) {
    provider = getAvailableProvider() || undefined;
    
    if (!provider) {
      return {
        image: imagePath,
        provider: 'gemini-api',
        result: {
          summary: '',
          ocr: { full_text: '', lines: [] },
          layout: { regions: [] },
          semantics: { scene: '', intent: '', entities: [], relations: [] },
          visual: { colors: [], style: '' },
          uncertainty: ['No vision provider available. Install gemini-api or antigravity-cli.']
        },
        meta: {
          generatedAt: new Date().toISOString(),
          model: 'unknown',
          durationSeconds: 0
        }
      };
    }
  }

  // Extract using specified provider
  if (provider === 'gemini-api') {
    return extractWithGemini(imagePath, prompt, model);
  } else if (provider === 'antigravity-cli') {
    return extractWithAntigravity(imagePath, prompt);
  } else {
    return {
      image: imagePath,
      provider: 'gemini-api',
      result: {
        summary: '',
        ocr: { full_text: '', lines: [] },
        layout: { regions: [] },
        semantics: { scene: '', intent: '', entities: [], relations: [] },
        visual: { colors: [], style: '' },
        uncertainty: [`Unknown provider: ${provider}`]
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model: 'unknown',
        durationSeconds: 0
      }
    };
  }
}

// Default export
export default {
  VERSION,
  checkProviders,
  getAvailableProvider,
  extract
};
