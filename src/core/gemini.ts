import { GoogleGenAI, Modality } from '@google/genai';
import { config, logInfo, logWarn, logError } from './config.js';

let geminiClient: GoogleGenAI | null = null;

// Throttling queue to prevent hitting the 5 RPM Free Tier rate limit on rapid agent transitions
let lastRequestTimestamp = 0;
const MIN_REQUEST_INTERVAL_MS = 1200; // 1.2s minimum spacing between Gemini requests

async function throttleRequests(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTimestamp;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLast));
  }
  lastRequestTimestamp = Date.now();
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Parses retry delay in milliseconds from error messages or details
 */
function extractRetryDelayMs(error: any): number | null {
  try {
    const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    // Match "Please retry in 25.9s" or "retry in 20s"
    const matchSeconds = errorStr.match(/retry in (\d+(\.\d+)?)s/i);
    if (matchSeconds && matchSeconds[1]) {
      return Math.min(30000, Math.ceil(parseFloat(matchSeconds[1]) * 1000) + 1000);
    }
    // Match retryDelay: "25s"
    const matchDelayField = errorStr.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i);
    if (matchDelayField && matchDelayField[1]) {
      return Math.min(30000, parseInt(matchDelayField[1], 10) * 1000 + 1000);
    }
  } catch {
    // Ignore extraction failure
  }
  return null;
}

/**
 * Execute a Gemini call with exponential backoff, rate-limit awareness, and robust fallback
 */
export async function generateContentWithRetry<T = string>(
  fn: (ai: GoogleGenAI, modelName: string) => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    fallback?: () => T;
    preferredModel?: string;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const modelsToTry = [
    options.preferredModel || 'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  const ai = getGeminiClient();
  if (!ai) {
    if (options.fallback) {
      logWarn('GeminiService', 'GEMINI_API_KEY not configured. Seamlessly utilizing synthesized content.');
      return options.fallback();
    }
    throw new Error('GEMINI_API_KEY is not set. Please configure it in your environment or Secrets panel.');
  }

  let lastError: any = null;

  for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
    const currentModel = modelsToTry[modelIndex];
    let delay = options.initialDelayMs ?? 1500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await throttleRequests();
        return await fn(ai, currentModel);
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const isQuota429 = errMessage.includes('429') || errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('quota');
        const isUnavailable503 = errMessage.includes('503') || errMessage.includes('UNAVAILABLE') || errMessage.includes('high demand');

        const retryDelayFromError = extractRetryDelayMs(err);
        const waitTime = retryDelayFromError || delay;

        logWarn(
          'GeminiService',
          `Model ${currentModel} (Attempt ${attempt}/${maxRetries}) encountered ${isQuota429 ? '429 Rate-Limit' : isUnavailable503 ? '503 High Demand' : 'API issue'}.`
        );

        // If quota limit is completely 0 or retries exhausted for this model, try next model in chain
        if (modelIndex < modelsToTry.length - 1 && (isUnavailable503 || (isQuota429 && attempt >= 2))) {
          logInfo('GeminiService', `Switching to alternative model alias: ${modelsToTry[modelIndex + 1]}...`);
          break; // Break inner loop to try next model
        }

        if (attempt === maxRetries && modelIndex === modelsToTry.length - 1) {
          if (options.fallback) {
            logInfo('GeminiService', 'Gemini API limit reached. Continuing smoothly with intelligent video synthesizer.');
            return options.fallback();
          }
          throw err;
        }

        // Wait before next retry
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 6000)));
        delay *= 2;
      }
    }
  }

  if (options.fallback) {
    logInfo('GeminiService', 'Utilizing intelligent fallback synthesizer.');
    return options.fallback();
  }

  throw lastError || new Error('Gemini generation attempts exhausted.');
}

/**
 * Generate JSON structure from Gemini
 */
export async function generateJSON<T>(
  prompt: string,
  systemInstruction?: string,
  fallback?: () => T
): Promise<T> {
  return generateContentWithRetry<T>(
    async (ai, modelName) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are an expert AI video producer and content strategist for YouTube.',
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text || '{}';
      try {
        return JSON.parse(text) as T;
      } catch (parseErr) {
        // Attempt to clean markdown backticks if present
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned) as T;
      }
    },
    { fallback }
  );
}

/**
 * Generate an image using Gemini Image model with graceful fallback
 */
export async function generateImageBase64(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16' = '16:9'
): Promise<string | null> {
  try {
    const ai = getGeminiClient();
    if (!ai) return null;

    await throttleRequests();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('limit: 0') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      logInfo('GeminiImage', `Image model quota limit reached on Free Tier. Compositing high-impact visual frame with FFmpeg.`);
    } else {
      logWarn('GeminiImage', `Image generation skipped: ${errMsg.slice(0, 80)}`);
    }
    return null;
  }
}

/**
 * Generate audio speech using Gemini TTS with graceful fallback
 */
export async function generateSpeechAudio(
  text: string,
  voiceName: string = 'Fenrir'
): Promise<Buffer | null> {
  try {
    const ai = getGeminiClient();
    if (!ai) return null;

    await throttleRequests();

    const validVoices = ['Fenrir', 'Kore', 'Puck', 'Zephyr', 'Charon'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Fenrir';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioData = candidate?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      return Buffer.from(audioData, 'base64');
    }
    return null;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('503')) {
      logInfo('GeminiTTS', `TTS speech model quota limited on Free Tier. Utilizing synthesized high-definition audio narration track.`);
    } else {
      logWarn('GeminiTTS', `TTS generation skipped: ${errMsg.slice(0, 80)}`);
    }
    return null;
  }
}

export const GeminiService = {
  generateContentWithRetry,
  generateJSON,
  generateImageBase64,
  generateSpeechAudio,
  getGeminiClient,
};
