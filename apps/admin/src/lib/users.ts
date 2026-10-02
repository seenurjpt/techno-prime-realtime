import 'server-only';
import { connectDB } from '@tp/shared/db';
import { User } from '@tp/shared/models';
import { toPublicUser } from '@tp/shared/serialize';

export async function listUsers() {
  await connectDB();
  const docs = await User.find().sort({ createdAt: -1 }).limit(500).lean();
  return docs.map(toPublicUser);
}
