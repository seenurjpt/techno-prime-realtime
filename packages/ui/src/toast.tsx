'use client';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Toast = { id: number; message: string; severity: AlertColor };
type Notify = (message: string, severity?: AlertColor) => void;

const ToastContext = createContext<Notify>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Toast[]>([]);
  const current = queue[0];

  const notify = useCallback<Notify>((message, severity = 'success') => {
    setQueue((q) => [...q, { id: Date.now() + Math.random(), message, severity }]);
  }, []);
  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.id}
        open={Boolean(current)}
        autoHideDuration={3500}
        onClose={(_, reason) => reason !== 'clickaway' && dismiss()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {current ? (
          <Alert onClose={dismiss} severity={current.severity} variant="outlined" className="min-w-72 max-w-md">
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
