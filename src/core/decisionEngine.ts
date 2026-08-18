import {
  AutonomousDecision,
  ChannelAnalyticsReport,
  ContentOpportunityItem,
  GlobalTrendItem,
  OpportunityCategory,
  VideoFormat,
} from '../types.js';
import { TrendIntelligenceService } from './trendIntelligence.js';
import { ChannelIntelligenceService } from './channelIntelligence.js';
import { memory } from './memory.js';
import { logInfo } from './config.js';

export class AutonomousDecisionEngine {
  /**
   * Calculate Content Opportunity Score (0-100):
   * Opportunity Score = (Global Trend * 0.35) + (Channel Fit * 0.30) + (Competition Opp * 0.20) + (Freshness * 0.15)
   */
  public static calculateOpportunityScore(params: {
    trendScore: number;
    channelFitScore: number;
    competitionLevel: 'Low' | 'Medium' | 'High';
    freshness: number;
  }): number {
    const compScore = params.competitionLevel === 'Low' ? 95 : params.competitionLevel === 'Medium' ? 75 : 40;
    const score =
      params.trendScore * 0.35 +
      params.channelFitScore * 0.30 +
      compScore * 0.20 +
      params.freshness * 0.15;
    return Math.min(100, Math.max(25, Math.round(score)));
  }

  /**
   * Build Content Opportunity Radar combining global trends, channel performance, and game affinity
   */
  public static async generateOpportunityRadar(channelId = 'channel_default'): Promise<{
    opportunities: ContentOpportunityItem[];
    radarSummary: Record<OpportunityCategory, number>;
  }> {
    logInfo('DecisionEngine', 'Generating Content Opportunity Radar combining global trend data & channel analytics...');

    const [trends, analytics] = await Promise.all([
      TrendIntelligenceService.getGlobalGamingTrends(),
      ChannelIntelligenceService.analyzeChannelHistory(channelId),
    ]);

    const channelProfile = memory.getChannel(channelId);
    const targetGames = channelProfile?.targetGames || ['Minecraft', 'GTA 5', 'Roblox', 'Fortnite', 'Elden Ring'];

    const opportunities: ContentOpportunityItem[] = trends.map((trend, idx) => {
      // Check channel fit based on historical channel game performances
      const isTargetGame = targetGames.some((g) => trend.game.toLowerCase().includes(g.toLowerCase()));
      const isTopHistoricalGame = analytics.bestGames.some((g) => g.toLowerCase().includes(trend.game.toLowerCase()));

      let channelFitScore = 70;
      if (isTopHistoricalGame) channelFitScore = 95;
      else if (isTargetGame) channelFitScore = 88;

      const oppScore = this.calculateOpportunityScore({
        trendScore: trend.trendScore,
        channelFitScore,
        competitionLevel: trend.competition,
        freshness: trend.freshness,
      });

      return {
        id: `opp_${Date.now()}_${idx + 1}`,
        game: trend.game,
        topic: trend.topic,
        opportunityScore: oppScore,
        trendScore: trend.trendScore,
        channelFitScore,
        competitionLevel: trend.competition,
        freshness: trend.freshness,
        opportunityCategory: trend.opportunityCategory,
        recommendedFormat: (trend.formatPotential === 'long_form' ? 'landscape' : 'shorts') as VideoFormat,
        reasoning: `Global demand is high (${trend.demandScore}/100) with ${trend.competition.toLowerCase()} saturation and +${trend.growthRate}% momentum for [${trend.game}]. Channel fit is ${channelFitScore}/100.`,
        suggestedHook: `Break viewers' assumptions immediately: "${trend.suggestedAngle}"`,
        suggestedAngles: [
          trend.suggestedAngle,
          'Speedrun comparison breakdown with sound effects',
          '3-step secret walkthrough with countdown timer',
        ],
        estimatedImpressions: trend.searchVolume,
      };
    });

    // Sort by Opportunity Score descending
    opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

    const radarSummary: Record<OpportunityCategory, number> = {
      hot_now: opportunities.filter((o) => o.opportunityCategory === 'hot_now').length,
      rising: opportunities.filter((o) => o.opportunityCategory === 'rising').length,
      underserved: opportunities.filter((o) => o.opportunityCategory === 'underserved').length,
      shorts_opportunity: opportunities.filter((o) => o.opportunityCategory === 'shorts_opportunity').length,
      longform_opportunity: opportunities.filter((o) => o.opportunityCategory === 'longform_opportunity').length,
      game_opportunity: opportunities.filter((o) => o.opportunityCategory === 'game_opportunity').length,
      new_release: opportunities.filter((o) => o.opportunityCategory === 'new_release').length,
    };

    return { opportunities, radarSummary };
  }

  /**
   * Decide Next Best Video to produce autonomously
   */
  public static async decideNextBestVideo(channelId = 'channel_default'): Promise<AutonomousDecision> {
    logInfo('DecisionEngine', 'Evaluating all data matrices to decide the NEXT BEST VIDEO...');

    const { opportunities } = await this.generateOpportunityRadar(channelId);
    const analytics = await ChannelIntelligenceService.analyzeChannelHistory(channelId);
    const channelProfile = memory.getChannel(channelId);

    // Pick highest opportunity item
    const topOpportunity = opportunities[0] || {
      game: 'Minecraft',
      topic: '5 Secret Minecraft 1.21 Mechanics Mojang Kept Hidden',
      recommendedFormat: 'shorts' as VideoFormat,
      trendScore: 92,
      channelFitScore: 95,
      opportunityScore: 94,
      opportunityCategory: 'hot_now' as OpportunityCategory,
    };

    // Calculate smart publishing time using channel timezone
    const bestPublishSlot = analytics.bestPublishingTimes[0] || {
      day: 'Friday',
      time: '18:30',
      timezone: channelProfile?.timezone || 'Local Channel Time',
    };

    const scheduledDate = new Date();
    scheduledDate.setHours(18, 30, 0, 0);
    const scheduleTimeStr = `${bestPublishSlot.day} @ ${bestPublishSlot.time} (${bestPublishSlot.timezone})`;

    const keyLearning =
      analytics.strategicGuidance.whatWorked[0] ||
      'Apply high-contrast animated captions and instant visual hook in first 1.5 seconds.';

    return {
      selectedTopic: topOpportunity.topic,
      selectedGame: topOpportunity.game,
      recommendedFormat: topOpportunity.recommendedFormat,
      trendScore: topOpportunity.trendScore,
      channelFitScore: topOpportunity.channelFitScore,
      opportunityScore: topOpportunity.opportunityScore,
      selectionReason: `Selected because [${topOpportunity.game}] yields the highest content opportunity score (${topOpportunity.opportunityScore}/100) combining worldwide viral momentum with proven channel retention history.`,
      keyLearningApplied: keyLearning,
      recommendedScheduleTime: scheduleTimeStr,
      expectedRetention: 82,
      opportunityCategory: topOpportunity.opportunityCategory,
    };
  }
}
