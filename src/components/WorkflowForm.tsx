import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  Youtube,
  Clock,
  Video,
  Mic,
  Film,
  Compass,
  Gamepad2,
  Flame,
  Layers,
  Wand2,
} from 'lucide-react';
import { VideoFormat, VoicePersona, FootageSource, PrivacyStatus, ContentType, WorkflowOptions } from '../types.js';

interface WorkflowFormProps {
  onSubmit: (options: WorkflowOptions) => void;
  isRunning: boolean;
  isDryRun: boolean;
  youtubeConfigured: boolean;
  clipsCount: number;
}

interface UniversalPreset {
  label: string;
  game: string;
  topic: string;
  format: VideoFormat;
  contentType: ContentType;
}

const UNIVERSAL_PRESETS: UniversalPreset[] = [
  {
    label: '⛏️ Minecraft Secrets',
    game: 'Minecraft',
    topic: 'Create a Minecraft video about 10 secret build hacks and hidden redstone tricks',
    format: 'shorts',
    contentType: 'secrets',
  },
  {
    label: '🚔 GTA 5 Police Chase',
    game: 'GTA 5',
    topic: 'Create a GTA 5 5-star police chase escape Short with insane stunt ramps',
    format: 'shorts',
    contentType: 'challenges',
  },
  {
    label: '🤖 Roblox Funny Moments',
    game: 'Roblox',
    topic: 'Create a Roblox funny moments and chaotic glitch fails video',
    format: 'shorts',
    contentType: 'funny_moments',
  },
  {
    label: '🔥 Auto-Discover Trending',
    game: '',
    topic: 'Find a trending game and create today’s viral YouTube Short',
    format: 'shorts',
    contentType: 'top_10',
  },
  {
    label: '⚔️ Elden Ring Boss Lore',
    game: 'Elden Ring',
    topic: 'Top 3 impossible boss secrets and hidden lore in Elden Ring',
    format: 'landscape',
    contentType: 'lore',
  },
  {
    label: '🎯 Valorant Lineup Hacks',
    game: 'Valorant',
    topic: '3 unpickable Sova dart lineups that win rounds automatically',
    format: 'shorts',
    contentType: 'tips_and_tricks',
  },
];

const POPULAR_GAMES = [
  'Minecraft',
  'GTA 5 / GTA 6',
  'Roblox',
  'Fortnite',
  'Valorant',
  'Call of Duty',
  'Elden Ring',
  'Counter-Strike 2',
  'EA Sports FC',
  'Horror Games',
  'Indie Games',
  'Auto-Discover Trending',
];

