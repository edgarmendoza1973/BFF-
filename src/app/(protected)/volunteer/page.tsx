'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, MapPin, Clock, Calendar, Users, Check, Loader2,
  Music, Heart, BookOpen, Video, Globe, Church, Star,
  HandHeart, ClipboardList, Plus, X, Timer
} from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';
import toast from 'react-hot-toast';

interface Opportunity {
  id: number;
  ministry_id: number;
  ministry_name?: string;
  ministry_category?: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  slots_total: number;
  slots_filled: number;
  location: string;
}

interface MySignup {
  id: number;
  opportunity_id: number;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  ministry_name?: string;
  ministry_category?: string;
  hours_logged: number;
  checked_in: number;
  signed_up_at: string;
}

function getCategoryIcon(cat?: string) {
  switch (cat) {
    case 'music':    return <Music className="h-4 w-4" />;
    case 'service':  return <Heart className="h-4 w-4" />;
    case 'education': return <BookOpen className="h-4 w-4" />;
    case 'media':    return <Video className="h-4 w-4" />;
    case 'outreach': return <Globe className="h-4 w-4" />;
    default:         return <Church className="h-4 w-4" />;
  }
}

function getCategoryEmoji(cat?: string) {
  switch (cat) {
    case 'music':    return '🎵';
    case 'service':  return '🤝';
    case 'education': return '📚';
    case 'media':    return '🎥';
    case 'outreach': return '🌍';
    default:         return '⛪';
  }
}

