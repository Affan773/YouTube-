import { google } from 'googleapis';
import fs from 'fs';
import { config, logInfo, logWarn, logError } from './config.js';
import { PrivacyStatus, YouTubeUploadData, SEOData } from '../types.js';

export interface YouTubeUploadParams {
  videoFilePath: string;
  thumbnailFilePath?: string;
  seoData: SEOData;
  privacyStatus?: PrivacyStatus;
  scheduledPublishAt?: string;
  dryRun?: boolean;
}

export class YouTubeService {
  private static getOAuth2Client() {
    if (!config.youtubeClientId || !config.youtubeClientSecret) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      config.youtubeClientId,
      config.youtubeClientSecret,
      'http://localhost:3000/api/youtube/callback'
    );

    if (config.youtubeRefreshToken) {
      oauth2Client.setCredentials({
        refresh_token: config.youtubeRefreshToken,
      });
    }

    return oauth2Client;
  }

  public static isConfigured(): boolean {
    return Boolean(
      config.youtubeClientId &&
      config.youtubeClientSecret &&
      config.youtubeRefreshToken
    );
  }

  /**
   * Upload video to YouTube or simulate in dry-run mode
   */
  public static async uploadVideo(params: YouTubeUploadParams): Promise<YouTubeUploadData> {
    const { videoFilePath, thumbnailFilePath, seoData, scheduledPublishAt, dryRun } = params;
    const privacy = (params.privacyStatus || 'private') as PrivacyStatus;
    const isDryRun = dryRun !== false && (!YouTubeService.isConfigured() || dryRun === true);

    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`Video file not found at: ${videoFilePath}`);
    }

    if (isDryRun) {
      logInfo('YouTubeUpload', `[DRY-RUN MODE] Simulating YouTube upload for "${seoData.selectedTitle}"...`);
      const mockId = `mock_yt_${Math.random().toString(36).substring(2, 9)}`;

      return {
        videoId: mockId,
        videoUrl: `https://youtu.be/${mockId}`,
        channelTitle: 'Ruflo Creator Studio (Dry Run)',
        privacyStatus: privacy,
        scheduledPublishAt: scheduledPublishAt,
        isDryRun: true,
        uploadedAt: new Date().toISOString(),
        uploadStatus: 'dry_run_simulated',
        message: `Dry-run completed successfully. Video validated (${(fs.statSync(videoFilePath).size / 1024 / 1024).toFixed(1)} MB). Ready for live upload once OAuth credentials are confirmed.`,
      };
    }

    const auth = YouTubeService.getOAuth2Client();
    if (!auth) {
      throw new Error('YouTube OAuth2 credentials are not configured in environment variables.');
    }

    const youtube = google.youtube({ version: 'v3', auth });

    logInfo('YouTubeUpload', `Starting live YouTube upload for "${seoData.selectedTitle}"...`);

    // Prepare status snippet
    const statusPayload: any = {
      privacyStatus: scheduledPublishAt ? 'private' : privacy,
      selfDeclaredMadeForKids: false,
    };

    if (scheduledPublishAt) {
      statusPayload.publishAt = new Date(scheduledPublishAt).toISOString();
      statusPayload.privacyStatus = 'private'; // Required for scheduled publish
    }

    // 1. Upload Video
    const videoResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: seoData.selectedTitle.slice(0, 100),
          description: seoData.description.slice(0, 5000),
          tags: seoData.tags.slice(0, 30),
          categoryId: seoData.categoryId || '20', // Gaming
          defaultLanguage: 'en',
        },
        status: statusPayload,
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    });

    const videoId = videoResponse.data.id;
    if (!videoId) {
      throw new Error('YouTube API did not return a valid video ID.');
    }

    logInfo('YouTubeUpload', `Video uploaded successfully. Video ID: ${videoId}`);

    // 2. Upload Custom Thumbnail if provided
    if (thumbnailFilePath && fs.existsSync(thumbnailFilePath)) {
      try {
        logInfo('YouTubeUpload', `Uploading custom thumbnail for video: ${videoId}...`);
        await youtube.thumbnails.set({
          videoId,
          media: {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(thumbnailFilePath),
          },
        });
        logInfo('YouTubeUpload', 'Thumbnail uploaded successfully.');
      } catch (thumbErr: any) {
        logWarn('YouTubeUpload', `Thumbnail upload warning: ${thumbErr.message}. The video was uploaded without custom thumbnail.`);
      }
    }

    return {
      videoId,
      videoUrl: `https://youtu.be/${videoId}`,
      channelTitle: videoResponse.data.snippet?.channelTitle || 'Authenticated Channel',
      privacyStatus: privacy,
      scheduledPublishAt,
      isDryRun: false,
      uploadedAt: new Date().toISOString(),
      uploadStatus: 'success',
      message: `Video successfully published to YouTube! URL: https://youtu.be/${videoId}`,
    };
  }
}
