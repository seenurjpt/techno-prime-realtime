import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import { LoginForm } from '@tp/ui/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  const redirectTo = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  return (
    <LoginForm
      title="Welcome back"
      subtitle="Sign in to see your balance and account details."
      redirectTo={redirectTo}
      notice={
        reason === 'removed'
          ? 'Your account was removed by an administrator.'
          : reason === 'expired'
            ? 'Your session expired. Sign in again to continue.'
            : undefined
      }
      flash={reason === 'signed-out' ? 'Signed out' : undefined}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-on-brand">
          <AccountBalanceWallet sx={{ fontSize: 16 }} /> Techno Prime
        </span>
      }
      footer="Your login is created by an administrator. Contact them if you can't sign in."
    />
  );
}
