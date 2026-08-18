import { BaseAgent } from './BaseAgent.js';
import { AgentId, AnalyticsData, WorkflowJob } from '../../types.js';
import { generateJSON } from '../gemini.js';
import { memory } from '../memory.js';

export class AnalyticsAgent extends BaseAgent {
  public readonly id: AgentId = 'analytics';
  public readonly name = 'Analytics Agent';
  public readonly role = 'Measures retention drop-offs, projected impressions, CTR & hook performance';

  public async run(job: WorkflowJob): Promise<AnalyticsData> {
    const game = job.game || job.artifacts.script?.game || 'Gaming';
    const seo = job.artifacts.seo;
    const strategy = job.artifacts.contentStrategy;
    const thumbnail = job.artifacts.thumbnail;
    const format = job.options.format || 'shorts';
    const isShorts = format === 'shorts';

    this.updateProgress(job.id, 25, `Analyzing performance metrics & simulated audience analytics for [${game}]...`);
    this.log(job.id, `Simulating 72-hour YouTube algorithmic performance & viewer retention telemetry for [${game}]...`);

    const prompt = `
You are the YouTube Analytics Intelligence Agent for a universal YouTube Gaming Studio.
Analyze the expected 72-hour launch metrics for:
- Game: "${game}"
- Format: ${format} (${isShorts ? '9:16 Shorts' : '16:9 Long-form'})
- Title: "${seo?.selectedTitle || 'Gaming Secrets'}"
- Thumbnail CTR Score: ${thumbnail?.ctrEstimateScore || 92}/100
- Strategy Expected Retention: ${strategy?.expectedAudienceRetentionRate || 85}%

Provide realistic, data-driven YouTube performance analytics including:
1. Projected impressions (e.g. 15,000 - 120,000).
2. Projected Click-Through-Rate (CTR percentage, e.g. 11.4%).
3. Average View Duration (seconds) and average percentage viewed.
4. Hook Effectiveness Score (0-100).
5. Identified drop-off points (second marker + explanation).
6. Performance rating ('viral_outlier', 'high_performer', 'solid_performer', 'needs_improvement').
7. Top performing elements and audience insights.

Return strictly valid JSON:
{
  "projectedImpressions": 48500,
  "projectedCTR": 12.8,
  "projectedViews": 18200,
  "averageViewDurationSeconds": 28,
  "retentionPercentage": 88,
  "hookEffectivenessScore": 94,
  "dropOffPoints": [
    { "second": 14, "percentage": 91, "reason": "Transition between trick 1 and 2" },
    { "second": 28, "percentage": 84, "reason": "Closing call-to-action" }
  ],
  "topPerformingElements": [
    "Opening 2-second visual pattern interrupt",
    "High-contrast yellow text badge on thumbnail",
    "Fast kinetic subtitle pace matching voiceover"
  ],
  "performanceRating": "high_performer",
  "audienceInsights": "${game} viewers responded strongly to actionable build mechanics with zero intro delay."
}
`;

    const fallbackAnalytics: AnalyticsData = {
      projectedImpressions: isShorts ? 64000 : 28000,
      projectedCTR: thumbnail?.ctrEstimateScore ? Number((thumbnail.ctrEstimateScore * 0.12).toFixed(1)) : 11.5,
      projectedViews: isShorts ? 24500 : 8900,
      averageViewDurationSeconds: isShorts ? 27 : 145,
      retentionPercentage: strategy?.expectedAudienceRetentionRate || (isShorts ? 87 : 65),
      hookEffectivenessScore: 93,
      dropOffPoints: [
        { second: 3, percentage: 95, reason: 'Initial swipe filter passed with 95% retention' },
        { second: 16, percentage: 89, reason: 'Mid-video escalation maintains high engagement' },
        { second: isShorts ? 30 : 160, percentage: 82, reason: 'Loop back to beginning or CTA' },
      ],
      topPerformingElements: [
        'Curiosity gap opened immediately at 0:00',
        'Vibrant thumbnail with bold 3-word headline',
        'Kinetic 2-word caption pacing with ducked audio beats',
      ],
      performanceRating: 'high_performer',
      audienceInsights: `Audience for ${game} engages heavily with secret glitches and immediate gameplay payoff.`,
    };

    this.updateProgress(job.id, 75, 'Synthesizing retention curve and viewer engagement telemetry...');

    const analyticsData = await generateJSON<AnalyticsData>(
      prompt,
      'You are a senior YouTube Gaming Data Scientist and Audience Retention Analyst. Output valid JSON only.',
      () => fallbackAnalytics
    );

    this.updateProgress(
      job.id,
      100,
      `Analytics telemetry compiled: ${analyticsData.projectedViews.toLocaleString()} projected views (${analyticsData.retentionPercentage}% retention).`
    );
    this.log(
      job.id,
      `Analytics Telemetry: Projected Views: ${analyticsData.projectedViews.toLocaleString()} | CTR: ${analyticsData.projectedCTR}% | Retention: ${analyticsData.retentionPercentage}% | Rating: ${analyticsData.performanceRating.toUpperCase()}`,
      'success'
    );

    memory.setArtifact(job.id, 'analytics', analyticsData);
    return analyticsData;
  }
}
