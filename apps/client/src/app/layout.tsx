import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { MODE_STORAGE_KEY } from '@tp/ui/colorScheme';
import { Providers } from '@tp/ui/Providers';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Open substitutes the design spec names for BinanceNova (text) and BinancePlex (numbers).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-plex', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Techno Prime', template: '%s | Techno Prime' },
  description: 'Your account and balance',
};

export const viewport: Viewport = { themeColor: '#181A20' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the colour-scheme script sets the light/dark class before React loads.
    <html lang="en" className={`${inter.variable} ${plex.variable}`} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="light" modeStorageKey={MODE_STORAGE_KEY} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
