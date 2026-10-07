import './globals.css';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'GD Arena - AI Group Discussion Practice',
  description: 'Practice sharper group discussions with four distinct AI personas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#070a14] text-[#f0f4fc] font-sans antialiased min-h-screen selection:bg-lime-300 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}

