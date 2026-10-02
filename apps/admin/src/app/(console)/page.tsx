import { UsersConsole } from '@/components/UsersConsole';
import { listUsers } from '@/lib/users';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users' };
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  // Rendered on the server so the table is populated on first paint; live updates take over after.
  const users = await listUsers();
  return <UsersConsole initialUsers={users} />;
}
