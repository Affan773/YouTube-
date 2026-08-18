import React, { useState } from 'react';
import { Tag, Copy, Check, Hash, Youtube, Sparkles, TrendingUp } from 'lucide-react';
import { SEOData } from '../types.js';

interface SeoInspectorProps {
  seo?: SEOData;
}

export const SeoInspector: React.FC<SeoInspectorProps> = ({ seo }) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  if (!seo) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500">
        <Tag className="h-8 w-8 mx-auto mb-2 text-zinc-600 animate-pulse" />
        <p className="text-xs">YouTube SEO Agent optimizing tags & titles...</p>
      </div>
    );
  }

  const copyToClipboard = (text: string, type: 'title' | 'desc') => {
    navigator.clipboard.writeText(text);
    if (type === 'title') {
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    } else {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Youtube className="h-4 w-4 text-rose-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            YouTube Metadata & SEO Ranking
          </h3>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs font-bold">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>SEO Score: {seo.seoScore}/100</span>
        </div>
      </div>

      {/* Selected Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Selected Video Title ({seo.selectedTitle.length}/100 chars)
          </label>
          <button
            onClick={() => copyToClipboard(seo.selectedTitle, 'title')}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            {copiedTitle ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedTitle ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-100">
          {seo.selectedTitle}
        </div>
      </div>

      {/* A/B Title Alternatives */}
      {seo.titleOptions && seo.titleOptions.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400">A/B Testing Title Variants:</label>
          <div className="grid grid-cols-1 gap-1.5">
            {seo.titleOptions.map((opt, i) => (
              <div
                key={i}
                className="p-2 bg-zinc-950/60 hover:bg-zinc-950 rounded-lg border border-zinc-800/60 text-[11px] text-zinc-300 flex items-center justify-between"
              >
                <span className="truncate">{opt}</span>
                <button
                  onClick={() => copyToClipboard(opt, 'title')}
                  className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer shrink-0 ml-2"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hashtags & Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {seo.hashtags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-800/60 rounded-md text-[11px] font-semibold"
            >
              {tag}
            </span>
          ))}
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md text-[11px] font-mono">
            Category: 20 (Gaming)
          </span>
        </div>

        {/* Search Tags Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {seo.tags.slice(0, 12).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-md text-[10px]"
            >
              #{tag}
            </span>
          ))}
          {seo.tags.length > 12 && (
            <span className="text-[10px] text-zinc-500">+{seo.tags.length - 12} more</span>
          )}
        </div>
      </div>

      {/* Description Snippet */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            YouTube Description & Timestamps
          </label>
          <button
            onClick={() => copyToClipboard(seo.description, 'desc')}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            {copiedDesc ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedDesc ? 'Copied Description' : 'Copy'}</span>
          </button>
        </div>
        <textarea
          readOnly
          value={seo.description}
          rows={5}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-300 font-mono focus:outline-none resize-none"
        />
      </div>
    </div>
  );
};
