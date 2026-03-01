"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight, ChevronLeft, Check, Heart, BookOpen,
  Users, Globe, Shield, Sparkles, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'spiritual_maturity',
    title: 'Where are you on your faith journey?',
    subtitle: 'Everyone starts somewhere — there are no wrong answers',
    description: 'Your answer helps us match you with the right resources, community, and leaders.',
    icon: BookOpen,
    emoji: '🌱',
    color: 'from-green-500 to-emerald-600',
    bg: 'from-green-50 via-white to-emerald-50',
    options: [
      { value: 'new_believer',  label: 'Just Starting Out',   desc: "I'm new to faith or recently came to believe",    emoji: '🌱' },
      { value: 'growing',      label: 'Actively Growing',    desc: 'I believe and want to go deeper in my faith',     emoji: '🌿' },
      { value: 'established',  label: 'Well-Established',    desc: 'I have a strong foundation in Scripture and faith', emoji: '🌳' },
      { value: 'mentor',       label: 'Ready to Lead',       desc: 'I want to mentor and disciple others',            emoji: '⭐' },
    ],
  },
  {
    id: 'faith_goals',
    title: "What's your biggest faith goal right now?",
    subtitle: 'Focus on what matters most to you today',
    description: 'Choose the one that resonates most. You can always update this later in your profile.',
    icon: Sparkles,
    emoji: '🎯',
    color: 'from-purple-500 to-pink-600',
    bg: 'from-purple-50 via-white to-pink-50',
    options: [
      { value: 'bible_study',   label: 'Deep Bible Study',       desc: "Understand God's Word more deeply",           emoji: '📖' },
      { value: 'prayer_life',   label: 'Stronger Prayer Life',   desc: 'Develop a consistent, vibrant prayer life',   emoji: '🙏' },
      { value: 'community',     label: 'Community & Fellowship', desc: 'Connect with others in meaningful ways',      emoji: '🤝' },
      { value: 'evangelism',    label: 'Sharing My Faith',       desc: 'Learn to share my faith with others',         emoji: '🌍' },
      { value: 'discipleship',  label: 'Personal Discipleship',  desc: 'A mentor to walk this journey with me',       emoji: '🧭' },
    ],
  },
  {
    id: 'church_background',
    title: "What's your church experience?",
    subtitle: 'Help us understand your background',
    description: 'This helps us tailor the content and community connections most helpful for you.',
    icon: Users,
    emoji: '⛪',
    color: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50 via-white to-indigo-50',
    options: [
      { value: 'none',       label: 'No Church Background', desc: "Exploring church and faith for the first time", emoji: '🔍' },
      { value: 'occasional', label: 'Occasional Attender',  desc: "I've attended church now and then",            emoji: '🚶' },
      { value: 'regular',    label: 'Regular Attender',     desc: 'I attend church most weeks',                   emoji: '🏛️' },
      { value: 'long_time',  label: 'Long-Time Member',     desc: "Active church member for years",               emoji: '🙌' },
    ],
  },
  {
    id: 'language',
    title: 'What is your preferred language?',
    subtitle: 'BFF+ supports 8 languages',
    description: "We'll display content, Bible versions, and notifications in your chosen language.",
    icon: Globe,
    emoji: '🌏',
    color: 'from-amber-500 to-orange-600',
    bg: 'from-amber-50 via-white to-yellow-50',
    options: [
      { value: 'en',  label: 'English',            desc: 'ESV, NLT Bible versions available', emoji: '🇺🇸' },
      { value: 'tl',  label: 'Filipino / Tagalog', desc: 'ASND at Pinoy Contemporary Bible',  emoji: '🇵🇭' },
      { value: 'es',  label: 'Español',            desc: 'Reina Valera available',             emoji: '🇪🇸' },
      { value: 'zh',  label: '中文 (Chinese)',     desc: 'Chinese Union Version available',    emoji: '🇨🇳' },
      { value: 'ko',  label: '한국어 (Korean)',    desc: 'Korean Standard Version available',  emoji: '🇰🇷' },
      { value: 'ja',  label: '日本語 (Japanese)',  desc: 'Japanese Bible available',           emoji: '🇯🇵' },
    ],
  },
  {
    id: 'gender_preference',
    title: 'Leader gender preference for discipleship?',
    subtitle: 'Your comfort and safety matter to us',
    description: "BFF+ enforces the Rule of Four safety guidelines to protect both you and your leader in all discipleship chats.",
    icon: Shield,
    emoji: '🤝',
    color: 'from-rose-500 to-red-600',
    bg: 'from-rose-50 via-white to-red-50',
    options: [
      { value: 'no_preference', label: 'No Preference',      desc: "Open to any available leader",        emoji: '🌟' },
      { value: 'male',          label: 'Male Leader',        desc: 'I prefer a male discipleship leader', emoji: '👨‍💼' },
      { value: 'female',        label: 'Female Leader',      desc: 'I prefer a female discipleship leader',emoji: '👩‍💼' },
      { value: 'same',          label: 'Same Gender as Me',  desc: "A leader of the same gender",         emoji: '🤲' },
    ],
  },
];

