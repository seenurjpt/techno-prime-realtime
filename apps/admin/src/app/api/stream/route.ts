import { userEventStream } from '@tp/shared/sse';
import { requireAdmin } from '@/lib/guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admins receive every user insert/update/delete. */
export async function GET(req: Request) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  return userEventStream(req.signal);
}
