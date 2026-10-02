import { connectDB } from '@tp/shared/db';
import { routeError } from '@tp/shared/http';
import { User } from '@tp/shared/models';
import { hashPassword } from '@tp/shared/password';
import { toPublicUser } from '@tp/shared/serialize';
import { createUserSchema } from '@tp/shared/validation';
import { requireAdmin } from '@/lib/guard';
import { listUsers } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  try {
    return Response.json({ users: await listUsers() });
  } catch (err) {
    return routeError(err);
  }
}

export async function POST(req: Request) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  try {
    const { password, ...data } = createUserSchema.parse(await req.json());
    await connectDB();
    const doc = await User.create({ ...data, passwordHash: await hashPassword(password) });
    return Response.json({ user: toPublicUser(doc.toObject()) }, { status: 201 });
  } catch (err) {
    return routeError(err);
  }
}
