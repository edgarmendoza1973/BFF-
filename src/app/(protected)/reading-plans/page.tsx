"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, Flame, Check, ChevronRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReadingPlan {
  id: number;
  title: string;
  description: string;
  duration_days: number;
  is_premade: number;
  cover_image?: string;
}

interface UserProgress {
  plan_id: number;
  current_day: number;
  completed_days: string;
  streak: number;
  last_read_at: string;
  title: string;
  duration_days: number;
}

export default function ReadingPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [myPlans, setMyPlans] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchMyProgress();
  }, []);

  const fetchPlans = async () => {
    const res = await fetch('/api/reading-plans');
    const data = await res.json();
    setPlans(data.plans || []);
    setLoading(false);
  };

  const fetchMyProgress = async () => {
    const res = await fetch('/api/reading-plans/progress');
    const data = await res.json();
    setMyPlans(data.progress || []);
  };

  const handleEnroll = async (planId: number) => {
    setEnrolling(planId);
    try {
      const res = await fetch('/api/reading-plans/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: 'enroll' }),
      });
      if (res.ok) {
        toast.success('Enrolled in reading plan! 📖');
        fetchMyProgress();
      }
    } catch {
      toast.error('Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  const handleCompleteDay = async (planId: number, day: number) => {
    try {
      const res = await fetch('/api/reading-plans/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: 'complete_day', completedDay: day }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Day ${day} completed! 🔥 ${data.streak} day streak`);
        fetchMyProgress();
      }
    } catch {
      toast.error('Failed to mark complete');
    }
  };

  const enrolledIds = new Set(myPlans.map(p => p.plan_id));

  const PLAN_ICONS: Record<string, string> = {
    'Bible in a Year': '📅',
    'New Testament in 90 Days': '✝',
    'Psalms & Proverbs Month': '🙏',
    'Genesis Exploration': '🌱',
  };

  const PlanCard = ({ plan }: { plan: ReadingPlan }) => {
    const isEnrolled = enrolledIds.has(plan.id);
    const progress = myPlans.find(p => p.plan_id === plan.id);
    const completedDays = progress ? JSON.parse(progress.completed_days || '[]').length : 0;
    const pct = progress ? Math.round((completedDays / plan.duration_days) * 100) : 0;
    const icon = PLAN_ICONS[plan.title] || '📖';

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-xl bg-indigo-50 flex items-center justify-center text-3xl shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                {isEnrolled && (
                  <Badge variant="secondary" className="text-xs text-green-600 shrink-0">Active</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{plan.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {plan.duration_days} days
                </span>
                {progress && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-3 w-3" />
                    {progress.streak} day streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEnrolled && progress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Day {progress.current_day} of {plan.duration_days}</span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {!isEnrolled ? (
              <Button
                size="sm"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handleEnroll(plan.id)}
                disabled={enrolling === plan.id}
              >
                {enrolling === plan.id ? 'Enrolling...' : 'Start Plan'}
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleCompleteDay(plan.id, progress!.current_day)}
              >
                <Check className="h-4 w-4 mr-1" />
                Complete Day {progress?.current_day}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => router.push(`/reading-plans/${plan.id}`)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reading Plans</h1>
        <p className="text-sm text-gray-500">Structured Bible reading for spiritual growth</p>
      </div>

      {/* My active plans summary */}
      {myPlans.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {myPlans.slice(0, 2).map(p => (
            <Card key={p.plan_id} className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-3">
                <p className="text-xs text-indigo-600 font-medium line-clamp-1">{p.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-bold text-orange-500">{p.streak} days</span>
                </div>
                <Progress value={Math.round((JSON.parse(p.completed_days || '[]').length / p.duration_days) * 100)} className="h-1 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="active">My Plans ({myPlans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {myPlans.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No active reading plans</p>
                <p className="text-sm">Start a plan to begin your journey!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {plans
                .filter(p => enrolledIds.has(p.id))
                .map(plan => <PlanCard key={plan.id} plan={plan} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
