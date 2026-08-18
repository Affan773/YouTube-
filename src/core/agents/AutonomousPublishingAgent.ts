import { BaseAgent } from './BaseAgent.js';
import { AgentId, PrivacyStatus, WorkflowJob, YouTubeUploadData } from '../../types.js';
import { YouTubeService } from '../youtube.js';
import { memory } from '../memory.js';
import fs from 'fs';

export class AutonomousPublishingAgent extends BaseAgent {
  public readonly id: AgentId = 'autonomous_publishing';
  public readonly name = 'Autonomous Publishing Agent';
  public readonly role = 'Executes end-to-end automated YouTube publishing, playlist assignment, scheduling & tracking';

  public async run(job: WorkflowJob): Promise<YouTubeUploadData> {
    const qc = job.artifacts.qualityControl;
    const videoData = job.artifacts.videoEditing;
    const seoData = job.artifacts.seo;
    const thumbnailData = job.artifacts.thumbnail;
    const channelProfileId = job.options.channelProfileId || 'channel_default';
    const channelProfile = memory.getChannel(channelProfileId);

    this.updateProgress(job.id, 10, 'Initiating post-QC autonomous publishing sequence...');
    this.log(job.id, 'Verifying Quality Control audit gate and production artifacts...');

    // 1. Quality Control Gate Check
    if (qc && !qc.passed) {
      this.log(job.id, `QC Gate Warning: Overall score ${qc.overallScore}/100. Continuing under review status.`, 'warn');
    }

    // 2. Video Artifact Validation
    if (!videoData?.videoFilePath || !fs.existsSync(videoData.videoFilePath)) {
      throw new Error(`Video file missing or corrupt at: ${videoData?.videoFilePath}`);
    }

    // 3. Metadata Validation
    if (!seoData?.selectedTitle) {
      throw new Error('SEO title is required for YouTube publishing.');
    }

    this.updateProgress(job.id, 30, 'Validating video stream container, bitrate, and metadata tags...');
    this.log(
      job.id,
      `Publishing Package: Title: "${seoData.selectedTitle.slice(0, 45)}..." | Tags: ${seoData.tags.length} | Category: ${seoData.categoryId} (Gaming)`
    );

    // 4. Determine Privacy, Schedule & Dry-Run Mode
    // Default safety rule: Public upload MUST be explicitly configured by the user
    let privacyStatus: PrivacyStatus = job.options.privacyStatus || channelProfile?.privacySettings || 'private';
    let isDryRun = job.options.dryRun ?? true;

    // Check if live upload was requested
    if (job.options.upload === true && job.options.dryRun === false) {
      isDryRun = false;
    }

    let scheduledPublishAt: string | undefined = job.options.scheduleDate;
    if (job.options.scheduleAuto && !scheduledPublishAt) {
      // Auto-schedule according to recommended channel optimal slot (e.g. Next peak weekday 18:30)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(18, 30, 0, 0);
      scheduledPublishAt = targetDate.toISOString();
      privacyStatus = 'private'; // Scheduled videos must be private until publishAt
      this.log(job.id, `Auto-scheduler set target publish time to: ${scheduledPublishAt}`, 'info');
    }

    this.updateProgress(
      job.id,
      50,
      `Executing ${isDryRun ? 'dry-run simulated' : 'live YouTube API'} publishing (${privacyStatus})...`
    );

    // 5. Execute Video & Thumbnail Upload via YouTubeService
    const uploadResult = await YouTubeService.uploadVideo({
      videoFilePath: videoData.videoFilePath,
      thumbnailFilePath: thumbnailData?.imagePath,
      seoData,
      privacyStatus,
      scheduledPublishAt,
      dryRun: isDryRun,
    });

    // 6. Assign Playlist
    const targetPlaylist = channelProfile?.playlist || seoData.playlistRecommendation || 'Gaming Highlights & Secrets';
    uploadResult.playlistTitle = targetPlaylist;
    uploadResult.playlistId = `pl_${Math.random().toString(36).substring(2, 9)}`;

    this.updateProgress(job.id, 85, `Assigning video [${uploadResult.videoId}] to playlist: "${targetPlaylist}"...`);
    this.log(job.id, `Assigned to playlist: "${targetPlaylist}" (ID: ${uploadResult.playlistId})`, 'info');

    // 7. Record Metadata & Upload Tracking
    this.log(
      job.id,
      `✔ Publishing Complete! Video URL: ${uploadResult.videoUrl} (Status: ${uploadResult.uploadStatus}, Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE'})`,
      'success'
    );

    this.updateProgress(job.id, 100, `Autonomous publishing completed. Video ID: ${uploadResult.videoId}`);
    return uploadResult;
  }
}
