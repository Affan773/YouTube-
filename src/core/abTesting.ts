import { ABCandidate } from '../types.js';
import { GeminiService } from './gemini.js';
import { logInfo, logWarn } from './config.js';

export class ABTestingService {
  /**
   * Generate and evaluate A/B/C candidate titles, thumbnail headlines, and script hooks
   */
  public static async generateAndScoreCandidates(params: {
    game: string;
    topic: string;
    format: string;
  }): Promise<{
    titleCandidates: ABCandidate[];
    thumbnailCandidates: ABCandidate[];
    hookCandidates: ABCandidate[];
  }> {
    logInfo('ABTesting', `Generating pre-publication A/B testing candidates for [${params.game}]: "${params.topic}"...`);

    const prompt = `You are a YouTube A/B Testing & Optimization Specialist.
For the gaming video:
Game: ${params.game}
Topic: ${params.topic}
Format: ${params.format}

Generate 3 distinct candidate options for each category:
1. Title Candidates:
   - Option A (Curiosity & Mystery focused)
   - Option B (Urgency & Extreme Action focused)
   - Option C (Numerical & Secret Exploit focused)

2. Thumbnail Text Candidates (Max 3 words, ultra-bold, high mobile readability):
   - Option A, B, C

3. Opening Hook Candidates (First 3-5 seconds verbal/visual statement):
   - Option A, B, C

Score each candidate from 70 to 98 based on:
- Cognitive Curiosity Gap
- Readability & Word Economy
- Mobile Screen Impact
- Avoidance of banned clickbait traps

Select the best candidate in each category with isSelected: true (others false).

Respond strictly in JSON format:
{
  "titles": [
    { "content": "...", "score": 94, "reasoning": "...", "isSelected": true },
    { "content": "...", "score": 88, "reasoning": "...", "isSelected": false },
    { "content": "...", "score": 85, "reasoning": "...", "isSelected": false }
  ],
  "thumbnails": [
    { "content": "...", "subContent": "...", "score": 96, "reasoning": "...", "isSelected": true },
    { "content": "...", "subContent": "...", "score": 90, "reasoning": "...", "isSelected": false },
    { "content": "...", "subContent": "...", "score": 87, "reasoning": "...", "isSelected": false }
  ],
  "hooks": [
    { "content": "...", "score": 95, "reasoning": "...", "isSelected": true },
    { "content": "...", "score": 89, "reasoning": "...", "isSelected": false },
    { "content": "...", "score": 84, "reasoning": "...", "isSelected": false }
  ]
}`;

    try {
      const res = await GeminiService.generateJSON<any>(prompt);
      if (res && res.titles && res.thumbnails && res.hooks) {
        const titleCandidates: ABCandidate[] = res.titles.map((t: any, i: number) => ({
          id: `title_cand_${i + 1}`,
          type: 'title',
          content: t.content,
          score: t.score || 88,
          reasoning: t.reasoning || 'Balanced curiosity and search intent.',
          isSelected: Boolean(t.isSelected),
        }));

        const thumbnailCandidates: ABCandidate[] = res.thumbnails.map((th: any, i: number) => ({
          id: `thumb_cand_${i + 1}`,
          type: 'thumbnail',
          content: th.content,
          subContent: th.subContent,
          score: th.score || 90,
          reasoning: th.reasoning || 'High-contrast mobile font rendering.',
          isSelected: Boolean(th.isSelected),
        }));

        const hookCandidates: ABCandidate[] = res.hooks.map((h: any, i: number) => ({
          id: `hook_cand_${i + 1}`,
          type: 'hook',
          content: h.content,
          score: h.score || 92,
          reasoning: h.reasoning || 'Strong pattern interrupt preventing initial drop-off.',
          isSelected: Boolean(h.isSelected),
        }));

        return { titleCandidates, thumbnailCandidates, hookCandidates };
      }
    } catch (err: any) {
      logWarn('ABTesting', `AI candidate generation fallback: ${err.message}`);
    }

    // High quality deterministic fallbacks
    return {
      titleCandidates: [
        {
          id: 'title_cand_1',
          type: 'title',
          content: `5 ${params.game.toUpperCase()} SECRETS PLAYERS MISSED IN 2026`,
          score: 94,
          reasoning: 'Strongest curiosity gap combining numbers, game name and temporal urgency.',
          isSelected: true,
        },
        {
          id: 'title_cand_2',
          type: 'title',
          content: `I TESTED THE MOST ILLEGAL ${params.game.toUpperCase()} GLITCH`,
          score: 89,
          reasoning: 'High-stakes personal narrative, strong search keyword presence.',
          isSelected: false,
        },
        {
          id: 'title_cand_3',
          type: 'title',
          content: `NEVER DO THIS IN ${params.game.toUpperCase()} (HUGE MISTAKE)`,
          score: 86,
          reasoning: 'Warning framing triggers high loss-aversion clicks.',
          isSelected: false,
        },
      ],
      thumbnailCandidates: [
        {
          id: 'thumb_cand_1',
          type: 'thumbnail',
          content: 'DON\'T DO THIS!',
          subContent: 'Secret Revealed',
          score: 95,
          reasoning: '3-word ultra punchy headline with highest visual contrast.',
          isSelected: true,
        },
        {
          id: 'thumb_cand_2',
          type: 'thumbnail',
          content: '100% ILLEGAL',
          subContent: 'New Exploit',
          score: 90,
          reasoning: 'Extreme urgency tag with bold yellow framing.',
          isSelected: false,
        },
        {
          id: 'thumb_cand_3',
          type: 'thumbnail',
          content: 'PRO ONLY',
          subContent: 'Hidden Trick',
          score: 87,
          reasoning: 'Status-driven framing appealing to competitive players.',
          isSelected: false,
        },
      ],
      hookCandidates: [
        {
          id: 'hook_cand_1',
          type: 'hook',
          content: 'If you play Minecraft right now, Mojang just changed something you were never supposed to find.',
          score: 96,
          reasoning: 'Instant pattern interrupt challenging player common knowledge.',
          isSelected: true,
        },
        {
          id: 'hook_cand_2',
          type: 'hook',
          content: '99% of players make this massive mistake without even realizing it.',
          score: 90,
          reasoning: 'High FOMO opener with immediate visual proof.',
          isSelected: false,
        },
        {
          id: 'hook_cand_3',
          type: 'hook',
          content: 'I spent 24 hours testing the hardest challenge in this game so you don\'t have to.',
          score: 86,
          reasoning: 'Effort-investment hook establishing creator credibility.',
          isSelected: false,
        },
      ],
    };
  }
}
