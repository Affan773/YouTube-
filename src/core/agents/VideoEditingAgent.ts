import fs from 'fs';
import path from 'path';
import { BaseAgent } from './BaseAgent.js';
import { AgentId, VideoEditingData, WorkflowJob } from '../../types.js';
import { FFmpegService } from '../ffmpeg.js';
import { config, logInfo, logWarn } from '../config.js';
import { memory } from '../memory.js';
import { VisualSynthesizer } from '../visualSynthesis.js';

export class VideoEditingAgent extends BaseAgent {
  public readonly id: AgentId = 'video_editing';
  public readonly name = 'Video Editing Agent';
  public readonly role = 'FFmpeg Compositor, Pan/Zoom Animation, Audio Ducking & MP4 Validation';

  public async run(job: WorkflowJob): Promise<VideoEditingData> {
    const game = job.game || job.artifacts.script?.game || 'Gaming';
    const scenePlan = job.artifacts.scenePlan;
    const assets = job.artifacts.assets;
    const voiceover = job.artifacts.voiceover;
    const format = job.options.format || 'shorts';

    this.updateProgress(job.id, 15, `Initializing FFmpeg compositor for [${game}] (${format.toUpperCase()})...`);
    this.log(job.id, `Compositing multi-layer video for [${game}] (Format: ${format === 'shorts' ? '9:16 Shorts 1080x1920' : '16:9 1920x1080'})...`);

    const videosDir = path.join(config.outputDir, 'videos');
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }

    const outputVideoPath = path.join(videosDir, `${job.id}_final.mp4`);
    const subtitlesSrtPath = path.join(videosDir, `${job.id}_subtitles.srt`);

    // Prepare scenes with asset mappings
    const sceneAssets = assets?.assets || [];
    const scenesToRender = (scenePlan?.scenes || []).map((scene, idx) => {
      const matchedAsset = sceneAssets.find((a) => a.sceneNumber === scene.sceneNumber) || sceneAssets[idx];
      return {
        sceneNumber: scene.sceneNumber,
        duration: scene.durationSeconds,
        imagePath: matchedAsset?.filePath && (matchedAsset.filePath.endsWith('.png') || matchedAsset.filePath.endsWith('.jpg') || matchedAsset.filePath.endsWith('.webp')) ? matchedAsset.filePath : undefined,
        videoPath: matchedAsset?.filePath && (matchedAsset.filePath.endsWith('.mp4') || matchedAsset.filePath.endsWith('.mov') || matchedAsset.filePath.endsWith('.webm')) ? matchedAsset.filePath : undefined,
        subtitleText: scene.subtitleText,
        visualPrompt: scene.visualPrompt,
        actionDescription: scene.actionDescription,
        sfxCue: scene.sfxCue,
      };
    });

    if (scenesToRender.length === 0) {
      scenesToRender.push({
        sceneNumber: 1,
        duration: 15,
        imagePath: undefined,
        videoPath: undefined,
        subtitleText: `${game.toUpperCase()} HIGHLIGHTS`,
        visualPrompt: `Epic ${game} survival gameplay`,
        actionDescription: `Action gameplay highlights`,
        sfxCue: 'WHOOSH',
      });
    }

    // 1. Mandatory Pre-FFmpeg Asset Validation for EVERY scene
    this.updateProgress(job.id, 25, 'Auditing and validating media assets before FFmpeg assembly...');
    this.log(job.id, `Running strict pre-render asset validation across ${scenesToRender.length} scenes...`);

