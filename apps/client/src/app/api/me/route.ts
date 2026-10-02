import { jsonError, routeError } from '@tp/shared/http';
import { getAccount } from '@/lib/account';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError('Sign in to continue.', 401);
  try {
    const user = await getAccount(session.sub);
    return user ? Response.json({ user }) : jsonError('This account no longer exists.', 410);
  } catch (err) {
    return routeError(err);
  }
}
