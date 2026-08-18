import React, { useState, useEffect } from 'react';
import { AutonomousDecision, ContentOpportunityItem, OpportunityCategory } from '../types.js';
import {
  Compass,
  Sparkles,
  Flame,
  TrendingUp,
  Target,
  ArrowRight,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart,
} from 'lucide-react';

interface Props {
  onLaunchOpportunity: (item: { game: string; topic: string; format: 'shorts' | 'landscape' }) => void;
}

export function OpportunityRadarView({ onLaunchOpportunity }: Props) {
  const [opportunities, setOpportunities] = useState<ContentOpportunityItem[]>([]);
  const [recommendation, setRecommendation] = useState<AutonomousDecision | null>(null);
  const [radarSummary, setRadarSummary] = useState<Record<string, number>>({});
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const fetchRadar = async () => {
    setLoading(true);
    try {
      const [oppRes, recRes] = await Promise.all([
        fetch('/api/channel/opportunities'),
        fetch('/api/channel/recommend'),
      ]);

      const oppData = await oppRes.json();
      const recData = await recRes.json();

      if (oppData.opportunities) {
        setOpportunities(oppData.opportunities);
        setRadarSummary(oppData.radarSummary || {});
      }
      if (recData.recommendation) {
        setRecommendation(recData.recommendation);
      }
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
  }, []);

  const filteredOpps = opportunities.filter((o) => {
    if (selectedFilter === 'all') return true;
    return o.opportunityCategory === selectedFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Compass className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-black text-zinc-100 flex items-center gap-2">
              Content Opportunity Radar
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                Trends + Channel Fit Fusion
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Combines worldwide search velocity with channel retention history to discover untapped high-demand gaps.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRadar}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition cursor-pointer"
        >
          Recalculate Radar
        </button>
      </div>

      {/* AUTONOMOUS DECISION ENGINE / NEXT BEST VIDEO HERO CARD */}
      {recommendation && (
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-2 border-amber-500/40 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider">
                  ★ Autonomous Decision
                </span>
                <span className="text-xs font-bold text-amber-400">NEXT BEST VIDEO TO PRODUCE</span>
              </div>
              <h3 className="text-xl font-black text-zinc-100">
                [{recommendation.selectedGame}] "{recommendation.selectedTopic}"
              </h3>
            </div>

            <button
              onClick={() =>
                onLaunchOpportunity({
                  game: recommendation.selectedGame,
                  topic: recommendation.selectedTopic,
                  format: recommendation.recommendedFormat,
                })
              }
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shrink-0"
            >
              <span>1-Click Autonomous Produce</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Opportunity Score</span>
              <span className="text-emerald-400 text-lg font-black">{recommendation.opportunityScore}/100</span>
            </div>
            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Global Trend Score</span>
              <span className="text-amber-400 text-lg font-black">{recommendation.trendScore}/100</span>
            </div>
            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Channel Fit Score</span>
              <span className="text-cyan-400 text-lg font-black">{recommendation.channelFitScore}/100</span>
            </div>
            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Optimal Publish Window</span>
              <span className="text-purple-400 text-xs font-bold block truncate">{recommendation.recommendedScheduleTime}</span>
            </div>
          </div>

          <div className="text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Memory Loop Applied: </span>
              {recommendation.keyLearningApplied}
            </div>
          </div>
        </div>
      )}

      {/* Opportunity Radar Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="h-4 w-4 text-zinc-400" />
          <span>Ranked Content Opportunity Radar</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpps.map((opp) => (
            <div
              key={opp.id}
              className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 hover:border-emerald-500/40 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-xs font-bold uppercase">
                      {opp.game}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {opp.opportunityCategory.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                    Opportunity: {opp.opportunityScore}/100
                  </div>
                </div>

                <h4 className="text-sm font-black text-zinc-100 line-clamp-2">{opp.topic}</h4>

                <p className="text-xs text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 font-bold">Suggested Hook: </span>
                  {opp.suggestedHook}
                </p>

                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
                  <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-500 text-[10px] block">Trend Score</span>
                    <span className="text-amber-400 font-bold">{opp.trendScore}/100</span>
                  </div>
                  <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-500 text-[10px] block">Channel Fit</span>
                    <span className="text-cyan-400 font-bold">{opp.channelFitScore}/100</span>
                  </div>
                  <div className="bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-500 text-[10px] block">Competition</span>
                    <span className="text-emerald-400 font-bold">{opp.competitionLevel}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  onLaunchOpportunity({
                    game: opp.game,
                    topic: opp.topic,
                    format: opp.recommendedFormat,
                  })
                }
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-200 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Launch This Video Blueprint</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
