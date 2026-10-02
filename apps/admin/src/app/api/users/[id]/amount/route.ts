import { connectDB } from '@tp/shared/db';
import { isObjectId, jsonError, routeError } from '@tp/shared/http';
import { Transaction, User } from '@tp/shared/models';
import { toPublicUser } from '@tp/shared/serialize';
import type { PublicUser } from '@tp/shared/types';
import { addAmountSchema } from '@tp/shared/validation';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/guard';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Adds to the user's balance. `$inc` is atomic, so two admins topping up at the same
 * moment both land (no read-modify-write race). The balance change and its ledger entry
 * are written in one transaction so they can never disagree.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { session: admin, denied } = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  if (!isObjectId(id)) return jsonError('User not found.', 404);

  try {
    const { amount, note } = addAmountSchema.parse(await req.json());
    const delta = mongoose.Types.Decimal128.fromString(amount.toFixed(2));
    await connectDB();

    let updated = null as PublicUser | null;
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        const doc = await User.findByIdAndUpdate(id, { $inc: { amount: delta } }, { new: true, session: dbSession }).lean();
        if (!doc) return;
        await Transaction.create(
          [{ userId: doc._id, delta, balanceAfter: doc.amount, createdBy: admin.sub, note }],
          { session: dbSession },
        );
        updated = toPublicUser(doc);
      });
    } finally {
      await dbSession.endSession();
    }

    if (!updated) return jsonError('User not found. They may have been deleted.', 404);
    return Response.json({ user: updated });
  } catch (err) {
    return routeError(err);
  }
}
