import React, { useState } from 'react';
import { Download, ExternalLink, Play, CheckCircle, Share2, Youtube, Film, Radio, Sparkles } from 'lucide-react';
import { WorkflowJob } from '../types.js';

interface VideoStudioPlayerProps {
  job: WorkflowJob;
  onTriggerManualUpload?: () => void;
}

export const VideoStudioPlayer: React.FC<VideoStudioPlayerProps> = ({ job, onTriggerManualUpload }) => {
  const videoArtifact = job.artifacts.videoEditing;
  const youtubeArtifact = job.artifacts.youtubeUpload;
  const seoArtifact = job.artifacts.seo;
  const [copied, setCopied] = useState(false);

  if (!videoArtifact) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">
        <Film className="h-10 w-10 text-zinc-600 mx-auto mb-3 animate-bounce" />
        <h3 className="text-sm font-bold text-zinc-200">Video Compositing In Progress</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          The Video Editing Agent is currently stitching video clips, synthesizing audio tracks, and burning subtitles with FFmpeg...
        </p>
      </div>
    );
  }

  // Path relative to web server static mount
  const videoFilename = videoArtifact.videoFilePath.split('/').pop() || '';
  const videoWebUrl = `/output/videos/${videoFilename}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.origin + videoWebUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-5">
      {/* Header with Title & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Master Output Render
          </span>
          <h2 className="text-base font-bold text-white mt-0.5">
            {seoArtifact?.selectedTitle || job.topic}
          </h2>
          <p className="text-xs text-zinc-400">
            Resolution: <span className="text-zinc-300 font-mono">{videoArtifact.resolution.width}x{videoArtifact.resolution.height}</span> ({videoArtifact.aspectRatio.toUpperCase()}) • Duration: <span className="text-zinc-300 font-mono">{videoArtifact.durationSeconds}s</span> • Size: <span className="text-zinc-300 font-mono">{(videoArtifact.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={videoWebUrl}
            download={`${job.id}_ruflo_render.mp4`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download MP4</span>
          </a>

          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copied ? 'Link Copied!' : 'Share Video'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Player Container */}
      <div className="flex justify-center bg-black/80 rounded-xl overflow-hidden border border-zinc-800 p-2 relative">
        <div
          className={`w-full ${
            videoArtifact.aspectRatio === 'shorts' ? 'max-w-[340px] aspect-[9/16]' : 'max-w-2xl aspect-video'
          } rounded-lg overflow-hidden bg-black shadow-2xl relative flex items-center justify-center`}
        >
          <video
            controls
            playsInline
            preload="metadata"
            src={videoWebUrl}
            className="w-full h-full object-contain"
          >
            Your browser does not support HTML5 video playback.
          </video>
        </div>
      </div>

      {/* YouTube Publish Status Banner */}
      {youtubeArtifact && (
        <div
          className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            youtubeArtifact.isDryRun
              ? 'bg-sky-950/40 border-sky-800 text-sky-200'
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shrink-0">
              <Youtube className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{youtubeArtifact.isDryRun ? 'Dry-Run Publishing Verification' : 'Published to YouTube'}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded border border-white/10">
                  {youtubeArtifact.privacyStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">{youtubeArtifact.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {youtubeArtifact.videoUrl && (
              <a
                href={youtubeArtifact.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>View on YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {youtubeArtifact.isDryRun && onTriggerManualUpload && (
              <button
                onClick={onTriggerManualUpload}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Youtube className="h-3 w-3" />
                <span>Upload Now</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
