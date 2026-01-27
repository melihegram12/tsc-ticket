import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './animations.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TSC Helpdesk - Şirket İçi Destek Sistemi',
  description: 'HESK benzeri şirket içi ticket yönetim sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
