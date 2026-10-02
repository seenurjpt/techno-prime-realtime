import 'server-only';
import { connectDB } from '@tp/shared/db';
import { Transaction, User } from '@tp/shared/models';
import { toPublicUser } from '@tp/shared/serialize';

export type Credit = { id: string; delta: number; balanceAfter: number; note?: string; createdAt: string };

export async function getAccount(userId: string) {
  await connectDB();
  const doc = await User.findById(userId).lean();
  return doc ? toPublicUser(doc) : null;
}

export async function getRecentCredits(userId: string, limit = 8): Promise<Credit[]> {
  await connectDB();
  const docs = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map((t) => ({
    id: String(t._id),
    delta: Number(t.delta.toString()),
    balanceAfter: Number(t.balanceAfter.toString()),
    note: t.note ?? undefined,
    createdAt: new Date(t.createdAt as Date).toISOString(),
  }));
}
