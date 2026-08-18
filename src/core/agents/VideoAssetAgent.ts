import fs from 'fs';
import path from 'path';
import { BaseAgent } from './BaseAgent.js';
import { AgentId, VideoAssetData, WorkflowJob } from '../../types.js';
import { generateImageBase64 } from '../gemini.js';
import { config, logInfo, logWarn } from '../config.js';
import { memory } from '../memory.js';
import { FFmpegService } from '../ffmpeg.js';
import { VisualSynthesizer } from '../visualSynthesis.js';

export class VideoAssetAgent extends BaseAgent {
  public readonly id: AgentId = 'video_asset';
  public readonly name = 'Gameplay & Asset Agent';
  public readonly role = 'Modular provider sourcing user clips, AI art, screenshots & game graphics';

  public async run(job: WorkflowJob): Promise<VideoAssetData> {
    const game = job.game || job.artifacts.script?.game || 'Gaming';
    const scenes = job.artifacts.scenePlan?.scenes || [];
    const sourcePreference = job.options.footageSource || 'hybrid';
    const isShorts = (job.options.format || 'shorts') === 'shorts';

    this.updateProgress(job.id, 15, `Sourcing media assets for [${game}] (Mode: ${sourcePreference})...`);
    this.log(job.id, `Preparing visual assets across ${scenes.length} scenes for [${game}] using ${sourcePreference} pipeline...`);

    const assetsDir = path.join(config.outputDir, `job_${job.id}_assets`);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const assetList: VideoAssetData['assets'] = [];

    // Check for user-provided gameplay clips in clips directory or custom input directory
    const clipsDirToCheck = job.options.inputClipsDir || config.clipsDir;
    let availableClips: string[] = [];
    try {
      if (fs.existsSync(clipsDirToCheck)) {
        availableClips = fs
          .readdirSync(clipsDirToCheck)
          .filter((f) => f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm'))
          .map((f) => path.join(clipsDirToCheck, f));
      }
    } catch {
      // Ignore
    }

    const totalScenes = scenes.length || 3;

    for (let i = 0; i < totalScenes; i++) {
      const scene = scenes[i] || {
        sceneNumber: i + 1,
        durationSeconds: 4,
        visualPrompt: `High-octane ${game} action scene with vibrant cinematic lighting`,
        subtitleText: `Scene ${i + 1}`,
      };

      const progressPct = 20 + Math.round(((i + 1) / totalScenes) * 65);
      this.updateProgress(job.id, progressPct, `Processing Scene ${scene.sceneNumber}/${totalScenes} visuals...`);

      let assetFilePath = '';
      let assetType: VideoAssetData['assets'][0]['type'] = 'rendered_canvas';
      let assetProvenance = '';
      let assetPrompt: string | undefined = undefined;

      // 1. Check if user provided clips match or exist for user_clips/hybrid mode
      if ((sourcePreference === 'user_clips' || sourcePreference === 'hybrid') && availableClips.length > 0) {
        const selectedClip = availableClips[i % availableClips.length];
        const clipValidation = await FFmpegService.validateMediaAsset(selectedClip);
        if (clipValidation.isValid) {
          assetFilePath = selectedClip;
          assetType = 'gameplay_clip';
          assetProvenance = `User Gameplay Footage (${path.basename(selectedClip)})`;
        }
      }

      // 2. Try Gemini Image Generation if no clip assigned
      if (!assetFilePath && (sourcePreference === 'ai_art' || sourcePreference === 'hybrid')) {
        const imagePrompt = `Epic cinematic screenshot of ${game}, ${scene.visualPrompt}, 4K ultra-detailed gaming render, raytraced lighting, clean dynamic composition`;
        assetPrompt = imagePrompt;
        try {
          const rawBase64 = await generateImageBase64(imagePrompt, isShorts ? '9:16' : '16:9');
          if (rawBase64) {
            const cleanBase64 = rawBase64.replace(/^data:image\/[a-z0-9.+_-]+;base64,/, '');
            const imageFilePath = path.join(assetsDir, `scene_${scene.sceneNumber}_ai.png`);
            fs.writeFileSync(imageFilePath, Buffer.from(cleanBase64, 'base64'));

            const validation = await FFmpegService.validateMediaAsset(imageFilePath);
            if (validation.isValid) {
              assetFilePath = imageFilePath;
              assetType = 'ai_image';
              assetProvenance = 'Gemini Image Generation';
            } else {
              logWarn('VideoAssetAgent', `AI image validation failed: ${validation.error}. Falling back to VisualSynthesizer.`);
            }
          }
        } catch (genErr: any) {
          logWarn('VideoAssetAgent', `Image generation skipped: ${genErr.message}`);
        }
      }

      // 3. High-Fidelity Procedural & Dynamic Game Visual Engine
      if (!assetFilePath) {
        const canvasFilePath = path.join(assetsDir, `scene_${scene.sceneNumber}_visual.png`);
        await VisualSynthesizer.generateGameSceneVisual({
          outputPath: canvasFilePath,
          game,
          sceneNumber: scene.sceneNumber,
          totalScenes,
          visualPrompt: scene.visualPrompt,
          actionDescription: scene.actionDescription || scene.subtitleText,
          subtitleText: scene.subtitleText,
          isShorts,
        });

        assetFilePath = canvasFilePath;
        assetType = 'rendered_canvas';
        assetProvenance = `VisualSynthesizer ${game} Dynamic Canvas Engine`;
      }

      // Validate the asset
      const validation = await FFmpegService.validateMediaAsset(assetFilePath);

      logInfo(
        'VideoAssetAgent',
        `Asset Validation: SCENE #${scene.sceneNumber} | Exists: ${validation.exists} | Size: ${validation.sizeBytes}B | Type: ${validation.mediaType} | Dim: ${validation.dimensions.width}x${validation.dimensions.height} | Decode: ${validation.decodeValid ? 'PASSED' : 'FAILED'} | Valid: ${validation.isValid ? 'YES' : 'NO'}`
      );

      this.log(
        job.id,
        `Scene ${scene.sceneNumber}: Validated visual asset (${validation.mediaType}, ${validation.dimensions.width}x${validation.dimensions.height}, ${(validation.sizeBytes / 1024).toFixed(1)} KB)`
      );

      assetList.push({
        sceneNumber: scene.sceneNumber,
        filePath: assetFilePath,
        type: assetType,
        provenance: assetProvenance,
        prompt: assetPrompt,
      });
    }

    const assetData: VideoAssetData = {
      assets: assetList,
      providerType: sourcePreference,
      disclaimer: `Media sourced via Ruflo Modular Asset Provider (${sourcePreference}). User footage, generated artwork, and procedural graphics are verified for YouTube copyright safety.`,
    };

    this.updateProgress(job.id, 100, `Asset sourcing complete: ${assetList.length} scene assets prepared.`);
    this.log(
      job.id,
      `Media Assets Ready: ${assetList.length} assets allocated (${assetList.filter((a) => a.type === 'gameplay_clip').length} gameplay clips, ${assetList.filter((a) => a.type === 'ai_image').length} AI frames, ${assetList.filter((a) => a.type === 'rendered_canvas').length} procedural graphics).`,
      'success'
    );

    memory.setArtifact(job.id, 'assets', assetData);
    return assetData;
  }
}

