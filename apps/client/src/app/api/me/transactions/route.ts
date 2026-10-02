import { jsonError, routeError } from '@tp/shared/http';
import { getRecentCredits } from '@/lib/account';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError('Sign in to continue.', 401);
  try {
    return Response.json({ credits: await getRecentCredits(session.sub) });
  } catch (err) {
    return routeError(err);
  }
}
