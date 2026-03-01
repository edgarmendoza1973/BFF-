'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, MessageCircle, Calendar, Users, Heart, Play,
  Star, Shield, Globe, ChevronRight, Check, Quote,
  Zap, Lock, Bell, Award, Music, Video, ChevronDown,
  ArrowRight, Smartphone, Wifi, Target
} from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Bible Reader',
    desc: 'Read in ESV, NLT, ASND (Tagalog), or Pinoy Contemporary. Highlight, bookmark, and take notes on any verse.',
    color: 'bg-indigo-100 text-indigo-700',
    emoji: '📖',
  },
  {
    icon: MessageCircle,
    title: 'Discipleship Chat',
    desc: 'One-on-one chats with trained leaders. Gender-safe Rule of Four guidelines protect every conversation.',
    color: 'bg-blue-100 text-blue-700',
    emoji: '💬',
  },
  {
    icon: BookOpen,
    title: 'SOAP Journal',
    desc: 'Scripture · Observation · Application · Prayer. Private journaling with optional community sharing.',
    color: 'bg-purple-100 text-purple-700',
    emoji: '✍️',
  },
  {
    icon: Calendar,
    title: 'Events & QR Check-in',
    desc: 'RSVP to events, scan QR codes at the door, and track your attendance history automatically.',
    color: 'bg-green-100 text-green-700',
    emoji: '📅',
  },
  {
    icon: Users,
    title: 'Small Groups',
    desc: 'Join Bible study groups, prayer circles, worship teams, and more by category and language.',
    color: 'bg-amber-100 text-amber-700',
    emoji: '🤝',
  },
  {
    icon: Heart,
    title: 'Prayer Wall',
    desc: 'Share prayer requests with your community or keep them private. Track answered prayers with joy.',
    color: 'bg-red-100 text-red-700',
    emoji: '🙏',
  },
  {
    icon: Play,
    title: 'Sermon Library',
    desc: 'Listen to or watch sermons anytime. Take personal notes and download for offline listening.',
    color: 'bg-teal-100 text-teal-700',
    emoji: '🎵',
  },
  {
    icon: Star,
    title: 'Faith Points & Badges',
    desc: 'Earn points for spiritual disciplines. Level up from New Member to Shepherd with a faith journey tracker.',
    color: 'bg-yellow-100 text-yellow-700',
    emoji: '⭐',
  },
  {
    icon: Shield,
    title: 'Online Giving',
    desc: 'Secure giving via Stripe. Set recurring donations, choose your fund, and receive digital receipts.',
    color: 'bg-pink-100 text-pink-700',
    emoji: '💝',
  },
  {
    icon: Target,
    title: 'Reading Plans',
    desc: 'Follow structured reading plans — Bible in a Year, NT in 90 Days, Psalms & Proverbs, and more.',
    color: 'bg-orange-100 text-orange-700',
    emoji: '📋',
  },
  {
    icon: Award,
    title: 'COMPASS Discipleship',
    desc: 'Christ-centered, Obedience-oriented, Multiplying, Prayer-saturated, Accountable, Scripture-rooted, Spirit-led.',
    color: 'bg-cyan-100 text-cyan-700',
    emoji: '🧭',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    desc: 'Never miss an event, message, or prayer response. Smart notifications keep you connected.',
    color: 'bg-violet-100 text-violet-700',
    emoji: '🔔',
  },
];

const TESTIMONIALS = [
  {
    name: 'Pastor Michael R.',
    role: 'Senior Pastor',
    avatar: 'M',
    text: 'BFF+ transformed how we do discipleship. The COMPASS framework helps our leaders stay grounded and accountable. Our congregation feels more connected than ever.',
    color: 'bg-indigo-600',
  },
  {
    name: 'Sarah L.',
    role: 'Small Group Leader',
    avatar: 'S',
    text: 'I manage 3 small groups and the platform makes it effortless. Members love the Bible reader with multiple versions, especially our Filipino members using ASND.',
    color: 'bg-purple-600',
  },
  {
    name: 'Mark T.',
    role: 'New Believer',
    avatar: 'M',
    text: 'As someone new to faith, BFF+ felt like a gentle guide. The onboarding questions helped match me with the right leader, and the daily reading plan keeps me consistent.',
    color: 'bg-green-600',
  },
  {
    name: 'Alice K.',
    role: 'Church Member',
    avatar: 'A',
    text: 'The prayer wall is so meaningful. Being able to pray for others and see answered prayers builds such an incredible sense of community and faith.',
    color: 'bg-amber-600',
  },
];

const JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Create Your Account',
    desc: 'Sign up in under 60 seconds. No credit card required.',
    icon: '✝️',
  },
  {
    step: '02',
    title: 'Share Your Faith Journey',
    desc: 'Answer 5 quick questions so we can personalize your experience.',
    icon: '🗺️',
  },
  {
    step: '03',
    title: 'Connect with Your Community',
    desc: 'Join groups, chat with leaders, and dive into the Word together.',
    icon: '🤝',
  },
  {
    step: '04',
    title: 'Grow in Faith, Together',
    desc: 'Earn badges, complete reading plans, and track your spiritual growth.',
    icon: '🌱',
  },
];

const ROLES = [
  {
    title: '👥 Church Members',
    desc: 'Read the Bible, journal, chat with leaders, attend events, join groups, pray, and grow in faith.',
    features: ['Bible Reader (4 versions)', 'SOAP Journaling', 'Event RSVP & QR Check-in', 'Prayer Wall', 'Reading Plans', 'Faith Points & Badges'],
    badge: null,
    color: 'border-gray-200',
  },
  {
    title: '✝️ Leaders & Pastors',
    desc: 'Disciple members, track COMPASS metrics, manage groups, and oversee one-on-one conversations.',
    features: ['1:1 Discipleship Chat', 'COMPASS Metrics Dashboard', 'Group Management', 'Chat Escalation Oversight', 'Rule of Four Safety', 'Leader Dashboard'],
    badge: 'Most Popular',
    color: 'border-indigo-500',
  },
  {
    title: '⚙️ Administrators',
    desc: 'Full church management, user roles, donation oversight, content management, and analytics.',
    features: ['User & Role Management', 'Donation Reports', 'Content Administration', 'Push Notifications', 'Full Analytics', 'Broadcast Messaging'],
    badge: null,
    color: 'border-gray-200',
  },
];

const STATS = [
  { value: '4', label: 'Bible Versions', sub: 'ESV, NLT, ASND, PCB' },
  { value: '8', label: 'Languages', sub: 'EN, TL, ES, ZH & more' },
  { value: '12+', label: 'Feature Modules', sub: 'Full-featured platform' },
  { value: 'iOS/Android', label: 'Mobile Ready', sub: 'PWA + Capacitor' },
];

const FAQS = [
  {
    q: 'Is BFF+ free for church members?',
    a: 'Yes! Church members can access all core spiritual growth features for free. Online giving uses industry-standard Stripe processing fees.',
  },
  {
    q: 'How does the Rule of Four work?',
    a: 'To protect both members and leaders in one-on-one cross-gender chats, a guardian (pastor or admin) is automatically added as an observer after 4 messages in a 12-hour window.',
  },
  {
    q: 'What languages are supported?',
    a: 'BFF+ supports English, Filipino/Tagalog, Spanish, Chinese, Korean, Japanese, French, and German. The Bible reader includes ASND (Tagalog) and Pinoy Contemporary versions.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted in transit (HTTPS), passwords are bcrypt-hashed, and sessions use secure JWT tokens. Your journal entries are private by default.',
  },
  {
    q: 'Can I use BFF+ on mobile?',
    a: 'BFF+ is a Progressive Web App (PWA) that works on any browser. Native iOS and Android apps are available via Capacitor 8.',
  },
];

