'use client';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { formatAmount } from '@tp/shared/format';
import type { PublicUser } from '@tp/shared/types';
import { api, ApiError } from '@tp/ui/api';
import { useToast } from '@tp/ui/toast';
import { useState, type FormEvent } from 'react';

type Props = { user: PublicUser; onClose: () => void; onSaved: (u: PublicUser) => void };
const PRESETS = [100, 500, 1000, 5000];

export default function AddAmountDialog({ user, onClose, onSaved }: Props) {
  const notify = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const parsed = Number(amount);
  const valid = amount !== '' && Number.isFinite(parsed) && parsed > 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      const { user: saved } = await api<{ user: PublicUser }>(`/api/users/${user.id}/amount`, {
        method: 'POST',
        json: { amount, note: note || undefined },
      });
      onSaved(saved);
      notify(`Added ${formatAmount(parsed)} to ${saved.name}. New balance ${formatAmount(saved.amount)}`);
      onClose();
    } catch (err) {
      setErrors(
        err instanceof ApiError && Object.keys(err.fields).length
          ? err.fields
          : { amount: err instanceof Error ? err.message : 'Could not add amount. Try again.' },
      );
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit} noValidate>
        <DialogTitle>Add amount</DialogTitle>
        <DialogContent className="flex flex-col gap-4 !pt-1">
          <div className="flex items-baseline justify-between rounded-lg bg-slate-50 px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <p className="tabular text-right">
              <span className="block text-xs text-slate-500">Current balance</span>
              <span className="font-semibold">{formatAmount(user.amount)}</span>
            </p>
          </div>

          <TextField
            label="Amount to add"
            type="number"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={Boolean(errors.amount)}
            helperText={errors.amount ?? 'Added on top of the current balance'}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              htmlInput: { min: 0.01, step: 0.01, inputMode: 'decimal', className: 'tabular' },
            }}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
            {PRESETS.map((p) => (
              <Chip key={p} label={`+${formatAmount(p).replace('.00', '')}`} onClick={() => setAmount(String(p))} variant="outlined" />
            ))}
          </div>
          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} slotProps={{ htmlInput: { maxLength: 140 } }} />

          <p className="tabular text-sm text-slate-600" aria-live="polite">
            New balance:{' '}
            <span className={`font-semibold ${valid ? 'text-credit' : 'text-slate-900'}`}>
              {formatAmount(user.amount + (valid ? parsed : 0))}
            </span>
          </p>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={onClose} disabled={pending} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            disabled={pending || !valid}
            startIcon={pending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Add {valid ? formatAmount(parsed) : 'amount'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
