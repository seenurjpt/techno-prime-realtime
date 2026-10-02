import { COOKIE_NAMES } from '@tp/shared/jwt';
import { NextResponse, type NextRequest } from 'next/server';

function logout(req: NextRequest) {
  const reason = req.nextUrl.searchParams.get('reason');
  const url = new URL('/login', req.url);
  if (reason === 'removed') url.searchParams.set('reason', 'removed');
  const res = NextResponse.redirect(url, 303);
  res.cookies.delete(COOKIE_NAMES.admin);
  return res;
}

export const POST = logout;
export const GET = logout; // used for server-side redirects when the account no longer exists
