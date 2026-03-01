'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HandHeart, Globe, Lock, Check, User } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface PrayerRequest {
  id: number;
  title: string;
  body?: string;
  privacy: 'private' | 'leader' | 'group' | 'community';
  is_answered?: number;
  prayer_count?: number;
  created_at: string;
  author_name?: string;
}

interface PrayerCardProps {
  prayer: PrayerRequest;
  showAuthor?: boolean;
  hasPrayed?: boolean;
  onPray?: (id: number) => void;
  onAnswer?: (id: number) => void;
}

const PRIVACY_ICONS = {
  private: Lock,
  leader: User,
  group: User,
  community: Globe,
};

const PRIVACY_LABELS = {
  private: 'Private',
  leader: 'Leader Only',
  group: 'Group',
  community: 'Community',
};

export function PrayerCard({ prayer, showAuthor, hasPrayed, onPray, onAnswer }: PrayerCardProps) {
  const PrivacyIcon = PRIVACY_ICONS[prayer.privacy] || Globe;

  return (
    <Card className={`transition-shadow hover:shadow-md ${prayer.is_answered ? 'border-green-200 bg-green-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{prayer.title}</h3>
              {prayer.is_answered ? (
                <Badge className="text-xs bg-green-100 text-green-700 border-0 shrink-0">
                  <Check className="h-2.5 w-2.5 mr-0.5" />Answered
                </Badge>
              ) : null}
            </div>

            {prayer.body && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">{prayer.body}</p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {showAuthor && prayer.author_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />{prayer.author_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <PrivacyIcon className="h-3 w-3" />
                {PRIVACY_LABELS[prayer.privacy]}
              </span>
              <span>{formatRelativeTime(prayer.created_at)}</span>
              {(prayer.prayer_count || 0) > 0 && (
                <span className="flex items-center gap-1">
                  <HandHeart className="h-3 w-3 text-indigo-400" />
                  {prayer.prayer_count} praying
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {!prayer.is_answered && onPray && (
            <Button
              size="sm"
              variant={hasPrayed ? 'outline' : 'default'}
              className={hasPrayed ? 'text-indigo-600 border-indigo-200 bg-indigo-50' : 'bg-indigo-600 hover:bg-indigo-700'}
              onClick={() => onPray(prayer.id)}
            >
              <HandHeart className="h-3.5 w-3.5 mr-1" />
              {hasPrayed ? 'Prayed' : 'Pray for this'}
            </Button>
          )}
          {onAnswer && !prayer.is_answered && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-200"
              onClick={() => onAnswer(prayer.id)}
            >
              <Check className="h-3.5 w-3.5 mr-1" />Mark Answered
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
