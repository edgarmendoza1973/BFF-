'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Home, BookOpen, PenLine, MessageCircle, Users, Music, Heart,
  HandHeart, BookMarked, Bell, Search, User, LogOut, Shield,
  Cross, Globe, ChevronDown, LayoutDashboard
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, type LangCode, t } from '@/lib/i18n';

const navItems = [
  { href: '/dashboard',     labelKey: 'nav.home',         icon: Home },
  { href: '/bible',         labelKey: 'nav.bible',        icon: BookOpen },
  { href: '/soap-journal',  labelKey: 'nav.journal',      icon: PenLine },
  { href: '/chat',          labelKey: 'nav.chat',         icon: MessageCircle },
  { href: '/community',     labelKey: 'nav.community',    icon: Users },
  { href: '/sermons',       labelKey: 'nav.sermons',      icon: Music },
  { href: '/giving',        labelKey: 'nav.give',         icon: Heart },
  { href: '/prayer-list',   labelKey: 'nav.prayer',       icon: HandHeart },
  { href: '/volunteer',     labelKey: 'nav.volunteer',    icon: HandHeart },
  { href: '/reading-plans', labelKey: 'nav.readingPlans', icon: BookMarked },
];

function useLang(): [LangCode, (l: LangCode) => void] {
  const [lang, setLangState] = useState<LangCode>('en');
  useEffect(() => {
    const stored = (localStorage.getItem('bff_lang') || 'en') as LangCode;
    setLangState(stored);
  }, []);
  const setLang = (l: LangCode) => {
    localStorage.setItem('bff_lang', l);
    setLangState(l);
  };
  return [lang, setLang];
}

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [lang, setLang] = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = SUPPORTED_LANGUAGES.find(l => l.code === lang);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors',
          compact ? 'p-2' : 'px-2 py-1.5 text-xs'
        )}
        title="Change language"
      >
        <Globe className="h-4 w-4" />
        {!compact && (
          <>
            <span>{current?.flag} {current?.code.toUpperCase()}</span>
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
          {SUPPORTED_LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50',
                lang === l.code ? 'text-indigo-600 font-medium' : 'text-gray-700'
              )}
            >
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount } = useNotificationStore();
  const [lang] = useLang();
  const role = (session?.user as any)?.role;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Cross className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">BFF+</h1>
            <p className="text-xs text-gray-500 leading-none mt-0.5">Community</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          const label = t(item.labelKey, lang) || item.labelKey.split('.')[1];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Leader Dashboard */}
        {['leader', 'pastor', 'admin'].includes(role) && (
          <Link
            href="/leader"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/leader') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span>Leader Dashboard</span>
          </Link>
        )}

        {/* Admin section */}
        {['admin', 'pastor'].includes(role) && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/admin') ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              <span>Admin Dashboard</span>
            </Link>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={(session?.user as any)?.image} />
            <AvatarFallback>{getInitials(session?.user?.name || 'U')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{(session?.user as any)?.memberLevel?.replace(/_/g, ' ')}</p>
          </div>
          <Link href="/notifications" className="relative text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <Link href="/search" className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-500 hover:bg-gray-50">
            <Search className="h-4 w-4" />
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-500 hover:bg-gray-50">
            <User className="h-4 w-4" />
          </Link>
          <LanguageSwitcher compact />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/bible', label: 'Bible', icon: BookOpen },
    { href: '/soap-journal', label: 'Journal', icon: PenLine },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/community', label: 'Community', icon: Users },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around py-2">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                isActive ? 'text-indigo-600' : 'text-gray-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession();
  const { unreadCount } = useNotificationStore();

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {title ? (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Cross className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">BFF+</span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link href="/search" className="p-2 text-gray-500 hover:text-gray-700">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <LanguageSwitcher compact />
          <Link href="/profile">
            <Avatar className="h-8 w-8">
              <AvatarImage src={(session?.user as any)?.image} />
              <AvatarFallback className="text-xs">{getInitials(session?.user?.name || 'U')}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
