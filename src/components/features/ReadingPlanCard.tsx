'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Flame, Check, BookOpen, ChevronRight, Loader2 } from 'lucide-react';

interface ReadingPlan {
  id: number;
  title: string;
  description?: string;
  duration_days: number;
  is_premade?: number;
  cover_image?: string;
}

interface UserProgress {
  plan_id: number;
  current_day: number;
  completed_days: string;
  streak: number;
  last_read_at?: string;
}

interface ReadingPlanCardProps {
  plan: ReadingPlan;
  progress?: UserProgress;
  isEnrolling?: boolean;
  onEnroll?: (id: number) => void;
  onCompleteDay?: (planId: number, day: number) => void;
  onViewPlan?: (id: number) => void;
}

const PLAN_ICONS: Record<string, string> = {
  'Bible in a Year': '📅',
  'New Testament in 90 Days': '✝️',
  'Psalms & Proverbs Month': '🙏',
  'Genesis Exploration': '🌱',
};

export function ReadingPlanCard({ plan, progress, isEnrolling, onEnroll, onCompleteDay, onViewPlan }: ReadingPlanCardProps) {
  const isEnrolled = !!progress;
  const completedDays = progress ? (() => { try { return JSON.parse(progress.completed_days || '[]').length; } catch { return 0; } })() : 0;
  const pct = progress ? Math.round((completedDays / plan.duration_days) * 100) : 0;
  const icon = PLAN_ICONS[plan.title] || '📖';
  const isComplete = pct >= 100;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isComplete ? 'border-green-200 bg-green-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-xl bg-indigo-50 flex items-center justify-center text-3xl shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">{plan.title}</h3>
              {isEnrolled && (
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${isComplete ? 'text-green-600 bg-green-100' : 'text-indigo-600'}`}
                >
                  {isComplete ? '✅ Done' : 'Active'}
                </Badge>
              )}
            </div>

            {plan.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.description}</p>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />{plan.duration_days} days
              </span>
              {progress && progress.streak > 0 && (
                <span className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-3 w-3" />{progress.streak} day streak
                </span>
              )}
            </div>
          </div>
        </div>

        {isEnrolled && progress && !isComplete && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Day {progress.current_day} of {plan.duration_days}</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {!isEnrolled ? (
            <Button
              size="sm"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => onEnroll?.(plan.id)}
              disabled={isEnrolling}
            >
              {isEnrolling
                ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Enrolling…</>
                : <><BookOpen className="h-3.5 w-3.5 mr-1" />Start Plan</>
              }
            </Button>
          ) : !isComplete ? (
            <Button
              size="sm"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => onCompleteDay?.(plan.id, progress.current_day)}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Complete Day {progress.current_day}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200" disabled>
              <Check className="h-3.5 w-3.5 mr-1" />Plan Completed!
            </Button>
          )}
          {onViewPlan && (
            <Button size="sm" variant="outline" onClick={() => onViewPlan(plan.id)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
