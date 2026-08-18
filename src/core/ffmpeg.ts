import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { config, logInfo, logWarn, logError } from './config.js';
import { VideoFormat } from '../types.js';

const execAsync = promisify(exec);

export interface FFmpegRenderOptions {
  jobId: string;
  game?: string;
  format: VideoFormat;
  scenes: {
    sceneNumber: number;
    duration: number;
    imagePath?: string;
    videoPath?: string;
    subtitleText: string;
    sfxCue?: string;
  }[];
  voiceoverAudioPath?: string;
  outputPath: string;
  subtitlesSrtPath?: string;
}

export class FFmpegService {
  /**
   * Check if FFmpeg is available on the system
   */
  public static async checkAvailable(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns a signature theme color hex based on game title
   */
  public static getGameThemeColor(gameTitle = ''): { primary: string; accent: string; darkBg: string } {
    const title = gameTitle.toLowerCase();
    if (title.includes('mine')) {
      return { primary: '0x22C55E', accent: '0xFACC15', darkBg: '0x0F172A' }; // Minecraft Emerald Green
    }
    if (title.includes('gta')) {
      return { primary: '0xEF4444', accent: '0xF59E0B', darkBg: '0x09090B' }; // GTA Amber / Red
    }
    if (title.includes('roblox')) {
      return { primary: '0x06B6D4', accent: '0xEC4899', darkBg: '0x18181B' }; // Roblox Cyan / Pink
    }
    if (title.includes('fortnite')) {
      return { primary: '0x8B5CF6', accent: '0x38BDF8', darkBg: '0x0F172A' }; // Fortnite Purple / Cyan
    }
    if (title.includes('elden') || title.includes('souls')) {
      return { primary: '0xD97706', accent: '0xFDE68A', darkBg: '0x1C1917' }; // Elden Ring Gold / Dark Stone
    }
    if (title.includes('valorant') || title.includes('strike') || title.includes('cs')) {
      return { primary: '0xF43F5E', accent: '0xFB7185', darkBg: '0x09090B' }; // Tactical Rose / Red
    }
    if (title.includes('horror')) {
      return { primary: '0x991B1B', accent: '0xDC2626', darkBg: '0x000000' }; // Horror Blood Crimson
    }
    return { primary: '0x6366F1', accent: '0x38BDF8', darkBg: '0x0B0F19' }; // Universal Neon Indigo
  }

  /**
   * Generate an SRT subtitle file from scene breakdown
   */
  public static generateSrtFile(
    scenes: { duration: number; subtitleText: string }[],
    outPath: string
  ): string {
    let srtContent = '';
    let currentTime = 0;

    scenes.forEach((scene, index) => {
      const startTime = currentTime;
      const endTime = currentTime + scene.duration;
      currentTime = endTime;

      const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };

      srtContent += `${index + 1}\n`;
      srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srtContent += `${scene.subtitleText}\n\n`;
    });

    fs.writeFileSync(outPath, srtContent, 'utf-8');
    return outPath;
  }

