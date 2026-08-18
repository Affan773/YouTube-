import fs from 'fs';
import { BaseAgent } from './BaseAgent.js';
import { AgentId, SEOData, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';
import { FFmpegService } from '../ffmpeg.js';

export class YouTubeSEOAgent extends BaseAgent {
  public readonly id: AgentId = 'seo';
  public readonly name = 'YouTube SEO Agent';
  public readonly role = 'High-CTR Title Options, Viral Description, Gaming Tags & Search Optimization';

  /**
   * Formats seconds into MM:SS (or H:MM:SS if >= 1 hour)
   */
  public static formatTimestamp(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Parses MM:SS or H:MM:SS string to total seconds
   */
  public static parseTimestampToSeconds(ts: string): number {
    const parts = ts.trim().split(':').map((p) => parseInt(p, 10));
    if (parts.some((p) => isNaN(p))) return 0;
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  /**
   * Resolves the actual final duration of the video in seconds using ffprobe or metadata
   */
  public static async resolveActualDuration(job: WorkflowJob): Promise<number> {
    const videoFilePath = job.artifacts.videoEditing?.videoFilePath;
    if (videoFilePath && fs.existsSync(videoFilePath)) {
      try {
        const probe = await FFmpegService.validateVideo(videoFilePath);
        if (probe.isValid && probe.duration > 0) {
          return probe.duration;
        }
      } catch {
        // Probe fallback
      }
    }

    if (job.artifacts.videoEditing?.durationSeconds && job.artifacts.videoEditing.durationSeconds > 0) {
      return job.artifacts.videoEditing.durationSeconds;
    }

    if (job.artifacts.voiceover?.durationSeconds && job.artifacts.voiceover.durationSeconds > 0) {
      return job.artifacts.voiceover.durationSeconds;
    }

    if (job.artifacts.script?.totalDurationSeconds && job.artifacts.script.totalDurationSeconds > 0) {
      return job.artifacts.script.totalDurationSeconds;
    }

    const isShorts = (job.options.format || 'shorts') === 'shorts';
    return isShorts ? 32 : 180;
  }

  /**
   * Validates and sanitizes all timestamps in the YouTube description so none exceed actual video duration
   */
  public static validateAndSanitizeDescription(description: string, maxDurationSeconds: number): string {
    if (!description) return '';
    const maxSeconds = Math.max(1, Math.floor(maxDurationSeconds));
    const maxTimestampStr = YouTubeSEOAgent.formatTimestamp(maxSeconds);

    // 1. Sanitize any timestamp ranges like "0:00 - 0:45" or "0:00 to 0:45"
    let sanitized = description.replace(
      /(\b\d{1,2}:\d{2}(?::\d{2})?\b)\s*([-\u2013\u2014]|to)\s*(\b\d{1,2}:\d{2}(?::\d{2})?\b)/gi,
      (match, startTs, sep, endTs) => {
        const endSec = YouTubeSEOAgent.parseTimestampToSeconds(endTs);
        if (endSec > maxSeconds) {
          return `${startTs} ${sep} ${maxTimestampStr}`;
        }
        return match;
      }
    );

    // 2. Identify chapter / timestamp list sections
    const lines = sanitized.split('\n');
    const chapterLineIndices: number[] = [];
    const chapterData: { lineIndex: number; title: string; originalTs: string; seconds: number }[] = [];

    const timestampLineRegex = /^\s*([*\-•]?\s*)(\d{1,2}:\d{2}(?::\d{2})?)\s*[-:]?\s*(.*)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(timestampLineRegex);
      if (match) {
        const rawTs = match[2];
        const title = match[3].trim();
        const sec = YouTubeSEOAgent.parseTimestampToSeconds(rawTs);
        chapterLineIndices.push(i);
        chapterData.push({
          lineIndex: i,
          title,
          originalTs: rawTs,
          seconds: sec,
        });
      }
    }

    // If chapters exist and ANY timestamp exceeds maxDurationSeconds, redistribute them proportionally
    const hasExceedingChapter = chapterData.some((c) => c.seconds > maxSeconds);
    if (hasExceedingChapter && chapterData.length > 0) {
      const count = chapterData.length;
      chapterData.forEach((c, idx) => {
        let newSec = 0;
        if (idx === 0) {
          newSec = 0;
        } else if (idx === count - 1) {
          // Final chapter ends before max duration
          newSec = Math.max(0, Math.floor(maxSeconds * 0.85));
        } else {
          newSec = Math.max(0, Math.floor((maxSeconds * idx) / count));
        }
        const newTs = YouTubeSEOAgent.formatTimestamp(newSec);
        lines[c.lineIndex] = `${newTs} ${c.title}`;
      });
      sanitized = lines.join('\n');
    }

    // 3. Fallback pass: Clamp any remaining rogue timestamp tokens that exceed maxSeconds
    sanitized = sanitized.replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g, (match) => {
      const sec = YouTubeSEOAgent.parseTimestampToSeconds(match);
      if (sec > maxSeconds) {
        return maxTimestampStr;
      }
      return match;
    });

    return sanitized;
  }

  public async run(job: WorkflowJob): Promise<SEOData> {
    const game = job.game || job.artifacts.script?.game || 'Gaming';
    const topic = job.topic || job.artifacts.script?.titleHook || `${game} Top Secrets`;
    const format = job.options.format || 'shorts';
    const isShorts = format === 'shorts';

    this.updateProgress(job.id, 25, `Synthesizing YouTube SEO & high-CTR metadata for [${game}]...`);
    this.log(job.id, `Generating viral title candidates, structured description, chapters & gaming tags for [${game}]...`);

    // Resolve the exact rendered video duration
    const actualDurationSeconds = await YouTubeSEOAgent.resolveActualDuration(job);
    const maxTimestampStr = YouTubeSEOAgent.formatTimestamp(actualDurationSeconds);
    const roundedDuration = Math.round(actualDurationSeconds);

    // Build reference chapters from actual scene plans if available
    const referenceChapters: string[] = [];
    if (job.artifacts.scenePlan?.scenes && job.artifacts.scenePlan.scenes.length > 0) {
      let accumulatedTime = 0;
      job.artifacts.scenePlan.scenes.forEach((sc, idx) => {
        if (accumulatedTime < actualDurationSeconds) {
          const label = sc.subtitleText || sc.actionDescription || `Secret #${idx + 1}`;
          referenceChapters.push(`${YouTubeSEOAgent.formatTimestamp(accumulatedTime)} ${label.slice(0, 35)}`);
        }
        accumulatedTime += sc.durationSeconds || actualDurationSeconds / job.artifacts.scenePlan!.scenes.length;
      });
    } else {
      referenceChapters.push('0:00 Intro & Secret Hook');
      referenceChapters.push(`${YouTubeSEOAgent.formatTimestamp(actualDurationSeconds * 0.3)} Key Build Technique`);
      referenceChapters.push(`${YouTubeSEOAgent.formatTimestamp(actualDurationSeconds * 0.7)} Pro Secret Reveal`);
    }

    const prompt = `
You are the YouTube SEO & Metadata Optimization Agent for a universal YouTube Gaming Studio.
Your mission is to craft authentic, high-converting, compliant YouTube metadata for:

- Game: "${game}"
- Topic: "${topic}"
- Format: ${format} (${isShorts ? 'YouTube Shorts (9:16)' : 'Long-form (16:9)'})
- Script Hook: "${job.artifacts.script?.titleHook || 'Epic Gameplay Moments'}"
- Thumbnail Headline: "${job.artifacts.thumbnail?.headlineText || 'PRO SECRET'}"
- Actual Video Duration: EXACTLY ${actualDurationSeconds.toFixed(1)} seconds (Maximum valid timestamp is ${maxTimestampStr})

STRICT CHAPTER / TIMESTAMP DURATION RULES:
- The video is EXACTLY ${actualDurationSeconds.toFixed(1)} seconds long (${maxTimestampStr}).
- Under NO circumstances can any timestamp or chapter marker exceed ${maxTimestampStr} (${roundedDuration}s).
- All timestamps in the description MUST be bounded between 0:00 and ${maxTimestampStr}.
- Suggested Timestamps:
${referenceChapters.map((rc) => `  ${rc}`).join('\n')}

REQUIREMENTS:
1. Provide 5 distinct high-CTR Title Options (under 65 chars, high curiosity, zero false clickbait).
2. Select the single best title into "selectedTitle". Include #Shorts and #${game.replace(/\s+/g, '')} if format is shorts.
3. Write a rich formatted YouTube Description including summary, key moments (strictly within 0:00 to ${maxTimestampStr}), call-to-action, and relevant gaming hashtags.
4. Provide 15-20 specific YouTube Tags (mix of broad e.g. "${game}", specific e.g. "${game} secret tricks", and format e.g. "gaming shorts").
5. Provide 4-6 Hashtags.
6. Set categoryId to '20' (Gaming).
7. Recommend a playlist name for the channel.
8. Calculate an overall SEO score (0-100) based on keyword density and search intent match.

Return strictly valid JSON:
{
  "titleOptions": [
    "Title Option 1",
    "Title Option 2",
    "Title Option 3",
    "Title Option 4",
    "Title Option 5"
  ],
  "selectedTitle": "The #1 Selected Title #Shorts",
  "description": "Full rich description with timestamps strictly within 0:00 to ${maxTimestampStr}...",
  "tags": ["tag1", "tag2", "tag3"],
  "hashtags": ["#Tag1", "#Tag2", "#Tag3"],
  "categoryId": "20",
  "seoScore": 96,
  "searchKeywords": ["keyword1", "keyword2", "keyword3"],
  "playlistRecommendation": "Best ${game} Secrets & Pro Tips",
  "audienceTargeting": "Gamers, ${game} players, competitive & casual community"
}
`;

    const fallbackSEO: SEOData = {
      titleOptions: [
        `${game}: 10 Secret Tricks You NEVER Knew! #Shorts`,
        `Only 0.1% Of ${game} Players Know This Secret... #Shorts`,
        `How Pro ${game} Players Actually Do This Trick! #Shorts`,
        `The Most Insane Trick In ${game} History #Shorts`,
        `I Tested The Rarest Secret In ${game} #Shorts`,
      ],
      selectedTitle: isShorts
        ? `${game}: The Secret Trick 99% Of Players Don't Know #Shorts`
        : `${game} Masterclass - The Secret Mechanics Nobody Told You About`,
      description: `Can you believe this secret exists in ${game}?\n\nIn this video, we break down an insane pro mechanic and hidden trick that changes how you play.\n\nKey Moments:\n${referenceChapters.join('\n')}\n\n🎮 GAME: ${game}\n🔔 SUBSCRIBE for daily gaming secrets, tips & viral highlights!\n\n#${game.replace(/[^a-zA-Z0-9]/g, '')} #Gaming #GamingShorts #TipsAndTricks #Viral`,
      tags: [
        game,
        `${game} secrets`,
        `${game} tricks`,
        `${game} guide`,
        `${game} pro tips`,
        `${game} gameplay`,
        `${game} shorts`,
        'gaming shorts',
        'viral gaming',
        'how to',
        'secret tricks',
      ],
      hashtags: [`#${game.replace(/[^a-zA-Z0-9]/g, '')}`, '#Gaming', '#GamingShorts', '#ProTips', '#Viral'],
      categoryId: '20',
      seoScore: 95,
      searchKeywords: [`${game} secrets`, `${game} tutorial`, `${game} tips`, `${game} gameplay`],
      playlistRecommendation: `Ultimate ${game} Guides & Viral Moments`,
      audienceTargeting: `Dedicated ${game} fans and YouTube gaming community`,
    };

    this.updateProgress(job.id, 75, 'Analyzing keyword density & YouTube search algorithms...');

    const seoData = await generateJSON<SEOData>(
      prompt,
      'You are a senior YouTube SEO specialist and metadata optimization expert for gaming. Output valid JSON only.',
      () => fallbackSEO
    );

    // Validate and sanitize description timestamps before saving
    seoData.description = YouTubeSEOAgent.validateAndSanitizeDescription(
      seoData.description,
      actualDurationSeconds
    );

    memory.setArtifact(job.id, 'seo', seoData);
    this.complete(job.id, `SEO metadata finalized (Score: ${seoData.seoScore}/100, Title: "${seoData.selectedTitle}", Max TS: ${maxTimestampStr})`, {
      selectedTitle: seoData.selectedTitle,
      seoScore: seoData.seoScore,
      tagsCount: seoData.tags.length,
      maxTimestamp: maxTimestampStr,
    });

    return seoData;
  }
}

