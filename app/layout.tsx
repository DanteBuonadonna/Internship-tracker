import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Internship Tracker',
  description: 'AI-powered internship outreach automation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-50 text-ink-800 antialiased">{children}</body>
    </html>
  );
}
