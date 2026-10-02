import { ZodError } from 'zod';
import { fieldErrors } from './validation';

export const jsonError = (error: string, status: number, fields?: Record<string, string>) =>
  Response.json({ error, ...(fields ? { fields } : {}) }, { status });

/** Maps known failure types to clean HTTP responses; logs and hides everything else. */
export function routeError(err: unknown): Response {
  if (err instanceof ZodError) {
    return jsonError('Check the highlighted fields.', 422, fieldErrors(err));
  }
  if (typeof err === 'object' && err && 'code' in err && (err as { code: number }).code === 11000) {
    const key = Object.keys((err as { keyPattern?: object }).keyPattern ?? { email: 1 })[0] ?? 'email';
    return jsonError(`A user with this ${key} already exists.`, 409, { [key]: `This ${key} is already in use` });
  }
  if (err instanceof SyntaxError) return jsonError('Request body must be valid JSON.', 400);
  console.error('[api] unexpected error', err);
  return jsonError('Something went wrong on the server. Try again.', 500);
}

export const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);
