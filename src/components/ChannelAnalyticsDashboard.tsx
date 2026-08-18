import React, { useState, useEffect } from 'react';
import { ChannelAnalyticsReport, ChannelProfile } from '../types.js';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  Repeat,
  AlertTriangle,
  FlaskConical,
  Calendar,
  Sparkles,
  Trophy,
  Flame,
} from 'lucide-react';

export function ChannelAnalyticsDashboard() {
  const [report, setReport] = useState<ChannelAnalyticsReport | null>(null);
  const [channels, setChannels] = useState<ChannelProfile[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('channel_default');
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (channelId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/channel/analytics?channelId=${channelId}`);
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      if (data.channels) {
        setChannels(data.channels);
      }
    } catch (err) {
      //
    }
  };

  useEffect(() => {
    fetchChannels();
    fetchAnalytics(selectedChannelId);
  }, [selectedChannelId]);

  if (!report) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs">
        Loading Channel Intelligence & Performance Metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Channel Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-black text-zinc-100 flex items-center gap-2">
              YouTube Channel Intelligence & Analytics
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                Self-Learning Loop
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Analyzes previous videos to continuously improve retention, hooks, CTR, and titles.
            </p>
          </div>
        </div>

        {/* Channel Selector */}
        {channels.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-bold">Channel:</span>
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Total Channel Views</span>
            <Eye className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-zinc-100 font-mono">
            {report.totalViews.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" /> Across {report.totalVideosAnalyzed} indexed videos
          </span>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Average CTR</span>
            <Percent className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">
            {report.avgCtr}%
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            Benchmark: 8.5% (High Performing)
          </span>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Average Retention</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {report.avgRetentionPercent}%
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            {report.bestVideoLength}
          </span>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Optimal Publishing Time</span>
            <Calendar className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-lg font-black text-purple-400">
            {report.bestPublishingTimes[0]?.day} @ {report.bestPublishingTimes[0]?.time}
          </p>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            +{Math.round((report.bestPublishingTimes[0]?.avgViewsMultiplier - 1) * 100)}% view velocity boost
          </span>
        </div>
      </div>

      {/* STRATEGIC GUIDANCE / PREVIOUS VIDEO LEARNING LOOP */}
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800/90 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider">
            Previous Video Strategic Learning Loop
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* What Worked */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
              <CheckCircle className="h-4 w-4" />
              <span>WHAT WORKED (Proven Successes)</span>
            </div>
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              {report.strategicGuidance.whatWorked.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>

          {/* What Failed */}
          <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-black text-xs">
              <XCircle className="h-4 w-4" />
              <span>WHAT FAILED (Eliminate These)</span>
            </div>
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              {report.strategicGuidance.whatDidNotWork.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>

          {/* What To Repeat */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-xs">
              <Repeat className="h-4 w-4" />
              <span>WHAT TO REPEAT (Double Down)</span>
            </div>
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              {report.strategicGuidance.whatToRepeat.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>

          {/* What To Avoid */}
          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>WHAT TO AVOID (Retention Killers)</span>
            </div>
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              {report.strategicGuidance.whatToAvoid.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>

          {/* What To Test Next */}
          <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-purple-400 font-black text-xs">
              <FlaskConical className="h-4 w-4" />
              <span>WHAT TO TEST NEXT (Algorithmic Experiments)</span>
            </div>
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              {report.strategicGuidance.whatToTestNext.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* TOP & LOW PERFORMERS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-zinc-900/70 border border-zinc-800/90 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
            <Trophy className="h-4 w-4" />
            <span>Top Performing Videos</span>
          </div>
          <div className="space-y-3">
            {report.topPerformingVideos.map((v, i) => (
              <div key={i} className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-100 line-clamp-1">{v.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                    Score: {v.performanceScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-400">
                  <div>Views: <span className="text-zinc-200 font-bold">{v.views.toLocaleString()}</span></div>
                  <div>CTR: <span className="text-amber-400 font-bold">{v.ctr}%</span></div>
                  <div>Retention: <span className="text-emerald-400 font-bold">{v.avgPercentageViewed}%</span></div>
                </div>
                <div className="text-[10px] text-zinc-400 bg-zinc-900/60 p-2 rounded-lg">
                  <span className="text-zinc-500 font-bold">Retention Note: </span>
                  {v.retentionDropPoints[0]?.reason || 'High pacing kept mobile viewer interest locked in.'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Performers & Lessons */}
        <div className="bg-zinc-900/70 border border-zinc-800/90 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Underperforming Videos & Drop-Off Diagnostics</span>
          </div>
          <div className="space-y-3">
            {report.lowPerformingVideos.map((v, i) => (
              <div key={i} className="p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-100 line-clamp-1">{v.title}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                    Score: {v.performanceScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-400">
                  <div>Views: <span className="text-zinc-200 font-bold">{v.views.toLocaleString()}</span></div>
                  <div>CTR: <span className="text-amber-400 font-bold">{v.ctr}%</span></div>
                  <div>Retention: <span className="text-rose-400 font-bold">{v.avgPercentageViewed}%</span></div>
                </div>
                <div className="text-[10px] text-rose-300/80 bg-rose-950/20 border border-rose-500/20 p-2 rounded-lg">
                  <span className="text-rose-400 font-bold">Failure Cause: </span>
                  {v.retentionDropPoints[0]?.reason || 'Slow verbal introduction caused high early drop-off.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
