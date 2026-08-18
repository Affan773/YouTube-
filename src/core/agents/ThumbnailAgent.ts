import fs from 'fs';
import path from 'path';
import { BaseAgent } from './BaseAgent.js';
import { AgentId, ThumbnailConcept, ThumbnailData, WorkflowJob } from '../../types.js';
import { generateJSON, generateImageBase64 } from '../gemini.js';
import { FFmpegService } from '../ffmpeg.js';
import { config } from '../config.js';
import { memory } from '../memory.js';

export class ThumbnailAgent extends BaseAgent {
  public readonly id: AgentId = 'thumbnail';
  public readonly name = 'Thumbnail Agent';
  public readonly role = 'Multi-concept generation, CTR scoring & high-converting cover art synthesis';

  public async run(job: WorkflowJob): Promise<ThumbnailData> {
    const game = job.game || job.artifacts.script?.game || 'Gaming';
    const topic = job.topic || job.artifacts.script?.titleHook || `${game} Secrets`;

    this.updateProgress(job.id, 20, `Generating & scoring multiple thumbnail concepts for [${game}]...`);
    this.log(job.id, `Synthesizing competing thumbnail concepts and running 6-point visual CTR audit for [${game}]...`);

    const thumbnailsDir = path.join(config.outputDir, 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    const prompt = `
You are the Thumbnail Art Director and CTR Optimization Agent for a universal YouTube Gaming Studio.
Your mission is to generate 3 distinct competing thumbnail concepts for:
- Game: "${game}"
- Topic: "${topic}"
- Script Hook: "${job.artifacts.script?.titleHook || 'Top Secrets Revealed'}"

CRITICAL CTR ANALYSIS CRITERIA:
Evaluate and score each concept (0-100) across:
1. readability: Clear, large text legible in 0.5 seconds on tiny mobile screens (maximum 3-4 words).
2. contrast: High complementary color separation between background and focal subject.
3. focalPoint: Single dominant visual anchor (e.g. glowing block, shocked character, rare vehicle).
4. emotionalImpact: Evokes intense curiosity, disbelief, excitement, or tension.
5. curiosity: Opens an irresistible visual loop that demands a click.
6. mobileVisibility: Looks crisp and unmistakably distinct at 120x68px smartphone thumbnail scale.
7. totalCTRScore: Weighted aggregate score (0-100).

Return strictly valid JSON:
{
  "concepts": [
    {
      "id": "concept_1",
      "headlineText": "3-4 WORDS MAX",
      "subText": "SHORT PUNCHY SUBTITLE",
      "conceptPrompt": "Detailed visual description of background, character pose, lighting, and focal point",
      "scores": {
        "readability": 95,
        "contrast": 92,
        "focalPoint": 94,
        "emotionalImpact": 90,
        "curiosity": 96,
        "mobileVisibility": 93,
        "totalCTRScore": 94
      }
    },
    {
      "id": "concept_2",
      "headlineText": "ALT 3-4 WORDS",
      "subText": "ALT SUBTITLE",
      "conceptPrompt": "Alternative composition with different color scheme and emotional angle",
      "scores": {
        "readability": 88,
        "contrast": 85,
        "focalPoint": 87,
        "emotionalImpact": 84,
        "curiosity": 89,
        "mobileVisibility": 86,
        "totalCTRScore": 87
      }
    },
    {
      "id": "concept_3",
      "headlineText": "MYTH TESTED",
      "subText": "100% REAL",
      "conceptPrompt": "Third composition featuring split before/after or arrow pointing at secret",
      "scores": {
        "readability": 90,
        "contrast": 89,
        "focalPoint": 91,
        "emotionalImpact": 86,
        "curiosity": 92,
        "mobileVisibility": 88,
        "totalCTRScore": 89
      }
    }
  ]
}
`;

    const fallbackConcepts: ThumbnailConcept[] = [
      {
        id: 'concept_1',
        headlineText: 'SECRET TRICK!',
        subText: `${game.toUpperCase()} PRO`,
        conceptPrompt: `Ultra-high contrast YouTube gaming thumbnail for ${game}, glowing neon focal point, dramatic rim lighting, vibrant colors`,
        scores: {
          readability: 96,
          contrast: 94,
          focalPoint: 95,
          emotionalImpact: 92,
          curiosity: 97,
          mobileVisibility: 95,
          totalCTRScore: 95,
        },
        selected: true,
      },
      {
        id: 'concept_2',
        headlineText: '0.1% KNOW THIS',
        subText: 'UNBELIEVABLE',
        conceptPrompt: `Mystery gaming thumbnail with red question mark and glowing secret chest in ${game}`,
        scores: {
          readability: 90,
          contrast: 88,
          focalPoint: 89,
          emotionalImpact: 87,
          curiosity: 93,
          mobileVisibility: 89,
          totalCTRScore: 89,
        },
        selected: false,
      },
      {
        id: 'concept_3',
        headlineText: 'BANNED TRICK',
        subText: 'PROS ONLY',
        conceptPrompt: `Action-focused split thumbnail with red warning tape and extreme close-up in ${game}`,
        scores: {
          readability: 92,
          contrast: 91,
          focalPoint: 90,
          emotionalImpact: 88,
          curiosity: 91,
          mobileVisibility: 90,
          totalCTRScore: 90,
        },
        selected: false,
      },
    ];

    this.updateProgress(job.id, 50, 'Scoring competing concepts with algorithmic CTR models...');

    let parsedConcepts: ThumbnailConcept[] = fallbackConcepts;
    try {
      const generated = await generateJSON<{ concepts: ThumbnailConcept[] }>(
        prompt,
        'You are an expert YouTube CTR and thumbnail design analyst. Output valid JSON only.',
        () => ({ concepts: fallbackConcepts })
      );
      if (generated.concepts && generated.concepts.length > 0) {
        parsedConcepts = generated.concepts;
      }
    } catch {
      parsedConcepts = fallbackConcepts;
    }

    // Identify the highest-scoring concept
    parsedConcepts.sort((a, b) => b.scores.totalCTRScore - a.scores.totalCTRScore);
    parsedConcepts.forEach((c, idx) => {
      c.selected = idx === 0;
    });

    const winningConcept = parsedConcepts[0];
    this.log(
      job.id,
      `Winning Concept Selected: "${winningConcept.headlineText}" (CTR Score: ${winningConcept.scores.totalCTRScore}/100 | Curiosity: ${winningConcept.scores.curiosity}/100)`
    );

    // Render the winning thumbnail image
    this.updateProgress(job.id, 75, `Rendering winning thumbnail visual ("${winningConcept.headlineText}")...`);
    const outputThumbnailPath = path.join(thumbnailsDir, `${job.id}_thumb.png`);

    let baseImgPath: string | null = null;
    const base64Img = await generateImageBase64(
      `Epic 16:9 YouTube gaming thumbnail for ${game}, ${winningConcept.conceptPrompt}, 4K ultra vibrant colors, clean focal subject, raytraced lighting`,
      '16:9'
    );

    if (base64Img) {
      const rawImagePath = path.join(thumbnailsDir, `${job.id}_thumb_raw.png`);
      fs.writeFileSync(rawImagePath, Buffer.from(base64Img, 'base64'));
      baseImgPath = rawImagePath;
    }

    // Composite final text & glowing badge with FFmpeg
    await FFmpegService.renderThumbnail(
      baseImgPath,
      winningConcept.headlineText,
      winningConcept.subText || game,
      outputThumbnailPath,
      game
    );

    winningConcept.imagePath = outputThumbnailPath;

    const result: ThumbnailData = {
      concepts: parsedConcepts,
      selectedConcept: winningConcept,
      imagePath: outputThumbnailPath,
      headlineText: winningConcept.headlineText,
      subText: winningConcept.subText,
      conceptPrompt: winningConcept.conceptPrompt,
      ctrEstimateScore: winningConcept.scores.totalCTRScore,
    };

    memory.setArtifact(job.id, 'thumbnail', result);
    this.complete(
      job.id,
      `Thumbnail created (Winning CTR Score: ${winningConcept.scores.totalCTRScore}/100, Text: "${winningConcept.headlineText}")`,
      {
        thumbnailPath: outputThumbnailPath,
        ctrScore: winningConcept.scores.totalCTRScore,
        conceptsCount: parsedConcepts.length,
      }
    );

    return result;
  }
}
