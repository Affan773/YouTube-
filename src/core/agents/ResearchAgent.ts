import { BaseAgent } from './BaseAgent.js';
import { AgentId, ResearchData, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';

export class ResearchAgent extends BaseAgent {
  public readonly id: AgentId = 'research';
  public readonly name = 'Research & Trends Agent';
  public readonly role = 'Analyzes game mechanics, gaming lore, viral angles & viewer retention drivers';

  public async run(job: WorkflowJob): Promise<ResearchData> {
    const game = job.game || job.artifacts.gameDiscovery?.selectedGame || 'Gaming';
    const topic = job.topic || job.artifacts.gameDiscovery?.recommendedIdea || `${game} Top Moments`;

    this.updateProgress(job.id, 20, `Investigating "${game}": deep lore, mechanics & audience psychology...`);
    this.log(job.id, `Starting universal gaming research for [${game}] on topic: "${topic}"...`);

    const prompt = `
You are the Research & Trends Intelligence Agent for a universal YouTube Gaming Studio.
Your mission is to perform comprehensive research for the following game and topic:

- Game: "${game}"
- Topic: "${topic}"
- Video Format: ${job.options.format || 'shorts'}
- Content Type: ${job.options.contentType || 'auto-detect'}

Conduct in-depth research covering:
1. Target Audience demographics, gamer slang, and viewer expectations for ${game}.
2. Immediate viral Hook Concept (first 3 seconds to prevent swipe-away).
3. 4-6 Key Gameplay Moments / Step-by-Step highlights to feature.
4. Gaming Lore / Mechanics Context (real items, locations, abilities, tricks, or updates relevant to ${game}).
5. 5-8 High-Intent Search Keywords that gamers use to find this content.
6. Optimal Tone (e.g. "Fast-paced adrenaline with witty commentary", "Mysterious suspenseful lore breakdown", "Crisp expert builder walkthrough").

Return valid JSON conforming to this schema:
{
  "game": "${game}",
  "topic": "${topic}",
  "hookConcept": "The exact opening visual and psychological curiosity hook",
  "targetAudience": "Specific gamer demographic and viewer intent",
  "keyMoments": ["Key moment 1", "Key moment 2", "Key moment 3", "Key moment 4"],
  "trendingAngles": ["Angle 1", "Angle 2", "Angle 3"],
  "tone": "Vibrant, confident, high-energy gaming excitement",
  "gamingLoreContext": "Specific in-game details, items, mechanics, and terminology",
  "searchIntentKeywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
}
`;

    const fallbackData: ResearchData = {
      game,
      topic,
      hookConcept: `Stop scrolling if you play ${game}! This trick changes everything in 30 seconds.`,
      targetAudience: `Dedicated ${game} players, casual gamers, and YouTube Shorts community aged 13-30.`,
      keyMoments: [
        `Instant hook showing the completed result / insane escape in ${game}`,
        `Step 1: The hidden secret mechanic most players overlook`,
        `Step 2: Pro execution showing exactly how to recreate it`,
        `Climax: Payoff demonstration with high-stakes in-game action`,
      ],
      trendingAngles: [
        `Pro secrets vs beginner mistakes in ${game}`,
        `Hidden mechanics the developers never documented`,
        `Satisfying fast-paced walkthrough with zero fluff`,
      ],
      tone: 'Energetic, crisp, entertaining and punchy gaming commentary',
      gamingLoreContext: `Features authentic ${game} visual aesthetics, UI elements, audio cues, and community terminology.`,
      searchIntentKeywords: [
        `${game} secrets`,
        `${game} tips and tricks`,
        `${game} guide`,
        `${game} shorts`,
        `${game} viral gameplay`,
      ],
    };

    this.updateProgress(job.id, 70, 'Synthesizing viral gaming patterns with Gemini AI...');

    const researchData = await generateJSON<ResearchData>(
      prompt,
      `You are an elite YouTube gaming researcher who understands all modern video games from AAA blockbusters to indie sensations. Output valid JSON only.`,
      () => fallbackData
    );

    this.updateProgress(job.id, 100, `Research complete: ${researchData.keyMoments.length} key moments identified.`);
    this.log(
      job.id,
      `Research completed for [${game}] | Hook: "${researchData.hookConcept.slice(0, 50)}..." | Keywords: ${researchData.searchIntentKeywords.slice(0, 3).join(', ')}`,
      'success'
    );

    memory.setArtifact(job.id, 'research', researchData);
    return researchData;
  }
}
