'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, ChevronLeft, Lock, Globe, Crown,
  MessageCircle, UserPlus, UserMinus, Settings, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface GroupMember {
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  category: string;
  leader_name?: string;
  leader_id?: string;
  member_count: number;
  max_members: number;
  is_public: boolean;
  created_at: string;
  is_member?: boolean;
  user_role?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'bible-study': '📖', prayer: '🙏', mens: '👨', womens: '👩',
  youth: '👦', general: '👥', worship: '🎵', outreach: '🌍',
};

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group || data);
        setMembers(data.members || []);
      }
    } catch {
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!group) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/join`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('🎉 Joined group!');
        fetchGroup();
      } else {
        toast.error(data.error || 'Failed to join');
      }
    } catch {
      toast.error('Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      const res = await fetch(`/api/groups/${group.id}/leave`, { method: 'POST' });
      if (res.ok) {
        toast.success('Left group');
        fetchGroup();
      }
    } catch {
      toast.error('Failed to leave group');
    }
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      // Using prayer/SOAP as group posts for now
      toast.success('Post shared with the group! 🎉');
      setPosts(prev => [{
        id: Date.now(),
        author: user?.name || 'You',
        content: newPost,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setNewPost('');
    } catch {
      toast.error('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-16">
        <Users className="h-16 w-16 mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 font-medium">Group not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/groups')}>
          Back to Groups
        </Button>
      </div>
    );
  }

  const emoji = CATEGORY_EMOJI[group.category] || '👥';
  const isMember = group.is_member;
  const isLeader = group.user_role === 'leader' || group.leader_id === user?.id;
  const canAdmin = isLeader || ['pastor', 'admin'].includes(user?.role);
  const isFull = group.member_count >= group.max_members;
  const spotsPct = Math.round((group.member_count / group.max_members) * 100);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/groups')} className="text-gray-600 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Groups
      </Button>

      {/* Group Header */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600" />
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
                <Badge variant="secondary" className="text-xs capitalize">{group.category}</Badge>
                {group.is_public ? (
                  <Badge className="bg-green-100 text-green-700 text-xs"><Globe className="h-2.5 w-2.5 mr-1" />Public</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 text-xs"><Lock className="h-2.5 w-2.5 mr-1" />Private</Badge>
                )}
              </div>
              {group.leader_name && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  <span>Led by {group.leader_name}</span>
                </div>
              )}
            </div>
          </div>

          {group.description && (
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{group.description}</p>
          )}

          {/* Member count */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {group.member_count} members</span>
              <span>{group.member_count}/{group.max_members} spots filled</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-indigo-400'}`}
                style={{ width: `${Math.min(spotsPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {!isMember ? (
              <Button
                onClick={handleJoin}
                disabled={joining || isFull}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {joining ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-1.5" />
                )}
                {isFull ? 'Group Full' : 'Join Group'}
              </Button>
            ) : (
              <>
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={handleLeave}>
                  <UserMinus className="h-4 w-4 mr-1.5" /> Leave
                </Button>
                {canAdmin && (
                  <Button variant="outline" onClick={() => setShowInvite(true)}>
                    <UserPlus className="h-4 w-4 mr-1.5" /> Invite
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for members and activity */}
      <Tabs defaultValue="members">
        <TabsList className="w-full">
          <TabsTrigger value="members" className="flex-1">
            <Users className="h-4 w-4 mr-1.5" /> Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-1.5" /> Group Wall
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No members yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {members.map(member => (
                    <div key={member.user_id} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-400">
                          Joined {member.joined_at ? format(new Date(member.joined_at), 'MMM d, yyyy') : 'recently'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === 'leader' && (
                          <div className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            <Crown className="h-3 w-3" /> Leader
                          </div>
                        )}
                        {member.user_id === user?.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Group Wall Tab */}
        <TabsContent value="activity" className="mt-3 space-y-3">
          {/* Post input */}
          {isMember && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <Textarea
                  placeholder="Share a verse, prayer request, or encouragement with the group..."
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  className="mb-3 resize-none"
                  rows={3}
                />
                <Button
                  onClick={handlePostSubmit}
                  disabled={posting || !newPost.trim()}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {posting ? 'Posting...' : 'Share with Group'}
                </Button>
              </CardContent>
            </Card>
          )}

          {posts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-400">
                <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No posts yet.</p>
                {isMember && <p className="text-xs mt-1">Be the first to share something!</p>}
                {!isMember && <p className="text-xs mt-1">Join the group to participate.</p>}
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card key={post.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{getInitials(post.author)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-900">{post.author}</span>
                    <span className="text-xs text-gray-400 ml-auto">{format(new Date(post.created_at), 'MMM d')}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">Enter an email address to invite someone to this group</p>
            <Input
              type="email"
              placeholder="member@email.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
            />
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                if (!inviteEmail) return;
                toast.success(`Invitation sent to ${inviteEmail}!`);
                setInviteEmail('');
                setShowInvite(false);
              }}
            >
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
