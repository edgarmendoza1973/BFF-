'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { QRGenerator } from '@/components/features/QRGenerator';
import { QRScanner } from '@/components/features/QRScanner';
import {
  Calendar, MapPin, Users, Clock, ChevronLeft,
  QrCode, CheckCircle, Share2, ArrowRight, User
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  audience_type: string;
  rsvp_count: number;
  max_attendees?: number;
  created_by: string;
  creator_name?: string;
  user_rsvp?: string;
  attendees?: { user_id: string; name: string; response: string }[];
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const canManage = ['leader', 'pastor', 'admin'].includes(user?.role);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events?id=${id}`);
      const data = await res.json();
      const events = data.events || [];
      const found = events.find((e: Event) => String(e.id) === String(id));
      if (found) {
        setEvent(found);
      } else {
        // Try direct fetch
        const res2 = await fetch(`/api/events/${id}`);
        if (res2.ok) {
          const d2 = await res2.json();
          setEvent(d2.event || d2);
        }
      }
    } catch {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!event) return;
    setRsvping(true);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: event.user_rsvp === 'yes' ? 'no' : 'yes' }),
      });
      if (res.ok) {
        toast.success(event.user_rsvp === 'yes' ? 'RSVP cancelled' : '✅ RSVP confirmed!');
        fetchEvent();
      }
    } catch {
      toast.error('Failed to update RSVP');
    } finally {
      setRsvping(false);
    }
  };

  const handleQRScan = async (data: string) => {
    try {
      // Support two QR formats:
      // 1. New: "bff-event-{eventId}" token string
      // 2. Legacy: JSON { eventId, title }
      let token = data;
      let targetEventId = id; // default to current page event

      if (data.startsWith('{')) {
        // Legacy JSON format — parse and build token
        const parsed = JSON.parse(data);
        targetEventId = String(parsed.eventId || parsed.id || id);
        token = `bff-event-${targetEventId}`;
      } else if (data.startsWith('bff-event-')) {
        // New token format — extract eventId
        const parts = data.split('-'); // ['bff', 'event', '{id}', ...]
        targetEventId = parts[2] || id;
        token = data;
      }

      const res = await fetch(`/api/events/${targetEventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const resData = await res.json();
      if (res.ok) {
        if (resData.already) {
          toast('Already checked in ✓', { icon: 'ℹ️' });
        } else {
          toast.success(`✅ ${resData.message || 'Check-in successful!'}`);
        }
        setShowScanner(false);
        fetchEvent();
      } else {
        toast.error(resData.error || 'Check-in failed');
      }
    } catch {
      toast.error('Invalid QR code');
    }
  };

  const handleShare = async () => {
    if (!event) return;
    const text = `Join me at "${event.title}" on ${format(new Date(event.event_date), 'EEEE, MMMM d')} at ${event.location}!`;
    if (navigator.share) {
      await navigator.share({ title: event.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Event details copied!');
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

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-16">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 font-medium">Event not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/events')}>
          Back to Events
        </Button>
      </div>
    );
  }

  const isPastEvent = isPast(new Date(event.event_date));
  // QR value uses the token format the check-in API validates: "bff-event-{id}"
  // (still embed title for display, but token string is primary)
  const qrValue = `bff-event-${event.id}`;
  const isCreator = event.created_by === user?.id || canManage;
  const capacityPct = event.max_attendees ? Math.round((event.rsvp_count / event.max_attendees) * 100) : null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/events')} className="text-gray-600 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Events
      </Button>

      {/* Event Header */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              {isPastEvent && <Badge variant="secondary" className="mb-2 text-xs">Past Event</Badge>}
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              {event.creator_name && (
                <p className="text-sm text-gray-500 mt-1">Organized by {event.creator_name}</p>
              )}
            </div>
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-700">{new Date(event.event_date).getDate()}</span>
              <span className="text-xs text-indigo-500 uppercase">{format(new Date(event.event_date), 'MMM')}</span>
            </div>
          </div>

          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy · h:mm a')}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Users className="h-4 w-4 text-green-500 shrink-0" />
              <span>
                {event.rsvp_count} {event.rsvp_count === 1 ? 'person' : 'people'} going
                {event.max_attendees && ` · ${event.max_attendees - event.rsvp_count} spots left`}
              </span>
            </div>
          </div>

          {/* Capacity bar */}
          {capacityPct !== null && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Capacity</span>
                <span>{event.rsvp_count}/{event.max_attendees}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${capacityPct >= 90 ? 'bg-red-400' : capacityPct >= 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${Math.min(capacityPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!isPastEvent && (
              <Button
                onClick={handleRSVP}
                disabled={rsvping || (!!event.max_attendees && event.rsvp_count >= event.max_attendees && event.user_rsvp !== 'yes')}
                className={event.user_rsvp === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}
              >
                {rsvping ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : event.user_rsvp === 'yes' ? (
                  <><CheckCircle className="h-4 w-4 mr-1.5" /> Going!</>
                ) : (
                  <><Calendar className="h-4 w-4 mr-1.5" /> RSVP</>
                )}
              </Button>
            )}
            {isCreator && (
              <Button variant="outline" onClick={() => setShowQR(true)}>
                <QrCode className="h-4 w-4 mr-1.5" /> QR Code
              </Button>
            )}
            {!isPastEvent && (
              <Button variant="outline" onClick={() => setShowScanner(true)}>
                <CheckCircle className="h-4 w-4 mr-1.5" /> Check In
              </Button>
            )}
            <Button variant="ghost" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {event.description && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">About This Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Attendee list preview */}
      {event.attendees && event.attendees.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attendees ({event.rsvp_count})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {event.attendees.slice(0, 10).map(a => (
                <div key={a.user_id} className="flex items-center gap-1.5 bg-gray-50 rounded-full pl-1 pr-3 py-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-indigo-100 text-indigo-600">{getInitials(a.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-700">{a.name}</span>
                </div>
              ))}
              {event.rsvp_count > 10 && (
                <div className="flex items-center gap-1.5 bg-indigo-50 rounded-full px-3 py-1">
                  <span className="text-xs text-indigo-600 font-medium">+{event.rsvp_count - 10} more</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 gap-4">
            <p className="text-sm text-gray-500 text-center">
              Display this QR code at the event entrance for easy check-in
            </p>
            <QRGenerator value={qrValue} size={220} label={event.title} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Check-in Scanner</DialogTitle>
          </DialogHeader>
          <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
