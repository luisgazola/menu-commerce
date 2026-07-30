import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MenuCommerce',
  description: 'Cardápio online e gestão comercial'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
