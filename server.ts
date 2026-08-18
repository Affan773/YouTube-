import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { orchestrator } from './src/core/workflow.js';
import { memory } from './src/core/memory.js';
import { config, logInfo, logError } from './src/core/config.js';
import { YouTubeService } from './src/core/youtube.js';
import { TrendIntelligenceService } from './src/core/trendIntelligence.js';
import { ChannelIntelligenceService } from './src/core/channelIntelligence.js';
import { AutonomousDecisionEngine } from './src/core/decisionEngine.js';
import { ABTestingService } from './src/core/abTesting.js';
import { ClipItem, WorkflowOptions } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Multer setup for user gameplay clips
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.clipsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      cb(null, `user_${Date.now()}_${name}${ext}`);
    },
  });
  const upload = multer({ storage });

  // 1. Static file serving for generated artifacts (videos, thumbnails, audio, clips)
  app.use('/output', express.static(config.outputDir));

  // 2. Health & Status
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/status', (req, res) => {
    res.json({
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY || config.geminiApiKey),
      youtubeConfigured: YouTubeService.isConfigured(),
      youtubeClientId: Boolean(config.youtubeClientId),
      youtubeRefreshToken: Boolean(config.youtubeRefreshToken),
      outputDir: config.outputDir,
      totalJobs: memory.getAllJobs().length,
      channelsCount: memory.getChannels().length,
      insightsCount: memory.getLearnedInsights().length,
    });
  });

  // 2.1 Global YouTube Trends & Scoring
  app.get('/api/trends', async (req, res) => {
    try {
      const force = req.query.force === 'true';
      const trends = await TrendIntelligenceService.getGlobalGamingTrends(force);
      res.json({ trends });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2.2 Channel Historical Analytics & Intelligence Report
  app.get('/api/channel/analytics', async (req, res) => {
    try {
      const channelId = (req.query.channelId as string) || 'channel_default';
      const report = await ChannelIntelligenceService.analyzeChannelHistory(channelId);
      res.json({ report });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2.3 Content Opportunity Radar
  app.get('/api/channel/opportunities', async (req, res) => {
    try {
      const channelId = (req.query.channelId as string) || 'channel_default';
      const data = await AutonomousDecisionEngine.generateOpportunityRadar(channelId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2.4 Autonomous Next Best Video Recommendation
  app.get('/api/channel/recommend', async (req, res) => {
    try {
      const channelId = (req.query.channelId as string) || 'channel_default';
      const recommendation = await AutonomousDecisionEngine.decideNextBestVideo(channelId);
      res.json({ recommendation });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2.5 A/B Candidate Generator & Scorer
  app.post('/api/ab/generate', async (req, res) => {
    try {
      const { game, topic, format } = req.body;
      const candidates = await ABTestingService.generateAndScoreCandidates({
        game: game || 'Minecraft',
        topic: topic || 'Secrets',
        format: format || 'shorts',
      });
      res.json(candidates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2.6 Multi-Channel Profile Management
  app.get('/api/channels', (req, res) => {
    res.json({ channels: memory.getChannels() });
  });

  app.post('/api/channels', (req, res) => {
    try {
      const profile = req.body;
      if (!profile.id || !profile.name) {
        return res.status(400).json({ error: 'Channel ID and Name are required' });
      }
      memory.saveChannel(profile);
      res.json({ success: true, channel: profile });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/channels/:id', (req, res) => {
    memory.deleteChannel(req.params.id);
    res.json({ success: true });
  });

  // 2.7 Memory Insights
  app.get('/api/insights', (req, res) => {
    res.json({ insights: memory.getLearnedInsights() });
  });

  // 3. Workflow Management
  app.post('/api/workflow/create', async (req, res) => {
    const options: WorkflowOptions = req.body;

    try {
      const initialJob = memory.createJob(options);

      // Execute asynchronously so UI gets immediate response and subscribes to SSE
      orchestrator.executeWorkflow({ ...options }, initialJob.id).catch((err) => {
        logError('Server', `Background workflow execution error for ${initialJob.id}`, err);
      });

      res.json({
        success: true,
        jobId: initialJob.id,
        job: initialJob,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3.1 Autonomous Daily Mode Endpoint
  app.post('/api/workflow/autonomous-daily', async (req, res) => {
    try {
      const { channelId, upload, scheduleAuto, dryRun, dailyLimit, weeklyLimit } = req.body;
      const result = await orchestrator.executeAutonomousDaily({
        channelId,
        upload,
        scheduleAuto,
        dryRun,
        dailyLimit,
        weeklyLimit,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/workflow/jobs', (req, res) => {
    res.json({ jobs: memory.getAllJobs() });
  });

  app.get('/api/workflow/jobs/:id', (req, res) => {
    const job = memory.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ job });
  });

  // 4. Server-Sent Events (SSE) for Real-Time Multi-Agent Swarm Progress & Logs
  app.get('/api/workflow/events/:id', (req, res) => {
    const jobId = req.params.id;
    const job = memory.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'snapshot', job })}\n\n`);

    const onProgress = (data: any) => {
      if (data.jobId === jobId) {
        res.write(`data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`);
      }
    };

    const onLog = (data: any) => {
      if (data.jobId === jobId) {
        res.write(`data: ${JSON.stringify({ type: 'log', ...data })}\n\n`);
      }
    };

    const onArtifact = (data: any) => {
      if (data.jobId === jobId) {
        res.write(`data: ${JSON.stringify({ type: 'artifact', ...data })}\n\n`);
      }
    };

    const onStatus = (data: any) => {
      if (data.jobId === jobId) {
        res.write(`data: ${JSON.stringify({ type: 'status', ...data })}\n\n`);
      }
    };

    memory.on('agent:progress', onProgress);
    memory.on('job:log', onLog);
    memory.on('job:artifact', onArtifact);
    memory.on('job:status', onStatus);

    req.on('close', () => {
      memory.off('agent:progress', onProgress);
      memory.off('job:log', onLog);
      memory.off('job:artifact', onArtifact);
      memory.off('job:status', onStatus);
    });
  });

  // 5. User Gameplay Clips Management
  app.get('/api/clips', (req, res) => {
    try {
      const files = fs.readdirSync(config.clipsDir);
      const clips: ClipItem[] = [];

      files.forEach((file) => {
        if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.webm')) {
          const filePath = path.join(config.clipsDir, file);
          const stats = fs.statSync(filePath);
          clips.push({
            id: file,
            filename: file,
            filePath: `/output/clips/${file}`,
            duration: 10,
            sizeBytes: stats.size,
            uploadedAt: stats.birthtimeMs || stats.mtimeMs,
          });
        }
      });

      res.json({ clips });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/clips/upload', upload.single('clip'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const clip: ClipItem = {
      id: req.file.filename,
      filename: req.file.originalname,
      filePath: `/output/clips/${req.file.filename}`,
      duration: 10,
      sizeBytes: req.file.size,
      uploadedAt: Date.now(),
    };

    res.json({ success: true, clip });
  });

  app.delete('/api/clips/:id', (req, res) => {
    const filePath = path.join(config.clipsDir, req.params.id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Clip not found' });
    }
  });

  // 6. Manual Live YouTube Upload
  app.post('/api/youtube/manual-upload', async (req, res) => {
    const { jobId, privacyStatus, scheduledPublishAt, dryRun } = req.body;
    const job = memory.getJob(jobId);

    if (!job || !job.artifacts.videoEditing || !job.artifacts.seo) {
      return res.status(400).json({ error: 'Job or required artifacts not found' });
    }

    try {
      const uploadResult = await YouTubeService.uploadVideo({
        videoFilePath: job.artifacts.videoEditing.videoFilePath,
        thumbnailFilePath: job.artifacts.thumbnail?.imagePath,
        seoData: job.artifacts.seo,
        privacyStatus: privacyStatus || 'private',
        scheduledPublishAt,
        dryRun: dryRun ?? false,
      });

      memory.setArtifact(job.id, 'youtubeUpload', uploadResult);
      memory.addLog(job.id, `Manual YouTube upload result: ${uploadResult.message}`, 'success', 'youtube_upload');

      res.json({ success: true, uploadResult });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. CLI Execution API for UI Terminal
  app.post('/api/cli/execute', async (req, res) => {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command string is required' });
    }

    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    if (parts[0] !== 'ruflo') {
      return res.status(400).json({ error: 'Only "ruflo" commands are supported.' });
    }

    try {
      // 1. Status
      if (parts[1] === 'status' || (parts[1] === 'youtube' && parts[2] === 'status')) {
        const channels = memory.getChannels();
        const insights = memory.getLearnedInsights();
        return res.json({
          output: `[Ruflo Autonomous YouTube Studio Status]
• Gemini 3.7 Flash API: ${config.geminiApiKey ? 'ONLINE' : 'FALLBACK READY'}
• YouTube OAuth: ${YouTubeService.isConfigured() ? 'AUTHENTICATED (Live Ready)' : 'DRY-RUN / SIMULATED'}
• Autonomous Swarm: 19 Active Intelligence Agents
• Channels Managed: ${channels.length} (${channels.map((c) => c.name).join(', ')})
• Learned Memory Insights: ${insights.length} active patterns
• Output Storage: ${config.outputDir}`,
        });
      }

      // 2. Global Trends
      if (parts[1] === 'youtube' && parts[2] === 'trends') {
        const trends = await TrendIntelligenceService.getGlobalGamingTrends();
        const formatted = trends
          .slice(0, 7)
          .map(
            (t, i) =>
              `${i + 1}. [${t.game}] "${t.topic}"\n   • Trend Score: ${t.trendScore}/100 | Demand: ${t.demandScore}/100 | Momentum: +${t.growthRate}%\n   • Opportunity: ${t.opportunityCategory.toUpperCase()} | Competition: ${t.competition}`
          )
          .join('\n\n');
        return res.json({
          output: `=== WORLDWIDE GAMING TREND INTELLIGENCE ===\n\n${formatted}\n\nTip: Run "ruflo youtube create --auto-topic" to produce the top opportunity!`,
        });
      }

      // 3. Channel Analytics & Learning Loop
      if (parts[1] === 'youtube' && parts[2] === 'analytics') {
        const report = await ChannelIntelligenceService.analyzeChannelHistory();
        return res.json({
          output: `=== CHANNEL HISTORICAL INTELLIGENCE REPORT ===
Channel: ${report.channelName} (${report.totalVideosAnalyzed} videos analyzed)
• Total Views: ${report.totalViews.toLocaleString()} | Avg CTR: ${report.avgCtr}% | Avg Retention: ${report.avgRetentionPercent}%
• Top Game Affinities: ${report.bestGames.join(', ')}
• Recommended Format: ${report.bestFormat.toUpperCase()} (${report.bestVideoLength})

[STRATEGIC LEARNING LOOP]
✔ What Worked: ${report.strategicGuidance.whatWorked[0]}
✖ What Failed: ${report.strategicGuidance.whatDidNotWork[0]}
🔁 Repeat: ${report.strategicGuidance.whatToRepeat[0]}
🚫 Avoid: ${report.strategicGuidance.whatToAvoid[0]}
🧪 Test Next: ${report.strategicGuidance.whatToTestNext[0]}`,
        });
      }

      // 4. Content Opportunity Radar
      if (parts[1] === 'youtube' && parts[2] === 'opportunities') {
        const { opportunities } = await AutonomousDecisionEngine.generateOpportunityRadar();
        const formatted = opportunities
          .slice(0, 5)
          .map(
            (o, i) =>
              `${i + 1}. [${o.game}] "${o.topic}"\n   • Opportunity Score: ${o.opportunityScore}/100 (Trend: ${o.trendScore} | Channel Fit: ${o.channelFitScore})\n   • Category: ${o.opportunityCategory.toUpperCase()} | Format: ${o.recommendedFormat.toUpperCase()}\n   • Hook: ${o.suggestedHook}`
          )
          .join('\n\n');
        return res.json({
          output: `=== CONTENT OPPORTUNITY RADAR ===\n\n${formatted}`,
        });
      }

      // 5. Autonomous Recommend Next Best Video
      if (parts[1] === 'youtube' && parts[2] === 'recommend') {
        const dec = await AutonomousDecisionEngine.decideNextBestVideo();
        return res.json({
          output: `=== AUTONOMOUS DECISION ENGINE: NEXT BEST VIDEO ===
🎮 Game: ${dec.selectedGame}
💡 Topic: "${dec.selectedTopic}"
🎬 Format: ${dec.recommendedFormat.toUpperCase()}
⭐ Opportunity Score: ${dec.opportunityScore}/100 (Trend: ${dec.trendScore} | Channel Fit: ${dec.channelFitScore})
📅 Optimal Publishing Slot: ${dec.recommendedScheduleTime}
🎯 Expected Retention: ${dec.expectedRetention}%
🧠 Learning Loop Applied: "${dec.keyLearningApplied}"
📝 Reason: ${dec.selectionReason}`,
        });
      }

      // 6. Channels List
      if (parts[1] === 'youtube' && (parts[2] === 'channels' || parts[2] === 'channel')) {
        const channels = memory.getChannels();
        const formatted = channels
          .map(
            (c) =>
              `• [${c.id}] ${c.name} ${c.isDefault ? '(DEFAULT)' : ''}\n   Games: ${c.targetGames.join(', ')}\n   Format: ${c.defaultFormat} | Mode: ${c.autoPublishMode || 'dry_run'} | Timezone: ${c.timezone || 'UTC'}`
          )
          .join('\n\n');
        return res.json({
          output: `=== CONFIGURED YOUTUBE CHANNELS ===\n\n${formatted}`,
        });
      }

      // 7. Video Production History
      if (parts[1] === 'history' || (parts[1] === 'youtube' && parts[2] === 'history') || parts[1] === 'list') {
        const jobs = memory.getAllJobs();
        const formatted = jobs
          .slice(0, 10)
          .map(
            (j) =>
              `• [${j.id}] ${j.game ? `[${j.game}] ` : ''}"${j.topic}" (${j.status.toUpperCase()})\n   Format: ${j.options.format || 'shorts'} | URL: ${j.artifacts.youtubeUpload?.videoUrl || 'N/A'}`
          )
          .join('\n');
        return res.json({
          output: `Found ${jobs.length} recorded productions:\n\n${formatted || 'No production history recorded yet.'}`,
        });
      }

      // 8. Autonomous Daily Execution (ruflo youtube autonomous --daily)
      if (parts[1] === 'youtube' && parts[2] === 'autonomous') {
        const isDaily = trimmed.includes('--daily');
        const upload = trimmed.includes('--upload');
        const scheduleAuto = trimmed.includes('--schedule') || isDaily;
        const dryRun = !upload && !trimmed.includes('--public');

        const result = await orchestrator.executeAutonomousDaily({
          upload,
          scheduleAuto,
          dryRun,
          dailyLimit: 1,
          weeklyLimit: 7,
        });

        return res.json({
          output: `✔ ${result.message}\nJob ID: ${result.job.id}\nVideo Path: ${result.job.artifacts.videoEditing?.videoFilePath}\nYouTube URL: ${result.job.artifacts.youtubeUpload?.videoUrl || 'Simulated in Dry-Run Mode'}`,
          jobId: result.job.id,
        });
      }

      // 9. Standard Create with Flags (ruflo youtube create ...)
      if (parts[1] === 'youtube' && parts[2] === 'create') {
        const rest = trimmed.slice(trimmed.indexOf('create') + 6).trim();
        const autoTopic = rest.includes('--auto-topic');
        const autoGame = rest.includes('--auto-game');
        const upload = rest.includes('--upload');
        const isPublic = rest.includes('--public');
        const isUnlisted = rest.includes('--unlisted');
        const scheduleAuto = rest.includes('--schedule');
        const dryRun = rest.includes('--dry-run') || (!upload && !isPublic);

        let format: 'shorts' | 'landscape' = 'shorts';
        if (rest.includes('--format landscape') || rest.includes('--format long')) {
          format = 'landscape';
        }

        let cleanedTopic = rest
          .replace('--auto-topic', '')
          .replace('--auto-game', '')
          .replace('--upload', '')
          .replace('--public', '')
          .replace('--unlisted', '')
          .replace('--private', '')
          .replace('--dry-run', '')
          .replace('--schedule', '')
          .replace(/--format\s+\w+/, '')
          .replace(/^["']|["']$/g, '')
          .trim();

        if (autoTopic && !cleanedTopic) {
          cleanedTopic = 'Auto-Discovered Highest Opportunity Topic';
        }

        const job = await orchestrator.executeWorkflow({
          topic: cleanedTopic || 'Trending Gaming Topic',
          autoTopic,
          autoGame,
          upload,
          dryRun,
          format,
          scheduleAuto,
          privacyStatus: isPublic ? 'public' : isUnlisted ? 'unlisted' : 'private',
        });

        return res.json({
          output: `✔ Autonomous Pipeline Completed for: [${job.game}] "${job.topic}"\nJob ID: ${job.id}\nVideo Render: ${job.artifacts.videoEditing?.videoFilePath}\nYouTube Result: ${job.artifacts.youtubeUpload?.message || job.artifacts.youtubeUpload?.videoUrl}`,
          jobId: job.id,
        });
      }

      // Help
      res.json({
        output: `Available Ruflo CLI Commands:
• ruflo youtube trends                     - Scan worldwide gaming trends & 0-100 scores
• ruflo youtube analytics                  - Analyze historical channel metrics & learning loop
• ruflo youtube opportunities              - Display Content Opportunity Radar (Hot, Rising, Underserved)
• ruflo youtube recommend                  - Autonomous Decision Engine for Next Best Video
• ruflo youtube create [topic] [--upload]  - Generate video (supports --auto-topic, --auto-game, --format shorts/landscape)
• ruflo youtube autonomous --daily        - Full autonomous daily cycle (Trend -> Script -> Edit -> Publish -> Learn)
• ruflo youtube history                    - View past video production history
• ruflo youtube channels                   - View configured multi-channel profiles
• ruflo status                             - Check Gemini & YouTube system health`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logInfo('Server', `Ruflo Multi-Agent YouTube Studio running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  logError('Server', 'Fatal startup error', err);
});
