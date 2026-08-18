import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { WorkflowJob, WorkflowOptions, AgentId, AgentProgress, ChannelProfile } from '../types.js';
import { config, logInfo } from './config.js';

export interface LearnedInsight {
  id: string;
  timestamp: number;
  game: string;
  topic?: string;
  contentType?: string;
  format?: string;
  hookType?: string;
  insight: string;
  retentionImpact: string;
}

export class MemoryStore extends EventEmitter {
  private jobs: Map<string, WorkflowJob> = new Map();
  private channels: Map<string, ChannelProfile> = new Map();
  private learnedInsights: LearnedInsight[] = [];
  private storeFile: string;
  private channelsFile: string;
  private insightsFile: string;

  constructor() {
    super();
    this.storeFile = path.join(config.outputDir, 'jobs_memory.json');
    this.channelsFile = path.join(config.outputDir, 'channels_memory.json');
    this.insightsFile = path.join(config.outputDir, 'learning_insights.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storeFile)) {
        const raw = fs.readFileSync(this.storeFile, 'utf-8');
        const list: WorkflowJob[] = JSON.parse(raw);
        list.forEach((job) => this.jobs.set(job.id, job));
      }
    } catch (err) {
      // Ignore load error
    }

    try {
      if (fs.existsSync(this.channelsFile)) {
        const raw = fs.readFileSync(this.channelsFile, 'utf-8');
        const list: ChannelProfile[] = JSON.parse(raw);
        list.forEach((ch) => this.channels.set(ch.id, ch));
      } else {
        // Seed default universal gaming channel profile
        const defaultChannel: ChannelProfile = {
          id: 'channel_default',
          name: 'Ruflo Gaming Studio',
          targetGames: ['Minecraft', 'GTA 5', 'Roblox', 'Fortnite', 'Elden Ring', 'Valorant'],
          targetAudience: 'Gaming Enthusiasts, Shorts viewers, Teens & Young Adults (13-28)',
          language: 'English',
          tone: 'High-energy, engaging, informative & funny',
          thumbnailStyle: 'High-contrast, bold vibrant typography, expressive character focal points',
          uploadFrequency: 'Daily Shorts & Weekly Long-form',
          defaultFormat: 'shorts',
          playlist: 'Trending Gaming Secrets & Highlights',
          privacySettings: 'private',
          isDefault: true,
          autoPublishMode: 'dry_run',
          dailyLimit: 1,
          weeklyLimit: 7,
          timezone: 'America/New_York',
          preferredPublishDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
          preferredPublishTime: '18:30',
        };
        this.channels.set(defaultChannel.id, defaultChannel);

        const esportsChannel: ChannelProfile = {
          id: 'channel_esports',
          name: 'Pro Meta & Lineups',
          targetGames: ['Valorant', 'Counter-Strike 2', 'Call of Duty', 'Apex Legends'],
          targetAudience: 'Competitive ranked players, tactical FPS grinders',
          language: 'English',
          tone: 'Analytical, authoritative, fast-paced',
          thumbnailStyle: 'Neon green/cyan borders, minimap arrows, pro rank badges',
          uploadFrequency: 'Daily Shorts',
          defaultFormat: 'shorts',
          playlist: 'Pro Ranked Lineups & Tech',
          privacySettings: 'private',
          isDefault: false,
          autoPublishMode: 'dry_run',
          dailyLimit: 2,
          weeklyLimit: 10,
          timezone: 'America/Los_Angeles',
          preferredPublishDays: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
          preferredPublishTime: '17:00',
        };
        this.channels.set(esportsChannel.id, esportsChannel);

        this.saveChannelsToDisk();
      }
    } catch (err) {
      // Ignore
    }