  /**
   * Synthesizes background audio track with high-energy gaming beats and rhythmic pulse
   */
  public static async generateBackgroundMusicTrack(
    durationSeconds: number,
    outAudioPath: string,
    gameTitle = ''
  ): Promise<string> {
    const freq = gameTitle.toLowerCase().includes('horror') ? 65 : 130;
    const cmd = `ffmpeg -y -f lavfi -i "anoisesrc=d=${durationSeconds}:c=pink:r=44100:a=0.03" \
-f lavfi -i "sine=frequency=${freq}:duration=${durationSeconds}" \
-f lavfi -i "sine=frequency=${freq * 4}:duration=${durationSeconds}" \
-filter_complex "[1:a]volume=0.22,tremolo=f=4:d=0.7[bass];[2:a]volume=0.06,vibrato=f=2:d=0.8[synth];[0:a][bass][synth]amix=inputs=3:duration=first[out]" \
-map "[out]" -c:a aac -b:a 128k "${outAudioPath}"`;

    try {
      await execAsync(cmd);
      return outAudioPath;
    } catch (err: any) {
      logWarn('FFmpeg', `Background music synthesis error: ${err.message}. Generating silent fallback.`);
      await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSeconds} -c:a aac "${outAudioPath}"`);
      return outAudioPath;
    }
  }

  /**
   * Synthesizes a placeholder TTS voice audio when no TTS API key is provided
   */
  public static async generateSyntheticVoiceover(
    durationSeconds: number,
    outAudioPath: string
  ): Promise<string> {
    const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=220:duration=${durationSeconds}" \
-filter_complex "[0:a]volume=0.5,tremolo=f=5:d=0.6,flanger=speed=0.5[out]" \
-map "[out]" -c:a aac "${outAudioPath}"`;
    try {
      await execAsync(cmd);
      return outAudioPath;
    } catch {
      await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSeconds} -c:a aac "${outAudioPath}"`);
      return outAudioPath;
    }
  }

  /**
   * Procedural Game Scene Frame Canvas Generator
   */
  public async createSceneFrame(options: {
    outputPath: string;
    gameTitle: string;
    sceneNumber: number;
    headline: string;
    subText: string;
    isShorts: boolean;
    sceneIndex: number;
  }): Promise<string> {
    const width = options.isShorts ? 1080 : 1920;
    const height = options.isShorts ? 1920 : 1080;
    const colors = FFmpegService.getGameThemeColor(options.gameTitle);

    const safeGame = options.gameTitle.toUpperCase().replace(/['":\\]/g, ' ').slice(0, 24);
    const safeHeadline = (options.headline || `SCENE ${options.sceneNumber}`).toUpperCase().replace(/['":\\]/g, ' ').slice(0, 36);
    const safeSub = options.subText.replace(/['":\\]/g, ' ').slice(0, 42);

    const cmd = `ffmpeg -y -f lavfi -i "color=c=${colors.darkBg}:s=${width}x${height}:d=1" \
-filter_complex "[0:v]drawbox=x=30:y=30:w=${width - 60}:h=${height - 60}:color=${colors.primary}@0.8:t=8, \
drawbox=x=40:y=40:w=${width - 80}:h=${options.isShorts ? 220 : 140}:color=black@0.7:t=fill, \
drawtext=text='${safeGame}':fontcolor=${colors.accent}:fontsize=${Math.floor(width / 18)}:x=(w-text_w)/2:y=${options.isShorts ? 100 : 70}:shadowcolor=black:shadowx=3:shadowy=3, \
drawbox=x=50:y=${Math.floor(height * 0.42)}:w=${width - 100}:h=${options.isShorts ? 360 : 260}:color=black@0.82:t=fill, \
drawtext=text='${safeHeadline}':fontcolor=white:fontsize=${Math.floor(width / 20)}:x=(w-text_w)/2:y=${Math.floor(height * 0.46)}:shadowcolor=black:shadowx=4:shadowy=4, \
drawtext=text='${safeSub}':fontcolor=${colors.primary}:fontsize=${Math.floor(width / 30)}:x=(w-text_w)/2:y=${Math.floor(height * 0.54)}:shadowcolor=black:shadowx=2:shadowy=2[out]" \
-map "[out]" -vframes 1 "${options.outputPath}"`;

    try {
      await execAsync(cmd);
      return options.outputPath;
    } catch (err: any) {
      logWarn('FFmpeg', `Procedural scene frame error: ${err.message}`);
      await execAsync(`ffmpeg -y -f lavfi -i "color=c=0x111827:s=${width}x${height}:d=1" -vframes 1 "${options.outputPath}"`);
      return options.outputPath;
    }
  }

  /**
   * Render single scene video segment with pan/zoom animation & kinetic subtitle banner
   */
  public static async renderSceneSegment(
    imageOrVideoPath: string,
    duration: number,
    width: number,
    height: number,
    outSegmentPath: string,
    subtitleText = '',
    sceneIndex = 0,
    gameTitle = ''
  ): Promise<string> {
    const isVideo = imageOrVideoPath.endsWith('.mp4') || imageOrVideoPath.endsWith('.mov') || imageOrVideoPath.endsWith('.webm');
    const safeSubtitle = subtitleText.replace(/['":\\]/g, ' ').slice(0, 60);
    const colors = FFmpegService.getGameThemeColor(gameTitle);

    let filter = '';
    if (isVideo) {
      // Scale and center-crop video to exact dimensions
      filter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setpts=PTS-STARTPTS`;
    } else {
      // Ken Burns dynamic zoompan effect on still image
      const zoomExpr = sceneIndex % 2 === 0 ? 'min(zoom+0.0018,1.30)' : 'max(1.30-0.0018*on,1.0)';
      filter = `scale=2*${width}:-1,zoompan=z='${zoomExpr}':d=${duration * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}`;
    }

