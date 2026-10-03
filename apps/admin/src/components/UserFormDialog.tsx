'use client';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import type { PublicUser } from '@tp/shared/types';
import { createUserSchema, updateUserSchema } from '@tp/shared/validation';
import { api, ApiError } from '@tp/ui/api';
import { useToast } from '@tp/ui/toast';
import { useFormValidation } from '@tp/ui/useFormValidation';
import { useState, type FormEvent } from 'react';

type Props = { user: PublicUser | null; onClose: () => void; onSaved: (u: PublicUser) => void };
type Field = 'name' | 'city' | 'email' | 'mobile' | 'password';

const fields: { key: Exclude<Field, 'password'>; label: string; type?: string; inputMode?: 'tel' | 'email'; hint?: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'email', label: 'Email', type: 'email', inputMode: 'email', hint: 'The user signs in to the client app with this' },
  { key: 'mobile', label: 'Mobile', type: 'tel', inputMode: 'tel', hint: '10–13 digits, e.g. 9876543210 or +919876543210' },
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
  const { errors, setErrors, onBlur, onChange, validateAll } = useFormValidation(
    editing ? updateUserSchema : createUserSchema,
  );
  const [pending, setPending] = useState(false);

  const set = (key: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    onChange(next, key);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validateAll(values)) return;

    // Compare the cleaned-up values with what's saved, so "  Aarav  " vs "Aarav" counts as unchanged.
    if (editing) {
      const parsed = updateUserSchema.parse(values);
      const unchanged =
        !parsed.password && (['name', 'city', 'email', 'mobile'] as const).every((k) => parsed[k] === user![k]);
      if (unchanged) {
        notify('No changes to save', 'info');
        onClose();
        return;
      }
    }

    setPending(true);
    try {
      const { user: saved } = await api<{ user: PublicUser }>(editing ? `/api/users/${user!.id}` : '/api/users', {
        method: editing ? 'PATCH' : 'POST',
        json: values,
      });
      onSaved(saved);
      notify(editing ? `Saved changes to ${saved.name}` : `Added ${saved.name}. They can now sign in to the client app.`);
      onClose();
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        setErrors(err.fields);
        return;
      }
      notify(err instanceof Error ? err.message : 'Could not save. Try again.', 'error');
      // The user was deleted while this dialog was open; there's nothing left to edit.
      if (err instanceof ApiError && err.status === 404) onClose();
    }
  }

  return (
    <Dialog open onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit} noValidate>
        <DialogTitle>{editing ? `Edit ${user!.name}` : 'Add user'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 !pt-2">
          {fields.map((f, i) => (
            <TextField
              key={f.key}
              label={f.label}
              type={f.type}
              autoFocus={i === 0}
              autoComplete="off"
              value={values[f.key]}
              onChange={set(f.key)}
              onBlur={() => onBlur(values, f.key)}
              error={Boolean(errors[f.key])}
              helperText={errors[f.key] ?? f.hint}
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
            onBlur={() => onBlur(values, 'password')}
            error={Boolean(errors.password)}
            helperText={
              errors.password ??
              (editing ? 'Leave blank to keep the current password' : 'At least 6 characters. The user signs in with this')
            }
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
