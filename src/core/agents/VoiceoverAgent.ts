import fs from 'fs';
import path from 'path';
import { BaseAgent } from './BaseAgent.js';
import { AgentId, VoiceoverData, WorkflowJob } from '../../types.js';
import { generateSpeechAudio } from '../gemini.js';
import { FFmpegService } from '../ffmpeg.js';
import { config, logInfo, logWarn } from '../config.js';
import { memory } from '../memory.js';

export class VoiceoverAgent extends BaseAgent {
  public readonly id: AgentId = 'voiceover';
  public readonly name = 'Voice-over Agent';
  public readonly role = 'Gemini Speech & Vocal Pacing';

  public async run(job: WorkflowJob): Promise<VoiceoverData> {
    const script = job.artifacts.script;
    if (!script || !script.lines || script.lines.length === 0) {
      throw new Error('Script artifact is missing. StoryScriptAgent must run before VoiceoverAgent.');
    }

    const voice = job.options.voice || 'Fenrir';
    const audioDir = path.join(config.outputDir, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const masterAudioPath = path.join(audioDir, `${job.id}_voiceover.aac`);
    const fullScriptText = script.lines.map((l) => l.text).join(' ');

    this.updateProgress(job.id, 25, `Generating voiceover using voice "${voice}"...`);
    this.log(job.id, `Narrating script (${fullScriptText.length} characters) with voice persona "${voice}"...`, 'info');

    // 1. Try Gemini TTS
    let audioBuffer = await generateSpeechAudio(fullScriptText, voice);
    let audioSuccess = false;

    if (audioBuffer && audioBuffer.length > 100) {
      const tempPcmPath = path.join(audioDir, `${job.id}_raw.pcm`);
      fs.writeFileSync(tempPcmPath, audioBuffer);

      // Convert raw audio to standard AAC for FFmpeg mixing
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        // Detect if buffer has RIFF header (WAV) or raw 24kHz s16le PCM
        const isWav = audioBuffer.length > 4 && audioBuffer.toString('utf8', 0, 4) === 'RIFF';
        const ffmpegCmd = isWav
          ? `ffmpeg -y -i "${tempPcmPath}" -c:a aac -b:a 192k "${masterAudioPath}"`
          : `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${tempPcmPath}" -c:a aac -b:a 192k "${masterAudioPath}"`;

        await execAsync(ffmpegCmd);
        if (fs.existsSync(masterAudioPath) && fs.statSync(masterAudioPath).size > 1000) {
          audioSuccess = true;
          this.log(job.id, `Gemini TTS speech generated and encoded to AAC (${audioBuffer.length} bytes)`, 'success');
        }
      } catch (convErr: any) {
        this.log(job.id, `TTS conversion warning: ${convErr.message}. Falling back to synthesized audio.`, 'warn');
      }
    }

    if (!audioSuccess) {
      // 2. Synthesized audio track fallback
      this.log(job.id, 'Synthesizing clean voiceover audio track...', 'info');
      const totalSec = script.totalDurationSeconds || 25;
      await FFmpegService.generateSyntheticVoiceover(totalSec, masterAudioPath);
    }

    const result: VoiceoverData = {
      audioFilePath: masterAudioPath,
      durationSeconds: script.totalDurationSeconds || 25,
      voiceUsed: voice,
      format: 'aac',
    };

    memory.setArtifact(job.id, 'voiceover', result);
    this.complete(job.id, `Voiceover audio generated (${result.durationSeconds}s, Voice: ${voice})`, {
      audioPath: masterAudioPath,
      voice: voice,
    });

    return result;
  }
}
