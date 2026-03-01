"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { QRGenerator } from '@/components/features/QRGenerator';
import { QRScanner } from '@/components/features/QRScanner';
import { Calendar, MapPin, Users, Search, Plus, QrCode, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
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
}

export default function EventsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const canCreate = ['leader', 'pastor', 'admin'].includes(user?.role);

  const [events, setEvents]           = useState<Event[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [rsvped, setRsvped]           = useState<Set<number>>(new Set());
  const [qrEvent, setQrEvent]         = useState<Event | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [checkinEvent, setCheckinEvent] = useState<Event | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [creating, setCreating]       = useState(false);
  const [form, setForm]               = useState({
    title: '', description: '', event_date: '', location: '', audience_type: 'all', max_attendees: '',
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleRSVP = async (eventId: number) => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: rsvped.has(eventId) ? 'no' : 'yes' }),
      });
      if (res.ok) {
        setRsvped(prev => {
          const n = new Set(prev);
          if (n.has(eventId)) n.delete(eventId); else n.add(eventId);
          return n;
        });
        toast.success(rsvped.has(eventId) ? 'RSVP cancelled' : "You're registered! 🎉");
        fetchEvents();
      }
    } catch { toast.error('Failed to RSVP'); }
  };

  const handleQRScan = async (result: string, event: Event) => {
    try {
      const res = await fetch(`/api/events/${event.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: result }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Checked in!');
        setShowScanner(false);
        setCheckinEvent(null);
      } else {
        toast.error(data.error || 'Check-in failed');
      }
    } catch { toast.error('Check-in failed'); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.event_date) { toast.error('Title and date are required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null }),
      });
      const data = await res.json();
      if (res.ok) { toast.success('Event created!'); setShowCreate(false); setForm({ title: '', description: '', event_date: '', location: '', audience_type: 'all', max_attendees: '' }); fetchEvents(); }
      else toast.error(data.error || 'Failed to create event');
    } catch { toast.error('Failed to create event'); }
    finally { setCreating(false); }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );
  const upcoming = filtered.filter(e => new Date(e.event_date) >= new Date());
  const past     = filtered.filter(e => new Date(e.event_date) < new Date());

  const EventCard = ({ event }: { event: Event }) => {
    const isPast = new Date(event.event_date) < new Date();
    const isGoing = rsvped.has(event.id);
    const qrToken = `bff-event-${event.id}-checkin`;

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center relative">
          <span className="text-white text-4xl">📅</span>
          {!isPast && canCreate && (
            <button
              onClick={() => setQrEvent(event)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1"
            >
              <QrCode className="h-3 w-3" /> QR
            </button>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{event.description}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}</span>
                {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.rsvp_count} going</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {!isPast && (
              <Button
                size="sm"
                variant={isGoing ? 'outline' : 'default'}
                className={isGoing ? 'text-green-600 border-green-200' : 'bg-indigo-600 hover:bg-indigo-700'}
                onClick={() => handleRSVP(event.id)}
              >
                {isGoing ? <><CheckCircle className="h-3.5 w-3.5 mr-1" />Going</> : 'RSVP'}
              </Button>
            )}
            {isGoing && !isPast && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setCheckinEvent(event); setShowScanner(true); }}
              >
                <QrCode className="h-3.5 w-3.5 mr-1" />Check In
              </Button>
            )}
            {isPast && <Badge variant="outline" className="text-gray-400">Past Event</Badge>}
            <Link href={`/events/${event.id}`} className="ml-auto">
              <Button size="sm" variant="ghost" className="text-indigo-600 text-xs">Details →</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500">Church events & gatherings</p>
          </div>
        </div>
        {canCreate && (
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search events..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past" className="flex-1">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="h-14 w-14 mx-auto mb-3 text-gray-200" />
              <p>No upcoming events</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {upcoming.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><p>No past events</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {past.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      <Dialog open={!!qrEvent} onOpenChange={() => setQrEvent(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Check-in Code</DialogTitle>
          </DialogHeader>
          {qrEvent && (
            <div className="flex flex-col items-center gap-4 py-2">
              <QRGenerator
                value={`bff-event-${qrEvent.id}-checkin`}
                size={220}
                label={qrEvent.title}
              />
              <p className="text-xs text-gray-500 text-center">Display this QR code at the event entrance for attendees to scan and check in</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Scanner Modal */}
      <Dialog open={showScanner} onOpenChange={() => { setShowScanner(false); setCheckinEvent(null); }}>
        <DialogContent className="sm:max-w-sm p-4">
          <DialogHeader>
            <DialogTitle>Scan QR to Check In{checkinEvent ? ` — ${checkinEvent.title}` : ''}</DialogTitle>
          </DialogHeader>
          {checkinEvent && (
            <QRScanner
              onScan={result => handleQRScan(result, checkinEvent)}
              onClose={() => { setShowScanner(false); setCheckinEvent(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What's this event about?" className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date & Time *</Label>
                <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Venue or link" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <select value={form.audience_type} onChange={e => setForm(f => ({ ...f, audience_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  {['all', 'men', 'women', 'youth', 'leaders'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Max Attendees</Label>
                <Input type="number" value={form.max_attendees} onChange={e => setForm(f => ({ ...f, max_attendees: e.target.value }))} placeholder="Unlimited" min="1" />
              </div>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
