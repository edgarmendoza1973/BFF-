import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_PREFIXES = [
  '/dashboard', '/bible', '/soap-journal', '/chat', '/community',
  '/events', '/groups', '/profile', '/notifications', '/volunteer',
  '/reading-plans', '/search', '/sermons', '/giving', '/prayer-list',
  '/admin', '/onboarding', '/leader',
];

const ADMIN_PREFIXES = ['/admin'];
const LEADER_PREFIXES = ['/leader'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage  = pathname.startsWith('/auth/');

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'bff-plus-secret-change-in-production',
  });

  // Not logged in → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    const role = token.role as string;

    // Logged-in users away from auth pages
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Check live onboarding status from DB (via internal API) for protected pages
    if (isProtected && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api')) {
      try {
        const statusUrl = new URL('/api/auth/onboarding-status', req.url);
        const statusRes = await fetch(statusUrl.toString(), {
          headers: { cookie: req.headers.get('cookie') || '' },
        });
        if (statusRes.ok) {
          const { completed } = await statusRes.json();
          if (!completed) {
            return NextResponse.redirect(new URL('/onboarding', req.url));
          }
        }
      } catch {
        // If check fails, fall through (don't block the user)
      }
    }

    // Admin paths — only admin/pastor can access
    if (ADMIN_PREFIXES.some(p => pathname.startsWith(p))) {
      if (!['admin', 'pastor'].includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Leader paths — leader/pastor/admin can access
    if (LEADER_PREFIXES.some(p => pathname.startsWith(p))) {
      if (!['leader', 'pastor', 'admin'].includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
