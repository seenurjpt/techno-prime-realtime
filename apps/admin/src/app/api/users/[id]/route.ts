import { connectDB } from '@tp/shared/db';
import { isObjectId, jsonError, routeError } from '@tp/shared/http';
import { Transaction, User } from '@tp/shared/models';
import { hashPassword } from '@tp/shared/password';
import { toPublicUser } from '@tp/shared/serialize';
import { updateUserSchema } from '@tp/shared/validation';
import { requireAdmin } from '@/lib/guard';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!isObjectId(id)) return jsonError('User not found.', 404);
  try {
    const { password, ...data } = updateUserSchema.parse(await req.json());
    await connectDB();
    const update = password ? { ...data, passwordHash: await hashPassword(password) } : data;
    const doc = await User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!doc) return jsonError('User not found. They may have been deleted.', 404);
    return Response.json({ user: toPublicUser(doc) });
  } catch (err) {
    return routeError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!isObjectId(id)) return jsonError('User not found.', 404);
  try {
    await connectDB();
    const doc = await User.findByIdAndDelete(id).lean();
    if (!doc) return jsonError('User not found. They may have been deleted already.', 404);
    await Transaction.deleteMany({ userId: id });
    return new Response(null, { status: 204 });
  } catch (err) {
    return routeError(err);
  }
}
