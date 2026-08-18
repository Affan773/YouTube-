import { BaseAgent } from './BaseAgent.js';
import { AgentId, WorkflowJob, YouTubeUploadData } from '../../types.js';
import { YouTubeService } from '../youtube.js';
import { memory } from '../memory.js';

export class YouTubeUploadAgent extends BaseAgent {
  public readonly id: AgentId = 'youtube_upload';
  public readonly name = 'YouTube Upload Agent';
  public readonly role = 'YouTube Data API v3 OAuth & Publisher';

  public async run(job: WorkflowJob): Promise<YouTubeUploadData> {
    const video = job.artifacts.videoEditing;
    const thumbnail = job.artifacts.thumbnail;
    const seo = job.artifacts.seo;
    const qc = job.artifacts.qualityControl;

    if (!video || !seo) {
      throw new Error('Video editing or SEO artifact missing. Previous pipeline stages must complete first.');
    }

    if (qc && !qc.passed) {
      this.log(job.id, 'Quality control flagged issues, but continuing upload pipeline with warnings.', 'warn');
    }

    const shouldUpload = job.options.upload === true || Boolean(job.options.scheduleDate);
    const isDryRun = job.options.dryRun !== false || !shouldUpload || !YouTubeService.isConfigured();

    this.updateProgress(
      job.id,
      25,
      isDryRun
        ? 'Running YouTube publish simulation (Dry-Run Mode)...'
        : 'Connecting to YouTube Data API v3 and establishing resumable upload stream...'
    );

    this.log(
      job.id,
      `Publish target: "${seo.selectedTitle}" | Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE UPLOAD'} | Privacy: ${job.options.privacyStatus || 'private'} | Schedule: ${job.options.scheduleDate || 'Immediate'}`,
      'info'
    );

    const uploadResult = await YouTubeService.uploadVideo({
      videoFilePath: video.videoFilePath,
      thumbnailFilePath: thumbnail?.imagePath,
      seoData: seo,
      privacyStatus: job.options.privacyStatus || 'private',
      scheduledPublishAt: job.options.scheduleDate,
      dryRun: isDryRun,
    });

    this.updateProgress(job.id, 90, 'Verifying upload receipt and metadata indexing...');

    memory.setArtifact(job.id, 'youtubeUpload', uploadResult);
    this.complete(
      job.id,
      uploadResult.isDryRun
        ? `Dry-run publish verified. Simulated URL: ${uploadResult.videoUrl}`
        : `Video live on YouTube! URL: ${uploadResult.videoUrl}`,
      {
        videoId: uploadResult.videoId,
        url: uploadResult.videoUrl,
        isDryRun: uploadResult.isDryRun,
      }
    );

    return uploadResult;
  }
}
