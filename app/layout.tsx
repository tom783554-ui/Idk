import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Babylon Room Viewer',
  description: 'Babylon.js GLB viewer',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
