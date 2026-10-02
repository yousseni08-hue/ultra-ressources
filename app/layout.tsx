import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import Pixel from '@/components/Pixel';
import './globals.css';

const head = Montserrat({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-head' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Ressources ULTRA',
  description: 'Les ressources gratuites de Marvin Ndiaye pour les patrons de business physiques.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${head.variable} ${body.variable}`}>
      <body>
        <Pixel />
        <header className="top">
          <div className="wrap brand">
            ULTRA <span>·</span> RESSOURCES
          </div>
        </header>
        {children}
        <footer className="foot">
          <div className="wrap">© ULTRA · Marvin Ndiaye. Ressource offerte, ne pas revendre.</div>
        </footer>
      </body>
    </html>
  );
}
