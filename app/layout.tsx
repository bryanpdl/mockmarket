import './globals.css';
import { Outfit } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';

const outfit = Outfit({ 
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
});

export const metadata = {
  title: 'MockMarket - Idle Trading Game',
  description: 'A fun idle trading game where you can buy and sell virtual assets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans bg-[#0C0C0C] text-white min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
