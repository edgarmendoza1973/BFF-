'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft, BookOpen, Calendar, Flame, Check,
  ChevronRight, Lock, Trophy, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PlanDay {
  id: number;
  plan_id: number;
  day_number: number;
  passages: string | string[];
  devotional: string;
}

interface ReadingPlan {
  id: number;
  title: string;
  description: string;
  duration_days: number;
  is_premade: boolean;
}

interface UserProgress {
  plan_id: number;
  current_day: number;
  completed_days: string | number[];
  streak: number;
  last_read_at: string;
}

export default function ReadingPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<PlanDay | null>(null);
  const [completing, setCompleting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      const [plansRes, daysRes, progressRes] = await Promise.all([
        fetch('/api/reading-plans'),
        fetch(`/api/reading-plans/${id}/days`),
        fetch('/api/reading-plans/progress'),
      ]);

      const plansData = await plansRes.json();
      const daysData = await daysRes.json();
      const progressData = await progressRes.json();

      const foundPlan = (plansData.plans || []).find((p: ReadingPlan) => String(p.id) === String(id));
      setPlan(foundPlan || null);

      const rawDays = daysData.days || [];
      setDays(rawDays.map((d: PlanDay) => ({
        ...d,
        passages: typeof d.passages === 'string' ? JSON.parse(d.passages) : d.passages,
      })));

      const myProgress = (progressData.progress || []).find((p: UserProgress) => String(p.plan_id) === String(id));
      setProgress(myProgress || null);

      if (myProgress) {
        const currentDayData = rawDays.find((d: PlanDay) => d.day_number === (myProgress.current_day || 1));
        setSelectedDay(currentDayData || rawDays[0] || null);
      } else {
        setSelectedDay(rawDays[0] || null);
      }
    } catch {
      toast.error('Failed to load reading plan');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch('/api/reading-plans/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: id, action: 'enroll' }),
      });
      if (res.ok) {
        toast.success('📚 Enrolled in reading plan!');
        fetchAll();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to enroll');
      }
    } catch {
      toast.error('Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteDay = async (dayNumber: number) => {
    if (!progress) {
      toast.error('Please enroll in this plan first');
      return;
    }
    setCompleting(true);
    try {
      const res = await fetch('/api/reading-plans/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: id, action: 'complete_day', completedDay: dayNumber }),
      });
      if (res.ok) {
        toast.success(`🎉 Day ${dayNumber} completed! Keep going!`);
        fetchAll();
        // Auto-advance to next day
        const nextDay = days.find(d => d.day_number === dayNumber + 1);
        if (nextDay) setSelectedDay(nextDay);
      }
    } catch {
      toast.error('Failed to mark day complete');
    } finally {
      setCompleting(false);
    }
  };

  const getCompletedDays = (): number[] => {
    if (!progress?.completed_days) return [];
    if (Array.isArray(progress.completed_days)) return progress.completed_days;
    try { return JSON.parse(progress.completed_days as string); } catch { return []; }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-16">
        <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 font-medium">Reading plan not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/reading-plans')}>
          Back to Reading Plans
        </Button>
      </div>
    );
  }

  const completedDays = getCompletedDays();
  const progressPct = Math.round((completedDays.length / plan.duration_days) * 100);
  const isEnrolled = !!progress;
  const currentDay = progress?.current_day || 1;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push('/reading-plans')} className="text-gray-600 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Reading Plans
      </Button>

      {/* Plan Header */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-500" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              {plan.is_premade && <Badge className="mb-2 bg-amber-100 text-amber-700 text-xs">Official Plan</Badge>}
              <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
              {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              📖
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span>{plan.duration_days} days</span>
            </div>
            {isEnrolled && (
              <>
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-red-500" />
                  <span>{progress.streak || 0} day streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{completedDays.length}/{plan.duration_days} completed</span>
                </div>
              </>
            )}
          </div>

          {isEnrolled && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Overall Progress</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {!isEnrolled ? (
            <Button
              onClick={handleEnroll}
              disabled={enrolling}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {enrolling ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <BookOpen className="h-4 w-4 mr-1.5" />
              )}
              Start Reading Plan
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl text-sm">
                <Check className="h-4 w-4" />
                Enrolled · Day {currentDay}
              </div>
              {progressPct === 100 && (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl text-sm">
                  <Trophy className="h-4 w-4" />
                  Completed!
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day content area */}
      <Tabs defaultValue="today">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">Today's Reading</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">All Days ({days.length})</TabsTrigger>
        </TabsList>

        {/* Today's Reading */}
        <TabsContent value="today" className="mt-3">
          {selectedDay ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Day {selectedDay.day_number}</p>
                    <h3 className="font-bold text-gray-900 mt-0.5">
                      {Array.isArray(selectedDay.passages) ? selectedDay.passages.join(' · ') : selectedDay.passages}
                    </h3>
                  </div>
                  {completedDays.includes(selectedDay.day_number) && (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Passages */}
                <div className="space-y-2 mb-5">
                  {(Array.isArray(selectedDay.passages) ? selectedDay.passages : [selectedDay.passages]).map((passage, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl">
                      <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-sm font-medium text-indigo-700">{passage}</span>
                    </div>
                  ))}
                </div>

                {/* Devotional */}
                {selectedDay.devotional && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
                    <p className="text-xs text-amber-600 font-medium uppercase tracking-wider mb-2">Devotional Thought</p>
                    <p className="text-sm text-gray-700 leading-relaxed italic">"{selectedDay.devotional}"</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedDay.day_number <= 1}
                    onClick={() => {
                      const prevDay = days.find(d => d.day_number === selectedDay.day_number - 1);
                      if (prevDay) setSelectedDay(prevDay);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>

                  {isEnrolled && !completedDays.includes(selectedDay.day_number) ? (
                    <Button
                      onClick={() => handleCompleteDay(selectedDay.day_number)}
                      disabled={completing}
                      className="bg-green-600 hover:bg-green-700 px-5"
                    >
                      {completing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-1.5" />
                      )}
                      Mark Complete
                    </Button>
                  ) : completedDays.includes(selectedDay.day_number) ? (
                    <Badge className="bg-green-100 text-green-700 px-3 py-1.5">
                      <Check className="h-3.5 w-3.5 mr-1" /> Done
                    </Badge>
                  ) : (
                    <Button onClick={handleEnroll} disabled={enrolling} size="sm" className="bg-orange-500 hover:bg-orange-600">
                      Enroll to Track
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedDay.day_number >= days.length}
                    onClick={() => {
                      const nextDay = days.find(d => d.day_number === selectedDay.day_number + 1);
                      if (nextDay) setSelectedDay(nextDay);
                    }}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                <p>No reading content available yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Days List */}
        <TabsContent value="all" className="mt-3">
          <div className="space-y-2">
            {days.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center text-gray-400">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Reading content coming soon</p>
                </CardContent>
              </Card>
            ) : (
              days.map(day => {
                const isDone = completedDays.includes(day.day_number);
                const isCurrent = day.day_number === currentDay;
                const isLocked = !isEnrolled && day.day_number > 3;
                const passages = Array.isArray(day.passages) ? day.passages : (() => {
                  try { return JSON.parse(day.passages as string); } catch { return [day.passages]; }
                })();

                return (
                  <button
                    key={day.id}
                    onClick={() => !isLocked && setSelectedDay(day)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isCurrent && !isDone ? 'border-orange-300 bg-orange-50' :
                      isDone ? 'border-green-200 bg-green-50' :
                      isLocked ? 'border-gray-100 bg-gray-50 opacity-60' :
                      'border-gray-100 bg-white hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        isDone ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-orange-500 text-white' :
                        isLocked ? 'bg-gray-200 text-gray-400' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {isDone ? <Check className="h-4 w-4" /> : isLocked ? <Lock className="h-3.5 w-3.5" /> : day.day_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Day {day.day_number} · {passages[0]}{passages.length > 1 ? ` +${passages.length - 1}` : ''}
                        </p>
                        {day.devotional && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{day.devotional}</p>
                        )}
                      </div>
                      {isDone && <Badge className="bg-green-100 text-green-700 text-xs shrink-0">Done</Badge>}
                      {isCurrent && !isDone && <Badge className="bg-orange-100 text-orange-700 text-xs shrink-0">Today</Badge>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
