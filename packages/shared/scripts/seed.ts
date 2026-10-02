import mongoose from 'mongoose';
import { connectDB } from '../src/db';
import { Admin, User } from '../src/models';
import { hashPassword } from '../src/password';

const email = (process.env.ADMIN_EMAIL ?? 'admin@technoprime.dev').toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? 'Admin@123';

const demoUsers = [
  { name: 'Aarav Shah', city: 'Ahmedabad', email: 'aarav@example.com', mobile: '9876543210' },
  { name: 'Diya Patel', city: 'Surat', email: 'diya@example.com', mobile: '9898989898' },
  { name: 'Kabir Mehta', city: 'Jaipur', email: 'kabir@example.com', mobile: '9123456780' },
];

async function main() {
  await connectDB();
  await Promise.all([Admin.syncIndexes(), User.syncIndexes()]);

  await Admin.updateOne(
    { email },
    { $set: { email, name: 'Admin', passwordHash: await hashPassword(password) } },
    { upsert: true },
  );
  console.log(`✔ Admin ready  → ${email} / ${password}`);

  const userHash = await hashPassword('User@123');
  for (const u of demoUsers) {
    await User.updateOne({ email: u.email }, { $setOnInsert: { ...u, passwordHash: userHash } }, { upsert: true });
  }
  console.log(`✔ Demo users   → ${demoUsers.map((u) => u.email).join(', ')} (password: User@123)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
