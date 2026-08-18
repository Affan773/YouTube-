import React, { useState, useEffect } from 'react';
import { GlobalTrendItem, OpportunityCategory } from '../types.js';
import {
  Flame,
  TrendingUp,
  Sparkles,
  Zap,
  Film,
  Gamepad2,
  RefreshCw,
  Search,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  onSelectTrend: (trend: GlobalTrendItem) => void;
}

export function GlobalTrendsView({ onSelectTrend }: Props) {
  const [trends, setTrends] = useState<GlobalTrendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTrends = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trends${force ? '?force=true' : ''}`);
      const data = await res.json();
      if (data.trends) {
        setTrends(data.trends);
      }
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const categories: { id: string; label: string; icon: any; color: string }[] = [
    { id: 'all', label: 'All Opportunities', icon: Layers, color: 'text-zinc-300' },
    { id: 'hot_now', label: '🔥 Hot Now', icon: Flame, color: 'text-rose-400' },
    { id: 'rising', label: '📈 Rising Momentum', icon: TrendingUp, color: 'text-amber-400' },
    { id: 'underserved', label: '💎 Underserved Gaps', icon: Sparkles, color: 'text-emerald-400' },
    { id: 'shorts_opportunity', label: '⚡ Shorts Ready', icon: Zap, color: 'text-cyan-400' },
    { id: 'longform_opportunity', label: '🎬 Long-Form', icon: Film, color: 'text-indigo-400' },
    { id: 'new_release', label: '🆕 New Releases', icon: Gamepad2, color: 'text-purple-400' },
  ];

  const filteredTrends = trends.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.opportunityCategory === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      t.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-zinc-100 flex items-center gap-2 tracking-tight">
                Global YouTube Trend Intelligence
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  0–100 Scoring
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Real-time worldwide search volume, viral velocity, and transformative content opportunities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search game or concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
            />
          </div>
          <button
            onClick={() => fetchTrends(true)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => {
          const count = cat.id === 'all' ? trends.length : trends.filter((t) => t.opportunityCategory === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-md'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <cat.icon className={`h-3.5 w-3.5 ${isSelected ? 'text-zinc-950' : cat.color}`} />
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${isSelected ? 'bg-zinc-950/30 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTrends.map((trend) => {
          const scoreColor =
            trend.trendScore >= 90
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : trend.trendScore >= 80
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

          return (
            <div
              key={trend.id}
              className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 hover:border-amber-500/50 transition-all group flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-black uppercase tracking-wider border border-zinc-700">
                    {trend.game}
                  </span>
                  <div className={`px-2.5 py-1 rounded-lg border font-mono font-black text-xs flex items-center gap-1 ${scoreColor}`}>
                    <span>Trend Score:</span>
                    <span className="text-sm">{trend.trendScore}</span>
                    <span className="text-[10px] text-zinc-500">/100</span>
                  </div>
                </div>

                {/* Topic Title */}
                <h3 className="text-base font-black text-zinc-100 group-hover:text-amber-400 transition leading-snug">
                  {trend.topic}
                </h3>

                {/* Transformative Angle */}
                <p className="text-xs text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                  <span className="text-zinc-500 font-bold uppercase mr-1">Angle:</span>
                  {trend.suggestedAngle}
                </p>

                {/* Detailed Score Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                  <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">Demand</span>
                    <span className="text-emerald-400 font-bold">{trend.demandScore}%</span>
                  </div>
                  <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">Growth</span>
                    <span className="text-amber-400 font-bold">+{trend.growthRate}%</span>
                  </div>
                  <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 block text-[10px]">Competition</span>
                    <span className={`font-bold ${trend.competition === 'Low' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {trend.competition}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {trend.tags.slice(0, 4).map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectTrend(trend)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <span>Produce This Video</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
