import { jsonError } from '@tp/shared/http';
import { userEventStream } from '@tp/shared/sse';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A user only ever receives changes to their own document — filtered server-side. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return jsonError('Sign in to continue.', 401);
  return userEventStream(req.signal, session.sub);
}
