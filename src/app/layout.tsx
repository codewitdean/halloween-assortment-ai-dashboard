import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Hometown | Halloween Assortment',
  description: 'Evidence-led merchandising decisions for the Hometown AI Innovation Challenge',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
