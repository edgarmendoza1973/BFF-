'use client';
/**
 * MediaUploader — reusable upload component for audio and video files.
 * Used by admin pages to attach audio/video URLs to sermons, events, etc.
 */
import { useRef, useState, useCallback } from 'react';
import { Upload, Music, Video, X, Loader2, CheckCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

type MediaType = 'audio' | 'video';

interface MediaUploaderProps {
  mediaType: MediaType;
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  purpose?: 'sermon_audio' | 'sermon_video' | 'event';
  label?: string;
}

const CONFIG: Record<MediaType, {
  accept: string; maxMB: number; icon: typeof Music; color: string; label: string;
}> = {
  audio: {
    accept: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac',
    maxMB: 50,
    icon: Music,
    color: 'text-indigo-600',
    label: 'Upload Audio',
  },
  video: {
    accept: 'video/mp4,video/webm,video/quicktime',
    maxMB: 200,
    icon: Video,
    color: 'text-purple-600',
    label: 'Upload Video',
  },
};

export function MediaUploader({
  mediaType,
  currentUrl,
  onUploadComplete,
  purpose,
  label,
}: MediaUploaderProps) {
  const config   = CONFIG[mediaType];
  const Icon     = config.icon;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]           = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState<string | null>(currentUrl || null);

  const processFile = useCallback(async (file: File) => {
    if (!config.accept.includes(file.type)) {
      toast.error(`Unsupported type: ${file.type}`);
      return;
    }
    if (file.size > config.maxMB * 1024 * 1024) {
      toast.error(`File too large (max ${config.maxMB} MB)`);
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => resolve((r.result as string).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    setUploading(true);
    setDone(false);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: base64,
          mimeType: file.type,
          purpose: purpose || (mediaType === 'audio' ? 'sermon_audio' : 'sermon_video'),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setPreview(json.url);
      setDone(true);
      onUploadComplete(json.url);
      toast.success(`${mediaType === 'audio' ? 'Audio' : 'Video'} uploaded!`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [config, mediaType, purpose, onUploadComplete]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all
          ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
          ${uploading ? 'pointer-events-none' : ''}
        `}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className={`h-10 w-10 animate-spin ${config.color}`} />
        ) : done ? (
          <CheckCircle className="h-10 w-10 text-green-500" />
        ) : (
          <Icon className={`h-10 w-10 ${config.color}`} />
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading…' : done ? 'Uploaded!' : label || config.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {mediaType === 'audio' ? 'MP3, WAV, OGG, AAC' : 'MP4, WebM, MOV'} · max {config.maxMB} MB
          </p>
          <p className="text-xs text-gray-400">Drag &amp; drop or click to select</p>
        </div>
      </div>

      {/* Current / uploaded file preview */}
      {preview && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border text-sm text-gray-600">
          <Play className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="flex-1 truncate text-xs">{preview}</span>
          <button onClick={() => { setPreview(null); setDone(false); }} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {preview && mediaType === 'audio' && (
        <audio controls src={preview} className="w-full h-8 mt-1" />
      )}
      {preview && mediaType === 'video' && (
        <video controls src={preview} className="w-full rounded-lg mt-1 max-h-40" />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
