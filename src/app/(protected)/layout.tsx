"use client";
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Home, BookOpen, PenLine, MessageCircle, Users, Calendar,
  Play, Heart, HandHeart, BookMarked, Search, Bell, User,
  LogOut, ChevronRight, Menu, X, Shield, LayoutGrid
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/features/LanguageSwitcher';

const NAV_ITEMS = [
  { href: '/dashboard',     icon: Home,          label: 'Dashboard',      roles: ['user','leader','pastor','admin'] },
  { href: '/bible',         icon: BookOpen,      label: 'Bible',          roles: ['user','leader','pastor','admin'] },
  { href: '/soap-journal',  icon: PenLine,       label: 'SOAP Journal',   roles: ['user','leader','pastor','admin'] },
  { href: '/chat',          icon: MessageCircle, label: 'Chat',           roles: ['user','leader','pastor','admin'] },
  { href: '/community',     icon: LayoutGrid,    label: 'Community',      roles: ['user','leader','pastor','admin'] },
  { href: '/events',        icon: Calendar,      label: 'Events',         roles: ['user','leader','pastor','admin'] },
  { href: '/groups',        icon: Users,         label: 'Groups',         roles: ['user','leader','pastor','admin'] },
  { href: '/sermons',       icon: Play,          label: 'Sermons',        roles: ['user','leader','pastor','admin'] },
  { href: '/giving',        icon: Heart,         label: 'Giving',         roles: ['user','leader','pastor','admin'] },
  { href: '/prayer-list',   icon: HandHeart,     label: 'Prayer',         roles: ['user','leader','pastor','admin'] },
  { href: '/volunteer',     icon: Heart,         label: 'Volunteer',      roles: ['user','leader','pastor','admin'] },
  { href: '/reading-plans', icon: BookMarked,    label: 'Reading Plans',  roles: ['user','leader','pastor','admin'] },
  { href: '/search',        icon: Search,        label: 'Search',         roles: ['user','leader','pastor','admin'] },
  { href: '/notifications', icon: Bell,          label: 'Notifications',  roles: ['user','leader','pastor','admin'] },
  { href: '/profile',       icon: User,          label: 'Profile',        roles: ['user','leader','pastor','admin'] },
  { href: '/admin',         icon: Shield,        label: 'Admin',          roles: ['admin','pastor'] },
];

const BOTTOM_NAV = [
  { href: '/dashboard',    icon: Home,          label: 'Home'     },
  { href: '/bible',        icon: BookOpen,      label: 'Bible'    },
  { href: '/chat',         icon: MessageCircle, label: 'Chat'     },
  { href: '/community',    icon: LayoutGrid,    label: 'Community'},
  { href: '/profile',      icon: User,          label: 'Profile'  },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = session?.user as any;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) return null;

  const filteredNav = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role || 'user')
  );

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={`flex flex-col h-full ${mobile ? 'p-4' : 'p-3'}`}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          ✝
        </div>
        <div>
          <span className="font-bold text-gray-900 text-base">BFF+</span>
          <p className="text-xs text-gray-400 leading-none">Church Community</p>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {filteredNav.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {item.label}
              {item.href === '/admin' && (
                <Badge className="ml-auto text-xs bg-red-100 text-red-600 hover:bg-red-100">Admin</Badge>
              )}
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div className="pt-3 mt-3 border-t">
        <div className="flex items-center gap-2 px-2 mb-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
              {(user?.name || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 capitalize truncate">{user?.role || 'member'}</p>
          </div>
        </div>
        {/* Language switcher in sidebar */}
        <div className="px-2 mb-1">
          <LanguageSwitcher variant="full" className="w-full" />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-200 shrink-0 overflow-hidden">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-white h-full shadow-xl overflow-y-auto z-10">
            <button
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-white text-xs">✝</div>
            <span className="font-bold text-gray-900">BFF+</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Link href="/notifications">
              <button className="p-1.5 rounded-md hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <Link href="/search">
              <button className="p-1.5 rounded-md hover:bg-gray-100">
                <Search className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex">
            {BOTTOM_NAV.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
