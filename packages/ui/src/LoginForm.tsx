'use client';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/navigation';
import { loginSchema } from '@tp/shared/validation';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from './api';
import { useToast } from './toast';
import { useFormValidation } from './useFormValidation';

type Props = {
  title: string;
  subtitle: string;
  badge: ReactNode;
  redirectTo: string;
  footer?: ReactNode;
  /** Shown as an alert above the form (account removed, session expired). */
  notice?: string;
  /** Shown once as a toast, e.g. after signing out. */
  flash?: string;
};

export function LoginForm({ title, subtitle, badge, redirectTo, footer, notice, flash }: Props) {
  const router = useRouter();
  const notify = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { errors: fields, setErrors: setFields, onBlur, onChange, validateAll } = useFormValidation(loginSchema);

  // Toast the flash message once, then drop ?reason from the URL so a refresh doesn't repeat it.
  const flashed = useRef(false);
  useEffect(() => {
    if (!flash || flashed.current) return;
    flashed.current = true;
    notify(flash, 'info');
    const url = new URL(window.location.href);
    url.searchParams.delete('reason');
    window.history.replaceState(null, '', url);
  }, [flash, notify]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateAll({ email, password })) return;
    setPending(true);
    try {
      await api('/api/auth/login', { method: 'POST', json: { email, password } });
      notify('Signed in');
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setFields(err.fields);
      else setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Paper variant="outlined" className="w-full max-w-sm p-8">
        <div className="mb-6">
          {badge}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        {notice && !error && (
          <Alert severity="info" className="mb-4">
            {notice}
          </Alert>
        )}
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onChange({ email: e.target.value, password }, 'email');
            }}
            onBlur={() => onBlur({ email, password }, 'email')}
            error={Boolean(fields.email)}
            helperText={fields.email}
            required
          />
          <TextField
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onChange({ email, password: e.target.value }, 'password');
            }}
            error={Boolean(fields.password)}
            helperText={fields.password}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShow((s) => !s)}
                      edge="end"
                      size="small"
                      aria-label={show ? 'Hide password' : 'Show password'}
                    >
                      {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={pending}
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {pending ? 'Signing in' : 'Sign in'}
          </Button>
        </form>
        {footer && <div className="mt-6 text-xs text-slate-500">{footer}</div>}
      </Paper>
    </main>
  );
}
