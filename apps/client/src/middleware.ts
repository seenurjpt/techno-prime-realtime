import { COOKIE_NAMES, verifySession } from '@tp/shared/jwt';
import { NextResponse, type NextRequest } from 'next/server';

const ROLE = 'user' as const;
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  const session = await verifySession(req.cookies.get(COOKIE_NAMES[ROLE])?.value, ROLE);

  // Signed-in visitors don't need the login page.
  if (pathname === '/login' && session) return NextResponse.redirect(new URL('/', req.url));
  if (isPublic || session) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  }
  // A present-but-invalid cookie (expired, or another app's token) gets cleared, and the login page says why.
  const stale = req.cookies.has(COOKIE_NAMES[ROLE]);
  const url = new URL('/login', req.url);
  if (pathname !== '/') url.searchParams.set('next', pathname + search);
  if (stale) url.searchParams.set('reason', 'expired');
  const res = NextResponse.redirect(url);
  if (stale) res.cookies.delete(COOKIE_NAMES[ROLE]);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
