import { WorkflowJob, WorkflowOptions } from '../types.js';
import { memory } from './memory.js';
import { logInfo, logWarn, logError } from './config.js';

// Swarm Agents
import { GlobalTrendAgent } from './agents/GlobalTrendAgent.js';
import { ChannelIntelligenceAgent } from './agents/ChannelIntelligenceAgent.js';
import { DecisionAgent } from './agents/DecisionAgent.js';
import { GameDiscoveryAgent } from './agents/GameDiscoveryAgent.js';
import { ResearchAgent } from './agents/ResearchAgent.js';
import { ContentStrategyAgent } from './agents/ContentStrategyAgent.js';
import { StoryScriptAgent } from './agents/StoryScriptAgent.js';
import { ScenePlanningAgent } from './agents/ScenePlanningAgent.js';
import { VideoAssetAgent } from './agents/VideoAssetAgent.js';
import { VoiceoverAgent } from './agents/VoiceoverAgent.js';
import { VideoEditingAgent } from './agents/VideoEditingAgent.js';
import { ThumbnailAgent } from './agents/ThumbnailAgent.js';
import { YouTubeSEOAgent } from './agents/YouTubeSEOAgent.js';
import { CopyrightSafetyAgent } from './agents/CopyrightSafetyAgent.js';
import { QualityControlAgent } from './agents/QualityControlAgent.js';
import { AutonomousPublishingAgent } from './agents/AutonomousPublishingAgent.js';
import { YouTubeUploadAgent } from './agents/YouTubeUploadAgent.js';
import { AnalyticsAgent } from './agents/AnalyticsAgent.js';
import { OptimizationAgent } from './agents/OptimizationAgent.js';

export class WorkflowOrchestrator {
  private globalTrendAgent = new GlobalTrendAgent();
  private channelIntelligenceAgent = new ChannelIntelligenceAgent();
  private decisionAgent = new DecisionAgent();
  private gameDiscoveryAgent = new GameDiscoveryAgent();
  private researchAgent = new ResearchAgent();
  private contentStrategyAgent = new ContentStrategyAgent();
  private storyScriptAgent = new StoryScriptAgent();
  private scenePlanningAgent = new ScenePlanningAgent();
  private videoAssetAgent = new VideoAssetAgent();
  private voiceoverAgent = new VoiceoverAgent();
  private videoEditingAgent = new VideoEditingAgent();
  private thumbnailAgent = new ThumbnailAgent();
  private seoAgent = new YouTubeSEOAgent();
  private copyrightSafetyAgent = new CopyrightSafetyAgent();
  private qualityControlAgent = new QualityControlAgent();
  private autonomousPublishingAgent = new AutonomousPublishingAgent();
  private youtubeUploadAgent = new YouTubeUploadAgent();
  private analyticsAgent = new AnalyticsAgent();
  private optimizationAgent = new OptimizationAgent();

