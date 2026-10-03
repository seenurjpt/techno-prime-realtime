'use client';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Search from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import { formatAmount } from '@tp/shared/format';
import type { PublicUser, UserEvent } from '@tp/shared/types';
import { api } from '@tp/ui/api';
import { LiveIndicator } from '@tp/ui/LiveIndicator';
import { useToast } from '@tp/ui/toast';
import { useLiveStream } from '@tp/ui/useLiveStream';
import dynamic from 'next/dynamic';
import { useCallback, useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { UserRow } from './UserRow';
import { usersReducer } from './usersReducer';

// Dialogs are split into their own chunks and only load when first opened.
const UserFormDialog = dynamic(() => import('./UserFormDialog'), { ssr: false });
const AddAmountDialog = dynamic(() => import('./AddAmountDialog'), { ssr: false });
const DeleteUserDialog = dynamic(() => import('./DeleteUserDialog'), { ssr: false });

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; user: PublicUser }
  | { kind: 'amount'; user: PublicUser }
  | { kind: 'delete'; user: PublicUser }
  | null;

const FLASH_MS = 1600;

export function UsersConsole({ initialUsers }: { initialUsers: PublicUser[] }) {
  const [users, dispatch] = useReducer(usersReducer, initialUsers);
  const notify = useToast();
  const [dialog, setDialog] = useState<DialogState>(null);
  const dialogRef = useRef(dialog);
  dialogRef.current = dialog;
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [flashing, setFlashing] = useState<Set<string>>(() => new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const flash = useCallback((id: string) => {
    setFlashing((s) => new Set(s).add(id));
    clearTimeout(timers.current.get(id));
    timers.current.set(
      id,
      setTimeout(() => {
        setFlashing((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        timers.current.delete(id);
      }, FLASH_MS),
    );
  }, []);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const status = useLiveStream<UserEvent>('/api/stream', {
    onEvent: (event) => {
      // Another admin deleted the user this admin is editing or topping up: close the dialog and say why.
      // (A delete dialog is skipped: its own request may finish after the stream reports the delete.)
      const open = dialogRef.current;
      if (event.type === 'delete' && open && open.kind !== 'create' && open.kind !== 'delete' && open.user.id === event.id) {
        notify(`${open.user.name} was deleted by another admin`, 'warning');
        setDialog(null);
      }
      dispatch(event);
      if (event.type === 'upsert') flash(event.user.id);
    },
    // After a dropped connection, resync so nothing missed while offline is lost.
    onReady: (reconnected) => {
      if (reconnected) {
        api<{ users: PublicUser[] }>('/api/users')
          .then(({ users }) => dispatch({ type: 'replace', users }))
          .catch(() => undefined);
      }
    },
  });

  // Apply our own mutations immediately instead of waiting for the stream echo.
  const applyUser = useCallback((user: PublicUser) => {
    dispatch({ type: 'upsert', user });
    flash(user.id);
  }, [flash]);
  const removeUser = useCallback((id: string) => dispatch({ type: 'delete', id }), []);

  const openAmount = useCallback((user: PublicUser) => setDialog({ kind: 'amount', user }), []);
  const openEdit = useCallback((user: PublicUser) => setDialog({ kind: 'edit', user }), []);
  const openDelete = useCallback((user: PublicUser) => setDialog({ kind: 'delete', user }), []);
  const close = useCallback(() => setDialog(null), []);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.city, u.email, u.mobile].some((field) => field.toLowerCase().includes(q)),
    );
  }, [users, deferredQuery]);

  const total = useMemo(() => users.reduce((sum, u) => sum + u.amount, 0), [users]);

  // Keep dialogs pointed at the latest version of the user they're showing.
  const dialogUser = dialog && 'user' in dialog ? users.find((u) => u.id === dialog.user.id) ?? dialog.user : null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Users</h1>
            <LiveIndicator status={status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {users.length} {users.length === 1 ? 'user' : 'users'}, holding{' '}
            <span className="tabular font-semibold text-slate-900">{formatAmount(total)}</span> in total
          </p>
        </div>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setDialog({ kind: 'create' })}>
          Add user
        </Button>
      </div>

      <Paper variant="outlined" className="mt-6 overflow-hidden">
        <div className="border-b border-line p-3">
          <TextField
            placeholder="Search by name, city, email or mobile"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search users' },
            }}
          />
        </div>
        <div className="overflow-x-auto">
          <Table size="small" stickyHeader aria-label="Users">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  flash={flashing.has(user.id)}
                  onAmount={openAmount}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    {users.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-slate-600">No users yet. Add one to give them access to the client app.</p>
                        <Button variant="outlined" startIcon={<PersonAdd />} onClick={() => setDialog({ kind: 'create' })}>
                          Add user
                        </Button>
                      </div>
                    ) : (
                      <p className="text-slate-600">No users match &ldquo;{deferredQuery}&rdquo;.</p>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Paper>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <UserFormDialog user={dialog.kind === 'edit' ? dialogUser : null} onClose={close} onSaved={applyUser} />
      )}
      {dialog?.kind === 'amount' && dialogUser && (
        <AddAmountDialog user={dialogUser} onClose={close} onSaved={applyUser} />
      )}
      {dialog?.kind === 'delete' && dialogUser && (
        <DeleteUserDialog user={dialogUser} onClose={close} onDeleted={removeUser} />
      )}
    </section>
  );
}
