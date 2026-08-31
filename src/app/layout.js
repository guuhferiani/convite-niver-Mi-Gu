import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Aniversário Gustavo 36 & Michele 34 — Confirmação de Presença',
  description: 'Bora comemorar! Nosso aniversário tá chegando: Gustavo 36 & Michele 34 anos. Confirme sua presença para nossa festa no dia 06/09/2026 às 13h30.',
  keywords: ['aniversário', 'gustavo e michele', 'confirmação de presença', 'rsvp', 'churrasco'],
  authors: [{ name: 'Gustavo & Michele' }],
  openGraph: {
    title: 'Aniversário Gustavo 36 & Michele 34 🎉',
    description: 'Confirme sua presença na comemoração do nosso aniversário! Dia 06/09/2026 às 13h30.',
    type: 'website',
    images: [
      {
        url: '/G_M-133.jpg',
        width: 1200,
        height: 800,
        alt: 'Gustavo e Michele',
      },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#090a0f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
