import { COOKIE_NAMES } from '@tp/shared/jwt';
import { NextResponse, type NextRequest } from 'next/server';

function logout(req: NextRequest) {
  // The sign-out button posts here; server-side redirects (account removed) use GET with a reason.
  const reason = req.method === 'POST' ? 'signed-out' : req.nextUrl.searchParams.get('reason');
  const url = new URL('/login', req.url);
  if (reason === 'removed' || reason === 'signed-out') url.searchParams.set('reason', reason);
  const res = NextResponse.redirect(url, 303);
  res.cookies.delete(COOKIE_NAMES.user);
  return res;
}

export const POST = logout;
export const GET = logout; // used for server-side redirects when the account no longer exists
