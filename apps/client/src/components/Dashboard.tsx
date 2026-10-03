'use client';
import Logout from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import { formatAmount, formatDateTime } from '@tp/shared/format';
import type { PublicUser, UserEvent } from '@tp/shared/types';
import { api } from '@tp/ui/api';
import { LiveIndicator } from '@tp/ui/LiveIndicator';
import { ThemeToggle } from '@tp/ui/ThemeToggle';
import { useToast } from '@tp/ui/toast';
import { useLiveStream } from '@tp/ui/useLiveStream';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Credit } from '@/lib/account';
import { useAnimatedNumber } from './useAnimatedNumber';

type Props = { initialUser: PublicUser; initialCredits: Credit[] };
const REMOVED_URL = '/api/auth/logout?reason=removed';

export function Dashboard({ initialUser, initialCredits }: Props) {
  const notify = useToast();
  const [user, setUser] = useState(initialUser);
  const [credits, setCredits] = useState(initialCredits);
  const [lastCredit, setLastCredit] = useState<{ delta: number; key: number } | null>(null);
  const [removed, setRemoved] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  const refreshCredits = useCallback(() => {
    api<{ credits: Credit[] }>('/api/me/transactions')
      .then(({ credits }) => setCredits(credits))
      .catch(() => undefined);
  }, []);

  const applyUpdate = useCallback(
    (next: PublicUser) => {
      const prev = userRef.current;
      if (next.updatedAt < prev.updatedAt) return;
      const delta = Math.round((next.amount - prev.amount) * 100) / 100;
      setUser(next);
      if (delta !== 0) {
        if (delta > 0) {
          setLastCredit({ delta, key: Date.now() });
          notify(`${formatAmount(delta)} was added to your balance`);
        }
        refreshCredits();
      } else if (next.name !== prev.name || next.city !== prev.city || next.email !== prev.email || next.mobile !== prev.mobile) {
        notify('Your details were updated by an administrator', 'info');
      }
    },
    [notify, refreshCredits],
  );

  const status = useLiveStream<UserEvent>('/api/stream', {
    onEvent: (event) => {
      if (event.type === 'delete') setRemoved(true);
      else applyUpdate(event.user);
    },
    onReady: (reconnected) => {
      if (!reconnected) return;
      api<{ user: PublicUser }>('/api/me')
        .then(({ user }) => applyUpdate(user))
        .catch((err) => {
          if (err?.status === 410) setRemoved(true);
        });
    },
  });

  // Hide the "+₹X" credit marker after a few seconds.
  useEffect(() => {
    if (!lastCredit) return;
    const t = setTimeout(() => setLastCredit(null), 4000);
    return () => clearTimeout(t);
  }, [lastCredit]);

  useEffect(() => {
    if (!removed) return;
    const t = setTimeout(() => window.location.assign(REMOVED_URL), 5000);
    return () => clearTimeout(t);
  }, [removed]);

  const shown = useAnimatedNumber(user.amount);
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <header className="border-b border-line bg-canvas">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-brand text-sm font-bold text-on-brand">
              T
            </span>
            <span className="text-base font-semibold text-fg">Techno Prime</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/api/auth/logout" method="post">
              <Button type="submit" size="small" color="inherit" startIcon={<Logout fontSize="small" />}>
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Hi, {firstName}</h1>
          <LiveIndicator status={status} />
        </div>

        {/* The balance is the one loud element on the page: a dark card in both modes with the number in yellow. */}
        <section
          aria-labelledby="balance-label"
          className="mt-6 rounded-xl border border-hero-line bg-hero px-6 py-8 text-[#eaecef] sm:px-10 sm:py-10"
        >
          <p id="balance-label" className="text-sm font-medium text-[#929aa5]">
            Available balance
          </p>
          <p
            className="tabular mt-2 text-[2.5rem] font-bold leading-[1.1] tracking-[-0.3px] text-brand sm:text-6xl"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatAmount(shown)}
          </p>
          <div className="mt-4 h-7">
            {lastCredit ? (
              <span
                key={lastCredit.key}
                className="tabular inline-flex items-center gap-1 rounded bg-[#0ecb81]/15 px-2.5 py-1 text-sm font-semibold text-[#0ecb81] motion-safe:animate-[credit-in_400ms_ease-out]"
              >
                <span aria-hidden>▲</span> +{formatAmount(lastCredit.delta)} added just now
              </span>
            ) : (
              <span className="text-sm text-[#929aa5]">Last updated {formatDateTime(user.updatedAt)}</span>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-5">
          <Paper variant="outlined" className="p-6 md:col-span-2">
            <h2 className="text-base font-semibold text-fg">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Name', user.name],
                ['City', user.city],
                ['Email', user.email],
                ['Mobile', user.mobile],
                ['Member since', new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
                  <dt className="text-muted">{label}</dt>
                  <dd className="truncate text-right font-medium text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          </Paper>

          <Paper variant="outlined" className="p-6 md:col-span-3">
            <h2 className="text-base font-semibold text-fg">Recent credits</h2>
            {credits.length === 0 ? (
              <p className="mt-4 text-sm text-fg-soft">
                No credits yet. Amounts added by an administrator will appear here the moment they&rsquo;re added.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {credits.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-fg">{c.note || 'Added by administrator'}</p>
                      <p className="text-xs text-muted">{formatDateTime(c.createdAt)}</p>
                    </div>
                    <div className="tabular text-right">
                      <p className="font-semibold text-up">+{formatAmount(c.delta)}</p>
                      <p className="text-xs text-muted">Balance {formatAmount(c.balanceAfter)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Paper>
        </div>
      </main>

      <Dialog open={removed} aria-labelledby="removed-title">
        <DialogTitle id="removed-title">Your account was removed</DialogTitle>
        <DialogContent>
          <p className="text-sm text-fg-soft">
            An administrator deleted this account, so you&rsquo;ve been signed out. Contact them if this is unexpected.
          </p>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button variant="contained" onClick={() => window.location.assign(REMOVED_URL)}>
            Go to sign in
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
