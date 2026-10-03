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
import { addAmountSchema } from '@tp/shared/validation';
import { api, ApiError } from '@tp/ui/api';
import { useToast } from '@tp/ui/toast';
import { useFormValidation } from '@tp/ui/useFormValidation';
import { useState, type FormEvent } from 'react';

type Props = { user: PublicUser; onClose: () => void; onSaved: (u: PublicUser) => void };
const PRESETS = [100, 500, 1000, 5000];

export default function AddAmountDialog({ user, onClose, onSaved }: Props) {
  const notify = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const { errors, setErrors, onBlur, onChange, validateAll } = useFormValidation(addAmountSchema);
  const [pending, setPending] = useState(false);

  // Drives the live 'New balance' preview and the button label.
  const check = addAmountSchema.safeParse({ amount, note });
  const valid = check.success;
  const parsed = check.success ? check.data.amount : 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validateAll({ amount, note })) return;
    setPending(true);
    try {
      const { user: saved } = await api<{ user: PublicUser }>(`/api/users/${user.id}/amount`, {
        method: 'POST',
        json: { amount, note: note || undefined },
      });
      onSaved(saved);
      notify(`Added ${formatAmount(parsed)} to ${saved.name}. New balance ${formatAmount(saved.amount)}`);
      onClose();
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        setErrors(err.fields);
        return;
      }
      notify(err instanceof Error ? err.message : 'Could not add the amount. Try again.', 'error');
      // The user was deleted while this dialog was open.
      if (err instanceof ApiError && err.status === 404) onClose();
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
            autoFocus
            autoComplete="off"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              onChange({ amount: e.target.value, note }, 'amount');
            }}
            onBlur={() => onBlur({ amount, note }, 'amount')}
            error={Boolean(errors.amount)}
            helperText={errors.amount ?? 'Added on top of the current balance'}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
              htmlInput: { inputMode: 'decimal', className: 'tabular' },
            }}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
            {PRESETS.map((p) => (
              <Chip key={p} label={`+${formatAmount(p).replace('.00', '')}`} onClick={() => {
                  setAmount(String(p));
                  onChange({ amount: String(p), note }, 'amount');
                }} variant="outlined" />
            ))}
          </div>
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={Boolean(errors.note)}
            helperText={errors.note ?? 'Shown to the user with this credit, e.g. Refund for order 1042'}
            slotProps={{ htmlInput: { maxLength: 140 } }}
          />

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
            disabled={pending}
            startIcon={pending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Add {valid ? formatAmount(parsed) : 'amount'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
