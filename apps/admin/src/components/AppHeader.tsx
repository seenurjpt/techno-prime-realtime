import Logout from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import { ThemeToggle } from '@tp/ui/ThemeToggle';

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-brand text-sm font-bold text-on-brand">
            T
          </span>
          <span className="text-base font-semibold text-fg">Techno Prime</span>
          <span className="rounded bg-surface-soft px-1.5 py-0.5 text-xs font-medium text-fg-soft">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="mr-1 hidden text-sm text-fg-soft sm:inline">{email}</span>
          <ThemeToggle />
          <form action="/api/auth/logout" method="post">
            <Button type="submit" size="small" color="inherit" startIcon={<Logout fontSize="small" />}>
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
