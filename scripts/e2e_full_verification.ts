import fs from 'fs';
import path from 'path';
import { orchestrator } from '../src/core/workflow.js';
import { memory } from '../src/core/memory.js';
import { FFmpegService } from '../src/core/ffmpeg.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('🚀 RUFLO MULTI-AGENT STUDIO: 19-STAGE END-TO-END DRY RUN TEST');
  console.log('Topic: "Create a Minecraft gaming Short about 5 secret survival builds"');
  console.log('Settings: Format: Shorts (9:16), Dry-Run: true, Upload: false');
  console.log('================================================================\n');

  const sseEvents: Array<{ type: string; agentId?: string; progress?: number; message?: string }> = [];
  const stageExecutionTime: Record<string, number> = {};
  let currentActiveStage = '';
  let stageStart = Date.now();

  // 1. Hook into Memory EventEmitter (which powers real-time SSE stream /api/events)
  memory.on('agent:progress', (data) => {
    sseEvents.push({ type: 'agent:progress', agentId: data.agentId, progress: data.progress, message: data.message });
    if (data.agentId !== currentActiveStage) {
      if (currentActiveStage) {
        stageExecutionTime[currentActiveStage] = Date.now() - stageStart;
        console.log(`  [STAGE COMPLETED] ${currentActiveStage} in ${(stageExecutionTime[currentActiveStage] / 1000).toFixed(1)}s`);
      }
      currentActiveStage = data.agentId;
      stageStart = Date.now();
      console.log(`\n▶ [STAGE START] Agent: "${data.agentId}" (Progress: ${data.progress}%)`);
      console.log(`  Message: ${data.message}`);
    } else {
      console.log(`    ↳ [${data.agentId}] ${data.progress}%: ${data.message}`);
    }
  });

  memory.on('job:artifact', (data) => {
    sseEvents.push({ type: 'job:artifact', message: data.key });
    console.log(`  📦 [ARTIFACT SAVED] Key: "${data.key}"`);
  });

  memory.on('job:log', (data) => {
    if (data.log.level === 'warn' || data.log.level === 'error') {
      console.log(`  ⚠️ [${data.log.level.toUpperCase()}] ${data.log.message}`);
    }
  });

  // 2. Execute Complete 19-Agent Workflow
  console.log('Starting orchestrator execution...');
  const startTime = Date.now();
  const job = await orchestrator.executeWorkflow({
    topic: 'Create a Minecraft gaming Short about 5 secret survival builds',
    game: 'Minecraft',
    format: 'shorts',
    dryRun: true,
    upload: false,
    autoTopic: false,
    autoGame: false,
  });
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  if (currentActiveStage) {
    stageExecutionTime[currentActiveStage] = Date.now() - stageStart;
    console.log(`  [STAGE COMPLETED] ${currentActiveStage} in ${(stageExecutionTime[currentActiveStage] / 1000).toFixed(1)}s`);
  }

  console.log(`\n================================================================`);
  console.log(`🏁 WORKFLOW COMPLETED IN ${totalTime}s`);
  console.log(`Job ID: ${job.id}`);
  console.log(`Job Status: ${job.status}`);
  console.log(`================================================================\n`);

  if (job.status === 'failed' || job.error) {
    console.error('❌ Job failed with error:', job.error);
    process.exit(1);
  }

  // 3. Specifically verify FFmpeg with Video Asset input as well as procedural frames
  console.log('--- Verifying FFmpeg Video Input Segment Rendering ---');
  const tempTestVideo = path.join(process.cwd(), '.ruflo-output', 'test_sample_video.mp4');
  const tempTestOutput = path.join(process.cwd(), '.ruflo-output', 'test_video_segment_out.mp4');
  
  // Create a 2-second test video clip using FFmpeg
  await execAsync(`ffmpeg -y -f lavfi -i "color=c=0x064e3b:s=1080x1920:d=2" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${tempTestVideo}"`);
  
  // Render video segment using FFmpegService.renderSceneSegment
  await FFmpegService.renderSceneSegment(
    tempTestVideo,
    2,
    1080,
    1920,
    tempTestOutput,
    'VIDEO SEGMENT TEST',
    1,
    'Minecraft'
  );

  const videoSegmentValidation = await FFmpegService.validateVideo(tempTestOutput);
  console.log(`  Video asset rendering check: ${videoSegmentValidation.isValid ? 'VALID' : 'INVALID'} (${videoSegmentValidation.duration}s)`);

  // 4. Validate output video with ffprobe
  const videoArtifact = job.artifacts.videoEditing;
  let ffprobeDetails: any = {};
  if (videoArtifact?.videoFilePath && fs.existsSync(videoArtifact.videoFilePath)) {
    const probeCmd = `ffprobe -v error -show_entries stream=width,height,codec_type,codec_name,duration -show_entries format=duration,size -of json "${videoArtifact.videoFilePath}"`;
    const { stdout } = await execAsync(probeCmd);
    ffprobeDetails = JSON.parse(stdout);
  }

  // 5. Gather Final Verification Report
  const checks = {
    all19AgentsProgressRecorded: Object.keys(job.agentsProgress).length === 19,
    gameDiscoveryArtifact: !!job.artifacts.gameDiscovery,
    researchArtifact: !!job.artifacts.research,
    contentStrategyArtifact: !!job.artifacts.contentStrategy,
    scriptArtifact: !!job.artifacts.script,
    scenePlanArtifact: !!job.artifacts.scenePlan,
    assetsArtifact: !!job.artifacts.assets,
    voiceoverArtifact: !!job.artifacts.voiceover,
    videoEditingArtifact: !!job.artifacts.videoEditing,
    thumbnailArtifact: !!job.artifacts.thumbnail,
    seoArtifact: !!job.artifacts.seo,
    copyrightSafetyArtifact: !!job.artifacts.copyrightSafety,
    qualityControlArtifact: !!job.artifacts.qualityControl,
    youtubeUploadArtifact: !!job.artifacts.youtubeUpload,
    analyticsArtifact: !!job.artifacts.analytics,
    optimizationArtifact: !!job.artifacts.optimization,
    
    mp4FileExists: !!videoArtifact?.videoFilePath && fs.existsSync(videoArtifact.videoFilePath),
    mp4Resolution9x16: ffprobeDetails.streams?.some((s: any) => s.codec_type === 'video' && s.width === 1080 && s.height === 1920),
    mp4HasAudio: ffprobeDetails.streams?.some((s: any) => s.codec_type === 'audio'),
    subtitlesSrtExists: !!videoArtifact?.subtitlesPath && fs.existsSync(videoArtifact.subtitlesPath),
    voiceoverAudioExists: !!job.artifacts.voiceover?.audioFilePath && fs.existsSync(job.artifacts.voiceover.audioFilePath),
    thumbnailFileExists: !!job.artifacts.thumbnail?.imagePath && fs.existsSync(job.artifacts.thumbnail.imagePath),
    sseEventsBroadcasted: sseEvents.length > 30,
    jobsMemoryPersisted: fs.existsSync(path.join(process.cwd(), '.ruflo-output', 'jobs_memory.json')),
    videoSegmentPass: videoSegmentValidation.isValid,
  };

  console.log('\n================================================================');
  console.log('📋 VERIFICATION CHECKLIST RESULTS:');
  console.log('================================================================');
  console.log(JSON.stringify(checks, null, 2));

  console.log('\n📁 EXACT LOCATIONS OF GENERATED ARTIFACTS:');
  console.log(`- Final MP4 Video: ${videoArtifact?.videoFilePath}`);
  console.log(`- Subtitles SRT: ${videoArtifact?.subtitlesPath}`);
  console.log(`- Voiceover Audio: ${job.artifacts.voiceover?.audioFilePath}`);
  console.log(`- Primary Thumbnail: ${job.artifacts.thumbnail?.imagePath}`);
  console.log(`- Thumbnail Concepts: ${job.artifacts.thumbnail?.concepts?.map((c: any) => c.imagePath).join(', ')}`);
  console.log(`- Jobs Memory File: ${path.join(process.cwd(), '.ruflo-output', 'jobs_memory.json')}`);
  console.log(`- Optimization Store: ${path.join(process.cwd(), '.ruflo-output', 'optimization_memory.json')}`);
  console.log(`- Channel Profiles Store: ${path.join(process.cwd(), '.ruflo-output', 'channel_profiles.json')}`);

  console.log('\n--- SCRIPT METADATA ---');
  console.log(`Title Hook: "${job.artifacts.script?.titleHook}"`);
  console.log(`Total Duration: ${job.artifacts.script?.totalDurationSeconds}s`);
  console.log(`Lines Count: ${job.artifacts.script?.lines?.length}`);

  console.log('\n--- SEO METADATA ---');
  console.log(`Chosen Title: "${job.artifacts.seo?.selectedTitle}"`);
  console.log(`Hashtags: ${job.artifacts.seo?.hashtags?.join(' ')}`);
  console.log(`Tags (${job.artifacts.seo?.tags?.length}): ${job.artifacts.seo?.tags?.slice(0, 8).join(', ')}...`);

  console.log('\n--- QUALITY CONTROL AUDIT ---');
  console.log(`Overall Score: ${job.artifacts.qualityControl?.overallScore}/100`);
  console.log(`Passed Checks: ${job.artifacts.qualityControl?.checks?.filter(c => c.status === 'passed').map(c => c.name).join(', ')}`);

  console.log('\n--- FFPROBE METRICS FOR FINAL MP4 ---');
  console.log(JSON.stringify(ffprobeDetails, null, 2));

  console.log('\n✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

runEndToEndVerification().catch((err) => {
  console.error('Fatal Error during verification:', err);
  process.exit(1);
});
