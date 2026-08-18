#!/usr/bin/env node

import { orchestrator } from '../core/workflow.js';
import { memory } from '../core/memory.js';
import { config } from '../core/config.js';
import { YouTubeService } from '../core/youtube.js';
import { VideoFormat, VoicePersona, FootageSource, PrivacyStatus } from '../types.js';

function printBanner() {
  console.log(`
\x1b[36m==================================================================\x1b[0m
\x1b[1m\x1b[33m 🚀 RUFLO MULTI-AGENT YOUTUBE STUDIO \x1b[0m
\x1b[90m Automated Video Creation & Publishing via Google Gemini & FFmpeg\x1b[0m
\x1b[36m==================================================================\x1b[0m
`);
}

function printHelp() {
  printBanner();
  console.log(`
\x1b[1mUSAGE:\x1b[0m
  $ \x1b[32mruflo youtube create\x1b[0m \x1b[33m"<topic>"\x1b[0m [options]
  $ \x1b[32mruflo status\x1b[0m
  $ \x1b[32mruflo list\x1b[0m
  $ \x1b[32mruflo help\x1b[0m

\x1b[1mEXAMPLES:\x1b[0m
  $ ruflo youtube create "GTA 5 police chase"
  $ ruflo youtube create "GTA 5 5-star police chase escape" --upload
  $ ruflo youtube create "GTA 5 police chase" --schedule "2026-08-25T18:00:00Z"
  $ ruflo youtube create "GTA 5 supercar stunts" --format shorts --voice Fenrir
  $ ruflo youtube create "GTA 5 highway getaway" --input-clips ./my_clips/ --upload

\x1b[1mOPTIONS:\x1b[0m
  \x1b[33m--upload\x1b[0m               Publish directly to YouTube via YouTube Data API
  \x1b[33m--schedule <date>\x1b[0m      Schedule YouTube release (ISO 8601 string)
  \x1b[33m--dry-run\x1b[0m              Run full workflow without uploading (Default: true if no --upload)
  \x1b[33m--format <type>\x1b[0m        Video format: \x1b[35mshorts\x1b[0m (9:16) or \x1b[35mlandscape\x1b[0m (16:9)
  \x1b[33m--voice <name>\x1b[0m         Gemini TTS voice: \x1b[35mFenrir\x1b[0m, \x1b[35mKore\x1b[0m, \x1b[35mPuck\x1b[0m, \x1b[35mZephyr\x1b[0m, \x1b[35mCharon\x1b[0m
  \x1b[33m--source <source>\x1b[0m      Footage source: \x1b[35mai_generated\x1b[0m, \x1b[35muser_clips\x1b[0m, \x1b[35mhybrid\x1b[0m
  \x1b[33m--input-clips <dir>\x1b[0m    Directory containing user-provided GTA 5 gameplay MP4s
  \x1b[33m--privacy <status>\x1b[0m     Privacy: \x1b[35mprivate\x1b[0m, \x1b[35munlisted\x1b[0m, \x1b[35mpublic\x1b[0m (Default: private)
`);
}

async function showStatus() {
  printBanner();
  console.log('\x1b[1m--- SYSTEM & CREDENTIAL STATUS ---\x1b[0m');
  console.log(`Gemini API Key:       ${config.geminiApiKey ? '\x1b[32m✔ Configured\x1b[0m' : '\x1b[31m✖ Missing (GEMINI_API_KEY)\x1b[0m'}`);
  console.log(`YouTube Client ID:    ${config.youtubeClientId ? '\x1b[32m✔ Configured\x1b[0m' : '\x1b[33m⚠ Not Set (YOUTUBE_CLIENT_ID)\x1b[0m'}`);
  console.log(`YouTube Client Secret:${config.youtubeClientSecret ? '\x1b[32m✔ Configured\x1b[0m' : '\x1b[33m⚠ Not Set (YOUTUBE_CLIENT_SECRET)\x1b[0m'}`);
  console.log(`YouTube Refresh Token:${config.youtubeRefreshToken ? '\x1b[32m✔ Configured\x1b[0m' : '\x1b[33m⚠ Not Set (YOUTUBE_REFRESH_TOKEN)\x1b[0m'}`);
  console.log(`YouTube OAuth Status: ${YouTubeService.isConfigured() ? '\x1b[32m✔ Ready for Live Uploads\x1b[0m' : '\x1b[33m⚠ Dry-Run Only\x1b[0m'}`);
  console.log(`Output Directory:     ${config.outputDir}`);
  console.log(`Gameplay Clips Dir:   ${config.clipsDir}\n`);
}

async function listJobs() {
  printBanner();
  const jobs = memory.getAllJobs();
  if (jobs.length === 0) {
    console.log('No previous Ruflo workflow jobs found.');
    return;
  }
  console.log(`Found ${jobs.length} workflow job(s):\n`);
  jobs.forEach((job, idx) => {
    const statusColor = job.status === 'completed' ? '\x1b[32m' : job.status === 'failed' ? '\x1b[31m' : '\x1b[33m';
    console.log(`[${idx + 1}] ID: ${job.id} | Topic: "${job.topic}" | Status: ${statusColor}${job.status.toUpperCase()}\x1b[0m`);
    if (job.artifacts.videoEditing) {
      console.log(`    Video: ${job.artifacts.videoEditing.videoFilePath}`);
    }
    if (job.artifacts.youtubeUpload?.videoUrl) {
      console.log(`    YouTube: ${job.artifacts.youtubeUpload.videoUrl}`);
    }
    console.log('');
  });
}