    try {
      if (fs.existsSync(this.insightsFile)) {
        const raw = fs.readFileSync(this.insightsFile, 'utf-8');
        this.learnedInsights = JSON.parse(raw);
      } else {
        // Seed initial foundational gaming performance insights
        this.learnedInsights = [
          {
            id: 'ins_1',
            timestamp: Date.now() - 86400000 * 3,
            game: 'Minecraft',
            contentType: 'secrets',
            format: 'shorts',
            hookType: 'Pattern Interruption',
            insight: 'Revealing a counter-intuitive game mechanic within the first 1.5 seconds increased 10-second retention by 38%.',
            retentionImpact: '+38% viewer hold',
          },
          {
            id: 'ins_2',
            timestamp: Date.now() - 86400000 * 2,
            game: 'GTA 5',
            contentType: 'challenges',
            format: 'shorts',
            hookType: 'High-Stakes Countdown',
            insight: 'Immediate siren SFX coupled with fast dynamic zoom on the police radar boosted watch-through rate past 82%.',
            retentionImpact: '+82% completion',
          },
          {
            id: 'ins_3',
            timestamp: Date.now() - 86400000,
            game: 'Roblox',
            contentType: 'funny_moments',
            format: 'shorts',
            hookType: 'Relatable Fail',
            insight: 'Subtitles formatted with 2-word burst animations and high color contrast increased comment engagement 4.2x.',
            retentionImpact: '4.2x engagement rate',
          },
        ];
        this.saveInsightsToDisk();
      }
    } catch (err) {
      // Ignore
    }
  }

  private saveToDisk() {
    try {
      const list = Array.from(this.jobs.values());
      fs.writeFileSync(this.storeFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      // Ignore
    }
  }

  private saveChannelsToDisk() {
    try {
      const list = Array.from(this.channels.values());
      fs.writeFileSync(this.channelsFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      // Ignore
    }
  }

  private saveInsightsToDisk() {
    try {
      fs.writeFileSync(this.insightsFile, JSON.stringify(this.learnedInsights, null, 2), 'utf-8');
    } catch (err) {
      // Ignore
    }
  }

  public createJob(options: WorkflowOptions): WorkflowJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialAgents: Record<AgentId, AgentProgress> = {
      global_trends: { agentId: 'global_trends', name: 'Global Trends Agent', role: 'Worldwide Demand & 0-100 Trend Scoring', status: 'idle', progress: 0, message: 'Ready' },
      channel_intelligence: { agentId: 'channel_intelligence', name: 'Channel Intelligence Agent', role: 'Historical Performance & Learning Loop', status: 'idle', progress: 0, message: 'Waiting' },
      autonomous_decision: { agentId: 'autonomous_decision', name: 'Decision Engine Agent', role: 'Opportunity Radar & Next Best Topic', status: 'idle', progress: 0, message: 'Waiting' },
      game_discovery: { agentId: 'game_discovery', name: 'Game Discovery Agent', role: 'Trending Games & Market Demand', status: 'idle', progress: 0, message: 'Waiting' },
      research: { agentId: 'research', name: 'Research & Lore Agent', role: 'Deep Topic, Mechanics & Viral Angles', status: 'idle', progress: 0, message: 'Waiting' },
      content_strategy: { agentId: 'content_strategy', name: 'Content Strategy Agent', role: 'Audience & Pacing Blueprint', status: 'idle', progress: 0, message: 'Waiting' },
      script: { agentId: 'script', name: 'Story/Script Agent', role: 'Narrative & Pattern Interrupt Hook Writing', status: 'idle', progress: 0, message: 'Waiting' },
      scene_planning: { agentId: 'scene_planning', name: 'Scene & Storyboard Agent', role: 'Audio-Visual Timing & Cues', status: 'idle', progress: 0, message: 'Waiting' },
      video_asset: { agentId: 'video_asset', name: 'Gameplay & Asset Agent', role: 'Modular Footage & Media Sourcing', status: 'idle', progress: 0, message: 'Waiting' },
      voiceover: { agentId: 'voiceover', name: 'Voiceover Agent', role: 'Gemini Speech Synthesis & Narration', status: 'idle', progress: 0, message: 'Waiting' },
      video_editing: { agentId: 'video_editing', name: 'Video Editing Agent', role: 'FFmpeg Compositor & Dynamic Captions', status: 'idle', progress: 0, message: 'Waiting' },
      thumbnail: { agentId: 'thumbnail', name: 'Thumbnail Agent', role: 'Multi-Concept Scoring & A/B Artwork', status: 'idle', progress: 0, message: 'Waiting' },
      seo: { agentId: 'seo', name: 'YouTube SEO Agent', role: 'High-CTR Titles, Tags & Hashtags', status: 'idle', progress: 0, message: 'Waiting' },
      copyright_safety: { agentId: 'copyright_safety', name: 'Copyright & Safety Agent', role: 'Fair Use & YouTube Content ID Audit', status: 'idle', progress: 0, message: 'Waiting' },
      quality_control: { agentId: 'quality_control', name: 'Quality Control Agent', role: 'Production Audit & Standards Gate', status: 'idle', progress: 0, message: 'Waiting' },
      autonomous_publishing: { agentId: 'autonomous_publishing', name: 'Autonomous Publishing Agent', role: 'Automated Upload, Playlists & Scheduling', status: 'idle', progress: 0, message: 'Waiting' },
      youtube_upload: { agentId: 'youtube_upload', name: 'YouTube Upload Agent', role: 'OAuth 2.0 & Publishing Control', status: 'idle', progress: 0, message: 'Waiting' },
      analytics: { agentId: 'analytics', name: 'Analytics Agent', role: '72h Retention Telemetry & Drop-offs', status: 'idle', progress: 0, message: 'Waiting' },
      optimization: { agentId: 'optimization', name: 'Learning & Optimization Agent', role: 'Self-Improvement & Continuous Loop', status: 'idle', progress: 0, message: 'Waiting' },
    };

    const displayTopic = options.topic || (options.game ? `${options.game} Highlights` : 'Trending Gaming Content');

    const job: WorkflowJob = {
      id,
      topic: displayTopic,
      game: options.game,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      options,
      agentsProgress: initialAgents,
      logs: [
        {
          timestamp: Date.now(),
          level: 'info',
          message: `Created Ruflo Studio workflow. Game: "${options.game || 'Auto-Discover'}", Topic: "${displayTopic}" (Format: ${options.format || 'shorts'}, Dry-Run: ${options.dryRun !== false})`,
        },
      ],
      artifacts: {},
    };

    this.jobs.set(id, job);
    this.saveToDisk();
    return job;
  }

  public getJob(id: string): WorkflowJob | undefined {
    return this.jobs.get(id);
  }

  public getAllJobs(): WorkflowJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public updateJobStatus(id: string, status: WorkflowJob['status'], error?: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = status;
    job.updatedAt = Date.now();
    if (error) job.error = error;
    this.saveToDisk();
    this.emit('job:status', { jobId: id, status, error });
  }

  public updateAgentProgress(
    id: string,
    agentIdOrProgress: AgentId | AgentProgress,
    partialProgress?: Partial<AgentProgress>
  ) {
    const job = this.jobs.get(id);
    if (!job) return;

    let progressObj: AgentProgress;
    if (typeof agentIdOrProgress === 'string') {
      const agentId = agentIdOrProgress as AgentId;
      const existing = job.agentsProgress[agentId] || {
        agentId,
        name: agentId,
        role: '',
        status: 'idle',
        progress: 0,
        message: '',
      };
      progressObj = {
        ...existing,
        ...partialProgress,
        agentId,
        message: partialProgress?.message ?? existing.message ?? '',
      };
    } else {
      progressObj = agentIdOrProgress;
    }

    job.agentsProgress[progressObj.agentId] = {
      ...job.agentsProgress[progressObj.agentId],
      ...progressObj,
    };
    job.updatedAt = Date.now();
    this.saveToDisk();
    this.emit('agent:progress', { jobId: id, ...progressObj });
  }

  public addLog(id: string, message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info', agentId?: AgentId) {
    const job = this.jobs.get(id);
    if (!job) return;
    const logItem = { timestamp: Date.now(), level, message, agentId };
    job.logs.push(logItem);
    job.updatedAt = Date.now();
    this.saveToDisk();
    this.emit('job:log', { jobId: id, log: logItem });
  }

  public setArtifact<K extends keyof WorkflowJob['artifacts']>(id: string, key: K, value: WorkflowJob['artifacts'][K]) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.artifacts[key] = value;
    job.updatedAt = Date.now();
    this.saveToDisk();
    this.emit('job:artifact', { jobId: id, key, value });
  }

  // Multi-Channel Profile Methods
  public getChannels(): ChannelProfile[] {
    return Array.from(this.channels.values());
  }

  public getChannel(id: string): ChannelProfile | undefined {
    return this.channels.get(id);
  }

  public saveChannel(profile: ChannelProfile) {
    this.channels.set(profile.id, profile);
    this.saveChannelsToDisk();
  }

  public deleteChannel(id: string) {
    this.channels.delete(id);
    this.saveChannelsToDisk();
  }

  // Learned Memory Insights
  public getLearnedInsights(): LearnedInsight[] {
    return [...this.learnedInsights];
  }

  public addLearnedInsight(insight: Omit<LearnedInsight, 'id' | 'timestamp'>) {
    const newInsight: LearnedInsight = {
      id: `ins_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...insight,
    };
    this.learnedInsights.unshift(newInsight);
    if (this.learnedInsights.length > 50) {
      this.learnedInsights = this.learnedInsights.slice(0, 50);
    }
    this.saveInsightsToDisk();
    logInfo('Memory', `Recorded new strategic insight for [${insight.game}]: "${insight.insight}"`);
  }
}

export const memory = new MemoryStore();
