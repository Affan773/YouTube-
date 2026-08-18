import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { QualityControlData } from '../types.js';

interface QualityAuditModalProps {
  qc?: QualityControlData;
}

export const QualityAuditModal: React.FC<QualityAuditModalProps> = ({ qc }) => {
  if (!qc) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500">
        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-zinc-600 animate-pulse" />
        <p className="text-xs">Quality Control Agent verifying integrity & safety...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Quality Control & Broadcast Audit
          </h3>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
            qc.passed
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-amber-950/80 border-amber-700 text-amber-300'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Score: {qc.overallScore}/100 ({qc.passed ? 'PASSED' : 'WARNING'})</span>
        </div>
      </div>

      {/* Checks Grid */}
      <div className="space-y-2.5">
        {qc.checks.map((check) => (
          <div
            key={check.id}
            className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-start gap-3 text-xs"
          >
            <div className="mt-0.5">
              {check.status === 'passed' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : check.status === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-100">{check.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    check.score >= 90
                      ? 'text-emerald-400 bg-emerald-950/50'
                      : check.score >= 70
                      ? 'text-amber-400 bg-amber-950/50'
                      : 'text-rose-400 bg-rose-950/50'
                  }`}
                >
                  {check.score}/100
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">{check.details}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {qc.recommendations && qc.recommendations.length > 0 && (
        <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-[11px] space-y-1">
          <span className="font-bold text-amber-400">Production Insights:</span>
          <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
            {qc.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
