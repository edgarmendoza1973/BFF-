'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Download, X, ChevronLeft } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface Sermon {
  id: number;
  title: string;
  speaker: string;
  bible_passage?: string;
  audio_url?: string;
  video_url?: string;
  duration?: number;
  series_title?: string;
}

interface SermonPlayerProps {
  sermon: Sermon;
  onClose?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

function formatTime(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function SermonPlayer({ sermon, onClose, onNext, onPrev }: SermonPlayerProps) {
  const audioRef              = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [isMuted, setIsMuted]         = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(sermon.duration || 0);
  const [volume, setVolume]           = useState(1);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [playTracked, setPlayTracked] = useState(false);

  // Track play on server
  const trackPlay = useCallback(async () => {
    if (playTracked) return;
    setPlayTracked(true);
    try {
      await fetch(`/api/sermons/${sermon.id}/play`, { method: 'POST' });
    } catch {}
  }, [sermon.id, playTracked]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    const onError = () => setError('Could not load audio. Check your internet connection.');
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        trackPlay();
      } catch (e) {
        setError('Playback failed. Audio may not be available.');
      }
    }
  };

  const handleSeek = (val: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = val[0];
    setCurrentTime(val[0]);
  };

  const handleVolume = (val: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = val[0];
    setVolume(val[0]);
    setIsMuted(val[0] === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasAudio = !!sermon.audio_url;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Hidden audio element */}
      {hasAudio && (
        <audio ref={audioRef} src={sermon.audio_url} preload="metadata" />
      )}

      {/* Video player if available */}
      {sermon.video_url && (
        <div className="aspect-video bg-black">
          <video
            className="w-full h-full"
            src={sermon.video_url}
            controls
            poster=""
            onPlay={() => { setIsPlaying(true); trackPlay(); }}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      )}

      {/* Player UI */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{sermon.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{sermon.speaker}</p>
            {sermon.series_title && (
              <p className="text-xs text-indigo-600 mt-0.5">{sermon.series_title}</p>
            )}
            {sermon.bible_passage && (
              <p className="text-xs text-gray-400 mt-0.5">📖 {sermon.bible_passage}</p>
            )}
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 shrink-0 ml-2">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
        )}

        {/* Album art / placeholder */}
        {!sermon.video_url && (
          <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-5">
            <div className="text-center text-white">
              <div className="text-5xl mb-2">🎵</div>
              <p className="text-sm opacity-80">Audio Sermon</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1 mb-4">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={!hasAudio}
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={toggleMute} className="p-2 text-gray-500 hover:text-gray-700">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="w-20">
              <Slider value={[isMuted ? 0 : volume]} min={0} max={1} step={0.05} onValueChange={handleVolume} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrev && (
              <button onClick={onPrev} className="p-2 text-gray-500 hover:text-gray-700">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <button onClick={() => skip(-10)} className="p-2 text-gray-500 hover:text-gray-700 text-xs font-medium">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!hasAudio || loading}
              className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center text-white shadow-md transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6 fill-white" />
              ) : (
                <Play className="h-6 w-6 fill-white ml-0.5" />
              )}
            </button>
            <button onClick={() => skip(10)} className="p-2 text-gray-500 hover:text-gray-700">
              <SkipForward className="h-5 w-5" />
            </button>
            {onNext && (
              <button onClick={onNext} className="p-2 text-gray-500 hover:text-gray-700">
                <SkipForward className="h-5 w-5" />
              </button>
            )}
          </div>

          {sermon.audio_url && (
            <a
              href={sermon.audio_url}
              download
              className="p-2 text-gray-500 hover:text-gray-700"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
        </div>

        {!hasAudio && !sermon.video_url && (
          <p className="text-center text-xs text-gray-400 mt-3">Audio not yet available for this sermon</p>
        )}
      </div>
    </div>
  );
}
