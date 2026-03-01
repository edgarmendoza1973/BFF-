"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SermonPlayer } from '@/components/features/SermonPlayer';
import { Search, Play, Clock, User, BookOpen, ListMusic } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Sermon {
  id: number;
  title: string;
  speaker: string;
  bible_passage: string;
  audio_url: string;
  video_url: string;
  date_preached: string;
  duration: number;
  play_count: number;
  series_title?: string;
  sermon_notes?: string;
}

function formatDuration(seconds: number) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SermonsPage() {
  const [sermons, setSermons]   = useState<Sermon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [nowPlaying, setNowPlaying] = useState<Sermon | null>(null);
  const [notes, setNotes]       = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => { fetchSermons(); }, []);

  const fetchSermons = async () => {
    try {
      const res = await fetch('/api/sermons');
      const data = await res.json();
      setSermons(data.sermons || []);
    } catch { toast.error('Failed to load sermons'); }
    finally { setLoading(false); }
  };

  const handlePlay = (sermon: Sermon) => {
    setNowPlaying(sermon);
    setNotes('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveNote = async () => {
    if (!notes.trim() || !nowPlaying) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/sermons/${nowPlaying.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: notes }),
      });
      if (res.ok) toast.success('Note saved!');
    } catch { toast.error('Failed to save note'); }
    finally { setSavingNote(false); }
  };

  const nowIdx = sermons.findIndex(s => s.id === nowPlaying?.id);
  const filtered = sermons.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.speaker?.toLowerCase().includes(search.toLowerCase()) ||
    s.bible_passage?.toLowerCase().includes(search.toLowerCase())
  );

  const SermonCard = ({ sermon }: { sermon: Sermon }) => (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer ${nowPlaying?.id === sermon.id ? 'ring-2 ring-indigo-500' : ''}`}
      onClick={() => handlePlay(sermon)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${nowPlaying?.id === sermon.id ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
            <Play className="h-6 w-6 text-white fill-white ml-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{sermon.title}</h3>
                {sermon.series_title && <p className="text-xs text-indigo-600 mt-0.5">{sermon.series_title}</p>}
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" />{sermon.speaker}
                </p>
              </div>
              <div className="text-right shrink-0">
                {sermon.duration > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />{formatDuration(sermon.duration)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {sermon.bible_passage && (
                <Badge variant="outline" className="text-xs py-0 gap-1">
                  <BookOpen className="h-2.5 w-2.5" />{sermon.bible_passage}
                </Badge>
              )}
              <span className="text-xs text-gray-400">
                {sermon.date_preached ? format(new Date(sermon.date_preached), 'MMM d, yyyy') : ''}
              </span>
              {sermon.play_count > 0 && (
                <span className="text-xs text-gray-400">{sermon.play_count} plays</span>
              )}
              <Link href={`/sermons/${sermon.id}`} onClick={e => e.stopPropagation()} className="ml-auto">
                <span className="text-xs text-indigo-600 hover:underline">Details →</span>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5">
      <div className="flex items-center gap-3">
        <ListMusic className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sermon Library</h1>
          <p className="text-sm text-gray-500">Listen, watch, and take notes</p>
        </div>
      </div>

      {/* Now Playing */}
      {nowPlaying && (
        <div className="space-y-3">
          <SermonPlayer
            sermon={nowPlaying}
            onClose={() => setNowPlaying(null)}
            onPrev={nowIdx > 0 ? () => setNowPlaying(sermons[nowIdx - 1]) : undefined}
            onNext={nowIdx < sermons.length - 1 ? () => setNowPlaying(sermons[nowIdx + 1]) : undefined}
          />
          {/* Sermon Notes */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700">My Notes</p>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Write your sermon notes here..."
                className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Button size="sm" onClick={handleSaveNote} disabled={!notes.trim() || savingNote}>
                Save Note
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search sermons, speakers, passages..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Sermon list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ListMusic className="h-14 w-14 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No sermons found</p>
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => <SermonCard key={s.id} sermon={s} />)}
        </div>
      )}
    </div>
  );
}
