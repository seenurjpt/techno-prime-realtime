import { Dashboard } from '@/components/Dashboard';
import { getAccount, getRecentCredits } from '@/lib/account';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const [user, credits] = await Promise.all([getAccount(session.sub), getRecentCredits(session.sub)]);
  // Valid token but the admin deleted the account: clear the cookie via the logout route.
  if (!user) redirect('/api/auth/logout?reason=removed');
  return <Dashboard initialUser={user} initialCredits={credits} />;
}