export async function runCli(args = process.argv.slice(2)) {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    return;
  }

  if (args[0] === 'status') {
    await showStatus();
    return;
  }

  if (args[0] === 'list') {
    await listJobs();
    return;
  }

  // Check `ruflo youtube create <topic>` or `ruflo create <topic>`
  let topicIndex = -1;
  if (args[0] === 'youtube' && args[1] === 'create') {
    topicIndex = 2;
  } else if (args[0] === 'create') {
    topicIndex = 1;
  }

  if (topicIndex === -1 || !args[topicIndex]) {
    console.error('\x1b[31mError: Missing topic. Usage: ruflo youtube create "<topic>"\x1b[0m');
    printHelp();
    process.exit(1);
  }

  const topic = args[topicIndex];
  const flagArgs = args.slice(topicIndex + 1);

  let upload = false;
  let scheduleDate: string | undefined;
  let dryRun = true;
  let format: VideoFormat = 'shorts';
  let voice: VoicePersona = 'Fenrir';
  let footageSource: FootageSource = 'hybrid';
  let inputClipsDir: string | undefined;
  let privacyStatus: PrivacyStatus = 'private';

  for (let i = 0; i < flagArgs.length; i++) {
    const arg = flagArgs[i];
    if (arg === '--upload') {
      upload = true;
      dryRun = false;
    } else if (arg === '--dry-run') {
      dryRun = true;
      upload = false;
    } else if (arg === '--schedule' && flagArgs[i + 1]) {
      scheduleDate = flagArgs[++i];
      upload = true;
      dryRun = false;
    } else if (arg === '--format' && flagArgs[i + 1]) {
      format = flagArgs[++i] as VideoFormat;
    } else if (arg === '--voice' && flagArgs[i + 1]) {
      voice = flagArgs[++i] as VoicePersona;
    } else if (arg === '--source' && flagArgs[i + 1]) {
      footageSource = flagArgs[++i] as FootageSource;
    } else if (arg === '--input-clips' && flagArgs[i + 1]) {
      inputClipsDir = flagArgs[++i];
    } else if (arg === '--privacy' && flagArgs[i + 1]) {
      privacyStatus = flagArgs[++i] as PrivacyStatus;
    }
  }

  printBanner();
  console.log(`\x1b[1mExecuting Ruflo Multi-Agent Workflow:\x1b[0m`);
  console.log(`• Topic:        \x1b[33m"${topic}"\x1b[0m`);
  console.log(`• Format:       \x1b[35m${format}\x1b[0m`);
  console.log(`• Voice:        \x1b[35m${voice}\x1b[0m`);
  console.log(`• Source:       \x1b[35m${footageSource}\x1b[0m`);
  console.log(`• Mode:         ${dryRun ? '\x1b[34m[DRY-RUN]\x1b[0m' : '\x1b[32m[LIVE UPLOAD]\x1b[0m'}`);
  if (scheduleDate) {
    console.log(`• Schedule:     \x1b[36m${scheduleDate}\x1b[0m`);
  }
  console.log('---------------------------------------------------\n');

  try {
    const job = await orchestrator.executeWorkflow({
      topic,
      format,
      voice,
      footageSource,
      upload,
      scheduleDate,
      dryRun,
      inputClipsDir,
      privacyStatus,
    });

    console.log('\n\x1b[32m===================================================\x1b[0m');
    console.log('\x1b[1m\x1b[32m✔ RUFLO WORKFLOW COMPLETED SUCCESSFULLY!\x1b[0m');
    console.log('\x1b[32m===================================================\x1b[0m');
    console.log(`\x1b[1mJob ID:\x1b[0m         ${job.id}`);
    console.log(`\x1b[1mTitle:\x1b[0m          ${job.artifacts.seo?.selectedTitle}`);
    console.log(`\x1b[1mVideo File:\x1b[0m     \x1b[36m${job.artifacts.videoEditing?.videoFilePath}\x1b[0m`);
    console.log(`\x1b[1mThumbnail:\x1b[0m      \x1b[36m${job.artifacts.thumbnail?.imagePath}\x1b[0m`);
    console.log(`\x1b[1mQC Score:\x1b[0m       \x1b[33m${job.artifacts.qualityControl?.overallScore}/100\x1b[0m`);
    console.log(`\x1b[1mYouTube URL:\x1b[0m    \x1b[34m${job.artifacts.youtubeUpload?.videoUrl}\x1b[0m (${job.artifacts.youtubeUpload?.isDryRun ? 'Dry Run' : 'Published'})\n`);
  } catch (err: any) {
    console.error(`\n\x1b[31m✖ Pipeline Failed:\x1b[0m ${err.message || err}`);
    process.exit(1);
  }
}

// Auto-run if executed directly via CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('ruflo.js') || process.argv[1]?.endsWith('index.ts')) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
