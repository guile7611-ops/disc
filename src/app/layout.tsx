import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@livekit/components-styles';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sala Principal - Chamada de Voz e Tela',
  description: 'Aplicativo de chamada de voz e compartilhamento de tela em tempo real com sala fixa e alta definição.',
  openGraph: {
    title: 'Sala Principal - Chamada de Voz e Tela',
    description: 'Entre na sala de voz permanente para conversar e compartilhar sua tela instantaneamente.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
