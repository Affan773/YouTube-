/**
 * Universal Multi-Game AI YouTube Studio Types & Interfaces
 */

export type VideoFormat = 'shorts' | 'landscape'; // shorts = 9:16 (1080x1920), landscape = 16:9 (1920x1080)
export type PrivacyStatus = 'private' | 'unlisted' | 'public';
export type VoicePersona = 'Fenrir' | 'Kore' | 'Puck' | 'Zephyr' | 'Charon';
export type FootageSource = 'ai_generated' | 'user_clips' | 'screenshots' | 'b_roll' | 'hybrid';
export type AutoPublishMode = 'dry_run' | 'preview' | 'approve' | 'auto_publish';

export type OpportunityCategory =
  | 'hot_now'
  | 'rising'
  | 'underserved'
  | 'shorts_opportunity'
  | 'longform_opportunity'
  | 'game_opportunity'
  | 'new_release';

export type ContentType =
  | 'gameplay_highlights'
  | 'funny_moments'
  | 'challenges'
  | 'tips_and_tricks'
  | 'secrets'
  | 'easter_eggs'
  | 'top_10'
  | 'rankings'
  | 'reviews'
  | 'comparisons'
  | 'walkthroughs'
  | 'game_lore'
  | 'lore'
  | 'gaming_news'
  | 'updates'
  | 'beginner_guides'
  | 'advanced_guides'
  | 'story_videos'
  | 'horror_videos'
  | 'compilation_videos'
  | 'shorts'
  | 'long_form';

