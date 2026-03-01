'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users, Calendar, Plus, Search, MessageCircle,
  BookOpen, Heart, ChevronRight, Flame, Star, ArrowRight
} from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useSession as useNextSession } from 'next-auth/react';
import { toast } from 'sonner';

interface FeedItem {
  id: number;
  type: 'soap' | 'prayer' | 'event' | 'group_join' | 'badge' | 'milestone';
  user_name: string;
  user_id: string;
  content: string;
  meta?: any;
  created_at: string;
  likes?: number;
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const canCreate = ['leader', 'pastor', 'admin'].includes(user?.role);

  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eventsRes, groupsRes, prayerRes] = await Promise.all([
        fetch('/api/events?upcoming=true'),
        fetch('/api/groups'),
        fetch('/api/prayer?public=true'),
      ]);
      const eventsData = await eventsRes.json();
      const groupsData = await groupsRes.json();
      const prayerData = await prayerRes.json();

      const eventsArr = eventsData.events || [];
      const groupsArr = groupsData.groups || [];
      const prayersArr = prayerData.prayers || [];

      setEvents(eventsArr);
      setGroups(groupsArr);
      setPrayers(prayersArr);

      // Build synthetic community feed from real data
      const feedItems: FeedItem[] = [];

      // Add public prayers to feed
      prayersArr.slice(0, 8).forEach((p: any) => {
        feedItems.push({
          id: p.id,
          type: 'prayer',
          user_name: p.author_name || 'Anonymous',
          user_id: p.user_id || '',
          content: p.request,
          created_at: p.created_at,
          likes: p.prayer_count || 0,
        });
      });

      // Sort by date desc
      feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFeed(feedItems);
    } catch {
      console.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  }

  async function handleRSVP(eventId: number, currentRsvp: string | null) {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: currentRsvp === 'yes' ? 'no' : 'yes' }),
      });
      const data = await res.json();
      toast.success(data.action === 'cancelled' ? 'RSVP cancelled' : '✅ RSVP confirmed!');
      loadData();
    } catch { toast.error('Failed to RSVP'); }
  }

  async function handleJoinGroup(groupId: number) {
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to join'); return; }
      toast.success('🎉 Joined group!');
      loadData();
    } catch { toast.error('Failed to join group'); }
  }

  async function handlePrayForRequest(prayerId: number) {
    try {
      await fetch(`/api/prayer/${prayerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pray' }),
      });
      toast.success('🙏 Prayer sent!');
      loadData();
    } catch { toast.error('Failed to send prayer'); }
  }

  const filteredEvents = events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  const categoryEmoji: Record<string, string> = {
    'bible-study': '📖', prayer: '🙏', mens: '👨', womens: '👩',
    youth: '👦', general: '👥', worship: '🎵', outreach: '🌍',
  };

  const FeedCard = ({ item }: { item: FeedItem }) => {
    const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
      prayer: { icon: '🙏', color: 'bg-red-100', label: 'Prayer Request' },
      soap: { icon: '✍️', color: 'bg-purple-100', label: 'SOAP Journal' },
      event: { icon: '📅', color: 'bg-green-100', label: 'Event Update' },
      badge: { icon: '🏆', color: 'bg-amber-100', label: 'Badge Earned' },
      milestone: { icon: '⭐', color: 'bg-indigo-100', label: 'Milestone' },
    };
    const config = typeConfig[item.type] || typeConfig.prayer;

    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                {getInitials(item.user_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm text-gray-900">{item.user_name}</span>
                <Badge className={`text-xs ${config.color} text-gray-700 border-0`}>
                  {config.icon} {config.label}
                </Badge>
                <span className="text-xs text-gray-400 ml-auto">{formatRelativeTime(item.created_at)}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{item.content}</p>
              {item.type === 'prayer' && (
                <button
                  onClick={() => handlePrayForRequest(item.id)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 mt-2 font-medium"
                >
                  🙏 Pray for this ({item.likes || 0})
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-sm text-gray-500">Connect, grow, and serve together</p>
        </div>
        {canCreate && (
          <Link href="/events">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-1.5" /> Create Event
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Events', value: events.length, icon: '📅', href: '/events' },
          { label: 'Groups', value: groups.length, icon: '👥', href: '/groups' },
          { label: 'Prayers', value: prayers.length, icon: '🙏', href: '/prayer-list' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3 text-center">
                <div className="text-xl mb-0.5">{stat.icon}</div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events & groups..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <Tabs defaultValue="feed">
        <TabsList className="w-full">
          <TabsTrigger value="feed" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-1.5" /> Feed
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1">
            <Calendar className="h-4 w-4 mr-1.5" /> Events ({filteredEvents.length})
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1">
            <Users className="h-4 w-4 mr-1.5" /> Groups ({filteredGroups.length})
          </TabsTrigger>
        </TabsList>

        {/* Community Feed */}
        <TabsContent value="feed" className="mt-4 space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
          ) : feed.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-400">
                <Heart className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                <p className="font-medium text-gray-500">Community feed is quiet</p>
                <p className="text-sm mt-1">Be the first to share a prayer or journal entry!</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Link href="/prayer-list">
                    <Button size="sm" variant="outline">🙏 Add Prayer</Button>
                  </Link>
                  <Link href="/soap-journal">
                    <Button size="sm" variant="outline">✍️ Write Journal</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {feed.map(item => <FeedCard key={`${item.type}-${item.id}`} item={item} />)}
              <div className="text-center pt-2">
                <Link href="/prayer-list">
                  <Button variant="outline" size="sm" className="text-indigo-600">
                    View All Prayer Requests <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4 space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p>No upcoming events</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-indigo-700">{new Date(event.event_date).getDate()}</span>
                      <span className="text-xs text-indigo-500">{new Date(event.event_date).toLocaleString('en', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                        {event.location && <span>📍 {event.location}</span>}
                        <span>👥 {event.rsvp_count} going</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleRSVP(event.id, event.user_rsvp)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                          event.user_rsvp === 'yes'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {event.user_rsvp === 'yes' ? '✓ Going' : 'RSVP'}
                      </button>
                      <Link href={`/events/${event.id}`}>
                        <button className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 w-full text-center">
                          Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <div className="text-center">
            <Link href="/events">
              <Button variant="outline" size="sm" className="text-indigo-600">
                View All Events <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-4 space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p>No groups found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {categoryEmoji[group.category] || '👥'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm">{group.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{group.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">{group.member_count} members</span>
                            <div className="flex gap-1.5">
                              <Link href={`/groups/${group.id}`}>
                                <button className="text-xs border border-gray-200 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                                  View
                                </button>
                              </Link>
                              {!group.is_member && (
                                <button
                                  onClick={() => handleJoinGroup(group.id)}
                                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                >
                                  Join
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center">
                <Link href="/groups">
                  <Button variant="outline" size="sm" className="text-indigo-600">
                    View All Groups <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
