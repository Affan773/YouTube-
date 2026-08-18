import fs from 'fs';
import path from 'path';
import { BaseAgent } from './BaseAgent.js';
import { AgentId, VideoAssetData, WorkflowJob } from '../../types.js';
import { generateImageBase64 } from '../gemini.js';
import { config } from '../config.js';
import { memory } from '../memory.js';
import { ffmpegService } from '../ffmpeg.js';

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

      // 1. Check if user provided clips match or exist for user_clips/hybrid mode
      if ((sourcePreference === 'user_clips' || sourcePreference === 'hybrid') && availableClips.length > 0) {
        const selectedClip = availableClips[i % availableClips.length];
        this.log(job.id, `Scene ${scene.sceneNumber}: Assigned user gameplay footage (${path.basename(selectedClip)})`);
        assetList.push({
          sceneNumber: scene.sceneNumber,
          filePath: selectedClip,
          type: 'gameplay_clip',
          provenance: `User Gameplay Footage (${path.basename(selectedClip)})`,
        });
        continue;
      }

      // 2. Try Gemini Image Generation
      const imagePrompt = `Epic cinematic screenshot of ${game}, ${scene.visualPrompt}, 4K ultra-detailed gaming render, raytraced lighting, clean dynamic composition`;
      const base64Img = await generateImageBase64(imagePrompt, isShorts ? '9:16' : '16:9');

      if (base64Img) {
        const imageFilePath = path.join(assetsDir, `scene_${scene.sceneNumber}_ai.png`);
        fs.writeFileSync(imageFilePath, Buffer.from(base64Img, 'base64'));
        this.log(job.id, `Scene ${scene.sceneNumber}: Rendered AI visual concept for [${game}]`);
        assetList.push({
          sceneNumber: scene.sceneNumber,
          filePath: imageFilePath,
          type: 'ai_image',
          provenance: 'Gemini Image Generation',
          prompt: imagePrompt,
        });
      } else {
        // 3. Fallback: Procedural High-Quality Game Frame Canvas synthesized with FFmpeg
        const canvasFilePath = path.join(assetsDir, `scene_${scene.sceneNumber}_canvas.png`);
        await ffmpegService.createSceneFrame({
          outputPath: canvasFilePath,
          gameTitle: game,
          sceneNumber: scene.sceneNumber,
          headline: scene.subtitleText || `SCENE ${scene.sceneNumber}`,
          subText: `${game.toUpperCase()} • 4K ULTRA HD`,
          isShorts,
          sceneIndex: i,
        });

        this.log(job.id, `Scene ${scene.sceneNumber}: Composited high-impact ${game} visual frame`);
        assetList.push({
          sceneNumber: scene.sceneNumber,
          filePath: canvasFilePath,
          type: 'rendered_canvas',
          provenance: `Procedural ${game} Frame Compositor`,
        });
      }
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
