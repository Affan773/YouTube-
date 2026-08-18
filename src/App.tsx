import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { WorkflowForm } from './components/WorkflowForm.js';
import { AgentSwarmView } from './components/AgentSwarmView.js';
import { VideoStudioPlayer } from './components/VideoStudioPlayer.js';
import { ThumbnailPreview } from './components/ThumbnailPreview.js';
import { ScriptTimeline } from './components/ScriptTimeline.js';
import { SeoInspector } from './components/SeoInspector.js';
import { QualityAuditModal } from './components/QualityAuditModal.js';
import { CopyrightSafetyCard } from './components/CopyrightSafetyCard.js';
import { AnalyticsFeedbackView } from './components/AnalyticsFeedbackView.js';
import { ChannelProfileModal } from './components/ChannelProfileModal.js';
import { ClipsLibrary } from './components/ClipsLibrary.js';
import { CliTerminal } from './components/CliTerminal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { GlobalTrendsView } from './components/GlobalTrendsView.js';
import { ChannelAnalyticsDashboard } from './components/ChannelAnalyticsDashboard.js';
import { OpportunityRadarView } from './components/OpportunityRadarView.js';
import { ABTestingPanel } from './components/ABTestingPanel.js';
import { WorkflowJob, WorkflowOptions, ClipItem, GlobalTrendItem } from './types.js';
import {
  Sparkles,
  Layers,
  History,
  RefreshCw,
  AlertCircle,
  Gamepad2,
  BrainCircuit,
  Flame,
  Compass,
  BarChart3,
  FlaskConical,
  Zap,
} from 'lucide-react';

