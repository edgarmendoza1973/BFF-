"use client";
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, MessageCircle, Calendar, Users, Heart, Play,
  Star, Bell, ChevronRight, Flame, Award, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const LEVEL_CONFIG: Record<string, { label: string; color: string; next: string; minPts: number; maxPts: number }> = {
  new_member:   { label: 'New Member',   color: 'text-gray-500',   next: 'Growing',      minPts: 0,    maxPts: 100  },
  growing:      { label: 'Growing',      color: 'text-green-600',  next: 'Established',  minPts: 100,  maxPts: 300  },
  established:  { label: 'Established',  color: 'text-blue-600',   next: 'Leader Track', minPts: 300,  maxPts: 700  },
  leader_track: { label: 'Leader Track', color: 'text-purple-600', next: 'Shepherd',     minPts: 700,  maxPts: 1500 },
  shepherd:     { label: 'Shepherd',     color: 'text-amber-600',  next: 'Max Level',    minPts: 1500, maxPts: 3000 },
};

const QUICK_LINKS = [
  { href: '/bible',        icon: BookOpen,      label: 'Bible',     color: 'bg-indigo-100 text-indigo-600' },
  { href: '/chat',         icon: MessageCircle, label: 'Chat',      color: 'bg-blue-100 text-blue-600'    },
  { href: '/soap-journal', icon: BookOpen,      label: 'Journal',   color: 'bg-purple-100 text-purple-600'},
  { href: '/events',       icon: Calendar,      label: 'Events',    color: 'bg-green-100 text-green-600'  },
  { href: '/groups',       icon: Users,         label: 'Groups',    color: 'bg-amber-100 text-amber-600'  },
  { href: '/prayer-list',  icon: Heart,         label: 'Prayer',    color: 'bg-red-100 text-red-600'      },
  { href: '/sermons',      icon: Play,          label: 'Sermons',   color: 'bg-teal-100 text-teal-600'    },
  { href: '/giving',       icon: Star,          label: 'Give',      color: 'bg-pink-100 text-pink-600'    },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user as any;

  useEffect(() => {
    if (session?.user) {
      Promise.all([
        fetch('/api/events').then(r => r.json()).then(d => setEvents(d.events?.slice(0, 3) || [])),
        fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications?.slice(0, 5) || [])),
        fetch('/api/user/profile').then(r => r.json()).then(d => setProfile(d.profile)),
      ]).finally(() => setLoading(false));
    }
  }, [session]);

  const memberLevel = profile?.member_level || user?.memberLevel || 'new_member';
  const faithPoints = profile?.faith_points ?? user?.faithPoints ?? 0;
  const level = LEVEL_CONFIG[memberLevel] || LEVEL_CONFIG.new_member;
  const levelProgress = level ? Math.min(((faithPoints - level.minPts) / (level.maxPts - level.minPts)) * 100, 100) : 0;
  const unreadNotifs = notifications.filter((n: any) => !n.read).length;

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {(user?.name || 'Friend').split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/notifications">
          <div className="relative">
            <Button size="sm" variant="outline" className="relative">
              <Bell className="h-4 w-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </Button>
          </div>
        </Link>
      </div>

      {/* Faith Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Level Progress */}
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">Faith Level</span>
            </div>
            <p className={`text-lg font-bold ${level.color}`}>{level.label}</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{faithPoints} pts</span>
                <span>{level.maxPts} pts</span>
              </div>
              <Progress value={levelProgress} className="h-1.5" />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {Math.max(0, level.maxPts - faithPoints)} pts to {level.next}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium">Faith Points</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{faithPoints.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Lifetime earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Streak</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">0</p>
            <p className="text-xs text-gray-400 mt-1">Reading days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Access</h2>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map(link => (
            <Link key={link.href} href={link.href}>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className={`h-12 w-12 rounded-2xl ${link.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-gray-600 font-medium">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          <Link href="/events">
            <Button variant="ghost" size="sm" className="text-indigo-600 h-7">
              View all <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No upcoming events</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event: any) => (
              <Link key={event.id} href="/events">
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-600">
                        {format(new Date(event.event_date), 'MMM').toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-indigo-700 leading-none">
                        {format(new Date(event.event_date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-1">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(event.event_date), 'h:mm a')} · {event.location}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {event.rsvp_count} going
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Verse of the Day */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Verse of the Day</span>
          </div>
          <p className="text-sm leading-relaxed italic">
            "In the beginning, God created the heavens and the earth."
          </p>
          <p className="text-xs opacity-70 mt-2">— Genesis 1:1 (ESV)</p>
          <Link href="/bible">
            <Button size="sm" variant="secondary" className="mt-3 bg-white/20 hover:bg-white/30 text-white border-0">
              Read Chapter <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="text-indigo-600 h-7">
                View all <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0 divide-y">
              {notifications.map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 p-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-200' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</p>
                    <p className="text-xs text-gray-400">{n.body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