// ─── Hours Log Modal ──────────────────────────────────────────────────────────
function LogHoursModal({
  signup,
  onClose,
  onSaved,
}: {
  signup: MySignup;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [hours, setHours] = useState(signup.hours_logged?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const h = parseFloat(hours);
    if (!h || h <= 0 || h > 24) {
      toast.error('Enter a valid number of hours (0.5 – 24)');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/volunteer/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId: signup.id, hours: h }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`✅ ${h} hour${h !== 1 ? 's' : ''} logged! Faith points earned!`);
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to log hours. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-indigo-600" />
              Log Service Hours
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3">
            <p className="font-semibold text-sm text-gray-900">{signup.title}</p>
            <p className="text-xs text-gray-500 mt-1">
              {format(parseISO(signup.event_date), 'MMM d, yyyy')} · {signup.start_time}–{signup.end_time}
            </p>
          </div>

          <div>
            <Label htmlFor="hours" className="text-sm font-medium">Hours Served</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                id="hours"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                placeholder="e.g. 3"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="text-center text-xl font-bold"
              />
              <span className="text-gray-500 text-sm font-medium whitespace-nowrap">hrs</span>
            </div>
          </div>

          {/* Quick select buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(h => (
              <button
                key={h}
                onClick={() => setHours(h.toString())}
                className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                  hours === h.toString()
                    ? 'border-indigo-500 bg-indigo-100 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-700 font-medium">
              🌟 You earn <strong>50 Faith Points</strong> per service hour logged!
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSave}
              disabled={!hours || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Hours'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────
function OpportunityCard({
  opp,
  isSigned,
  isSigning,
  onSignup,
}: {
  opp: Opportunity;
  isSigned: boolean;
  isSigning: boolean;
  onSignup: (id: number) => void;
}) {
  const filled  = opp.slots_filled || 0;
  const total   = opp.slots_total  || 1;
  const pct     = Math.round((filled / total) * 100);
  const isFull  = filled >= total;
  const isUpcoming = opp.event_date ? isFuture(parseISO(opp.event_date)) : true;

  return (
    <Card className={`border-l-4 transition-shadow hover:shadow-md ${
      isSigned ? 'border-l-green-500' : 'border-l-indigo-300'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">
            {getCategoryEmoji(opp.ministry_category)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{opp.title}</h3>
              {isSigned && (
                <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0 text-xs">
                  <Check className="h-2.5 w-2.5 mr-1" /> Signed Up
                </Badge>
              )}
            </div>

            {opp.ministry_name && (
              <Badge variant="outline" className="text-xs mt-1 mb-2">
                {getCategoryIcon(opp.ministry_category)}
                <span className="ml-1">{opp.ministry_name}</span>
              </Badge>
            )}

            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{opp.description}</p>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
              {opp.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(opp.event_date), 'EEE, MMM d')}
                </span>
              )}
              {(opp.start_time || opp.end_time) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {opp.start_time}–{opp.end_time}
                </span>
              )}
              {opp.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {opp.location}
                </span>
              )}
            </div>

            {/* Capacity bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {filled} / {total} spots filled
                </span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>

            <Button
              size="sm"
              variant={isSigned ? 'outline' : 'default'}
              className={isSigned ? 'text-green-700 border-green-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
              disabled={(!isUpcoming && !isSigned) || (isFull && !isSigned) || isSigning}
              onClick={() => !isSigned && onSignup(opp.id)}
            >
              {isSigning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isSigned ? (
                <><Check className="h-3.5 w-3.5 mr-1" /> Signed Up</>
              ) : isFull ? (
                'Full'
              ) : (
                <><Plus className="h-3.5 w-3.5 mr-1" /> Sign Up</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VolunteerPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [mySignups, setMySignups] = useState<MySignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [signingId, setSigningId] = useState<number | null>(null);
  const [logHoursFor, setLogHoursFor] = useState<MySignup | null>(null);

  const loadData = async () => {
    try {
      const [opsRes, signupsRes] = await Promise.all([
        fetch('/api/volunteer/opportunities'),
        fetch('/api/volunteer/signups'),
      ]);
      const opsData     = await opsRes.json();
      const signupsData = await signupsRes.json();
      setOpportunities(opsData.opportunities || []);
      setMySignups(signupsData.signups || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSignup = async (id: number) => {
    setSigningId(id);
    try {
      const res = await fetch(`/api/volunteer/signup/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      toast.success('🙌 Signed up successfully! God bless your service!');
      await loadData();
    } catch {
      toast.error('Could not sign up. Please try again.');
    } finally {
      setSigningId(null);
    }
  };

  const signedUpIds = new Set(mySignups.map(s => s.opportunity_id));
  const totalHours  = mySignups.reduce((sum, s) => sum + (s.hours_logged || 0), 0);

  const filteredOps = opportunities.filter(op =>
    op.title.toLowerCase().includes(search.toLowerCase()) ||
    op.description?.toLowerCase().includes(search.toLowerCase()) ||
    op.ministry_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HandHeart className="h-6 w-6 text-indigo-600" />
            Volunteer
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Serve with purpose, grow in faith</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-indigo-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-indigo-700">{mySignups.length}</p>
            <p className="text-xs text-indigo-500">Signups</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-amber-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{totalHours}</p>
            <p className="text-xs text-amber-500">Hours Served</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{totalHours * 50}</p>
            <p className="text-xs text-green-500">Faith Points</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="available">
            Available ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="my-service">
            My Service ({mySignups.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Opportunities */}
        <TabsContent value="available" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search opportunities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))
          ) : filteredOps.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Church className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No opportunities found</p>
              <p className="text-sm">Check back soon for new ways to serve!</p>
            </div>
          ) : (
            filteredOps.map(op => (
              <OpportunityCard
                key={op.id}
                opp={op}
                isSigned={signedUpIds.has(op.id)}
                isSigning={signingId === op.id}
                onSignup={handleSignup}
              />
            ))
          )}
        </TabsContent>

        {/* My Service */}
        <TabsContent value="my-service" className="space-y-4 mt-4">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          ) : mySignups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No service yet</p>
              <p className="text-sm">Sign up for a volunteer opportunity to get started!</p>
            </div>
          ) : (
            <>
              {/* Total summary */}
              <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-200 text-sm">Total Service Hours</p>
                      <p className="text-4xl font-bold">{totalHours}h</p>
                      <p className="text-indigo-200 text-xs mt-1">
                        = {totalHours * 50} Faith Points earned
                      </p>
                    </div>
                    <div className="text-6xl opacity-30">🙏</div>
                  </div>
                </CardContent>
              </Card>

              {mySignups.map(signup => (
                <Card key={signup.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getCategoryEmoji(signup.ministry_category)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-gray-900">{signup.title}</h3>
                          {signup.hours_logged > 0 ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs shrink-0">
                              {signup.hours_logged}h logged
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs shrink-0">Pending</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(parseISO(signup.event_date), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {signup.start_time}–{signup.end_time}
                          </span>
                          {signup.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {signup.location}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                          onClick={() => setLogHoursFor(signup)}
                        >
                          <Timer className="h-3.5 w-3.5 mr-1.5" />
                          {signup.hours_logged > 0 ? 'Update Hours' : 'Log Hours'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Hours Modal */}
      {logHoursFor && (
        <LogHoursModal
          signup={logHoursFor}
          onClose={() => setLogHoursFor(null)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