// ─── Interactive "Find Your Path" Quiz ────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'Where are you on your faith journey?',
    emoji: '🌱',
    options: [
      { value: 'new',         label: "I'm brand new to faith",        emoji: '🌱', desc: 'Just starting out' },
      { value: 'growing',     label: 'Growing, need guidance',         emoji: '🌿', desc: 'Building my foundation' },
      { value: 'established', label: 'Established believer',           emoji: '🌳', desc: 'Active church member' },
      { value: 'leader',      label: 'Ready to lead & mentor',         emoji: '✨', desc: 'Called to disciple others' },
    ],
  },
  {
    id: 'q2',
    question: 'What matters most to you right now?',
    emoji: '🎯',
    options: [
      { value: 'bible',       label: 'Daily Bible reading',            emoji: '📖', desc: 'Deepen in the Word' },
      { value: 'community',   label: 'Finding my community',           emoji: '🤝', desc: 'Connect with others' },
      { value: 'prayer',      label: 'Stronger prayer life',           emoji: '🙏', desc: 'Commune with God' },
      { value: 'serve',       label: 'Serving & volunteering',         emoji: '🛠️', desc: 'Give back to others' },
    ],
  },
];

// Recommendation logic based on quiz answers
function getRecommendation(answers: Record<string, string>) {
  const maturity = answers.q1;
  const goal     = answers.q2;

  if (maturity === 'new') {
    return {
      title: 'Start with the Bible Reader',
      desc:  "You're just beginning — and that's wonderful! Start by reading the Bible in your language, then join a small group of new believers like you.",
      features: ['📖 Bible in a Year Plan', '🤝 New Believers Group', '💬 Chat with a Leader'],
      cta:   'Begin Your Journey',
      color: 'from-green-500 to-emerald-600',
      emoji: '🌱',
    };
  }
  if (maturity === 'leader') {
    return {
      title: 'Lead with COMPASS',
      desc:  "You're ready to multiply. BFF+ gives you a full discipleship dashboard, COMPASS metrics, and tools to shepherd your flock effectively.",
      features: ['🧭 COMPASS Dashboard', '💬 1:1 Discipleship Chat', '📊 Member Progress Tracking'],
      cta:   'Access Leader Tools',
      color: 'from-purple-500 to-indigo-600',
      emoji: '✨',
    };
  }
  if (goal === 'bible') {
    return {
      title: 'Deep Dive into the Word',
      desc:  "Your love for Scripture is your greatest strength. Our multi-version Bible reader, SOAP journal, and reading plans will help you go deeper.",
      features: ['📖 4 Bible Versions', '✍️ SOAP Journal', '📋 Structured Reading Plans'],
      cta:   'Open the Bible Reader',
      color: 'from-indigo-500 to-blue-600',
      emoji: '📖',
    };
  }
  if (goal === 'community') {
    return {
      title: 'Find Your People',
      desc:  "Community is the heartbeat of BFF+. Join small groups by category and language, attend events, and connect on the prayer wall.",
      features: ['🤝 Small Groups', '📅 Events & Check-in', '🙏 Prayer Wall'],
      cta:   'Join a Community',
      color: 'from-amber-500 to-orange-600',
      emoji: '🤝',
    };
  }
  if (goal === 'prayer') {
    return {
      title: 'Deepen Your Prayer Life',
      desc:  "Prayer is the foundation of everything. Use our Prayer Wall, discipleship chat, and devotional reading plans to cultivate intimacy with God.",
      features: ['🙏 Community Prayer Wall', '💬 Mentored by a Leader', '📖 Devotional Plans'],
      cta:   'Start Praying Together',
      color: 'from-rose-500 to-pink-600',
      emoji: '🙏',
    };
  }
  return {
    title: 'Serve & Grow Together',
    desc:  "Service is worship! Sign up for volunteer opportunities, earn Faith Points, and watch your impact grow alongside your faith.",
    features: ['🛠️ Volunteer Sign-ups', '⭐ Faith Points & Badges', '🌍 Outreach Opportunities'],
    cta:   'Start Serving',
    color: 'from-teal-500 to-cyan-600',
    emoji: '🛠️',
  };
}

