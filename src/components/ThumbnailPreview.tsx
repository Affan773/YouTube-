import React from 'react';
import { Download, Sparkles, TrendingUp, Image } from 'lucide-react';
import { ThumbnailData } from '../types.js';

interface ThumbnailPreviewProps {
  thumbnail?: ThumbnailData;
  jobId: string;
}

export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({ thumbnail, jobId }) => {
  if (!thumbnail) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500">
        <Image className="h-8 w-8 mx-auto mb-2 text-zinc-600 animate-pulse" />
        <p className="text-xs">Thumbnail Agent generating cover concept...</p>
      </div>
    );
  }

  const thumbFilename = thumbnail.imagePath.split('/').pop() || '';
  const thumbWebUrl = `/output/thumbnails/${thumbFilename}`;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            High-CTR YouTube Cover Art
          </h3>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-300 text-xs font-bold">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>CTR Score: {thumbnail.ctrEstimateScore}/100</span>
        </div>
      </div>

      {/* Thumbnail Frame */}
      <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black aspect-video group shadow-xl">
        <img
          src={thumbWebUrl}
          alt={thumbnail.headlineText}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 justify-between">
          <span className="text-[11px] font-bold text-white uppercase">{thumbnail.headlineText}</span>
          <a
            href={thumbWebUrl}
            download={`${jobId}_thumbnail.jpg`}
            className="px-2.5 py-1 bg-white text-zinc-950 font-bold rounded-md text-xs flex items-center gap-1 shadow-lg hover:bg-zinc-200 cursor-pointer"
          >
            <Download className="h-3 w-3" /> Save
          </a>
        </div>
      </div>

      <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] space-y-1">
        <div className="text-zinc-400">
          <span className="font-semibold text-zinc-200">Headline: </span>
          <span className="text-amber-300 font-bold uppercase">{thumbnail.headlineText}</span>
        </div>
        <div className="text-zinc-400">
          <span className="font-semibold text-zinc-200">Sub-Badge: </span>
          <span className="text-zinc-300">{thumbnail.subText}</span>
        </div>
      </div>
    </div>
  );
};
