import fs from 'fs';
import path from 'path';
import { BaseAgent } from './BaseAgent.js';
import { AgentId, VideoEditingData, WorkflowJob } from '../../types.js';
import { FFmpegService } from '../ffmpeg.js';
import { config } from '../config.js';
import { memory } from '../memory.js';

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
        imagePath: matchedAsset?.filePath && (matchedAsset.filePath.endsWith('.png') || matchedAsset.filePath.endsWith('.jpg')) ? matchedAsset.filePath : undefined,
        videoPath: matchedAsset?.filePath && (matchedAsset.filePath.endsWith('.mp4') || matchedAsset.filePath.endsWith('.mov') || matchedAsset.filePath.endsWith('.webm')) ? matchedAsset.filePath : undefined,
        subtitleText: scene.subtitleText,
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
        sfxCue: 'WHOOSH',
      });
    }

    // 1. Generate SRT subtitle file
    this.updateProgress(job.id, 30, 'Generating synchronized animated captions & subtitles...');
    FFmpegService.generateSrtFile(
      scenesToRender.map((s) => ({ duration: s.duration, subtitleText: s.subtitleText })),
      subtitlesSrtPath
    );

    // 2. Render Full Video via FFmpeg
    this.updateProgress(job.id, 50, 'Rendering scene transitions, zoom/pan dynamics & ducked audio...');
    await FFmpegService.renderFullVideo({
      jobId: job.id,
      game,
      format,
      scenes: scenesToRender,
      voiceoverAudioPath: voiceover?.audioFilePath,
      outputPath: outputVideoPath,
      subtitlesSrtPath,
    });

    // 3. Validate Final MP4 Artifact
    this.updateProgress(job.id, 85, 'Validating output MP4 stream, bitrates & container health...');
    const validation = await FFmpegService.validateVideo(outputVideoPath);

    if (!validation.isValid) {
      throw new Error(`Video validation failed: ${validation.error}`);
    }

    // 4. Calculate chapters for long-form format
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
      durationSeconds: Math.round(validation.duration || scenesToRender.reduce((a, s) => a + s.duration, 0)),
      resolution: format === 'shorts' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
      aspectRatio: format,
      subtitlesPath: subtitlesSrtPath,
      hasAudioDucking: true,
      fileSizeBytes: validation.sizeBytes,
      chapters: chapters.length > 0 ? chapters : undefined,
    };

    memory.setArtifact(job.id, 'videoEditing', result);
    this.complete(job.id, `Video rendered & validated (${result.durationSeconds}s, ${(result.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)`, {
      videoPath: outputVideoPath,
      resolution: `${result.resolution.width}x${result.resolution.height}`,
      subtitles: subtitlesSrtPath,
    });

    return result;
  }
}
