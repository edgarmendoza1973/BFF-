'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Lock, Globe, Crown, LogOut, Loader2 } from 'lucide-react';

interface Group {
  id: number;
  name: string;
  description?: string;
  category: string;
  max_members?: number;
  is_public: number;
  member_count?: number;
  leader_name?: string;
  leader_id?: string;
}

interface GroupCardProps {
  group: Group;
  isMember?: boolean;
  isJoining?: boolean;
  isLeaving?: boolean;
  currentUserId?: string;
  onJoin?: (id: number) => void;
  onLeave?: (id: number) => void;
}

const CAT_EMOJI: Record<string, string> = {
  'bible-study': '📖',
  prayer: '🙏',
  mens: '👨',
  womens: '👩',
  youth: '🌟',
  ministry: '⛪',
};

export function GroupCard({ group, isMember, isJoining, isLeaving, currentUserId, onJoin, onLeave }: GroupCardProps) {
  const isFull = group.max_members && (group.member_count || 0) >= group.max_members;
  const isLeader = group.leader_id === currentUserId;
  const emoji = CAT_EMOJI[group.category] || '👥';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm">{group.name}</h3>
              {isLeader && <Crown className="h-3.5 w-3.5 text-amber-500" />}
              {group.is_public
                ? <Globe className="h-3 w-3 text-gray-400" />
                : <Lock className="h-3 w-3 text-gray-400" />}
            </div>

            {group.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{group.description}</p>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />{group.member_count || 0} members
                {group.max_members && ` / ${group.max_members}`}
              </span>
              {group.leader_name && <span>Led by {group.leader_name}</span>}
            </div>

            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs capitalize">
                {group.category?.replace('-', ' ')}
              </Badge>
              {isFull && !isMember && (
                <Badge className="text-xs bg-red-100 text-red-700 border-0">Full</Badge>
              )}
            </div>

            <div className="mt-2">
              {isMember ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 text-xs h-7"
                  disabled={isLeaving}
                  onClick={() => onLeave?.(group.id)}
                >
                  {isLeaving
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Leaving…</>
                    : <><LogOut className="h-3 w-3 mr-1" />Leave</>
                  }
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7"
                  disabled={isJoining || !!isFull}
                  onClick={() => onJoin?.(group.id)}
                >
                  {isJoining
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Joining…</>
                    : isFull ? 'Full' : 'Join Group'
                  }
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
