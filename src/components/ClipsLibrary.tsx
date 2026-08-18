import React, { useState, useEffect, useRef } from 'react';
import { Upload, Film, Trash2, CheckCircle2, AlertCircle, X, HardDrive } from 'lucide-react';
import { ClipItem } from '../types.js';

interface ClipsLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onClipsUpdated: (clips: ClipItem[]) => void;
}

export const ClipsLibrary: React.FC<ClipsLibraryProps> = ({ isOpen, onClose, onClipsUpdated }) => {
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchClips = async () => {
    try {
      const res = await fetch('/api/clips');
      const data = await res.json();
      if (data.clips) {
        setClips(data.clips);
        onClipsUpdated(data.clips);
      }
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClips();
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('clip', file);

    try {
      const res = await fetch('/api/clips/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        await fetchClips();
      } else {
        setError(data.error || 'Failed to upload clip');
      }
    } catch (err: any) {
      setError(err.message || 'Upload error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/clips/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchClips();
      }
    } catch (err) {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Film className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                User GTA 5 Gameplay Clips Library
              </h2>
              <p className="text-xs text-zinc-400">
                Upload real gameplay footage to stitch seamlessly into generated videos
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

        {/* Upload Zone */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-amber-500 bg-zinc-950/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
            />
            <Upload className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <span className="text-xs font-bold text-zinc-200 block">
              {isUploading ? 'Uploading Clip...' : 'Click to Upload GTA 5 Gameplay MP4'}
            </span>
            <span className="text-[11px] text-zinc-500 block mt-1">
              Supports .mp4, .mov, .webm gameplay recordings
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Clips List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Available Footage Files ({clips.length})
            </h3>

            {clips.length === 0 ? (
              <div className="p-6 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
                No user gameplay clips uploaded yet. The Video Asset Agent will automatically use Gemini cinematic visual frames.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HardDrive className="h-4 w-4 text-zinc-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-zinc-200 truncate">{clip.filename}</p>
                        <p className="text-[10px] text-zinc-500">
                          {(clip.sizeBytes / 1024 / 1024).toFixed(1)} MB • Uploaded {new Date(clip.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(clip.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
                      title="Delete Clip"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Clips stored locally in <code className="text-zinc-400">.ruflo-output/clips/</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
