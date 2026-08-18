import React, { useState } from 'react';
import { ABCandidate } from '../types.js';
import { FlaskConical, CheckCircle2, Sparkles, Trophy, Lightbulb, RefreshCw } from 'lucide-react';

export function ABTestingPanel() {
  const [game, setGame] = useState('Minecraft');
  const [topic, setTopic] = useState('5 Secret Redstone Mechanics Mojang Tried To Hide');
  const [format, setFormat] = useState<'shorts' | 'landscape'>('shorts');
  const [loading, setLoading] = useState(false);

  const [titleCandidates, setTitleCandidates] = useState<ABCandidate[]>([
    {
      id: 't1',
      type: 'title',
      content: '5 MINECRAFT 1.21 SECRETS MOJANG TRIED TO HIDE',
      score: 95,
      reasoning: 'Strongest curiosity gap combining numbers, game version, and forbidden curiosity framing.',
      isSelected: true,
    },
    {
      id: 't2',
      type: 'title',
      content: 'I TESTED THE MOST ILLEGAL MINECRAFT REDSTONE GLITCH',
      score: 89,
      reasoning: 'High-stakes personal narrative, strong search keyword presence.',
      isSelected: false,
    },
    {
      id: 't3',
      type: 'title',
      content: 'NEVER CRAFT THIS BLOCK IN MINECRAFT (HUGE MISTAKE)',
      score: 86,
      reasoning: 'Loss-aversion warning format generates high impulse clicks.',
      isSelected: false,
    },
  ]);

  const [thumbCandidates, setThumbCandidates] = useState<ABCandidate[]>([
    {
      id: 'th1',
      type: 'thumbnail',
      content: 'DO NOT CRAFT!',
      subContent: 'Secret Revealed',
      score: 96,
      reasoning: '3-word ultra punchy headline with highest visual contrast for mobile scrollers.',
      isSelected: true,
    },
    {
      id: 'th2',
      type: 'thumbnail',
      content: '100% ILLEGAL',
      subContent: 'New Exploit',
      score: 90,
      reasoning: 'Extreme urgency tag with bold yellow framing.',
      isSelected: false,
    },
    {
      id: 'th3',
      type: 'thumbnail',
      content: 'PRO SECRET',
      subContent: 'Mojang Hidden',
      score: 87,
      reasoning: 'Status-driven framing appealing to hardcore players.',
      isSelected: false,
    },
  ]);

  const [hookCandidates, setHookCandidates] = useState<ABCandidate[]>([
    {
      id: 'h1',
      type: 'hook',
      content: 'If you play Minecraft right now, Mojang just changed something you were never supposed to find.',
      score: 96,
      reasoning: 'Instant pattern interrupt challenging player assumptions within 1.5 seconds.',
      isSelected: true,
    },
    {
      id: 'h2',
      type: 'hook',
      content: '99% of players make this massive mistake without even realizing it.',
      score: 89,
      reasoning: 'High FOMO opener with immediate visual proof.',
      isSelected: false,
    },
    {
      id: 'h3',
      type: 'hook',
      content: 'I spent 24 hours testing the rarest glitch in this game so you don\'t have to.',
      score: 85,
      reasoning: 'Effort-investment hook establishing creator credibility.',
      isSelected: false,
    },
  ]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ab/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, topic, format }),
      });
      const data = await res.json();
      if (data.titleCandidates) setTitleCandidates(data.titleCandidates);
      if (data.thumbnailCandidates) setThumbCandidates(data.thumbnailCandidates);
      if (data.hookCandidates) setHookCandidates(data.hookCandidates);
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FlaskConical className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-black text-zinc-100 flex items-center gap-2">
              Pre-Publication A/B Testing & Retention Lab
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                Candidate Scorer
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Generates multiple candidates for Titles, Thumbnails, and Hooks, scoring each before publication.
            </p>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">Game</label>
            <input
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-zinc-400 block mb-1">Topic / Premise</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-zinc-100 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Generate & Score A/B
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Sections */}
      <div className="space-y-6">
        {/* Title Candidates */}
        <div className="bg-zinc-900/70 border border-zinc-800/90 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
            <Trophy className="h-4 w-4" />
            <span>Title Candidates (Ranked by Algorithmic Curiosity Score)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {titleCandidates.map((c, i) => (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition space-y-2 flex flex-col justify-between ${
                  c.isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-400">Candidate {String.fromCharCode(65 + i)}</span>
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                        c.isSelected ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {c.score}/100 {c.isSelected ? '★ WINNER' : ''}
                    </span>
                  </div>
                  <h4 className="font-black text-xs text-zinc-100 leading-snug">{c.content}</h4>
                </div>
                <p className="text-[11px] text-zinc-400 italic bg-zinc-900/60 p-2 rounded-lg">{c.reasoning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnail Headline Candidates */}
        <div className="bg-zinc-900/70 border border-zinc-800/90 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-black text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Thumbnail Headlines (Max 3-4 Words • Mobile Legibility Audit)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {thumbCandidates.map((c, i) => (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition space-y-2 flex flex-col justify-between ${
                  c.isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-400">Variant {String.fromCharCode(65 + i)}</span>
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                        c.isSelected ? 'bg-cyan-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {c.score}/100 {c.isSelected ? '★ WINNER' : ''}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg text-center font-black text-lg text-amber-300 tracking-wider">
                    {c.content}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 italic bg-zinc-900/60 p-2 rounded-lg">{c.reasoning}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Opening Hook Candidates */}
        <div className="bg-zinc-900/70 border border-zinc-800/90 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
            <Lightbulb className="h-4 w-4" />
            <span>Opening Hook Lines (First 3-5 Seconds Retention Gate)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hookCandidates.map((c, i) => (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition space-y-2 flex flex-col justify-between ${
                  c.isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/60 shadow-md'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-400">Hook {String.fromCharCode(65 + i)}</span>
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                        c.isSelected ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {c.score}/100 {c.isSelected ? '★ WINNER' : ''}
                    </span>
                  </div>
                  <p className="font-semibold text-xs text-zinc-200 leading-relaxed">"{c.content}"</p>
                </div>
                <p className="text-[11px] text-zinc-400 italic bg-zinc-900/60 p-2 rounded-lg">{c.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
