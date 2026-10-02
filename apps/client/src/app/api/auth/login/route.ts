import { connectDB } from '@tp/shared/db';
import { jsonError, routeError } from '@tp/shared/http';
import { COOKIE_NAMES, sessionCookieOptions, signSession } from '@tp/shared/jwt';
import { User } from '@tp/shared/models';
import { dummyHash, verifyPassword } from '@tp/shared/password';
import { loginSchema } from '@tp/shared/validation';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = loginSchema.parse(await req.json());
    await connectDB();
    // Only the User collection is checked: admin accounts can never sign in here.
    const user = await User.findOne({ email }).select('+passwordHash').lean();
    const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash());
    if (!user || !ok) return jsonError('Email or password is incorrect.', 401);

    const token = await signSession({ sub: String(user._id), role: 'user', email: user.email, name: user.name });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAMES.user, token, sessionCookieOptions);
    return res;
  } catch (err) {
    return routeError(err);
  }
}
