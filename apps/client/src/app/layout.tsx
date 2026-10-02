import { Providers } from '@tp/ui/Providers';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Techno Prime', template: '%s | Techno Prime' },
  description: 'Your account and balance',
};

export const viewport: Viewport = { themeColor: '#1F3A5F' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