// ─── Welcome Screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ userName, onStart }: { userName: string; onStart: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-lg w-full text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl text-5xl">
            ✝
          </div>
        </div>

        <Badge className="mb-4 bg-indigo-100 text-indigo-700 px-4 py-1.5 text-sm">
          Welcome to BFF+ ✨
        </Badge>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
          Hi, {userName?.split(' ')[0] || 'Friend'}! 👋
        </h1>

        <p className="text-base text-gray-600 mb-2 leading-relaxed">
          You're in the right place! <strong className="text-indigo-600">BFF+</strong> is your
          digital home for{' '}
          <span className="font-semibold">Belongingness, Fellowship, Focus</span> and{' '}
          <span className="font-semibold text-purple-600">Christ</span>.
        </p>
        <p className="text-sm text-gray-500 mb-10">
          Answer 5 quick questions so we can personalize your faith journey. Takes under 1 minute!
        </p>

        {/* What's inside */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: '📖', label: 'Bible Reader',       sub: '4 versions' },
            { icon: '💬', label: 'Discipleship Chat',  sub: 'Rule of Four safe' },
            { icon: '🏆', label: 'Faith Points',       sub: 'Earn badges' },
            { icon: '🤝', label: 'Small Groups',       sub: 'Find community' },
            { icon: '🙏', label: 'Prayer Wall',        sub: 'Pray together' },
            { icon: '📅', label: 'Events',             sub: 'QR check-in' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-2.5">
              <div className="text-xl mb-0.5">{item.icon}</div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">{item.label}</div>
              <div className="text-xs text-gray-400">{item.sub}</div>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg font-bold rounded-2xl shadow-xl"
          onClick={onStart}
        >
          Let's Get Started — 5 Questions!
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <p className="mt-4 text-xs text-gray-400">
          Your answers are private and help us serve you better
        </p>
      </div>
    </div>
  );
}

