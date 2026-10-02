'use client';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

export default function ConsoleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={reset}>
          Try again
        </Button>
      }
    >
      Users could not be loaded. Check that MongoDB is running and MONGODB_URI in .env is correct.
    </Alert>
  );
}
