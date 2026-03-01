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
import { Users, Search, Plus, Lock, Globe, LogOut, Crown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface Group {
  id: number; name: string; description: string; category: string;
  max_members: number; is_public: number; member_count?: number; leader_name?: string; leader_id?: string;
}

const CATEGORIES = [
  { value: 'all',        label: 'All',         emoji: '👥' },
  { value: 'bible-study',label: 'Bible Study',  emoji: '📖' },
  { value: 'prayer',     label: 'Prayer',       emoji: '🙏' },
  { value: 'mens',       label: "Men's",        emoji: '👨' },
  { value: 'womens',     label: "Women's",      emoji: '👩' },
  { value: 'youth',      label: 'Youth',        emoji: '🌟' },
  { value: 'ministry',   label: 'Ministry',     emoji: '⛪' },
];

export default function GroupsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [groups, setGroups]       = useState<Group[]>([]);
  const [myGroups, setMyGroups]   = useState<number[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('all');
  const [joining, setJoining]     = useState<number | null>(null);
  const [leaving, setLeaving]     = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [form, setForm]           = useState({ name: '', description: '', category: 'bible-study', is_public: true, max_members: '50' });

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      const all: Group[] = data.groups || [];
      setGroups(all);
      // Determine which groups current user is in
      if (user?.id) {
        const myRes = await fetch(`/api/groups?user_id=${user.id}`);
        // We'll track via local state from join/leave actions
      }
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  };

  const handleJoin = async (groupId: number) => {
    setJoining(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMyGroups(prev => [...prev, groupId]);
        toast.success('Joined group! 🎉');
        fetchGroups();
      } else toast.error(data.error || 'Failed to join');
    } catch { toast.error('Failed to join group'); }
    finally { setJoining(null); }
  };

  const handleLeave = async (groupId: number) => {
    setLeaving(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMyGroups(prev => prev.filter(id => id !== groupId));
        toast.success('Left group');
        fetchGroups();
      } else toast.error(data.error || 'Failed to leave');
    } catch { toast.error('Failed to leave group'); }
    finally { setLeaving(null); }
  };

  const handleCreate = async () => {
    if (!form.name) { toast.error('Group name is required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, max_members: parseInt(form.max_members) || 50 }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Group created! 🎉');
        setShowCreate(false);
        setForm({ name: '', description: '', category: 'bible-study', is_public: true, max_members: '50' });
        if (data.group) { setMyGroups(prev => [...prev, data.group.id]); }
        fetchGroups();
      } else toast.error(data.error || 'Failed to create group');
    } catch { toast.error('Failed to create group'); }
    finally { setCreating(false); }
  };

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || g.category === category;
    return matchSearch && matchCat;
  });

  const GroupCard = ({ group }: { group: Group }) => {
    const isMember = myGroups.includes(group.id);
    const isLeader = group.leader_id === user?.id;
    const catEmoji = CATEGORIES.find(c => c.value === group.category)?.emoji || '👥';
    const isFull = group.max_members && (group.member_count || 0) >= group.max_members;

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {catEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm">{group.name}</h3>
                {isLeader && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                {group.is_public ? <Globe className="h-3 w-3 text-gray-400" /> : <Lock className="h-3 w-3 text-gray-400" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{group.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{group.member_count} members</span>
                {group.leader_name && <span>Led by {group.leader_name}</span>}
                {group.max_members && <span>Max {group.max_members}</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="text-xs capitalize">{group.category?.replace('-', ' ')}</Badge>
                {isFull && !isMember && <Badge className="text-xs bg-red-100 text-red-700">Full</Badge>}
              </div>
              <div className="flex gap-2 mt-2">
                {isMember ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50 text-xs h-7"
                    disabled={leaving === group.id}
                    onClick={() => handleLeave(group.id)}
                  >
                    <LogOut className="h-3 w-3 mr-1" />{leaving === group.id ? 'Leaving…' : 'Leave'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7"
                    disabled={joining === group.id || !!isFull}
                    onClick={() => handleJoin(group.id)}
                  >
                    {joining === group.id ? 'Joining…' : isFull ? 'Full' : 'Join'}
                  </Button>
                )}
                <Link href={`/groups/${group.id}`}>
                  <Button size="sm" variant="ghost" className="text-indigo-600 text-xs h-7">View →</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
            <p className="text-sm text-gray-500">Connect & grow together</p>
          </div>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search groups…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === c.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="h-14 w-14 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No groups found</p>
          <p className="text-sm mt-1">Try a different search or create a new group</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(g => <GroupCard key={g.id} group={g} />)}
        </div>
      )}

      {/* Create Group Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Create a New Group</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Group Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning Prayer Warriors" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What is this group about?" className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Max Members</Label>
                <Input type="number" value={form.max_members} onChange={e => setForm(f => ({ ...f, max_members: e.target.value }))} min="2" max="500" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-600">Public group (visible to everyone)</span>
            </label>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create Group'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
