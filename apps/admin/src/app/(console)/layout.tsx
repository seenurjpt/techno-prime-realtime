import { getSession } from '@/lib/session';
import { AppHeader } from '@/components/AppHeader';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <>
      <AppHeader email={session.email} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
