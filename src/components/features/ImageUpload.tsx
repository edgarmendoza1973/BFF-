'use client';
import { useRef, useState, useCallback } from 'react';
import { Upload, X, Camera, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
  purpose?: 'avatar' | 'event' | 'group' | 'sermon_audio' | 'sermon_video';
  accept?: string;
  maxMB?: number;
  label?: string;
  shape?: 'circle' | 'square';
}

export function ImageUpload({
  currentUrl,
  onUploadComplete,
  purpose = 'avatar',
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxMB = 5,
  label = 'Change Photo',
  shape = 'circle',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    // Type check
    const allowed = accept.split(',').map(a => a.trim());
    if (!allowed.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}`);
      return;
    }
    // Size check
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`File too large (max ${maxMB} MB)`);
      return;
    }

    // Build preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Convert to base64 for upload
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    setUploading(true);
    setDone(false);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: base64, mimeType: file.type, purpose }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setDone(true);
      onUploadComplete(json.url);
      toast.success('Photo uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  }, [accept, maxMB, purpose, onUploadComplete, currentUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const isCircle = shape === 'circle';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview / Drop zone */}
      <div
        className={`relative group cursor-pointer transition-all
          ${isCircle ? 'h-24 w-24 rounded-full' : 'h-32 w-48 rounded-xl'}
          ${dragOver ? 'ring-4 ring-indigo-400 ring-offset-2' : ''}
          bg-gray-100 overflow-hidden flex items-center justify-center
        `}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className={`w-full h-full object-cover ${isCircle ? 'rounded-full' : 'rounded-xl'}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <Upload className="h-8 w-8" />
            <span className="text-[10px] text-center leading-tight">Drop here or click</span>
          </div>
        )}

        {/* Hover overlay */}
        {!uploading && (
          <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${isCircle ? 'rounded-full' : 'rounded-xl'}`}>
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Upload spinner */}
        {uploading && (
          <div className={`absolute inset-0 bg-white/80 flex items-center justify-center ${isCircle ? 'rounded-full' : 'rounded-xl'}`}>
            <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Done tick */}
        {done && !uploading && (
          <div className="absolute bottom-1 right-1">
            <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
          </div>
        )}

        {/* Clear button */}
        {preview && !uploading && (
          <button
            className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); setPreview(null); setDone(false); }}
          >
            <X className="h-3 w-3 text-white" />
          </button>
        )}
      </div>

      {/* Label button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs h-7"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading…</>
        ) : (
          <><Upload className="h-3 w-3 mr-1" />{label}</>
        )}
      </Button>

      <p className="text-[10px] text-gray-400">
        {accept.includes('image') ? 'JPG, PNG, WebP' : accept.split(',').join(', ')} · max {maxMB} MB
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
