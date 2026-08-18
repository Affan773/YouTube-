import { BaseAgent } from './BaseAgent.js';
import { AgentId, ContentStrategyData, ContentType, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';

export class ContentStrategyAgent extends BaseAgent {
  public readonly id: AgentId = 'content_strategy';
  public readonly name = 'Content Strategy Agent';
  public readonly role = 'Blueprints retention curve, pacing architecture & viral differentiation';

  public async run(job: WorkflowJob): Promise<ContentStrategyData> {
    const game = job.game || job.artifacts.research?.game || 'Gaming';
    const topic = job.topic || job.artifacts.research?.topic || 'Epic Gameplay Moments';
    const format = job.options.format || 'shorts';
    const contentType: ContentType = job.options.contentType || 'secrets';

    this.updateProgress(job.id, 25, `Structuring pacing curve & retention hooks for [${game}]...`);
    this.log(job.id, `Formulating viral content strategy and audience retention architecture for ${format.toUpperCase()}...`);

    // Ingest memory insights from past videos
    const learnedInsights = memory.getLearnedInsights();
    const relevantInsights = learnedInsights
      .filter((ins) => !ins.game || ins.game.toLowerCase() === game.toLowerCase() || ins.format === format)
      .slice(0, 4)
      .map((ins) => `[${ins.game || 'General'}] ${ins.insight} (${ins.retentionImpact})`);

    const prompt = `
You are the Content Strategy Agent for a universal YouTube Gaming Studio.
Design an audience retention blueprint for:
- Game: "${game}"
- Topic: "${topic}"
- Format: ${format} (${format === 'shorts' ? '9:16 Vertical, 30-55s target' : '16:9 Landscape, 180-360s target'})
- Content Type: ${contentType}
- Channel Tone / Persona: ${job.options.voice || 'Fenrir (Dynamic Gamer)'}

RELEVANT PAST PERFORMANCE INSIGHTS FROM MEMORY (Apply these):
${relevantInsights.length > 0 ? relevantInsights.map((i) => `• ${i}`).join('\n') : '• No past memory yet. Use cutting-edge 2026 YouTube Shorts retention best practices.'}

STRATEGY REQUIREMENTS:
1. Pacing strategy (BPM of cuts, audio ducking, zoom intervals every 2-3 seconds).
2. 3 psychological retention hooks positioned throughout the timeline (0s Hook, Mid-point escalation, Climax loop/payoff).
3. Competitive differentiator (Why this video stands out from generic gameplay).
4. Timeline Structure Breakdown with target seconds and specific viewer psychological purpose for each section.
5. Expected retention rate percentage (e.g. 85% for Shorts, 65% for Long-form).

Return strictly valid JSON:
{
  "chosenGame": "${game}",
  "chosenContentType": "${contentType}",
  "targetDemographic": "Demographic details",
  "pacingStrategy": "Rapid visual cuts every 2-3 seconds, animated kinetic subtitles, synchronized bass drops on key reveals",
  "retentionHooks": [
    "0-3s: Immediate impossible statement or high-stakes action",
    "15-20s: Unexpected twist or escalation",
    "End: Seamless loop or intense final secret"
  ],
  "competitiveDifferentiator": "Direct, zero-wasted-seconds value density with authentic pro gamer insights",
  "expectedAudienceRetentionRate": 86,
  "structureBreakdown": [
    { "section": "Visual Pattern Interrupt Hook", "targetSeconds": 4, "purpose": "Stop swipe-away within 1.5s" },
    { "section": "The Secret Setup", "targetSeconds": 10, "purpose": "Establish high curiosity gap" },
    { "section": "The Pro Execution", "targetSeconds": 16, "purpose": "Deliver immediate actionable value" },
    { "section": "Climax & Payoff Loop", "targetSeconds": 8, "purpose": "Maximize rewatch rate & trigger comments" }
  ],
  "learnedInsightsApplied": [
    "Applied pattern interruption in first 2 seconds",
    "Two-word burst kinetic subtitle timing"
  ]
}
`;

    const fallbackStrategy: ContentStrategyData = {
      chosenGame: game,
      chosenContentType: contentType,
      targetDemographic: 'Active gaming community, competitive players and mobile Shorts viewers',
      pacingStrategy: 'Dynamic visual cuts every 2.5s, aggressive audio ducking, kinetic 2-word captions with punchy SFX',
      retentionHooks: [
        '0-3s: Immediate visual pattern interrupt with shocking claim',
        '15s: "Wait until you see what happens next" mid-video escalation',
        'End: Seamless rewatch loop leading right back to the first second',
      ],
      competitiveDifferentiator: 'High density of actionable gaming knowledge with zero filler or slow intros',
      expectedAudienceRetentionRate: format === 'shorts' ? 88 : 68,
      structureBreakdown: [
        { section: 'The Viral Hook', targetSeconds: 4, purpose: 'Prevent swipe-away instantly' },
        { section: 'Core Secret Reveal', targetSeconds: 12, purpose: 'Build intense curiosity' },
        { section: 'Step-by-step Execution', targetSeconds: 14, purpose: 'High-value demonstration' },
        { section: 'Final Climax & Loop', targetSeconds: 6, purpose: 'Trigger immediate rewatch' },
      ],
      learnedInsightsApplied: [
        'Applied high-contrast visual pacing',
        'Integrated fast loop transition to maximize replay rate',
      ],
    };

    this.updateProgress(job.id, 75, 'Calibrating retention curve with algorithmic intelligence...');

    const strategyData = await generateJSON<ContentStrategyData>(
      prompt,
      'You are a senior YouTube Content Strategist and Retention Engineer. Output valid JSON only.',
      () => fallbackStrategy
    );

    this.updateProgress(job.id, 100, `Strategy established: Projected ${strategyData.expectedAudienceRetentionRate}% retention.`);
    this.log(
      job.id,
      `Strategy Blueprint: ${strategyData.structureBreakdown.length} structural beats | Expected Retention: ${strategyData.expectedAudienceRetentionRate}% | Pacing: ${strategyData.pacingStrategy.slice(0, 60)}...`,
      'success'
    );

    memory.setArtifact(job.id, 'contentStrategy', strategyData);
    return strategyData;
  }
}