// ─── Completion Screen ─────────────────────────────────────────────────────────
function CompletionScreen({ userName, router }: { userName: string; router: any }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="max-w-lg w-full text-center">
        <div className="text-7xl mb-6">🎉</div>
        <Badge className="mb-4 bg-green-100 text-green-700 px-4 py-1.5">Profile Complete!</Badge>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          You're all set, {userName?.split(' ')[0] || 'Friend'}!
        </h2>
        <p className="text-gray-600 mb-8 leading-relaxed text-sm">
          Your personalized faith journey is ready. Start by opening your Bible, connecting with a leader,
          joining a small group, or posting on the prayer wall!
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { icon: '📖', label: 'Open Bible',   href: '/bible',       color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
            { icon: '💬', label: 'Start Chat',   href: '/chat',        color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { icon: '🤝', label: 'Join a Group', href: '/groups',      color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { icon: '🙏', label: 'Prayer Wall',  href: '/prayer-list', color: 'bg-red-50 border-red-200 text-red-700' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`rounded-2xl border-2 p-4 text-sm font-semibold flex flex-col items-center gap-2 transition-transform hover:scale-105 ${item.color}`}
            >
              <span className="text-2xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-bold rounded-2xl shadow-xl"
          onClick={() => router.push('/dashboard')}
        >
          Go to My Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [screen, setScreen] = useState<'welcome' | 'questions' | 'complete'>('welcome');
  const [step, setStep] = useState(0); // 0-based index into STEPS array
  const [answers, setAnswers] = useState<Record<string, string>>({
    spiritual_maturity: '',
    faith_goals: '',
    church_background: '',
    language: 'en',
    gender_preference: 'no_preference',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = session?.user as any;
  const userName = user?.name || 'Friend';
  const TOTAL = STEPS.length;
  const currentStep = STEPS[step];

  // Check if already onboarded
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/auth/onboarding-status')
        .then(r => r.json())
        .then(d => {
          if (d.completed) router.replace('/dashboard');
        });
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === 'welcome') {
    return <WelcomeScreen userName={userName} onStart={() => setScreen('questions')} />;
  }

  if (screen === 'complete') {
    return <CompletionScreen userName={userName} router={router} />;
  }

  // ── Questions screen ──────────────────────────────────────────────────────
  const canContinue = !!answers[currentStep.id];
  const isLastStep  = step === TOTAL - 1;
  const progress    = ((step + 1) / TOTAL) * 100;
  const StepIcon    = currentStep.icon;

  const handleSelect = (value: string) =>
    setAnswers(prev => ({ ...prev, [currentStep.id]: value }));

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
    else setScreen('welcome');
  };

  const handleNext = async () => {
    if (!isLastStep) {
      setStep(s => s + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spiritualMaturity: answers.spiritual_maturity,
          faithGoals:        answers.faith_goals,
          churchBackground:  answers.church_background,
          language:          answers.language,
          genderPreference:  answers.gender_preference,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      toast.success('Welcome to BFF+! Your journey begins now 🎉', { duration: 4000 });
      setScreen('complete');
    } catch {
      toast.error('Failed to save your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentStep.bg} flex flex-col`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">✝</div>
          <span className="font-bold text-gray-900 text-sm">BFF+</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          Step {step + 1} of {TOTAL}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="px-4 max-w-lg mx-auto w-full mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{Math.round(progress)}% complete</span>
          <span>{TOTAL - step - 1} step{TOTAL - step - 1 !== 1 ? 's' : ''} left</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-lg">
          <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden">
            {/* Gradient top bar */}
            <div className={`h-1.5 bg-gradient-to-r ${currentStep.color}`} />

            <CardContent className="p-6 sm:p-8">
              {/* Step header */}
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center shadow-lg shrink-0 text-xl`}>
                  {currentStep.emoji}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-snug">{currentStep.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{currentStep.subtitle}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-5 leading-relaxed">{currentStep.description}</p>

              {/* Options */}
              <div className="space-y-2.5">
                {currentStep.options.map((option) => {
                  const isSelected = answers[currentStep.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all duration-150 text-left group ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-gray-100 bg-gray-50 hover:border-indigo-200 hover:bg-white'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-100' : 'bg-white'
                      }`}>
                        {option.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                          {option.label}
                        </p>
                        {option.desc && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{option.desc}</p>
                        )}
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0 group-hover:border-indigo-300" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-7 pt-5 border-t border-gray-100 gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="px-5 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: TOTAL }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i === step       ? 'h-2 w-5 bg-indigo-600' :
                        i < step        ? 'h-2 w-2 bg-indigo-400' :
                                          'h-2 w-2 bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {!isLastStep ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canContinue}
                    className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-xl"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canContinue || isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 rounded-xl"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Finish 🎉'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-400 mt-4">
            You can update your preferences anytime in Profile Settings
          </p>
        </div>
      </div>
    </div>
  );
}
