'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { SermonPlayer } from '@/components/features/SermonPlayer';
import {
  ChevronLeft, Download, BookOpen, Play, Clock, User,
  ListMusic, Share2, Heart, MessageCircle, ChevronDown, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Sermon {
  id: number;
  title: string;
  speaker: string;
  bible_passage?: string;
  series_title?: string;
  audio_url?: string;
  video_url?: string;
  date_preached: string;
  duration?: number;
  play_count?: number;
  sermon_notes?: string;
  description?: string;
  user_note?: string;
}

export default function SermonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    fetchSermon();
  }, [id]);

  const fetchSermon = async () => {
    try {
      const res = await fetch(`/api/sermons/${id}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.sermon || data;
        setSermon(s);
        setNote(s.user_note || '');
      } else {
        // Fallback: search in list
        const listRes = await fetch('/api/sermons');
        const listData = await listRes.json();
        const found = (listData.sermons || []).find((s: Sermon) => String(s.id) === String(id));
        if (found) {
          setSermon(found);
          setNote(found.user_note || '');
        }
      }
    } catch {
      toast.error('Failed to load sermon');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!sermon) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/sermons/${sermon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (res.ok) {
        toast.success('Note saved! ✅');
      }
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleShare = async () => {
    if (!sermon) return;
    const text = `Check out "${sermon.title}" by ${sermon.speaker} on BFF+!`;
    if (navigator.share) {
      await navigator.share({ title: sermon.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Sermon link copied!');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-16">
        <Play className="h-16 w-16 mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 font-medium">Sermon not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/sermons')}>
          Back to Sermons
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/sermons')} className="text-gray-600 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Sermons
      </Button>

      {/* Sermon Header */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-teal-500 to-blue-600" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              {sermon.series_title && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mb-2">
                  <ListMusic className="h-3.5 w-3.5" />
                  {sermon.series_title}
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-900 leading-snug mb-2">{sermon.title}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{sermon.speaker}</span>
                </div>
                {sermon.duration && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>{formatDuration(sermon.duration)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-gray-400" />
                  <span>{(sermon.play_count || 0).toLocaleString()} plays</span>
                </div>
              </div>
              {sermon.bible_passage && (
                <Badge className="mt-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  <BookOpen className="h-3 w-3 mr-1" />{sermon.bible_passage}
                </Badge>
              )}
            </div>
            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              🎵
            </div>
          </div>

          {/* Preached date */}
          <p className="text-xs text-gray-400 mb-4">
            Preached {format(new Date(sermon.date_preached), 'MMMM d, yyyy')}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={liked ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setLiked(!liked); if (!liked) toast.success('Added to favorites!'); }}
              className={liked ? 'bg-red-500 hover:bg-red-600 border-red-500' : ''}
            >
              <Heart className={`h-4 w-4 mr-1.5 ${liked ? 'fill-current' : ''}`} />
              {liked ? 'Favorited' : 'Favorite'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
            {sermon.audio_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={sermon.audio_url} download>
                  <Download className="h-4 w-4 mr-1.5" /> Download
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sermon Player */}
      {(sermon.audio_url || sermon.video_url) ? (
        <SermonPlayer sermon={sermon} />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center text-gray-400">
            <Play className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Audio coming soon</p>
            <p className="text-sm mt-1">Check back later for the sermon recording</p>
          </CardContent>
        </Card>
      )}

      {/* Sermon Description */}
      {sermon.description && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">About This Sermon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">{sermon.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sermon Notes */}
      <Card className="border-0 shadow-sm">
        <button
          className="w-full flex items-center justify-between p-4"
          onClick={() => setShowNotes(!showNotes)}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-gray-900 text-sm">My Sermon Notes</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
        </button>
        {showNotes && (
          <CardContent className="pt-0 pb-4 px-4">
            {sermon.sermon_notes && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-600 font-medium mb-1">Preacher's Notes</p>
                <p className="text-sm text-gray-700 leading-relaxed">{sermon.sermon_notes}</p>
              </div>
            )}
            <Textarea
              placeholder="Write your personal sermon notes here... What stood out to you? How will you apply this message?"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="mb-3 resize-none min-h-[120px]"
              rows={5}
            />
            <Button
              onClick={handleSaveNote}
              disabled={savingNote}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {savingNote ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              Save Notes
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
