import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, CornerDownLeft, Play, RefreshCw, Trash2, Flame, LineChart, Compass, Target, Zap } from 'lucide-react';

interface CliTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowTriggered?: (jobId: string) => void;
}

export const CliTerminal: React.FC<CliTerminalProps> = ({ isOpen, onClose, onWorkflowTriggered }) => {
  const [input, setInput] = useState('ruflo youtube trends');
  const [history, setHistory] = useState<string[]>([
    'Ruflo Autonomous YouTube Intelligence Studio CLI v3.0',
    'Type "ruflo help" for documentation or click quick commands below.',
    '------------------------------------------------------------------',
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history.length, isOpen]);

  const handleExecute = async (cmdToRun?: string) => {
    const command = (cmdToRun || input).trim();
    if (!command) return;

    setIsExecuting(true);
    setHistory((prev) => [...prev, `$ ${command}`]);

    try {
      const res = await fetch('/api/cli/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();
      if (data.output) {
        setHistory((prev) => [...prev, data.output, '']);
      } else if (data.error) {
        setHistory((prev) => [...prev, `Error: ${data.error}`, '']);
      }

      if (data.jobId && onWorkflowTriggered) {
        onWorkflowTriggered(data.jobId);
      }
    } catch (err: any) {
      setHistory((prev) => [...prev, `Execution error: ${err.message}`, '']);
    } finally {
      setIsExecuting(false);
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[650px] max-h-[92vh]">
        {/* Terminal Titlebar */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <TerminalIcon className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-zinc-200">
              ruflo-intelligence-cli@studio:~
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistory(['Terminal cleared.'])}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 cursor-pointer"
              title="Clear Terminal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Command Chips */}
        <div className="px-4 py-2 bg-zinc-900/70 border-b border-zinc-800/80 flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <span className="text-zinc-500 font-bold">Quick CLI:</span>
          <button
            onClick={() => handleExecute('ruflo youtube trends')}
            className="px-2 py-0.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded border border-amber-800/60 flex items-center gap-1 cursor-pointer"
          >
            <Flame className="h-3 w-3" />
            trends
          </button>
          <button
            onClick={() => handleExecute('ruflo youtube analytics')}
            className="px-2 py-0.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 rounded border border-cyan-800/60 flex items-center gap-1 cursor-pointer"
          >
            <LineChart className="h-3 w-3" />
            analytics
          </button>
          <button
            onClick={() => handleExecute('ruflo youtube opportunities')}
            className="px-2 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 rounded border border-emerald-800/60 flex items-center gap-1 cursor-pointer"
          >
            <Compass className="h-3 w-3" />
            opportunities
          </button>
          <button
            onClick={() => handleExecute('ruflo youtube recommend')}
            className="px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 rounded border border-purple-800/60 flex items-center gap-1 cursor-pointer"
          >
            <Target className="h-3 w-3" />
            recommend
          </button>
          <button
            onClick={() => handleExecute('ruflo youtube autonomous --daily')}
            className="px-2 py-0.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 rounded border border-rose-800/70 flex items-center gap-1 cursor-pointer font-bold"
          >
            <Zap className="h-3 w-3" />
            autonomous --daily
          </button>
          <button
            onClick={() => handleExecute('ruflo youtube history')}
            className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 cursor-pointer"
          >
            history
          </button>
          <button
            onClick={() => handleExecute('ruflo status')}
            className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 cursor-pointer"
          >
            status
          </button>
        </div>

        {/* Terminal Output Body */}
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 bg-black/90 text-zinc-300 select-text">
          {history.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap leading-relaxed">
              {line}
            </div>
          ))}
          {isExecuting && (
            <div className="text-amber-400 flex items-center gap-2 animate-pulse py-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Executing autonomous YouTube intelligence sequence...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecute();
          }}
          className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
        >
          <span className="font-mono text-cyan-400 font-bold text-sm">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ruflo youtube trends | analytics | opportunities | autonomous --daily | create <topic>"
            disabled={isExecuting}
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isExecuting || !input.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>Run</span>
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
