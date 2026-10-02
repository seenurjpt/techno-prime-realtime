// Edge-safe: imported by middleware, so this file must not touch mongoose or Node APIs.
import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import type { Role, SessionPayload } from './types';

export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * Separate cookie names per app. Browsers share cookies across ports on the same host,
 * so localhost:3000 and localhost:3001 would otherwise overwrite each other's session.
 */
export const COOKIE_NAMES: Record<Role, string> = {
  admin: 'tp_admin_session',
  user: 'tp_client_session',
};

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET must be set and at least 32 characters long');
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setAudience(`tp:${payload.role}`)
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

/** Returns the session only if the token is valid AND was issued for the expected role. */
export async function verifySession(token: string | undefined, expected: Role): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: `tp:${expected}`, algorithms: ['HS256'] });
    if (payload.role !== expected || !payload.sub) return null;
    return {
      sub: payload.sub,
      role: expected,
      email: String(payload.email ?? ''),
      name: payload.name ? String(payload.name) : undefined,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};
