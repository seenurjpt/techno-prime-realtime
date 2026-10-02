'use client';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { formatAmount } from '@tp/shared/format';
import type { PublicUser } from '@tp/shared/types';
import { api } from '@tp/ui/api';
import { useToast } from '@tp/ui/toast';
import { useState } from 'react';

type Props = { user: PublicUser; onClose: () => void; onDeleted: (id: string) => void };

export default function DeleteUserDialog({ user, onClose, onDeleted }: Props) {
  const notify = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await api(`/api/users/${user.id}`, { method: 'DELETE' });
      onDeleted(user.id);
      notify(`Deleted ${user.name}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete. Try again.');
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete {user.name}?</DialogTitle>
      <DialogContent>
        <p className="text-sm text-slate-700">
          Their account, balance of <span className="tabular font-semibold">{formatAmount(user.amount)}</span> and
          amount history will be removed. If they&rsquo;re signed in to the client app, they&rsquo;ll be signed out
          right away.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </DialogContent>
      <DialogActions className="!px-6 !pb-4">
        <Button onClick={onClose} disabled={pending} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={confirm}
          variant="contained"
          color="error"
          disabled={pending}
          startIcon={pending ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Delete user
        </Button>
      </DialogActions>
    </Dialog>
  );
}
