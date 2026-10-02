import Logout from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-md bg-ink text-sm font-bold text-white">
            T
          </span>
          <span className="font-semibold text-slate-900">Techno Prime</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">{email}</span>
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
