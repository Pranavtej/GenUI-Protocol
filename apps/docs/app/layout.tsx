import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GenUI Protocol Docs',
  description: 'Documentation for the GenUI Protocol and AI-native UI runtime.',
  openGraph: {
    title: 'GenUI Protocol Docs',
    description: 'Documentation for the GenUI Protocol and AI-native UI runtime.',
    type: 'website'
  },
  alternates: {
    canonical: 'https://genui-protocol.vercel.app'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
