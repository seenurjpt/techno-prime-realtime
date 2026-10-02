import 'server-only';
import { COOKIE_NAMES, verifySession } from '@tp/shared/jwt';
import type { SessionPayload } from '@tp/shared/types';
import { cookies } from 'next/headers';
import { cache } from 'react';

/** Per-request memoised session lookup. Middleware already gates pages; this is defence in depth. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAMES.user)?.value, 'user');
});