  /**
   * Run the complete multi-agent automated YouTube workflow
   */
  public async executeWorkflow(options: WorkflowOptions, existingJobId?: string): Promise<WorkflowJob> {
    const job = existingJobId ? (memory.getJob(existingJobId) || memory.createJob(options)) : memory.createJob(options);
    memory.updateJobStatus(job.id, 'running');
    logInfo('Orchestrator', `Starting Ruflo Multi-Agent YouTube workflow for Job ID: ${job.id}`);

    try {
      // Stage 1: Global YouTube Trends & Momentum Scoring (0-100)
      memory.addLog(job.id, 'Stage 1/19: Scanning Global YouTube Gaming Trends & Demand Velocities...', 'info', 'global_trends');
      await this.globalTrendAgent.execute(job);

      // Stage 2: Channel Historical Performance & Retention Analysis
      memory.addLog(job.id, 'Stage 2/19: Auditing Channel Historical Analytics & Retention Drop Points...', 'info', 'channel_intelligence');
      await this.channelIntelligenceAgent.execute(job);

      // Stage 3: Autonomous Opportunity Radar & Next Best Topic Decision
      memory.addLog(job.id, 'Stage 3/19: Fusing Trends + Channel History to Calculate Content Opportunity Score...', 'info', 'autonomous_decision');
      await this.decisionAgent.execute(job);

      // Stage 4: Game Discovery & Market Demand Analysis
      memory.addLog(job.id, 'Stage 4/19: Initiating Game Discovery Agent (Audience Demographics)...', 'info', 'game_discovery');
      await this.gameDiscoveryAgent.execute(job);

      // Stage 5: Deep Topic & Lore Research
      memory.addLog(job.id, 'Stage 5/19: Initiating Research Agent (Lore, Mechanics & Viral Angles)...', 'info', 'research');
      await this.researchAgent.execute(job);

      // Stage 6: Content Strategy & Memory Learning Injection
      memory.addLog(job.id, 'Stage 6/19: Initiating Content Strategy Agent (Retention Formula & Pacing)...', 'info', 'content_strategy');
      await this.contentStrategyAgent.execute(job);

      // Stage 7: Story/Script & Pattern Interrupt Hook Writing
      memory.addLog(job.id, 'Stage 7/19: Initiating Story/Script Agent (Dialogue & Psychological Cues)...', 'info', 'script');
      await this.storyScriptAgent.execute(job);

      // Stage 8: Scene Planning & Audio-Visual Storyboard
      memory.addLog(job.id, 'Stage 8/19: Initiating Scene Planning Agent (Transitions & Camera Cues)...', 'info', 'scene_planning');
      await this.scenePlanningAgent.execute(job);

      // Stage 9: Video Assets & Modular Gameplay Footage Sourcing
      memory.addLog(job.id, 'Stage 9/19: Initiating Video Asset Agent (Modular Gameplay Clips & AI Frames)...', 'info', 'video_asset');
      await this.videoAssetAgent.execute(job);

      // Stage 10: Voiceover Audio Synthesis
      memory.addLog(job.id, 'Stage 10/19: Initiating Voiceover Agent (TTS Audio Narration Synthesis)...', 'info', 'voiceover');
      await this.voiceoverAgent.execute(job);

      // Stage 11: Video Editing & FFmpeg Composition Engine
      memory.addLog(job.id, 'Stage 11/19: Initiating Video Editing Agent (Dynamic Subtitles, Zoom & Audio Ducking)...', 'info', 'video_editing');
      await this.videoEditingAgent.execute(job);

      // Stage 12: Thumbnail Generation & 6-Point CTR Evaluation
      memory.addLog(job.id, 'Stage 12/19: Initiating Thumbnail Agent (A/B Concepts & Mobile Readability Audit)...', 'info', 'thumbnail');
      await this.thumbnailAgent.execute(job);

      // Stage 13: YouTube SEO & Algorithmic Metadata
      memory.addLog(job.id, 'Stage 13/19: Initiating YouTube SEO Agent (High-CTR Titles, Hashtags & Keywords)...', 'info', 'seo');
      await this.seoAgent.execute(job);

      // Stage 14: Copyright & Fair Use Safety Verification
      memory.addLog(job.id, 'Stage 14/19: Initiating Copyright & Policy Safety Agent (Content ID & Fair Use Audit)...', 'info', 'copyright_safety');
      await this.copyrightSafetyAgent.execute(job);

      // Stage 15: Holistic Quality Control Integrity Gate
      memory.addLog(job.id, 'Stage 15/19: Initiating Quality Control Agent (Audio, Video & Script Standards Gate)...', 'info', 'quality_control');
      await this.qualityControlAgent.execute(job);

      // Stage 16: Autonomous Publishing & Playlist Assignment
      memory.addLog(job.id, 'Stage 16/19: Initiating Autonomous Publishing Agent (Metadata Check & Upload Routing)...', 'info', 'autonomous_publishing');
      await this.autonomousPublishingAgent.execute(job);

      // Stage 17: YouTube Direct Upload Sync
      if (job.options.upload) {
        memory.addLog(job.id, 'Stage 17/19: Initiating YouTube Upload Agent (Direct API Synchronization)...', 'info', 'youtube_upload');
        await this.youtubeUploadAgent.execute(job);
      }

      // Stage 18: Analytics Telemetry & Performance Projection
      memory.addLog(job.id, 'Stage 18/19: Initiating Analytics Agent (72h Retention Telemetry & Drop-off Points)...', 'info', 'analytics');
      await this.analyticsAgent.execute(job);

      // Stage 19: Learning Loop & Continuous Memory Optimization
      memory.addLog(job.id, 'Stage 19/19: Initiating Learning & Optimization Agent (Storing Insights to Memory)...', 'info', 'optimization');
      await this.optimizationAgent.execute(job);

      // Mark Job Completed
      memory.updateJobStatus(job.id, 'completed');
      memory.addLog(job.id, `🎉 Full autonomous YouTube intelligence pipeline successfully completed for [${job.game}]! Video rendered and indexed in memory.`, 'success');
      logInfo('Orchestrator', `Job ${job.id} completed successfully across all intelligence stages.`);

      return memory.getJob(job.id)!;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      memory.updateJobStatus(job.id, 'failed', errorMessage);
      memory.addLog(job.id, `Workflow failed: ${errorMessage}`, 'error');
      logError('Orchestrator', `Job ${job.id} encountered error: ${errorMessage}`);
      throw err;
    }
  }

