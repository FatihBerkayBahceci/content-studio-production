import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AuthLayout } from '@/components/auth/auth-layout';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SEOART Content Studio',
    template: '%s | SEOART',
  },
  description: 'Uçtan uca SEO-ready içerik üretim platformu. Keyword araştırmasından yayınlamaya, tüm süreç tek bir AI agentte.',
  keywords: ['SEO', 'AI Content', 'Keyword Research', 'Content Studio', 'Internal Linking', 'AI Agent'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <Providers>
          <AuthLayout>
            {children}
          </AuthLayout>
        </Providers>
      </body>
    </html>
  );
}
