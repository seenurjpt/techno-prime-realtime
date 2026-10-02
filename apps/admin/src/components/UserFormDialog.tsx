'use client';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import type { PublicUser } from '@tp/shared/types';
import { api, ApiError } from '@tp/ui/api';
import { useToast } from '@tp/ui/toast';
import { useState, type FormEvent } from 'react';

type Props = { user: PublicUser | null; onClose: () => void; onSaved: (u: PublicUser) => void };
type Field = 'name' | 'city' | 'email' | 'mobile' | 'password';

const fields: { key: Field; label: string; type?: string; autoComplete?: string; inputMode?: 'tel' }[] = [
  { key: 'name', label: 'Name', autoComplete: 'off' },
  { key: 'city', label: 'City', autoComplete: 'off' },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'off' },
  { key: 'mobile', label: 'Mobile', type: 'tel', inputMode: 'tel', autoComplete: 'off' },
];

export default function UserFormDialog({ user, onClose, onSaved }: Props) {
  const editing = Boolean(user);
  const notify = useToast();
  const [values, setValues] = useState<Record<Field, string>>({
    name: user?.name ?? '',
    city: user?.city ?? '',
    email: user?.email ?? '',
    mobile: user?.mobile ?? '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (key: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setFormError(null);
    try {
      const { user: saved } = await api<{ user: PublicUser }>(editing ? `/api/users/${user!.id}` : '/api/users', {
        method: editing ? 'PATCH' : 'POST',
        json: values,
      });
      onSaved(saved);
      notify(editing ? `Saved changes to ${saved.name}` : `Added ${saved.name}`);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else setFormError(err instanceof Error ? err.message : 'Could not save. Try again.');
      setPending(false);
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit} noValidate>
        <DialogTitle>{editing ? `Edit ${user!.name}` : 'Add user'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 !pt-2">
          {formError && <p className="text-sm text-red-700">{formError}</p>}
          {fields.map((f, i) => (
            <TextField
              key={f.key}
              label={f.label}
              type={f.type}
              autoFocus={i === 0}
              autoComplete={f.autoComplete}
              value={values[f.key]}
              onChange={set(f.key)}
              error={Boolean(errors[f.key])}
              helperText={errors[f.key]}
              required
              slotProps={{ htmlInput: { inputMode: f.inputMode } }}
            />
          ))}
          <TextField
            label={editing ? 'New password' : 'Password'}
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={set('password')}
            error={Boolean(errors.password)}
            helperText={errors.password ?? (editing ? 'Leave blank to keep the current password' : 'The user signs in to the client app with this')}
            required={!editing}
          />
          {editing && (
            <p className="text-xs text-slate-500">To change the balance, use Add amount from the users table.</p>
          )}
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={onClose} disabled={pending} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {editing ? 'Save changes' : 'Add user'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
