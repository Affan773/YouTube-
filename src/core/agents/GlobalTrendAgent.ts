import { BaseAgent } from './BaseAgent.js';
import { AgentId, GlobalTrendItem, WorkflowJob } from '../../types.js';
import { TrendIntelligenceService } from '../trendIntelligence.js';

export class GlobalTrendAgent extends BaseAgent {
  public readonly id: AgentId = 'global_trends';
  public readonly name = 'Global YouTube Trend Intelligence Agent';
  public readonly role = 'Analyzes worldwide gaming search volume, viral velocity, and calculates 0-100 Trend Scores';

  public async run(job: WorkflowJob): Promise<GlobalTrendItem[]> {
    this.updateProgress(job.id, 20, 'Scanning worldwide YouTube gaming trends, search momentum & viral velocity...');
    this.log(job.id, 'Gathering global YouTube gaming search demand & release calendars...');

    const trends = await TrendIntelligenceService.getGlobalGamingTrends();

    this.updateProgress(job.id, 70, `Discovered ${trends.length} active gaming trends across YouTube ecosystem.`);

    const topTrend = trends[0];
    this.log(
      job.id,
      `Top global trend detected: [${topTrend.game}] "${topTrend.topic}" (Trend Score: ${topTrend.trendScore}/100, Demand: ${topTrend.demandScore}/100, Momentum: +${topTrend.growthRate}%)`,
      'info'
    );

    this.updateProgress(job.id, 100, `Trend intelligence completed. Discovered ${trends.length} trending concepts.`);
    return trends;
  }
}
