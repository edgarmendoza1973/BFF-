"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  Users, MessageCircle, TrendingUp, BookOpen, Star,
  Shield, Compass, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface COMPASSMetric {
  avg_biblical_truth: number;
  avg_christ_centered: number;
  avg_gospel_shaped: number;
  total_ratings: number;
}

interface Disciplee {
  id: string; name: string; email: string;
  member_level: string; faith_points: number;
  last_message?: string; conversation_id?: number;
}

const LEVEL_COLORS: Record<string, string> = {
  new_member:   'bg-gray-100 text-gray-600',
  growing:      'bg-green-100 text-green-700',
  established:  'bg-blue-100 text-blue-700',
  leader_track: 'bg-purple-100 text-purple-700',
  shepherd:     'bg-amber-100 text-amber-700',
};

export default function LeaderPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [metrics, setMetrics]       = useState<COMPASSMetric | null>(null);
  const [conversations, setConvs]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [escalations, setEscalations] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchAll();
    }
  }, [user?.id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMetrics(), fetchConversations(), fetchEscalations()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/compass?leader_id=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch {}
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConvs(data.conversations || []);
      }
    } catch {}
  };

  const fetchEscalations = async () => {
    try {
      const res = await fetch('/api/chat/conversations?escalated=true');
      if (res.ok) {
        const data = await res.json();
        setEscalations((data.conversations || []).filter((c: any) => c.status === 'escalated'));
      }
    } catch {}
  };

  const handleResolveEscalation = async (convId: number) => {
    try {
      const res = await fetch(`/api/chat/escalate/${convId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        toast.success('Escalation resolved');
        fetchEscalations();
        fetchConversations();
      }
    } catch { toast.error('Failed to resolve'); }
  };

  const CompassScore = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value ? value.toFixed(1) : 'N/A'}/5</span>
      </div>
      <Progress value={value ? (value / 5) * 100 : 0} className="h-2" />
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const activeConvs    = conversations.filter(c => c.status === 'active');
  const escalatedConvs = conversations.filter(c => c.status === 'escalated');
  const totalDisciples = new Set(conversations.flatMap(c => (c.participants || []).map((p: any) => p.user_id))).size;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Compass className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leader Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {user?.name?.split(' ')[0]} · <span className="capitalize">{user?.role}</span></p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: MessageCircle, label: 'Active Chats',    value: activeConvs.length,    color: 'bg-blue-500' },
          { icon: AlertCircle,   label: 'Escalations',    value: escalatedConvs.length, color: 'bg-red-500'  },
          { icon: Users,         label: 'Disciples',      value: totalDisciples,         color: 'bg-purple-500' },
          { icon: Star,          label: 'COMPASS Ratings', value: metrics?.total_ratings ?? 0, color: 'bg-amber-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="compass">
        <TabsList className="w-full">
          <TabsTrigger value="compass" className="flex-1">COMPASS Metrics</TabsTrigger>
          <TabsTrigger value="conversations" className="flex-1">
            Conversations {escalatedConvs.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{escalatedConvs.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex-1">Leader Guide</TabsTrigger>
        </TabsList>

        {/* COMPASS Tab */}
        <TabsContent value="compass" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Compass className="h-4 w-4 text-indigo-600" />
                  Your COMPASS Score
                </CardTitle>
                <p className="text-xs text-gray-500">Rated by pastors on your discipleship conversations</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics && metrics.total_ratings > 0 ? (
                  <>
                    <CompassScore label="🔵 Christ-Centered"  value={metrics.avg_christ_centered} color="text-blue-600" />
                    <CompassScore label="📖 Biblical Truth"   value={metrics.avg_biblical_truth}  color="text-indigo-600" />
                    <CompassScore label="✝️ Gospel-Shaped"    value={metrics.avg_gospel_shaped}   color="text-purple-600" />
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">Based on {metrics.total_ratings} rating{metrics.total_ratings !== 1 ? 's' : ''}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Compass className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No ratings yet</p>
                    <p className="text-sm mt-1">Your pastor will rate your discipleship conversations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">COMPASS Framework</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'C — Christ-Centered',  desc: 'Every conversation points to Jesus and His work', score: metrics?.avg_christ_centered },
                  { label: 'O — Obedience-Oriented', desc: 'Encouraging practical application of God\'s Word', score: null },
                  { label: 'M — Multiplying',       desc: 'Equipping disciples who disciple others', score: null },
                  { label: 'P — Prayer-Saturated',  desc: 'Covering all discipleship in prayer', score: null },
                  { label: 'A — Accountable',       desc: 'Maintaining healthy accountability boundaries', score: null },
                  { label: 'S — Scripture-Rooted',  desc: 'Grounding all counsel in God\'s Word', score: metrics?.avg_biblical_truth },
                  { label: 'S — Spirit-Led',        desc: 'Sensitive to the Holy Spirit\'s guidance', score: metrics?.avg_gospel_shaped },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="mt-4">
          <div className="space-y-4">
            {escalatedConvs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />Escalated Conversations — Require Attention
                </h3>
                <div className="space-y-2">
                  {escalatedConvs.map((conv: any) => (
                    <Card key={conv.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Conversation #{conv.id}
                            <Badge className="ml-2 bg-red-100 text-red-700 text-xs">Escalated</Badge>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Rule of Four — Guardian added. Review and resolve.</p>
                          {conv.last_message && <p className="text-xs text-gray-400 mt-0.5 italic">"{conv.last_message}"</p>}
                        </div>
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 shrink-0"
                          onClick={() => handleResolveEscalation(conv.id)}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />Resolve
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Active Conversations ({activeConvs.length})</h3>
              {activeConvs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>No active discipleship conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeConvs.map((conv: any) => (
                    <Card key={conv.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                            {getInitials(conv.participants?.[0]?.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {conv.participants?.filter((p: any) => p.user_id !== user?.id).map((p: any) => p.name).join(', ') || `Chat #${conv.id}`}
                          </p>
                          {conv.last_message && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0" asChild>
                          <a href="/chat">Open</a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Leader Resources & Guidelines</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: '🤝', title: 'Rule of Four', desc: 'For cross-gender one-on-one conversations, a guardian is added after 4 messages in 12 hours. This protects both the disciple and the leader.' },
                { icon: '📖', title: 'Biblical Counseling', desc: 'Always ground advice in Scripture. Ask "What does the Bible say?" before offering personal opinion.' },
                { icon: '🙏', title: 'Prayer First', desc: 'Begin every discipleship conversation with prayer. It sets the tone and acknowledges God\'s presence.' },
                { icon: '⚠️', title: 'Escalate When Needed', desc: 'If a conversation involves crisis, mental health concerns, or safety issues, escalate immediately to a pastor.' },
                { icon: '🔒', title: 'Confidentiality', desc: 'Keep discipleship conversations confidential unless there is risk of harm. Build trust through consistent integrity.' },
                { icon: '📊', title: 'Track Growth', desc: 'Use COMPASS metrics to reflect on your discipleship effectiveness. Seek pastor feedback regularly.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