export const WorkflowForm: React.FC<WorkflowFormProps> = ({
  onSubmit,
  isRunning,
  isDryRun,
  youtubeConfigured,
  clipsCount,
}) => {
  const [topic, setTopic] = useState('Create a Minecraft video about 10 secret builds');
  const [game, setGame] = useState('Minecraft');
  const [format, setFormat] = useState<VideoFormat>('shorts');
  const [contentType, setContentType] = useState<ContentType>('secrets');
  const [voice, setVoice] = useState<VoicePersona>('Fenrir');
  const [footageSource, setFootageSource] = useState<FootageSource>(clipsCount > 0 ? 'hybrid' : 'ai_generated');
  const [privacy, setPrivacy] = useState<PrivacyStatus>('private');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  const handleSelectPreset = (preset: UniversalPreset) => {
    setTopic(preset.topic);
    setGame(preset.game);
    setFormat(preset.format);
    setContentType(preset.contentType);
  };

  const handleSelectGameChip = (selectedGame: string) => {
    if (selectedGame === 'Auto-Discover Trending') {
      setGame('');
      setTopic("Find a trending game and create today's YouTube Short");
    } else {
      setGame(selectedGame);
      if (!topic || topic.includes('Find a trending') || topic.includes('Create a ')) {
        setTopic(`Create a ${selectedGame} video about secret tricks and top gameplay moments`);
      }
    }
  };

  const handleStart = (uploadMode: boolean) => {
    if (!topic.trim()) return;
    onSubmit({
      topic: topic.trim(),
      game: game.trim() || undefined,
      format,
      contentType,
      voice,
      footageSource,
      upload: uploadMode,
      dryRun: isDryRun || !uploadMode,
      privacyStatus: privacy,
      scheduleDate: isScheduled ? new Date(scheduleDate).toISOString() : undefined,
    });
  };

  return (
    <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-5 lg:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-bl from-rose-600/15 to-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-gradient-to-tr from-cyan-600/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Universal Studio Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Universal Multi-Game Video Creator
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Works for <span className="text-zinc-200 font-semibold">ANY Game</span> • 15 Autonomous Agents
          </span>
        </div>

        {/* Quick Concept Presets */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
              One-Click Studio Presets:
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {UNIVERSAL_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                disabled={isRunning}
                className="p-2 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800/80 hover:border-amber-500/50 text-left transition-all text-xs font-medium text-zinc-300 hover:text-white cursor-pointer group shadow-sm"
              >
                <div className="font-bold text-[11px] text-zinc-200 group-hover:text-amber-400 truncate">
                  {preset.label}
                </div>
                <div className="text-[9.5px] text-zinc-500 truncate mt-0.5">
                  {preset.format === 'shorts' ? '9:16 Short' : '16:9 Long'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Selection & Custom Input */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Target Game Input */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Gamepad2 className="h-3.5 w-3.5 text-cyan-400" /> Target Game
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Any game or blank</span>
            </label>
            <input
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              disabled={isRunning}
              placeholder="e.g. Minecraft, GTA 5, Roblox, Elden Ring, or leave blank"
              className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {/* Quick Game Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {POPULAR_GAMES.slice(0, 6).map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectGameChip(g)}
                  disabled={isRunning}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    game === g || (g === 'Auto-Discover Trending' && !game)
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Main Prompt / Video Topic */}
          <div className="md:col-span-8 space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Video Topic / Content Prompt
              </span>
              <span className="text-[10px] text-zinc-400">Natural language goal</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isRunning}
              rows={3}
              placeholder="e.g., Create a Minecraft video about 10 secret builds or Find a trending game and create today's YouTube Short"
              className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none shadow-inner"
            />
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Format Selector */}
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
              <Video className="h-3 w-3 text-cyan-400" /> Format
            </label>
            <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setFormat('shorts')}
                disabled={isRunning}
                className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center ${
                  format === 'shorts'
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                9:16 Short
              </button>
              <button
                type="button"
                onClick={() => setFormat('landscape')}
                disabled={isRunning}
                className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-center ${
                  format === 'landscape'
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                16:9 Long
              </button>
            </div>
          </div>

          {/* Voice Selector */}
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
              <Mic className="h-3 w-3 text-emerald-400" /> Spoken Voice
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoicePersona)}
              disabled={isRunning}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="Fenrir">Fenrir (High Action / Deep Hype)</option>
              <option value="Kore">Kore (Dynamic Storyteller)</option>
              <option value="Puck">Puck (Fast-Paced Gaming Hype)</option>
              <option value="Zephyr">Zephyr (Chill Pro Streamer)</option>
              <option value="Charon">Charon (Tense Drama & Lore)</option>
            </select>
          </div>

          {/* Footage Layer */}
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
              <Film className="h-3 w-3 text-amber-400" /> Footage Layer
            </label>
            <select
              value={footageSource}
              onChange={(e) => setFootageSource(e.target.value as FootageSource)}
              disabled={isRunning}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="hybrid">Hybrid (Procedural + AI Visuals)</option>
              <option value="ai_generated">Procedural Game Compositor</option>
              <option value="user_clips">Custom Clips ({clipsCount} available)</option>
            </select>
          </div>

          {/* YouTube Privacy */}
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
              <Youtube className="h-3 w-3 text-rose-400" /> Privacy
            </label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PrivacyStatus)}
              disabled={isRunning}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="private">Private (Default / Safe)</option>
              <option value="unlisted">Unlisted (Sharable)</option>
              <option value="public">Public (Immediate)</option>
            </select>
          </div>
        </div>

        {/* Optional Scheduling */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              disabled={isRunning}
              className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-amber-500"
            />
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3 text-zinc-400" /> Schedule Release Time (publishAt)
            </span>
          </label>

          {isScheduled && (
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              disabled={isRunning}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Main Generate Button */}
          <button
            type="button"
            onClick={() => handleStart(false)}
            disabled={isRunning || !topic.trim()}
            className="flex-1 min-w-[220px] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {isRunning ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Ruflo Swarm (15 Agents) Orchestrating...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 fill-white" />
                <span>Generate Video with 15 AI Agents {isDryRun ? '(Dry-Run Safe)' : ''}</span>
              </>
            )}
          </button>

          {/* Direct Upload & Publish Trigger */}
          <button
            type="button"
            onClick={() => handleStart(true)}
            disabled={isRunning || !topic.trim()}
            className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
              youtubeConfigured
                ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-700 text-rose-200'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Youtube className="h-4 w-4 text-rose-400" />
            <span>Generate & Publish to YouTube</span>
          </button>
        </div>
      </div>
    </div>
  );
};
