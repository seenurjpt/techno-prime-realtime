'use client';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

export default function ClientError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reset}>
            Try again
          </Button>
        }
      >
        Your account could not be loaded. Check your connection and try again.
      </Alert>
    </main>
  );
}
