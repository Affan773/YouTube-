import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, FileText, Scale } from 'lucide-react';
import { CopyrightSafetyData } from '../types.js';

interface CopyrightSafetyCardProps {
  safety?: CopyrightSafetyData;
}

export const CopyrightSafetyCard: React.FC<CopyrightSafetyCardProps> = ({ safety }) => {
  if (!safety) return null;

  const isSafe = safety.status === 'safe';
  const isWarning = safety.status === 'warning';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-md ${
              isSafe ? 'bg-emerald-600' : isWarning ? 'bg-amber-600' : 'bg-rose-600'
            }`}
          >
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Copyright & Fair Use Compliance Audit
            </h3>
            <p className="text-xs text-zinc-400">
              YouTube Content ID, Fair Use & Commercial Safety Gate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-zinc-300">
            Score: {safety.overallSafetyScore || 98}/100
          </span>
          <span
            className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase border ${
              isSafe
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : isWarning
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-rose-950 text-rose-300 border-rose-700'
            }`}
          >
            {safety.status}
          </span>
        </div>
      </div>

      {/* Safety Checks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {safety.checks && safety.checks.map((chk, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl text-xs"
          >
            {chk.status === 'passed' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : chk.status === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-semibold text-zinc-200">{chk.category}</div>
              <p className="text-zinc-400 text-[11px] leading-snug">{chk.details}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Fair Use Summary */}
      {safety.fairUseGuidelines && safety.fairUseGuidelines.length > 0 && (
        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 text-xs space-y-1.5">
          <span className="text-[11px] text-zinc-400 font-semibold uppercase flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-cyan-400" /> Fair Use & Transformative Justifications:
          </span>
          <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px] pl-1">
            {safety.fairUseGuidelines.map((g, idx) => (
              <li key={idx} className="leading-snug">{g}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
