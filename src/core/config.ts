import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AppConfig {
  geminiApiKey: string;
  youtubeClientId?: string;
  youtubeClientSecret?: string;
  youtubeRefreshToken?: string;
  youtubeChannelId?: string;
  outputDir: string;
  clipsDir: string;
  isProduction: boolean;
}

const OUTPUT_DIR = path.resolve(process.cwd(), '.ruflo-output');
const CLIPS_DIR = path.resolve(process.cwd(), '.ruflo-output', 'clips');
const TEMP_DIR = path.resolve(process.cwd(), '.ruflo-output', 'temp');

// Ensure essential directories exist
[OUTPUT_DIR, CLIPS_DIR, TEMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const config: AppConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  youtubeClientId: process.env.YOUTUBE_CLIENT_ID || '',
  youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
  youtubeRefreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
  youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID || '',
  outputDir: OUTPUT_DIR,
  clipsDir: CLIPS_DIR,
  isProduction: process.env.NODE_ENV === 'production',
};

/**
 * Sanitizes any string to prevent leaking API keys or secrets in logs
 */
export function sanitizeLog(message: string): string {
  if (!message) return '';
  let sanitized = message;
  const secrets = [
    config.geminiApiKey,
    config.youtubeClientSecret,
    config.youtubeRefreshToken,
  ].filter(Boolean);

  secrets.forEach((secret) => {
    if (secret && secret.length > 6) {
      sanitized = sanitized.split(secret).join('[REDACTED_SECRET]');
    }
  });

  return sanitized;
}

export function logInfo(agent: string, message: string) {
  const safeMsg = sanitizeLog(message);
  console.log(`[Ruflo::${agent}] ℹ️ ${safeMsg}`);
}

export function logWarn(agent: string, message: string) {
  const safeMsg = sanitizeLog(message);
  console.warn(`[Ruflo::${agent}] ⚠️ ${safeMsg}`);
}

export function logError(agent: string, message: string, err?: any) {
  const safeMsg = sanitizeLog(message);
  const errMsg = err ? (err.message ? sanitizeLog(err.message) : String(err)) : '';
  console.error(`[Ruflo::${agent}] ❌ ${safeMsg} ${errMsg}`);
}
