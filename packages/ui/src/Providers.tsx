'use client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { MODE_STORAGE_KEY } from './colorScheme';
import { theme } from './theme';
import { ToastProvider } from './toast';

/**
 * enableCssLayer puts MUI's styles in the `mui` cascade layer, which globals.css
 * orders before Tailwind's `utilities` — so Tailwind classes can override MUI cleanly.
 * Light by default; the choice made with ThemeToggle is remembered per browser.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme} defaultMode="light" modeStorageKey={MODE_STORAGE_KEY} disableTransitionOnChange>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
