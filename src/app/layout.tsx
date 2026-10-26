import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const editorial = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SGC-SEMPI/RJ — Sistema de Gestão de Contratos e Atas',
  description:
    'Sistema de Gestão de Contratos e Atas de Registro de Preços da Secretaria de Estado da Mulher e de Políticas Inclusivas do Rio de Janeiro',
};

import { ThemeProvider } from '@/components/theme/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${editorial.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ledger-paper text-ledger-text antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
