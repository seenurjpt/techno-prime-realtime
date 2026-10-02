import 'server-only';
import { jsonError } from '@tp/shared/http';
import { getSession } from './session';

/** For route handlers: returns the admin session, or a 401 Response to return as-is. */
export async function requireAdmin() {
  const session = await getSession();
  return session ? { session, denied: null } : { session: null, denied: jsonError('Sign in to continue.', 401) };
}
