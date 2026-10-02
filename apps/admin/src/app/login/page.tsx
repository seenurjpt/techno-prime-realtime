import { LoginForm } from '@tp/ui/LoginForm';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin sign in' };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const redirectTo = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  return (
    <LoginForm
      title="Admin console"
      subtitle="Sign in to manage users and balances."
      redirectTo={redirectTo}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-ink px-2.5 py-1 text-xs font-semibold text-white">
          <AdminPanelSettings sx={{ fontSize: 16 }} /> Techno Prime Admin
        </span>
      }
      footer="Admin accounts only. Customer accounts sign in through the client app."
    />
  );
}