  /**
   * Autonomous Daily Mode:
   * 1. Check global trends
   * 2. Check channel analytics
   * 3. Check previous uploads
   * 4. Find content opportunities
   * 5. Select best topic
   * 6. Generate content
   * 7. Run QC
   * 8. Generate thumbnail & SEO
   * 9. Upload / schedule
   * 10. Track performance & learn
   * Respects dailyLimit and weeklyLimit.
   */
  public async executeAutonomousDaily(options: {
    channelId?: string;
    upload?: boolean;
    scheduleAuto?: boolean;
    dryRun?: boolean;
    dailyLimit?: number;
    weeklyLimit?: number;
  }): Promise<{ job: WorkflowJob; message: string }> {
    const channelId = options.channelId || 'channel_default';
    const channel = memory.getChannel(channelId);

    const dailyLimit = options.dailyLimit ?? channel?.dailyLimit ?? 1;
    const weeklyLimit = options.weeklyLimit ?? channel?.weeklyLimit ?? 7;

    logInfo('Orchestrator', `Executing Autonomous Daily Workflow for channel [${channel?.name || channelId}] (Daily Limit: ${dailyLimit}, Weekly Limit: ${weeklyLimit})...`);

    // Check recent completed jobs to enforce limits
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const past24hJobs = memory.getAllJobs().filter((j) => j.status === 'completed' && j.createdAt > oneDayAgo);

    if (past24hJobs.length >= dailyLimit) {
      logWarn('Orchestrator', `Daily limit of ${dailyLimit} video(s) already reached in past 24h. Safely skipping automated daily run.`);
      return {
        job: past24hJobs[0],
        message: `Daily limit reached (${past24hJobs.length}/${dailyLimit} uploads in past 24h). Safety limits respected.`,
      };
    }

    const workflowOptions: WorkflowOptions = {
      autoTopic: true,
      autoGame: true,
      autonomousDaily: true,
      channelProfileId: channelId,
      upload: options.upload ?? false,
      scheduleAuto: options.scheduleAuto ?? true,
      dryRun: options.dryRun ?? true,
      privacyStatus: channel?.privacySettings || 'private',
      format: channel?.defaultFormat || 'shorts',
      dailyLimit,
      weeklyLimit,
    };

    const job = await this.executeWorkflow(workflowOptions);

    return {
      job,
      message: `Autonomous Daily Workflow successfully produced: [${job.game}] "${job.topic}".`,
    };
  }
}

export const orchestrator = new WorkflowOrchestrator();
