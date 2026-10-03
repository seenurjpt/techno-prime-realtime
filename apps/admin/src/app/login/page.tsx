import { LoginForm } from '@tp/ui/LoginForm';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin sign in' };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  const redirectTo = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  return (
    <LoginForm
      title="Admin console"
      subtitle="Sign in to manage users and balances."
      redirectTo={redirectTo}
      notice={reason === 'expired' ? 'Your session expired. Sign in again to continue.' : undefined}
      flash={reason === 'signed-out' ? 'Signed out' : undefined}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-on-brand">
          <AdminPanelSettings sx={{ fontSize: 16 }} /> Techno Prime Admin
        </span>
      }
      footer="Admin accounts only. Customer accounts sign in through the client app."
    />
  );
}
