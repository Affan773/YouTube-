import React, { useState, useEffect } from 'react';
import { X, Tv, Sparkles, Plus, Trash2, CheckCircle2, BrainCircuit, Lightbulb } from 'lucide-react';
import { ChannelProfile } from '../types.js';

interface ChannelProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LearnedInsightItem {
  id: string;
  timestamp: number;
  game: string;
  topic?: string;
  insight: string;
  retentionImpact: string;
}

export const ChannelProfileModal: React.FC<ChannelProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'insights'>('channels');
  const [channels, setChannels] = useState<ChannelProfile[]>([]);
  const [insights, setInsights] = useState<LearnedInsightItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelProfile | null>(null);

  const fetchChannelData = async () => {
    try {
      const [chRes, insRes] = await Promise.all([
        fetch('/api/channels'),
        fetch('/api/insights'),
      ]);
      if (chRes.ok) {
        const chData = await chRes.json();
        setChannels(chData.channels || []);
        if (chData.channels && chData.channels.length > 0 && !selectedChannel) {
          setSelectedChannel(chData.channels[0]);
        }
      }
      if (insRes.ok) {
        const insData = await insRes.json();
        setInsights(insData.insights || []);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChannelData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white">
              <Tv className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Studio Channels & Learned Swarm Memory
              </h3>
              <p className="text-xs text-zinc-400">
                Multi-channel profiles, persistent audience preferences & viral optimizations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'channels'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv className="h-3.5 w-3.5" /> Channel Profiles ({channels.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'insights'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5" /> Swarm Learned Memory ({insights.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'channels' ? (
            <div className="space-y-4">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100">{ch.name}</span>
                      {ch.isDefault && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded-full">
                          Default Channel
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 uppercase font-mono">{ch.defaultFormat}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-zinc-500 font-medium">Target Games: </span>
                      <span className="text-zinc-300">{ch.targetGames.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-medium">Audience: </span>
                      <span className="text-zinc-300">{ch.targetAudience}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-medium">Tone & Style: </span>
                      <span className="text-zinc-300">{ch.tone}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-medium">Thumbnail Style: </span>
                      <span className="text-zinc-300">{ch.thumbnailStyle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs">
                The Ruflo Multi-Agent Swarm continuously updates this knowledge store after each video generation and analysis loop.
              </p>

              {insights.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">No learned insights stored yet.</div>
              ) : (
                insights.map((ins) => (
                  <div
                    key={ins.id}
                    className="bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md">
                          {ins.game}
                        </span>
                        {ins.topic && (
                          <span className="text-zinc-400 text-[11px] font-medium truncate max-w-xs">
                            {ins.topic}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {ins.retentionImpact}
                      </span>
                    </div>
                    <p className="text-zinc-200 text-xs flex items-start gap-2 pt-1">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{ins.insight}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