export type AgentId =
  | 'game_discovery'
  | 'research'
  | 'content_strategy'
  | 'script'
  | 'scene_planning'
  | 'video_asset'
  | 'voiceover'
  | 'video_editing'
  | 'thumbnail'
  | 'seo'
  | 'copyright_safety'
  | 'quality_control'
  | 'youtube_upload'
  | 'analytics'
  | 'optimization'
  | 'channel_intelligence'
  | 'global_trends'
  | 'autonomous_decision'
  | 'autonomous_publishing';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AgentProgress {
  agentId: AgentId;
  name: string;
  role: string;
  status: AgentStatus;
  progress: number; // 0-100
  message: string;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface ChannelCredentials {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  channelId?: string;
}

export interface ChannelProfile {
  id: string;
  name: string;
  targetGames: string[];
  targetAudience: string;
  language: string;
  tone: string;
  thumbnailStyle: string;
  uploadFrequency: string;
  defaultFormat: VideoFormat;
  playlist: string;
  privacySettings: PrivacyStatus;
  isDefault?: boolean;
  credentials?: ChannelCredentials;
  autoPublishMode?: AutoPublishMode;
  dailyLimit?: number;
  weeklyLimit?: number;
  timezone?: string;
  preferredPublishDays?: string[];
  preferredPublishTime?: string; // e.g. "18:30"
}

export interface WorkflowOptions {
  topic?: string;
  game?: string; // e.g. "Minecraft", "GTA 5", "Roblox", "Fortnite", "Elden Ring", etc.
  autoGameDiscovery?: boolean; // When true, automatically discover trending game & topic
  autoTopic?: boolean; // When true, select topic automatically from trend & channel opportunity scoring
  autoGame?: boolean; // Synonym for autoGameDiscovery
  autonomousDaily?: boolean; // Run full daily loop
  dailyLimit?: number;
  weeklyLimit?: number;
  scheduleAuto?: boolean;
  abTestingEnabled?: boolean;
  contentType?: ContentType;
  channelProfileId?: string;
  language?: string;
  format?: VideoFormat;
  footageSource?: FootageSource;
  voice?: VoicePersona;
  upload?: boolean;
  scheduleDate?: string; // ISO 8601
  privacyStatus?: PrivacyStatus;
  dryRun?: boolean;
  inputClipsDir?: string;
  targetDurationSeconds?: number;
  batchCount?: number;
}

// ----------------------------------------------------
// Global Trend Intelligence & Scoring Models
// ----------------------------------------------------

export interface GlobalTrendItem {
  id: string;
  game: string;
  topic: string;
  category: string;
  demandScore: number; // 0-100
  growthRate: number; // 0-100
  relevance: number; // 0-100
  competition: 'Low' | 'Medium' | 'High';
  audienceFit: number; // 0-100
  contentPotential: number; // 0-100
  freshness: number; // 0-100
  trendScore: number; // 0-100 (Calculated weighted score)
  searchVolume: string; // e.g. "3.8M/mo (+45%)"
  formatPotential: 'shorts' | 'long_form' | 'both';
  opportunityCategory: OpportunityCategory;
  suggestedAngle: string;
  tags: string[];
  discoveredAt: number;
}

export interface TrendingGameItem {
  name: string;
  genre: string;
  popularityScore: number; // 1-100
  searchVolume: string; // e.g. "Very High (2.4M/mo)"
  competitionLevel: 'Low' | 'Medium' | 'High';
  trendingTopics: string[];
  recommendedFormat: VideoFormat;
  hookIdeas: string[];
}

export interface GameDiscoveryData {
  trendingGames: TrendingGameItem[];
  selectedGame: string;
  discoveryReason: string;
  searchDemandAnalysis: string;
  competitionAnalysis: string;
  recommendedIdea: string;
  contentAngle: string;
  isAutoDiscovered: boolean;
}

// ----------------------------------------------------
// Channel Historical Intelligence & Performance Models
// ----------------------------------------------------

export interface RetentionDropPoint {
  timestampSec: number;
  dropPercent: number;
  reason: string;
}

export interface ChannelVideoPerformance {
  videoId: string;
  title: string;
  game: string;
  format: VideoFormat;
  uploadDate: string;
  views: number;
  impressions: number;
  ctr: number; // e.g. 11.4%
  avgViewDurationSec: number;
  avgPercentageViewed: number; // e.g. 74.2%
  retentionRate: number; // e.g. 82.5%
  likes: number;
  comments: number;
  shares?: number;
  subscribersGained: number;
  trafficSources?: Record<string, number>;
  performanceScore: number; // 0-100
  retentionDropPoints: RetentionDropPoint[];
  weakIntro: boolean;
  thumbnailScore: number;
  publishHourUtc?: number;
  publishDay?: string;
}

export interface ChannelAnalyticsReport {
  channelId: string;
  channelName: string;
  totalVideosAnalyzed: number;
  totalViews: number;
  avgCtr: number;
  avgRetentionPercent: number;
  topPerformingVideos: ChannelVideoPerformance[];
  lowPerformingVideos: ChannelVideoPerformance[];
  bestTopics: string[];
  bestGames: string[];
  bestVideoLength: string;
  bestFormat: VideoFormat;
  bestHooks: string[];
  bestTitles: string[];
  bestThumbnails: string[];
  bestPublishingTimes: {
    day: string;
    time: string;
    timezone: string;
    avgViewsMultiplier: number;
  }[];
  weakRetentionPatterns: string[];
  failurePatternsToAvoid: string[];
  strategicGuidance: {
    whatWorked: string[];
    whatDidNotWork: string[];
    whatToRepeat: string[];
    whatToAvoid: string[];
    whatToTestNext: string[];
  };
}

// ----------------------------------------------------
// Content Opportunity Radar & Decision Engine Models
// ----------------------------------------------------

export interface ContentOpportunityItem {
  id: string;
  game: string;
  topic: string;
  opportunityScore: number; // 0-100 (Combined Global + Channel + Competition + Freshness)
  trendScore: number; // 0-100
  channelFitScore: number; // 0-100
  competitionLevel: 'Low' | 'Medium' | 'High';
  freshness: number; // 0-100
  opportunityCategory: OpportunityCategory;
  recommendedFormat: VideoFormat;
  reasoning: string;
  suggestedHook: string;
  suggestedAngles: string[];
  estimatedImpressions: string;
}

export interface AutonomousDecision {
  selectedTopic: string;
  selectedGame: string;
  recommendedFormat: VideoFormat;
  trendScore: number;
  channelFitScore: number;
  opportunityScore: number;
  selectionReason: string;
  keyLearningApplied: string;
  recommendedScheduleTime: string;
  expectedRetention: number;
  opportunityCategory: OpportunityCategory;
}

export interface ABCandidate {
  id: string;
  type: 'title' | 'thumbnail' | 'hook';
  content: string;
  subContent?: string;
  score: number; // 0-100
  reasoning: string;
  isSelected: boolean;
}

// ----------------------------------------------------
// Pipeline Artifact Models
// ----------------------------------------------------

export interface ResearchData {
  game: string;
  topic: string;
  hookConcept: string;
  targetAudience: string;
  keyMoments: string[];
  trendingAngles: string[];
  tone: string;
  gamingLoreContext: string;
  searchIntentKeywords: string[];
}

export interface ContentStrategyData {
  chosenGame: string;
  chosenContentType: ContentType;
  targetDemographic: string;
  pacingStrategy: string;
  retentionHooks: string[];
  competitiveDifferentiator: string;
  expectedAudienceRetentionRate: number; // e.g. 78%
  structureBreakdown: { section: string; targetSeconds: number; purpose: string }[];
  learnedInsightsApplied: string[];
}

export interface ScriptLine {
  id: string;
  timestampStart: number;
  timestampEnd: number;
  speaker: string;
  emotion: string;
  text: string;
  sfxCue?: string;
}

export interface ScriptData {
  game: string;
  titleHook: string;
  synopsis: string;
  totalDurationSeconds: number;
  lines: ScriptLine[];
  callToAction: string;
}

export interface SceneItem {
  sceneNumber: number;
  durationSeconds: number;
  visualPrompt: string;
  cameraMovement: string;
  actionDescription: string;
  subtitleText: string;
  sfxCue: string;
  visualStyleTag: string;
  assetPath?: string;
  assetType?: 'image' | 'video' | 'clip';
}

export interface ScenePlanningData {
  scenes: SceneItem[];
  musicStyle: string;
  colorPalette: string;
  energyCurve: string;
}

export interface VideoAssetData {
  assets: {
    sceneNumber: number;
    filePath: string;
    type: 'ai_image' | 'gameplay_clip' | 'rendered_canvas' | 'screenshot' | 'b_roll';
    provenance: string;
    prompt?: string;
  }[];
  providerType: string;
  disclaimer: string;
}

export interface VoiceoverData {
  audioFilePath: string;
  durationSeconds: number;
  voiceUsed: string;
  format: string;
  sceneAudioFiles?: { sceneNumber: number; filePath: string }[];
}

export interface VideoEditingData {
  videoFilePath: string;
  durationSeconds: number;
  resolution: { width: number; height: number };
  aspectRatio: VideoFormat;
  subtitlesPath: string;
  hasAudioDucking: boolean;
  fileSizeBytes: number;
  chapters?: { time: string; title: string }[];
}

export interface ThumbnailConcept {
  id: string;
  headlineText: string;
  subText: string;
  conceptPrompt: string;
  scores: {
    readability: number; // 0-100
    contrast: number; // 0-100
    focalPoint: number; // 0-100
    emotionalImpact: number; // 0-100
    curiosity: number; // 0-100
    mobileVisibility: number; // 0-100
    totalCTRScore: number; // 0-100
  };
  imagePath?: string;
  selected: boolean;
}

export interface ThumbnailData {
  concepts: ThumbnailConcept[];
  selectedConcept: ThumbnailConcept;
  imagePath: string;
  headlineText: string;
  subText: string;
  conceptPrompt: string;
  ctrEstimateScore: number;
}

export interface SEOData {
  titleOptions: string[];
  selectedTitle: string;
  description: string;
  tags: string[];
  hashtags: string[];
  categoryId: string; // '20' for Gaming
  seoScore: number;
  searchKeywords: string[];
  playlistRecommendation: string;
  audienceTargeting: string;
}

export interface CopyrightCheckItem {
  id: string;
  category: string;
  description: string;
  status: 'passed' | 'warning' | 'flagged';
  details: string;
}

export interface CopyrightSafetyData {
  overallSafetyScore: number; // 0-100
  status: 'safe' | 'warning' | 'flagged';
  checks: CopyrightCheckItem[];
  fairUseGuidelines: string[];
  misleadingMetadataCheck: string;
  spamRepetitionCheck: string;
  userConfirmationRequired: boolean;
  actionNotes: string[];
}

export interface QualityCheckItem {
  id: string;
  name: string;
  category: 'audio' | 'video' | 'script' | 'seo' | 'guidelines';
  status: 'passed' | 'warning' | 'failed';
  score: number; // 0-100
  details: string;
}

export interface QualityControlData {
  overallScore: number; // 0-100
  passed: boolean;
  checks: QualityCheckItem[];
  recommendations: string[];
}

export interface YouTubeUploadData {
  videoId?: string;
  videoUrl?: string;
  channelTitle?: string;
  privacyStatus: PrivacyStatus;
  scheduledPublishAt?: string;
  isDryRun: boolean;
  uploadedAt: string;
  uploadStatus: 'success' | 'dry_run_simulated' | 'failed';
  message: string;
  playlistId?: string;
  playlistTitle?: string;
}

export interface AnalyticsData {
  projectedImpressions: number;
  projectedCTR: number;
  projectedViews: number;
  averageViewDurationSeconds: number;
  retentionPercentage: number;
  hookEffectivenessScore: number;
  dropOffPoints: { second: number; percentage: number; reason: string }[];
  topPerformingElements: string[];
  performanceRating: 'viral_outlier' | 'high_performer' | 'solid_performer' | 'needs_improvement';
  audienceInsights: string;
  videoMetrics?: {
    views: number;
    impressions: number;
    ctr: number;
    avgViewDurationSeconds: number;
    retentionRate: number;
    likes: number;
    comments: number;
    subscribersGained: number;
  };
}

export interface OptimizationData {
  insights: string[];
  nextVideoImprovements: string[];
  updatedRetentionGuidelines: string[];
  futureTopicRecommendations: string[];
  learnings?: string[];
  strategyAdjustments?: string[];
  retentionOptimizations?: string[];
  memoryStateSummary?: string;
}

export interface WorkflowJob {
  id: string;
  topic: string;
  game?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  options: WorkflowOptions;
  agentsProgress: Record<AgentId, AgentProgress>;
  logs: { timestamp: number; agentId?: AgentId; level: 'info' | 'warn' | 'error' | 'success'; message: string }[];
  artifacts: {
    gameDiscovery?: GameDiscoveryData;
    research?: ResearchData;
    contentStrategy?: ContentStrategyData;
    script?: ScriptData;
    scenePlan?: ScenePlanningData;
    assets?: VideoAssetData;
    voiceover?: VoiceoverData;
    videoEditing?: VideoEditingData;
    thumbnail?: ThumbnailData;
    seo?: SEOData;
    copyrightSafety?: CopyrightSafetyData;
    qualityControl?: QualityControlData;
    youtubeUpload?: YouTubeUploadData;
    analytics?: AnalyticsData;
    optimization?: OptimizationData;
    channelAnalytics?: ChannelAnalyticsReport;
    globalTrends?: GlobalTrendItem[];
    contentOpportunities?: ContentOpportunityItem[];
    autonomousDecision?: AutonomousDecision;
    abTestCandidates?: ABCandidate[];
  };
  error?: string;
}

export interface ClipItem {
  id: string;
  filename: string;
  filePath: string;
  duration: number;
  sizeBytes: number;
  uploadedAt: number;
  gameTag?: string;
  description?: string;
}
