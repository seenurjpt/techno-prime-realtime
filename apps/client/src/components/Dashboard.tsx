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
        if (delta > 0) setLastCredit({ delta, key: Date.now() });
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
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <span className="font-semibold text-slate-900">Techno Prime</span>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" size="small" color="inherit" startIcon={<Logout fontSize="small" />}>
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Hi, {firstName}</h1>
          <LiveIndicator status={status} />
        </div>

        {/* The balance is the one loud element on the page. */}
        <section aria-labelledby="balance-label" className="relative mt-6 overflow-hidden rounded-2xl bg-ink px-6 py-8 text-white sm:px-10 sm:py-10">
          <p id="balance-label" className="text-sm text-white/70">
            Available balance
          </p>
          <p className="tabular mt-2 text-5xl font-semibold tracking-tight sm:text-6xl" aria-live="polite" aria-atomic="true">
            {formatAmount(shown)}
          </p>
          <div className="mt-4 h-7">
            {lastCredit ? (
              <span
                key={lastCredit.key}
                className="tabular inline-flex items-center rounded-full bg-credit px-3 py-1 text-sm font-semibold text-white motion-safe:animate-[credit-in_400ms_ease-out]"
              >
                +{formatAmount(lastCredit.delta)} added just now
              </span>
            ) : (
              <span className="text-sm text-white/60">Last updated {formatDateTime(user.updatedAt)}</span>
            )}
          </div>
          {/* Ledger rule lines: a quiet nod to an account book. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_27px,rgba(255,255,255,0.07)_27px,rgba(255,255,255,0.07)_28px)] sm:block" />
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-5">
          <Paper variant="outlined" className="p-6 md:col-span-2">
            <h2 className="text-base font-semibold text-slate-900">Account details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Name', user.name],
                ['City', user.city],
                ['Email', user.email],
                ['Mobile', user.mobile],
                ['Member since', new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="truncate text-right font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </Paper>

          <Paper variant="outlined" className="p-6 md:col-span-3">
            <h2 className="text-base font-semibold text-slate-900">Recent credits</h2>
            {credits.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No credits yet. Amounts added by an administrator will appear here the moment they&rsquo;re added.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {credits.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-slate-900">{c.note || 'Added by administrator'}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</p>
                    </div>
                    <div className="tabular text-right">
                      <p className="font-semibold text-credit">+{formatAmount(c.delta)}</p>
                      <p className="text-xs text-slate-500">Balance {formatAmount(c.balanceAfter)}</p>
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
          <p className="text-sm text-slate-700">
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
