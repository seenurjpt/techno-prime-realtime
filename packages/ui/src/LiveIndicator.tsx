'use client';
import Tooltip from '@mui/material/Tooltip';
import type { LiveStatus } from './useLiveStream';

const copy: Record<LiveStatus, { label: string; hint: string; dot: string }> = {
  connecting: { label: 'Connecting', hint: 'Opening live connection', dot: 'bg-amber-400' },
  live: { label: 'Live', hint: 'Changes appear here instantly', dot: 'bg-emerald-500' },
  reconnecting: { label: 'Reconnecting', hint: 'Connection dropped. Retrying every 3 seconds', dot: 'bg-amber-400' },
  unavailable: {
    label: 'Live updates off',
    hint: 'MongoDB must run as a replica set for live updates. Refresh to see changes.',
    dot: 'bg-slate-400',
  },
};

export function LiveIndicator({ status }: { status: LiveStatus }) {
  const c = copy[status];
  return (
    <Tooltip title={c.hint}>
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
      >
        <span className="relative flex h-2 w-2">
          {status === 'live' && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${c.dot}`} />
        </span>
        {c.label}
      </span>
    </Tooltip>
  );
}
