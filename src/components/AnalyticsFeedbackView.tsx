import React from 'react';
import { BarChart3, TrendingUp, Sparkles, BrainCircuit, Target, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';
import { AnalyticsData, OptimizationData, WorkflowJob } from '../types.js';

interface AnalyticsFeedbackViewProps {
  job: WorkflowJob;
}

export const AnalyticsFeedbackView: React.FC<AnalyticsFeedbackViewProps> = ({ job }) => {
  const analytics = job.artifacts.analytics;
  const optimization = job.artifacts.optimization;
  const game = job.game || job.artifacts.script?.game || 'Universal Gaming';

  if (!analytics && !optimization) {
    return null;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Audience Analytics & Continuous Learning Loop
            </h3>
            <p className="text-xs text-zinc-400">
              Simulated 72-Hour Algorithmic Performance Telemetry & Memory Feedback
            </p>
          </div>
        </div>

        {analytics?.performanceRating && (
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase border ${
              analytics.performanceRating === 'viral_outlier'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse'
                : analytics.performanceRating === 'high_performer'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            {analytics.performanceRating.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Analytics Telemetry KPI Grid */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-zinc-400 font-medium block mb-1">Projected Impressions</span>
            <div className="text-lg font-extrabold text-indigo-400 font-mono">
              {analytics.projectedImpressions ? analytics.projectedImpressions.toLocaleString() : '52,000'}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="h-2.5 w-2.5" /> High browse demand
            </span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-zinc-400 font-medium block mb-1">Projected CTR</span>
            <div className="text-lg font-extrabold text-amber-400 font-mono">
              {analytics.projectedCTR || 12.4}%
            </div>
            <span className="text-[10px] text-zinc-400">vs 5.2% gaming avg</span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-zinc-400 font-medium block mb-1">Audience Retention</span>
            <div className="text-lg font-extrabold text-emerald-400 font-mono">
              {analytics.retentionPercentage || 87}%
            </div>
            <span className="text-[10px] text-zinc-400">
              Avg duration: {analytics.averageViewDurationSeconds || 28}s
            </span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
            <span className="text-[11px] text-zinc-400 font-medium block mb-1">Hook Hold Score</span>
            <div className="text-lg font-extrabold text-rose-400 font-mono">
              {analytics.hookEffectivenessScore || 94}/100
            </div>
            <span className="text-[10px] text-emerald-400">Zero-second drop</span>
          </div>
        </div>
      )}

      {/* Retention Timeline & Drop-off Points */}
      {analytics?.dropOffPoints && analytics.dropOffPoints.length > 0 && (
        <div className="bg-zinc-950/70 border border-zinc-800/80 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400" /> Retention Curve & Drop-Off Markers
            </span>
            <span className="text-[11px] text-zinc-400">{game} Dynamics</span>
          </div>

          <div className="space-y-2">
            {analytics.dropOffPoints.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                <span className="font-mono text-cyan-400 font-bold px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-800 rounded">
                  {pt.second}s
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-300 text-[11px]">{pt.reason}</span>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold">{pt.percentage}% hold</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      style={{ width: `${pt.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Self-Improvement & Continuous Memory Updates */}
      {optimization && (
        <div className="bg-zinc-950/80 border border-amber-900/40 p-4 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Ruflo Memory Feedback: Learned Rules for Next Video
              </h4>
            </div>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800 font-mono">
              Persistent Loop
            </span>
          </div>

          {/* Key Insights List */}
          {optimization.insights && optimization.insights.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-semibold uppercase">Strategic Insights Recorded:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {optimization.insights.map((ins, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-200 text-[11px] leading-snug">{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Future Topic Recommendations */}
          {optimization.futureTopicRecommendations && optimization.futureTopicRecommendations.length > 0 && (
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-400 font-semibold uppercase block mb-1.5">
                Recommended Next High-Impact Topics for {game}:
              </span>
              <div className="flex flex-wrap gap-2">
                {optimization.futureTopicRecommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-700/80 flex items-center gap-1.5 transition-colors"
                  >
                    <Target className="h-3 w-3 text-rose-400" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
