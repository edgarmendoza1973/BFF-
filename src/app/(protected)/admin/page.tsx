"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Users, MessageCircle, BookOpen, Calendar, DollarSign, TrendingUp, Shield, Loader2, Search, Bell, AlertTriangle, Send, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  activeLeaders: number;
  totalConversations: number;
  totalDonations: number;
  totalEvents: number;
  totalGroups: number;
  totalPrayers: number;
  totalSermons: number;
  recentSignups: any[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || `Failed to load stats (${res.status})`);
        return;
      }
      const data = await res.json();
      // /api/admin/metrics returns { stats: {...}, member_levels, recent_users, recent_donations }
      const s = data.stats || {};
      setStats({
        totalUsers:          s.total_users          ?? 0,
        activeLeaders:       s.active_leaders       ?? 0,
        totalConversations:  s.total_conversations  ?? 0,
        totalDonations:      s.total_donations      ?? 0,
        totalEvents:         s.total_events         ?? 0,
        totalGroups:         s.total_groups         ?? 0,
        totalPrayers:        s.total_prayers        ?? 0,
        totalSermons:        s.total_sermons        ?? 0,
        recentSignups:       data.recent_users      ?? [],
      });
    } catch (e) {
      console.error('[Admin] fetchStats error:', e);
      toast.error('Could not load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error('[Admin] fetchUsers error:', e);
    }
  };

  const handleAction = async (action: string, targetId: string, data?: any) => {
    setActionLoading(`${action}-${targetId}`);
    try {
      const res = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetId, data }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'Action completed');
        fetchUsers();
        fetchStats();
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    pastor: 'bg-purple-100 text-purple-700',
    leader: 'bg-blue-100 text-blue-700',
    user: 'bg-gray-100 text-gray-700',
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please enter a title and message');
      return;
    }
    setBroadcasting(true);
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          type: 'announcement',
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`📢 Broadcast sent to ${result.sent} members!`);
        setBroadcastTitle('');
        setBroadcastMessage('');
        fetchStats();
      } else {
        toast.error(result.error || 'Failed to send broadcast');
      }
    } catch {
      toast.error('Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value?.toLocaleString?.() ?? value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Church management overview</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users}          label="Total Users"        value={stats?.totalUsers}         color="bg-indigo-500" />
            <StatCard icon={Shield}         label="Active Leaders"     value={stats?.activeLeaders}      color="bg-purple-500" />
            <StatCard icon={MessageCircle}  label="Conversations"      value={stats?.totalConversations} color="bg-blue-500"   />
            <StatCard icon={DollarSign}     label="Total Donations"    value={`$${(stats?.totalDonations || 0).toFixed(2)}`} color="bg-green-500" />
            <StatCard icon={Calendar}       label="Events"             value={stats?.totalEvents}        color="bg-amber-500"  />
            <StatCard icon={Users}          label="Groups"             value={stats?.totalGroups}        color="bg-pink-500"   />
            <StatCard icon={BookOpen}       label="Prayer Requests"    value={stats?.totalPrayers}       color="bg-red-500"    />
            <StatCard icon={TrendingUp}     label="Sermons"            value={stats?.totalSermons}       color="bg-teal-500"   />
          </div>

          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
              <TabsTrigger value="recent">Recent Signups</TabsTrigger>
              <TabsTrigger value="escalations">Escalations</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">User Management</CardTitle>
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        className="pl-8 h-8 text-sm"
                        value={searchUser}
                        onChange={e => setSearchUser(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        <Badge className={`text-xs ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                          {u.role}
                        </Badge>
                        <div className="flex gap-1">
                          {u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={!!actionLoading}
                              onClick={() => handleAction('change_role', u.id, { role: u.role === 'user' ? 'leader' : 'user' })}
                            >
                              {u.role === 'user' ? '↑ Leader' : '↓ User'}
                            </Button>
                          )}
                          {u.role !== 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-500 hover:text-red-600"
                              disabled={!!actionLoading}
                              onClick={() => handleAction('suspend_user', u.id)}
                            >
                              Suspend
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="broadcast" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-indigo-600" />
                    Broadcast Notification to All Members
                  </CardTitle>
                  <p className="text-sm text-gray-500">Send a push notification and in-app alert to all church members</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notification Title</label>
                    <Input
                      placeholder="e.g., Sunday Service Reminder"
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      placeholder="Write your message to the congregation..."
                      rows={4}
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1">{broadcastMessage.length}/500 characters</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                    ⚠️ This will send a notification to <strong>all {stats?.totalUsers || 0} members</strong>. Use sparingly for important announcements.
                  </div>
                  <Button
                    onClick={handleBroadcast}
                    disabled={broadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {broadcasting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {(stats?.recentSignups || []).map((u: any) => (
                      <div key={u.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                          {(u.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>{u.role}</Badge>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {u.created_at ? format(new Date(u.created_at), 'MMM d') : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="escalations" className="mt-4">
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-400" />
                  <p className="font-medium">No active escalations</p>
                  <p className="text-sm">Chat escalations will appear here for review</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
