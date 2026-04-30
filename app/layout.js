import './globals.css';

export const metadata = {
  title: 'Ev Sor Bulsun',
  description: 'Tekirdağ ve Çorlu\'nun güvenilir emlak platformu',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}