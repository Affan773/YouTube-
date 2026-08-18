import React from 'react';
import { Sparkles, Youtube, Terminal, Settings, ShieldCheck, Layers, Tv } from 'lucide-react';

interface HeaderProps {
  geminiConnected: boolean;
  youtubeConnected: boolean;
  isDryRun: boolean;
  onToggleDryRun: () => void;
  onOpenTerminal: () => void;
  onOpenSettings: () => void;
  onOpenClips: () => void;
  onOpenChannels: () => void;
  clipsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  geminiConnected,
  youtubeConnected,
  isDryRun,
  onToggleDryRun,
  onOpenTerminal,
  onOpenSettings,
  onOpenClips,
  onOpenChannels,
  clipsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-600 to-red-600 flex items-center justify-center shadow-lg shadow-rose-900/30 ring-1 ring-white/20">
          <Sparkles className="h-5 w-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-1.5">
              RUFLO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">YOUTUBE STUDIO</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
              v2.5 Multi-Agent
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Autonomous Video Generation & YouTube Publisher • Google Gemini & FFmpeg
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Gemini Status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            geminiConnected
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
              : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${geminiConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span>Gemini 3.7 Flash: {geminiConnected ? 'Active' : 'Using Fallback'}</span>
        </div>

        {/* YouTube OAuth Status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            youtubeConnected
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}
        >
          <Youtube className="h-3.5 w-3.5 text-rose-500" />
          <span>YouTube API: {youtubeConnected ? 'OAuth Connected' : 'Dry-Run Mode'}</span>
        </div>

        {/* Dry-Run Toggle Button */}
        <button
          onClick={onToggleDryRun}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isDryRun
              ? 'bg-sky-950/60 border-sky-700 text-sky-300 shadow-sm shadow-sky-900/20'
              : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{isDryRun ? 'Dry-Run Active (Safe)' : 'Live Mode (Will Upload)'}</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Channel & Swarm Memory */}
        <button
          onClick={onOpenChannels}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all cursor-pointer"
        >
          <Tv className="h-3.5 w-3.5 text-indigo-400" />
          <span>Channels & Memory</span>
        </button>

        {/* Gameplay Clips Library */}
        <button
          onClick={onOpenClips}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all cursor-pointer"
        >
          <Layers className="h-3.5 w-3.5 text-amber-400" />
          <span>Clips ({clipsCount})</span>
        </button>

        {/* CLI Terminal */}
        <button
          onClick={onOpenTerminal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all cursor-pointer"
        >
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          <span>CLI Console</span>
        </button>

        {/* Settings & Setup Guide */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5 text-zinc-400" />
          <span>Setup Guide</span>
        </button>
      </div>
    </header>
  );
};
