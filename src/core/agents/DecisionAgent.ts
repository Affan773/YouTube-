import { BaseAgent } from './BaseAgent.js';
import { AgentId, AutonomousDecision, WorkflowJob } from '../../types.js';
import { AutonomousDecisionEngine } from '../decisionEngine.js';

export class DecisionAgent extends BaseAgent {
  public readonly id: AgentId = 'autonomous_decision';
  public readonly name = 'Autonomous Decision & Opportunity Engine';
  public readonly role = 'Synthesizes global trends + channel history + content gaps to choose Next Best Video';

  public async run(job: WorkflowJob): Promise<AutonomousDecision> {
    const channelId = job.options.channelProfileId || 'channel_default';

    this.updateProgress(job.id, 20, 'Fusing global trend momentum with channel history to compute Opportunity Radar...');
    this.log(job.id, 'Synthesizing demand, audience fit, and content gap opportunities...');

    const decision = await AutonomousDecisionEngine.decideNextBestVideo(channelId);

    this.updateProgress(job.id, 80, `Calculated Opportunity Score: ${decision.opportunityScore}/100 for [${decision.selectedGame}].`);

    this.log(
      job.id,
      `Autonomous Selection: [${decision.selectedGame}] "${decision.selectedTopic}" (Opportunity: ${decision.opportunityScore}/100, Trend: ${decision.trendScore}/100, Channel Fit: ${decision.channelFitScore}/100)`,
      'info'
    );

    this.log(
      job.id,
      `Optimal Publishing Window: Recommended for ${decision.recommendedScheduleTime}. Applying learning: "${decision.keyLearningApplied}"`,
      'info'
    );

    // If autoTopic or autoGame was requested, populate job topic/game if empty or generic
    if (job.options.autoTopic || job.options.autoGame || !job.topic || job.topic.toLowerCase().includes('trending')) {
      job.topic = decision.selectedTopic;
      job.game = decision.selectedGame;
      if (!job.options.format) {
        job.options.format = decision.recommendedFormat;
      }
    }

    this.updateProgress(job.id, 100, `Autonomous decision synthesized: ${decision.selectedTopic}`);
    return decision;
  }
}
