import React from 'react';
import { X, Key, Youtube, ShieldAlert, Sparkles, CheckCircle2, HelpCircle, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiConnected: boolean;
  youtubeConnected: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiConnected,
  youtubeConnected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                API & YouTube Integration Setup Guide
              </h2>
              <p className="text-xs text-zinc-400">
                Credentials and deployment configuration for Ruflo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs text-zinc-300">
          {/* Gemini AI Status */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-100">
                <Key className="h-4 w-4 text-emerald-400" />
                <span>1. Google Gemini API (Server-Side)</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                geminiConnected ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300'
              }`}>
                {geminiConnected ? 'Active' : 'Fallback Engine Ready'}
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Google AI Studio automatically injects the <code className="text-amber-400">GEMINI_API_KEY</code> secret directly into the server environment at runtime. Ruflo uses Gemini 3.7 Flash and Gemini Imagen for research, scriptwriting, scene composition, and high-CTR thumbnail generation.
            </p>
          </div>

          {/* YouTube OAuth Configuration */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-100">
                <Youtube className="h-4 w-4 text-rose-500" />
                <span>2. YouTube Data API v3 OAuth Publishing</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                youtubeConnected ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {youtubeConnected ? 'OAuth Connected' : 'Dry-Run Mode (Safe)'}
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              To publish videos directly to your live YouTube channel, configure your OAuth 2.0 credentials in the environment:
            </p>
            <div className="bg-black/80 p-3 rounded-lg font-mono text-[10px] text-zinc-300 space-y-1 select-all border border-zinc-800">
              <div>YOUTUBE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"</div>
              <div>YOUTUBE_CLIENT_SECRET="your_client_secret"</div>
              <div>YOUTUBE_REFRESH_TOKEN="your_oauth_refresh_token"</div>
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
              <ShieldAlert className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              <span>When credentials are not set, Ruflo operates in <strong>Dry-Run Mode</strong>, simulating uploads safely without touching any live channels.</span>
            </div>
          </div>

          {/* CLI Usage Guide */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-zinc-100">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>3. Command Line Interface (CLI)</span>
            </div>
            <p className="text-zinc-400 text-[11px]">
              You can run Ruflo directly from the command line in terminal or through the in-app CLI console:
            </p>
            <div className="bg-black/80 p-3 rounded-lg font-mono text-[11px] text-amber-300 space-y-1 select-all border border-zinc-800">
              <div>$ ruflo youtube create "GTA 5 police chase"</div>
              <div>$ ruflo youtube create "GTA 5 getaway" --upload</div>
              <div>$ ruflo youtube create "GTA 5 stunts" --schedule "2026-08-25T18:00:00Z"</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
