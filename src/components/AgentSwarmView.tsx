import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  BookOpen,
  Film,
  Mic,
  Scissors,
  Image,
  Tag,
  ShieldCheck,
  Youtube,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  Compass,
  FileSpreadsheet,
  Scale,
  BarChart3,
  BrainCircuit,
  Flame,
  LineChart,
  Target,
  Send,
} from 'lucide-react';
import { AgentId, AgentProgress, WorkflowJob } from '../types.js';

interface AgentSwarmViewProps {
  job: WorkflowJob;
}

const AGENT_ICONS: Record<AgentId, React.ReactNode> = {
  global_trends: <Flame className="h-3.5 w-3.5 text-amber-400" />,
  channel_intelligence: <LineChart className="h-3.5 w-3.5 text-cyan-400" />,
  autonomous_decision: <Target className="h-3.5 w-3.5 text-emerald-400" />,
  game_discovery: <Compass className="h-3.5 w-3.5 text-blue-400" />,
  research: <BookOpen className="h-3.5 w-3.5 text-purple-400" />,
  content_strategy: <FileSpreadsheet className="h-3.5 w-3.5 text-yellow-400" />,
  script: <Sparkles className="h-3.5 w-3.5 text-amber-400" />,
  scene_planning: <Film className="h-3.5 w-3.5 text-indigo-400" />,
  video_asset: <Film className="h-3.5 w-3.5 text-pink-400" />,
  voiceover: <Mic className="h-3.5 w-3.5 text-red-400" />,
  video_editing: <Scissors className="h-3.5 w-3.5 text-emerald-400" />,
  thumbnail: <Image className="h-3.5 w-3.5 text-amber-400" />,
  seo: <Tag className="h-3.5 w-3.5 text-cyan-400" />,
  copyright_safety: <Scale className="h-3.5 w-3.5 text-purple-400" />,
  quality_control: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />,
  autonomous_publishing: <Send className="h-3.5 w-3.5 text-rose-400" />,
  youtube_upload: <Youtube className="h-3.5 w-3.5 text-rose-500" />,
  analytics: <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />,
  optimization: <BrainCircuit className="h-3.5 w-3.5 text-emerald-400" />,
};

const AGENT_ORDER: AgentId[] = [
  'global_trends',
  'channel_intelligence',
  'autonomous_decision',
  'game_discovery',
  'research',
  'content_strategy',
  'script',
  'scene_planning',
  'video_asset',
  'voiceover',
  'video_editing',
  'thumbnail',
  'seo',
  'copyright_safety',
  'quality_control',
  'autonomous_publishing',
  'youtube_upload',
  'analytics',
  'optimization',
];

export const AgentSwarmView: React.FC<AgentSwarmViewProps> = ({ job }) => {
  const [logsExpanded, setLogsExpanded] = useState(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<AgentId | 'all'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [job.logs.length, logsExpanded]);

  const agentsList: AgentProgress[] = AGENT_ORDER.map((id) => job.agentsProgress[id]).filter(Boolean);

  const completedCount = agentsList.filter((a) => a.status === 'completed').length;
  const totalCount = agentsList.length;
  const overallPct = Math.round((completedCount / Math.max(1, totalCount)) * 100);

  const filteredLogs = selectedAgentFilter === 'all'
    ? job.logs
    : job.logs.filter((l) => l.agentId === selectedAgentFilter);

  return (
    <div className="space-y-4">
      {/* Top Swarm Header with Progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-400 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Ruflo Autonomous Swarm Intelligence ({totalCount} Specialized Agents)
            </h2>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
              job.status === 'completed'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : job.status === 'failed'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
            }`}>
              {job.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Topic: <span className="text-zinc-200 font-semibold">{job.topic}</span> • Game: <span className="text-amber-400 font-semibold">{job.game || 'Auto-Discovered'}</span>
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="flex items-center gap-3 min-w-[200px] flex-1 sm:flex-initial justify-end">
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-zinc-300">{completedCount}/{totalCount} Agents</span>
            <span className="text-[10px] text-zinc-500 block">{overallPct}% Completed</span>
          </div>
          <div className="w-28 sm:w-36 h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {agentsList.map((agent) => {
          const isCompleted = agent.status === 'completed';
          const isRunning = agent.status === 'running';
          const isFailed = agent.status === 'failed';
          const isWaiting = agent.status === 'idle' || !agent.status;

          let statusBadge = (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              <Clock className="h-2.5 w-2.5" />
              Idle
            </span>
          );

          if (isRunning) {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80 animate-pulse">
                <Activity className="h-2.5 w-2.5 animate-spin" />
                Running ({agent.progress}%)
              </span>
            );
          } else if (isCompleted) {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                Done
              </span>
            );
          } else if (isFailed) {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 font-semibold">
                <AlertCircle className="h-2.5 w-2.5 text-rose-400" />
                Failed
              </span>
            );
          }

          return (
            <div
              key={agent.agentId}
              onClick={() => setSelectedAgentFilter(selectedAgentFilter === agent.agentId ? 'all' : agent.agentId)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-950/30'
                  : isCompleted
                  ? 'bg-zinc-900/90 border-zinc-800/90 hover:border-emerald-700/60'
                  : isFailed
                  ? 'bg-rose-950/20 border-rose-800/80'
                  : 'bg-zinc-900/40 border-zinc-800/40 opacity-75'
              } ${selectedAgentFilter === agent.agentId ? 'ring-2 ring-amber-400' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-zinc-800 text-zinc-300'}`}>
                    {AGENT_ICONS[agent.agentId] || <Sparkles className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-zinc-200 line-clamp-1">{agent.name}</span>
                </div>
                {statusBadge}
              </div>

              <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2">
                {agent.role}
              </p>

              {/* Mini Progress Line */}
              <div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50 mb-1.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-400'
                      : isRunning
                      ? 'bg-amber-400'
                      : isFailed
                      ? 'bg-rose-500'
                      : 'bg-zinc-700'
                  }`}
                  style={{ width: `${isCompleted ? 100 : agent.progress || 0}%` }}
                />
              </div>

              <p className="text-[10px] text-zinc-500 font-mono line-clamp-1">
                {agent.message || (isWaiting ? 'Pending trigger...' : 'Completed')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Swarm Live Telemetry & Execution Log Terminal */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div
          onClick={() => setLogsExpanded(!logsExpanded)}
          className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-800/80 transition"
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
              Swarm Real-Time Telemetry & Agent Execution Logs
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {filteredLogs.length} events
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedAgentFilter !== 'all' && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                Filtered: {selectedAgentFilter} (Click to reset)
              </span>
            )}
            {logsExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
          </div>
        </div>

        {logsExpanded && (
          <div className="p-4 max-h-72 overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {filteredLogs.length === 0 ? (
              <p className="text-zinc-600 italic">No telemetry events recorded yet.</p>
            ) : (
              filteredLogs.map((log, index) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString();
                let colorClass = 'text-zinc-400';
                if (log.level === 'error') colorClass = 'text-rose-400 font-semibold';
                if (log.level === 'warn') colorClass = 'text-amber-300 font-semibold';
                if (log.level === 'success') colorClass = 'text-emerald-400 font-bold';

                return (
                  <div key={index} className="flex items-start gap-2.5 hover:bg-zinc-900/60 px-1 py-0.5 rounded transition">
                    <span className="text-[10px] text-zinc-600 select-none shrink-0">{timeStr}</span>
                    {log.agentId && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-cyan-400 border border-zinc-800 shrink-0 font-semibold">
                        [{log.agentId}]
                      </span>
                    )}
                    <span className={`flex-1 break-all ${colorClass}`}>{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
