import type { Metadata } from "next";
import { Inter } from "next/font/google";
import './globals.css'
import { AuthProvider } from '@/app/context/AuthContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js Login App",
  description: "A Next.js application with authentication and ETL features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}