import { BaseAgent } from './BaseAgent.js';
import { AgentId, ChannelAnalyticsReport, WorkflowJob } from '../../types.js';
import { ChannelIntelligenceService } from '../channelIntelligence.js';

export class ChannelIntelligenceAgent extends BaseAgent {
  public readonly id: AgentId = 'channel_intelligence';
  public readonly name = 'YouTube Channel Intelligence Agent';
  public readonly role = 'Analyzes historical channel video performance, retention curves & extracts learning loop insights';

  public async run(job: WorkflowJob): Promise<ChannelAnalyticsReport> {
    const channelId = job.options.channelProfileId || 'channel_default';

    this.updateProgress(job.id, 25, `Analyzing historical channel uploads and retention analytics for channel [${channelId}]...`);
    this.log(job.id, 'Extracting historical performance scores, CTR benchmarks & retention drop-off markers...');

    const report = await ChannelIntelligenceService.analyzeChannelHistory(channelId);

    this.updateProgress(job.id, 75, `Analyzed ${report.totalVideosAnalyzed} channel videos (Avg CTR: ${report.avgCtr}%, Avg Retention: ${report.avgRetentionPercent}%).`);

    const topVid = report.topPerformingVideos[0];
    this.log(
      job.id,
      `Channel Benchmark: Top performing video "${topVid?.title.slice(0, 35)}..." scored ${topVid?.performanceScore}/100 with ${topVid?.views.toLocaleString()} views.`,
      'info'
    );

    this.log(
      job.id,
      `Strategic Learning Loop: What Worked: "${report.strategicGuidance.whatWorked[0]}" | Weakness Identified: "${report.weakRetentionPatterns[0]}"`,
      'info'
    );

    this.updateProgress(job.id, 100, 'Channel intelligence analysis and strategic guidance formulated.');
    return report;
  }
}