type ActiveTab = 'studio' | 'trends' | 'radar' | 'analytics' | 'ab_lab';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [activeJob, setActiveJob] = useState<WorkflowJob | null>(null);
  const [jobsHistory, setJobsHistory] = useState<WorkflowJob[]>([]);
  const [geminiConnected, setGeminiConnected] = useState(true);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Modals state
  const [isClipsOpen, setIsClipsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);

  // 1. Fetch system status & jobs history
  const refreshStatusAndJobs = async () => {
    try {
      const [statusRes, jobsRes, clipsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/workflow/jobs'),
        fetch('/api/clips'),
      ]);

      const statusData = await statusRes.json();
      setGeminiConnected(statusData.geminiConfigured);
      setYoutubeConnected(statusData.youtubeConfigured);

      const jobsData = await jobsRes.json();
      if (jobsData.jobs && jobsData.jobs.length > 0) {
        setJobsHistory(jobsData.jobs);
        if (!activeJob) {
          setActiveJob(jobsData.jobs[0]);
        }
      }

      const clipsData = await clipsRes.json();
      if (clipsData.clips) {
        setClips(clipsData.clips);
      }
    } catch (err) {
      // Server may be initializing
    }
  };

  useEffect(() => {
    refreshStatusAndJobs();
    const interval = setInterval(refreshStatusAndJobs, 15000);
    return () => clearInterval(interval);
  }, []);

  // 2. Real-Time Server-Sent Events (SSE) stream for Active Job
  useEffect(() => {
    if (!activeJob?.id) return;

    const eventSource = new EventSource(`/api/workflow/events/${activeJob.id}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'snapshot' && data.job) {
          setActiveJob(data.job);
          setIsRunning(data.job.status === 'running');
        } else if (data.type === 'progress') {
          setActiveJob((prev) => {
            if (!prev || prev.id !== data.jobId) return prev;
            return {
              ...prev,
              agentsProgress: {
                ...prev.agentsProgress,
                [data.agentId]: {
                  ...prev.agentsProgress[data.agentId],
                  progress: data.progress,
                  status: data.status,
                  message: data.message,
                },
              },
            };
          });
        } else if (data.type === 'log') {
          setActiveJob((prev) => {
            if (!prev || prev.id !== data.jobId) return prev;
            return {
              ...prev,
              logs: [...prev.logs, data.log],
            };
          });
        } else if (data.type === 'artifact') {
          setActiveJob((prev) => {
            if (!prev || prev.id !== data.jobId) return prev;
            return {
              ...prev,
              artifacts: {
                ...prev.artifacts,
                [data.key || data.artifactType]: data.value || data.data,
              },
            };
          });
        } else if (data.type === 'status') {
          setIsRunning(data.status === 'running');
          setActiveJob((prev) => {
            if (!prev || prev.id !== data.jobId) return prev;
            return {
              ...prev,
              status: data.status,
              error: data.error,
            };
          });
          refreshStatusAndJobs();
        }
      } catch (err) {
        // parsing error
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeJob?.id]);

  // 3. Trigger Workflow Generation
  const handleStartWorkflow = async (options: WorkflowOptions) => {
    setIsRunning(true);
    setActiveTab('studio');
    try {
      const res = await fetch('/api/workflow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (data.job) {
        setActiveJob(data.job);
        setJobsHistory((prev) => [data.job, ...prev.filter((j) => j.id !== data.job.id)]);
      }
    } catch (err: any) {
      alert(`Failed to start workflow: ${err.message}`);
      setIsRunning(false);
    }
  };

  // 3.1 Trigger Autonomous Daily Loop
  const handleAutonomousDaily = async () => {
    setIsRunning(true);
    setActiveTab('studio');
    try {
      const res = await fetch('/api/workflow/autonomous-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload: false,
          dryRun: isDryRun,
          scheduleAuto: true,
        }),
      });
      const data = await res.json();
      if (data.job) {
        setActiveJob(data.job);
        setJobsHistory((prev) => [data.job, ...prev.filter((j) => j.id !== data.job.id)]);
      }
    } catch (err: any) {
      alert(`Autonomous Daily run error: ${err.message}`);
      setIsRunning(false);
    }
  };

  // 4. Trigger Manual YouTube Upload for completed job
  const handleManualUpload = async () => {
    if (!activeJob) return;
    try {
      const res = await fetch('/api/youtube/manual-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: activeJob.id,
          privacyStatus: activeJob.options.privacyStatus || 'private',
          dryRun: false,
        }),
      });
      const data = await res.json();
      if (data.success && data.uploadResult) {
        setActiveJob((prev) =>
          prev
            ? {
                ...prev,
                artifacts: {
                  ...prev.artifacts,
                  youtubeUpload: data.uploadResult,
                },
              }
            : null
        );
      }
    } catch (err: any) {
      alert(`Manual upload failed: ${err.message}`);
    }
  };

  const handleSelectTrend = (trend: GlobalTrendItem) => {
    handleStartWorkflow({
      game: trend.game,
      topic: trend.topic,
      format: trend.formatPotential === 'long_form' ? 'landscape' : 'shorts',
      dryRun: isDryRun,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        geminiConnected={geminiConnected}
        youtubeConnected={youtubeConnected}
        isDryRun={isDryRun}
        onToggleDryRun={() => setIsDryRun(!isDryRun)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenClips={() => setIsClipsOpen(true)}
        onOpenChannels={() => setIsChannelsOpen(true)}
        clipsCount={clips.length}
      />

      {/* Primary Navigation Tabs */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 sticky top-[65px] z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 py-2.5">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>Studio & Swarm</span>
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'trends'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Flame className="h-4 w-4 text-rose-400" />
              <span>Global Trends (0-100)</span>
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Compass className="h-4 w-4 text-emerald-400" />
              <span>Opportunity Radar</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span>Channel Intelligence & Learning Loop</span>
            </button>

            <button
              onClick={() => setActiveTab('ab_lab')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'ab_lab'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <FlaskConical className="h-4 w-4 text-purple-400" />
              <span>A/B Retention Lab</span>
            </button>
          </div>

          {/* 1-Click Autonomous Daily Run Button */}
          <button
            onClick={handleAutonomousDaily}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-zinc-100 text-xs font-black flex items-center gap-1.5 shrink-0 transition cursor-pointer disabled:opacity-50 shadow-md"
          >
            <Zap className="h-3.5 w-3.5 text-yellow-300" />
            <span>Autonomous Daily Run</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Content by Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Tab 1: Studio & Swarm */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Form Controls */}
            <WorkflowForm
              onSubmit={handleStartWorkflow}
              isRunning={isRunning}
              isDryRun={isDryRun}
              youtubeConfigured={youtubeConnected}
              clipsCount={clips.length}
            />

            {/* Previous Jobs Switcher Bar */}
            {jobsHistory.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <History className="h-3.5 w-3.5 text-zinc-400" /> Recent Productions ({jobsHistory.length}):
                </span>
                {jobsHistory.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => setActiveJob(j)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeJob?.id === j.id
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md font-bold'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-zinc-900 font-bold mr-1">[{j.game || 'Auto'}]</span>
                    {j.topic.slice(0, 24)}...
                  </button>
                ))}
              </div>
            )}

            {/* Active Multi-Agent Swarm Orchestrator */}
            {activeJob && (
              <div className="space-y-6">
                {/* 19-Agent Swarm & Live Telemetry Stream */}
                <AgentSwarmView job={activeJob} />

                {/* Analytics Feedback & Continuous Self-Improvement Loop */}
                {(activeJob.artifacts.analytics || activeJob.artifacts.optimization) && (
                  <AnalyticsFeedbackView job={activeJob} />
                )}

                {/* Artifacts Studio Section */}
                {(activeJob.artifacts.videoEditing ||
                  activeJob.artifacts.script ||
                  activeJob.artifacts.thumbnail ||
                  activeJob.artifacts.copyrightSafety) && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Video Player & Thumbnail Preview & Copyright */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Master Video Player */}
                      <VideoStudioPlayer
                        job={activeJob}
                        onTriggerManualUpload={handleManualUpload}
                      />

                      {/* Thumbnail Studio */}
                      <ThumbnailPreview
                        thumbnail={activeJob.artifacts.thumbnail}
                        jobId={activeJob.id}
                      />

                      {/* Copyright & Fair Use Audit Card */}
                      <CopyrightSafetyCard safety={activeJob.artifacts.copyrightSafety} />

                      {/* Quality Control Audit Card */}
                      <QualityAuditModal qc={activeJob.artifacts.qualityControl} />
                    </div>

                    {/* Right Column: SEO Metadata & Script Storyboard */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* YouTube SEO Metadata */}
                      <SeoInspector seo={activeJob.artifacts.seo} />

                      {/* Narrative Script & Scene Breakdown */}
                      <ScriptTimeline
                        script={activeJob.artifacts.script}
                        scenePlan={activeJob.artifacts.scenePlan}
                        assets={activeJob.artifacts.assets}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Global Trends View */}
        {activeTab === 'trends' && <GlobalTrendsView onSelectTrend={handleSelectTrend} />}

        {/* Tab 3: Opportunity Radar View */}
        {activeTab === 'radar' && (
          <OpportunityRadarView
            onLaunchOpportunity={(item) => {
              handleStartWorkflow({
                game: item.game,
                topic: item.topic,
                format: item.format,
                dryRun: isDryRun,
              });
            }}
          />
        )}

        {/* Tab 4: Channel Analytics Dashboard */}
        {activeTab === 'analytics' && <ChannelAnalyticsDashboard />}

        {/* Tab 5: A/B Candidate Lab */}
        {activeTab === 'ab_lab' && <ABTestingPanel />}
      </main>

      {/* Interactive Modals */}
      <ChannelProfileModal
        isOpen={isChannelsOpen}
        onClose={() => setIsChannelsOpen(false)}
      />

      <ClipsLibrary
        isOpen={isClipsOpen}
        onClose={() => setIsClipsOpen(false)}
        onClipsUpdated={(updated) => setClips(updated)}
      />

      <CliTerminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onWorkflowTriggered={(jobId) => {
          refreshStatusAndJobs();
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiConnected={geminiConnected}
        youtubeConnected={youtubeConnected}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-6 text-center text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <span>Ruflo Autonomous YouTube Intelligence Studio • 19 Swarm Intelligence Agents</span>
        <span className="text-zinc-600">Powered by Google Gemini 3.7 Flash & FFmpeg Engine</span>
      </footer>
    </div>
  );
}
