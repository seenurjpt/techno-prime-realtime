import { connectDB } from '@tp/shared/db';
import { routeError, jsonError } from '@tp/shared/http';
import { COOKIE_NAMES, sessionCookieOptions, signSession } from '@tp/shared/jwt';
import { Admin } from '@tp/shared/models';
import { dummyHash, verifyPassword } from '@tp/shared/password';
import { loginSchema } from '@tp/shared/validation';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password } = loginSchema.parse(await req.json());
    await connectDB();
    // Only the Admin collection is checked: client users can never sign in here.
    const admin = await Admin.findOne({ email }).select('+passwordHash').lean();
    const ok = await verifyPassword(password, admin?.passwordHash ?? dummyHash());
    if (!admin || !ok) return jsonError('Email or password is incorrect.', 401);

    const token = await signSession({ sub: String(admin._id), role: 'admin', email: admin.email, name: admin.name });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAMES.admin, token, sessionCookieOptions);
    return res;
  } catch (err) {
    return routeError(err);
  }
}