// ─── Quiz Component ────────────────────────────────────────────────────────────
function FindYourPathQuiz() {
  const [step, setStep]        = useState(0); // 0 = intro, 1-2 = questions, 3 = result
  const [answers, setAnswers]  = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>('');

  const currentQ = QUIZ_QUESTIONS[step - 1];
  const recommendation = step === QUIZ_QUESTIONS.length + 1 ? getRecommendation(answers) : null;

  const handleSelect = (value: string) => setSelected(value);

  const handleNext = () => {
    if (step > 0 && step <= QUIZ_QUESTIONS.length) {
      setAnswers(prev => ({ ...prev, [currentQ.id]: selected }));
    }
    setSelected('');
    setStep(s => s + 1);
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setSelected('');
  };

  // Intro
  if (step === 0) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">🧭</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Find Your Perfect Starting Point</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">
          Answer 2 quick questions and we'll show you exactly where to start your BFF+ journey.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-8 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span>⏱️</span> Only 30 seconds</span>
          <span className="flex items-center gap-1 ml-3"><span>🔒</span> No account needed</span>
          <span className="flex items-center gap-1 ml-3"><span>🎯</span> Personalized result</span>
        </div>
        <Button
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-5 rounded-2xl font-semibold shadow-lg"
          onClick={() => setStep(1)}
        >
          Take the Quiz
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Questions
  if (step <= QUIZ_QUESTIONS.length) {
    return (
      <div>
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {QUIZ_QUESTIONS.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i + 1 === step ? 'h-2 w-8 bg-indigo-600' : i + 1 < step ? 'h-2 w-2 bg-indigo-400' : 'h-2 w-2 bg-gray-200'}`} />
          ))}
        </div>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{currentQ.emoji}</div>
          <h3 className="text-xl font-bold text-gray-900">{currentQ.question}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {currentQ.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`rounded-2xl border-2 p-4 text-left flex items-center gap-3 transition-all ${
                selected === opt.value
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
              {selected === opt.value && (
                <div className="ml-auto h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setSelected(''); setStep(s => Math.max(0, s - 1)); }} className="px-6 rounded-xl">
            Back
          </Button>
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            disabled={!selected}
            onClick={handleNext}
          >
            {step === QUIZ_QUESTIONS.length ? 'See My Result →' : 'Next →'}
          </Button>
        </div>
      </div>
    );
  }

  // Result
  if (recommendation) {
    return (
      <div>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{recommendation.emoji}</div>
          <Badge className="mb-3 bg-green-100 text-green-700">Your Personalized Path</Badge>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{recommendation.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">{recommendation.desc}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-gray-50 to-indigo-50 border border-indigo-100 p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recommended for you:</p>
          <ul className="space-y-2">
            {recommendation.features.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/auth/register">
            <Button
              size="lg"
              className={`w-full bg-gradient-to-r ${recommendation.color} text-white py-5 rounded-2xl font-bold shadow-md text-base`}
            >
              {recommendation.cta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <button
            onClick={handleReset}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            ← Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              ✝
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg">BFF+</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-1.5">Building Faith Forward</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#find-your-path" className="hover:text-indigo-600 transition-colors font-medium text-indigo-600">Find My Path</a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Stories</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-gray-700">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                Join Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-24 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-5 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 text-sm">
            🌟 Your Complete Church Community Platform
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
            Belongingness.{' '}
            <span className="text-indigo-600">Fellowship.</span>
            <br />
            <span className="text-purple-600">Focus.</span>{' '}
            Christ.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            BFF+ is a full-featured church community platform where faith grows, communities connect,
            and disciples are made. Available on web, iOS, and Android — in 8 languages.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 px-10 py-6 text-base shadow-lg shadow-indigo-200">
                Start Your Faith Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-10 py-6 text-base border-gray-300">
                Sign In to Your Account
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Demo: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">alice@bffplus.church</code> / 
            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs ml-1">User@1234</code>
          </p>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center bg-white/70 backdrop-blur rounded-2xl p-4 shadow-sm border border-white">
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-green-100 text-green-700 hover:bg-green-100">Simple & Welcoming</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Your Faith Journey Starts Here</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Getting started takes less than 2 minutes. We guide you every step of the way.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {i < JOURNEY_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-indigo-200 to-transparent" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-2xl shadow-lg shadow-indigo-100 mb-4">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 bg-white text-indigo-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-indigo-100">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">{step.title}</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/auth/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 px-8">
                Get Started — It's Free
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Find Your Path Quiz ───────────────────────────────────── */}
      <section id="find-your-path" className="py-20 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Interactive Quiz</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Where Does Your Journey Begin?</h2>
            <p className="text-gray-500 mt-3 text-sm max-w-lg mx-auto">
              Tell us a little about yourself and we'll guide you to the perfect starting point in BFF+.
            </p>
          </div>
          <Card className="border-0 shadow-xl bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <FindYourPathQuiz />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">12 Powerful Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything Your Church Needs</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              One platform for spiritual growth, community connection, and church administration.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map(feature => (
              <Card key={feature.title} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center text-lg shadow-sm`}>
                      {feature.emoji}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based section */}
      <section id="roles" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-purple-100 text-purple-700 hover:bg-purple-100">Role-Based Access</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Built for Everyone in Your Church</h2>
            <p className="text-gray-500 mt-3">Tailored experiences for members, leaders, and administrators.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((role, i) => (
              <Card key={role.title} className={`border-2 ${role.color} shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-6">
                  {role.badge && (
                    <Badge className="mb-3 bg-indigo-600 text-white text-xs">{role.badge}</Badge>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{role.title}</h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">{role.desc}</p>
                  <ul className="space-y-2.5">
                    {role.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-amber-100 text-amber-700 hover:bg-amber-100">Real Stories</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Transforming Church Communities</h2>
            <p className="text-gray-500 mt-3">Stories from churches already using BFF+</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-5">
                  <Quote className="h-6 w-6 text-indigo-200 mb-3" />
                  <p className="text-sm text-gray-600 leading-relaxed mb-5 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className={`w-9 h-9 rounded-full ${t.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Faith Journey Highlights */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-3 bg-blue-100 text-blue-700 hover:bg-blue-100">Discipleship at Scale</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">The COMPASS Framework</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Every discipleship conversation in BFF+ is guided by the COMPASS framework — 
                ensuring Christ-centered, accountable, and scripturally-grounded interactions.
              </p>
              <ul className="space-y-3">
                {[
                  { letter: 'C', text: 'Christ-Centered conversations' },
                  { letter: 'O', text: 'Obedience-Oriented guidance' },
                  { letter: 'M', text: 'Multiplying disciples' },
                  { letter: 'P', text: 'Prayer-Saturated ministry' },
                  { letter: 'A', text: 'Accountable relationships' },
                  { letter: 'S', text: 'Scripture-Rooted counsel' },
                  { letter: 'S', text: 'Spirit-Led conversations' },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                      {item.letter}
                    </div>
                    <span className="text-gray-700 text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {[
                { icon: '🔒', title: 'Rule of Four Safety', desc: 'Guardian auto-added to cross-gender chats after 4 messages in 12 hours for accountability.' },
                { icon: '🏆', title: 'Faith Progression System', desc: 'Level up from New Member → Growing → Established → Leader Track → Shepherd.' },
                { icon: '🌍', title: 'Multilingual Support', desc: 'Full support for 8 languages including Filipino, Chinese, Korean, and Spanish.' },
                { icon: '📱', title: 'Works Everywhere', desc: 'PWA for any browser, or install as a native app on iOS and Android.' },
              ].map(item => (
                <div key={item.title} className="flex gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-gray-100 text-gray-700 hover:bg-gray-100">FAQ</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 flex-shrink-0 ml-2 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-6">Built with production-grade technology</h3>
          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              'Next.js 15', 'TypeScript', 'SQLite / PostgreSQL', 'NextAuth.js',
              'Tailwind CSS', 'shadcn/ui', 'Zustand', 'Stripe',
              'Firebase FCM', 'Capacitor 8', 'PWA', 'date-fns',
            ].map(tech => (
              <span key={tech} className="px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="start" className="py-24 px-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-2xl mx-auto text-center text-white relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-6 text-3xl">
            ✝
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Build Faith Forward?</h2>
          <p className="text-indigo-100 mb-10 text-lg leading-relaxed">
            Join thousands of believers growing in faith together. 
            Create your free account and start your faith journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 px-10 py-6 text-base font-semibold shadow-xl">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 px-10 py-6 text-base">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-indigo-200 text-sm">
            No credit card required · Free for all church members · Available on iOS & Android
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                ✝
              </div>
              <div>
                <span className="text-base font-bold text-gray-900">BFF+</span>
                <p className="text-xs text-gray-400">Belongingness, Fellowship, Focus and Christ</p>
              </div>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
              <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© 2026 BFF+ Church App. All rights reserved.</p>
            <p className="text-xs text-gray-400">Built with ❤️ for the Kingdom of God</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