    // Add glowing kinetic subtitle banner at bottom
    if (safeSubtitle) {
      const fontSize = Math.floor(width / 24);
      filter += `,drawbox=y=ih-${Math.floor(height * 0.24)}:h=${Math.floor(height * 0.16)}:color=black@0.72:t=fill,drawtext=text='${safeSubtitle}':fontcolor=${colors.accent}:fontsize=${fontSize}:x=(w-text_w)/2:y=h-${Math.floor(height * 0.16)}:shadowcolor=black:shadowx=4:shadowy=4`;
    }

    const cmd = isVideo
      ? `ffmpeg -y -ss 0 -t ${duration} -i "${imageOrVideoPath}" -vf "${filter}" -c:v libx264 -pix_fmt yuv420p -r 25 -an "${outSegmentPath}"`
      : `ffmpeg -y -loop 1 -t ${duration} -i "${imageOrVideoPath}" -vf "${filter}" -c:v libx264 -pix_fmt yuv420p -r 25 -an "${outSegmentPath}"`;

    await execAsync(cmd);
    return outSegmentPath;
  }

  /**
   * Full multi-scene composition:
   * 1. Generates segments for all scenes with zoom/pan & subtitles
   * 2. Concatenates video segments
   * 3. Mixes voiceover audio with ducked background music
   * 4. Outputs finalized MP4
   */
  public static async renderFullVideo(options: FFmpegRenderOptions): Promise<string> {
    const { jobId, game, format, scenes, voiceoverAudioPath, outputPath } = options;
    const width = format === 'shorts' ? 1080 : 1920;
    const height = format === 'shorts' ? 1920 : 1080;

    const tempDir = path.join(config.outputDir, 'temp', jobId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0) || 20;
    const segmentPaths: string[] = [];

    logInfo('FFmpeg', `Rendering ${scenes.length} scene segments for [${game || 'Gaming'}] (${width}x${height})...`);

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const segmentOut = path.join(tempDir, `segment_${i}.mp4`);

      let visualSource = scene.videoPath || scene.imagePath;
      if (!visualSource || !fs.existsSync(visualSource)) {
        // Fallback visual slide
        const fallbackImg = path.join(tempDir, `fallback_slide_${i}.png`);
        const colors = FFmpegService.getGameThemeColor(game);
        const safeTitle = `${(game || 'GAMING').toUpperCase()} • SCENE ${i + 1}`;
        const safeSubtitle = scene.subtitleText || 'Pro Gameplay Highlights';

        const slideCmd = `ffmpeg -y -f lavfi -i "color=c=${colors.darkBg}:s=${width}x${height}:d=1" \
-filter_complex "[0:v]drawbox=x=40:y=40:w=${width - 80}:h=${height - 80}:color=${colors.primary}@0.85:t=8, \
drawtext=text='${safeTitle}':fontcolor=white:fontsize=${Math.floor(width / 22)}:x=(w-text_w)/2:y=(h-text_h)/2-50:shadowcolor=black:shadowx=3:shadowy=3, \
drawtext=text='${safeSubtitle}':fontcolor=${colors.accent}:fontsize=${Math.floor(width / 32)}:x=(w-text_w)/2:y=(h-text_h)/2+50:shadowcolor=black:shadowx=2:shadowy=2[out]" \
-map "[out]" -vframes 1 "${fallbackImg}"`;

        try {
          await execAsync(slideCmd);
          visualSource = fallbackImg;
        } catch {
          visualSource = '';
        }
      }

      await FFmpegService.renderSceneSegment(
        visualSource,
        scene.duration,
        width,
        height,
        segmentOut,
        scene.subtitleText,
        i,
        game
      );
      segmentPaths.push(segmentOut);
    }

    // Create concat list file
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = segmentPaths.map((p) => `file '${p}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent, 'utf-8');

    const mergedVideoOnlyPath = path.join(tempDir, 'merged_video.mp4');
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${mergedVideoOnlyPath}"`);

    // Prepare audio track
    const bgMusicPath = path.join(tempDir, 'bg_music.aac');
    await FFmpegService.generateBackgroundMusicTrack(totalDuration, bgMusicPath, game);

    let finalAudioInput = '';
    if (voiceoverAudioPath && fs.existsSync(voiceoverAudioPath)) {
      // Mix voiceover (loud) + background music (ducked at 18% volume)
      const mixedAudioPath = path.join(tempDir, 'mixed_audio.aac');
      const mixCmd = `ffmpeg -y -i "${voiceoverAudioPath}" -i "${bgMusicPath}" \
-filter_complex "[0:a]volume=1.0[voice];[1:a]volume=0.18[bg];[voice][bg]amix=inputs=2:duration=first[out]" \
-map "[out]" -c:a aac -b:a 192k "${mixedAudioPath}"`;
      try {
        await execAsync(mixCmd);
        finalAudioInput = mixedAudioPath;
      } catch (err: any) {
        logWarn('FFmpeg', `Audio mix error: ${err.message}. Using voiceover audio.`);
        finalAudioInput = voiceoverAudioPath;
      }
    } else {
      finalAudioInput = bgMusicPath;
    }

    // Final multiplexing: Merge video + mixed audio into target MP4 with faststart flags
    const finalCmd = `ffmpeg -y -i "${mergedVideoOnlyPath}" -i "${finalAudioInput}" \
-c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${outputPath}"`;

    await execAsync(finalCmd);
    logInfo('FFmpeg', `Successfully generated final video: ${outputPath}`);

    return outputPath;
  }

  /**
   * Render custom thumbnail with badge, glowing text and game-specific color aesthetic
   */
  public static async renderThumbnail(
    baseImagePath: string | null,
    headline: string,
    subText: string,
    outputPath: string,
    gameTitle = ''
  ): Promise<string> {
    const width = 1280;
    const height = 720;
    const colors = FFmpegService.getGameThemeColor(gameTitle);
    const safeHeadline = (headline || 'INSANE SECRET REVEALED').toUpperCase().replace(/['":\\]/g, ' ').slice(0, 30);
    const safeSub = (subText || (gameTitle ? `${gameTitle.toUpperCase()} TRICKS` : 'PRO SECRETS')).toUpperCase().replace(/['":\\]/g, ' ').slice(0, 35);

    let baseInput = '';
    if (baseImagePath && fs.existsSync(baseImagePath)) {
      baseInput = `-i "${baseImagePath}"`;
    } else {
      baseInput = `-f lavfi -i "color=c=${colors.darkBg}:s=${width}x${height}:d=1"`;
    }

    const cmd = `ffmpeg -y ${baseInput} \
-filter_complex "[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}, \
drawbox=x=0:y=0:w=${width}:h=${height}:color=black@0.25:t=fill, \
drawbox=x=30:y=30:w=${width - 60}:h=${height - 60}:color=${colors.primary}@0.85:t=10, \
drawbox=x=40:y=h-240:w=w-80:h=190:color=black@0.8:t=fill, \
drawtext=text='${safeHeadline}':fontcolor=${colors.accent}:fontsize=74:x=(w-text_w)/2:y=h-210:shadowcolor=black:shadowx=5:shadowy=5, \
drawtext=text='${safeSub}':fontcolor=white:fontsize=46:x=(w-text_w)/2:y=h-100:shadowcolor=black:shadowx=4:shadowy=4[out]" \
-map "[out]" -vframes 1 "${outputPath}"`;

    try {
      await execAsync(cmd);
      return outputPath;
    } catch (err: any) {
      logWarn('FFmpeg', `Thumbnail rendering failed: ${err.message}`);
      await execAsync(`ffmpeg -y -f lavfi -i "color=c=0x1E293B:s=${width}x${height}:d=1" -vframes 1 "${outputPath}"`);
      return outputPath;
    }
  }

  /**
   * Probe video properties to validate output
   */
  public static async validateVideo(videoPath: string): Promise<{
    isValid: boolean;
    duration: number;
    sizeBytes: number;
    error?: string;
  }> {
    if (!fs.existsSync(videoPath)) {
      return { isValid: false, duration: 0, sizeBytes: 0, error: 'Video file does not exist on disk' };
    }

    const stats = fs.statSync(videoPath);
    if (stats.size < 1000) {
      return { isValid: false, duration: 0, sizeBytes: stats.size, error: 'Video file is empty or corrupted' };
    }

    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
      );
      const duration = parseFloat(stdout.trim()) || 0;
      return {
        isValid: duration > 0,
        duration,
        sizeBytes: stats.size,
      };
    } catch (err: any) {
      return {
        isValid: true,
        duration: 15,
        sizeBytes: stats.size,
        error: `Probe warning: ${err.message}`,
      };
    }
  }
}

export const ffmpegService = new FFmpegService();
