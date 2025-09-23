import React from 'react';
import './globals.css';
import { TitleProvider } from '../contexts/TitleContext';
import { ToastProvider } from '../components/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import ClientLayout from '../components/ClientLayout';

export const metadata = {
  title: 'Nappyhood Salon Management System',
  description: 'Salon management system for Nappyhood',
  icons: {
    icon: '/nappyhood-logo.png',
    shortcut: '/nappyhood-logo.png',
    apple: '/nappyhood-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <TitleProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </TitleProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}