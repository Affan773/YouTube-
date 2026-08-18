import React, { useState } from 'react';
import { ScriptData, ScenePlanningData, VideoAssetData } from '../types.js';
import { Sparkles, Film, Mic, Volume2, Camera, Clock, Layers } from 'lucide-react';

interface ScriptTimelineProps {
  script?: ScriptData;
  scenePlan?: ScenePlanningData;
  assets?: VideoAssetData;
}

export const ScriptTimeline: React.FC<ScriptTimelineProps> = ({ script, scenePlan, assets }) => {
  const [activeTab, setActiveTab] = useState<'script' | 'scenes'>('scenes');

  if (!script && !scenePlan) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500">
        <Sparkles className="h-8 w-8 mx-auto mb-2 text-zinc-600 animate-pulse" />
        <p className="text-xs">Story/Script Agent crafting narrative beats...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Storyboard & Voiceover Breakdown
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('scenes')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'scenes'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Scenes ({scenePlan?.scenes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === 'script'
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Script Lines ({script?.lines?.length || 0})
          </button>
        </div>
      </div>

      {/* Synopsis Banner */}
      {script?.synopsis && (
        <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs text-zinc-300">
          <span className="font-bold text-amber-400">Narrative Hook: </span>
          <span>{script.synopsis}</span>
        </div>
      )}

      {/* Content View */}
      {activeTab === 'scenes' ? (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {scenePlan?.scenes.map((scene, idx) => {
            const asset = assets?.assets.find((a) => a.sceneNumber === scene.sceneNumber);
            const assetFilename = asset?.filePath?.split('/').pop();
            const assetWebUrl = asset?.filePath
              ? (asset.filePath.startsWith('/') ? asset.filePath : `/output/${asset.filePath}`)
              : undefined;

            return (
              <div
                key={idx}
                className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 hover:border-zinc-700 transition-colors"
              >
                {/* Scene Number & Duration badge */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center sm:w-20 shrink-0 bg-zinc-900 p-2 rounded-lg border border-zinc-800 text-center">
                  <span className="text-xs font-bold text-amber-400">Scene {scene.sceneNumber}</span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {scene.durationSeconds}s
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800/80 rounded-md font-medium flex items-center gap-1">
                      <Camera className="h-3 w-3" /> {scene.cameraMovement}
                    </span>
                    {scene.sfxCue && (
                      <span className="px-2 py-0.5 bg-sky-950/60 text-sky-300 border border-sky-800/80 rounded-md font-medium flex items-center gap-1">
                        <Volume2 className="h-3 w-3" /> {scene.sfxCue}
                      </span>
                    )}
                    {asset?.provenance && (
                      <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 rounded-md font-medium text-[10px]">
                        {asset.provenance}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-200 font-medium">"{scene.subtitleText}"</p>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{scene.visualPrompt}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {script?.lines.map((line, idx) => (
            <div
              key={line.id || idx}
              className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex items-start gap-3 text-xs"
            >
              <span className="font-mono text-zinc-500 text-[11px] w-12 shrink-0 pt-0.5">
                {line.timestampStart}s - {line.timestampEnd}s
              </span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">{line.speaker}</span>
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded text-[10px] uppercase">
                    [{line.emotion}]
                  </span>
                </div>
                <p className="text-zinc-200 text-xs leading-relaxed">"{line.text}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