    for (let idx = 0; idx < scenesToRender.length; idx++) {
      const s = scenesToRender[idx];
      let assetPath = s.videoPath || s.imagePath;

      let validation = await FFmpegService.validateMediaAsset(assetPath);

      // If asset is missing or invalid, generate rich visual asset before passing to FFmpeg
      if (!validation.isValid) {
        logWarn('VideoEditingAgent', `Scene #${s.sceneNumber} asset invalid (${validation.error}). Synthesizing high-resolution game scene...`);
        const fallbackPath = path.join(videosDir, `job_${job.id}_scene_${s.sceneNumber}_fallback.png`);
        await VisualSynthesizer.generateGameSceneVisual({
          outputPath: fallbackPath,
          game,
          sceneNumber: s.sceneNumber,
          totalScenes: scenesToRender.length,
          visualPrompt: s.visualPrompt || s.subtitleText,
          actionDescription: s.actionDescription || s.subtitleText,
          subtitleText: s.subtitleText,
          isShorts: format === 'shorts',
        });

        s.imagePath = fallbackPath;
        s.videoPath = undefined;
        assetPath = fallbackPath;
        validation = await FFmpegService.validateMediaAsset(assetPath);
      }

      // Detailed validation logging
      const validationReport = `[Pre-FFmpeg Asset Validation]
SCENE #${s.sceneNumber}
Asset path: ${assetPath}
Exists: ${validation.exists}
File size: ${validation.sizeBytes} bytes
Media type: ${validation.mediaType}
Dimensions: ${validation.dimensions.width}x${validation.dimensions.height}
Decode test: ${validation.decodeValid ? 'PASSED' : 'FAILED'}
Valid: ${validation.isValid ? 'YES' : 'NO'}`;

      logInfo('VideoEditingAgent', validationReport);
      this.log(
        job.id,
        `Scene #${s.sceneNumber} Pre-Validation: ${validation.mediaType} (${validation.dimensions.width}x${validation.dimensions.height}, ${(validation.sizeBytes / 1024).toFixed(1)} KB) - ${validation.isValid ? 'PASSED' : 'FAILED'}`
      );

      if (!validation.isValid) {
        throw new Error(`Pre-FFmpeg validation failed for Scene #${s.sceneNumber}: ${validation.error}`);
      }
    }

    // 2. Generate SRT subtitle file
    this.updateProgress(job.id, 40, 'Generating synchronized animated captions & subtitles...');
    FFmpegService.generateSrtFile(
      scenesToRender.map((s) => ({ duration: s.duration, subtitleText: s.subtitleText })),
      subtitlesSrtPath
    );

    // 3. Render Full Video via FFmpeg
    this.updateProgress(job.id, 60, 'Rendering scene transitions, zoom/pan dynamics & ducked audio...');
    await FFmpegService.renderFullVideo({
      jobId: job.id,
      game,
      format,
      scenes: scenesToRender,
      voiceoverAudioPath: voiceover?.audioFilePath,
      outputPath: outputVideoPath,
      subtitlesSrtPath,
    });

    // 4. Validate Final MP4 Artifact (Stream probe + Visual frame sampling)
    this.updateProgress(job.id, 85, 'Validating output MP4 bitstreams & running visual frame variety sampling...');
    const streamValidation = await FFmpegService.validateVideo(outputVideoPath);

    if (!streamValidation.isValid) {
      throw new Error(`Video stream validation failed: ${streamValidation.error}`);
    }

    const visualValidation = await FFmpegService.validateVideoVisuals(outputVideoPath);
    logInfo('VideoEditingAgent', `Final Video Visual Validation: ${visualValidation.details}`);

    if (!visualValidation.isValid || visualValidation.isBlank) {
      throw new Error(`Video visual quality check failed: Video contains flat/blank/solid placeholder frames. ${visualValidation.details}`);
    }

    this.log(job.id, `Visual Frame Sampling Verified: ${visualValidation.details}`, 'success');

    // 5. Calculate chapters for long-form format
    const chapters: { time: string; title: string }[] = [];
    if (format === 'landscape') {
      let currentSecond = 0;
      scenesToRender.forEach((s, idx) => {
        const mins = Math.floor(currentSecond / 60);
        const secs = Math.floor(currentSecond % 60);
        chapters.push({
          time: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
          title: `Chapter ${idx + 1}: ${s.subtitleText || `Scene ${idx + 1}`}`,
        });
        currentSecond += s.duration;
      });
    }

    const result: VideoEditingData = {
      videoFilePath: outputVideoPath,
      durationSeconds: Math.round(streamValidation.duration || scenesToRender.reduce((a, s) => a + s.duration, 0)),
      resolution: format === 'shorts' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
      aspectRatio: format,
      subtitlesPath: subtitlesSrtPath,
      hasAudioDucking: true,
      fileSizeBytes: streamValidation.sizeBytes,
      chapters: chapters.length > 0 ? chapters : undefined,
    };

    memory.setArtifact(job.id, 'videoEditing', result);
    this.complete(job.id, `Video rendered & validated (${result.durationSeconds}s, ${(result.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB, Visual Variety Index: ${visualValidation.avgVariance.toFixed(1)}/100)`, {
      videoPath: outputVideoPath,
      resolution: `${result.resolution.width}x${result.resolution.height}`,
      subtitles: subtitlesSrtPath,
      visualVariance: visualValidation.avgVariance,
    });

    return result;
  }
}

