import React from 'react';
import './globals.css';
import { TitleProvider } from '../contexts/TitleContext';
import { ToastProvider } from '../components/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import ClientLayout from '../components/ClientLayout';

export const metadata = {
  title: 'Nappyhood Salon Management System',
  description: 'Salon management system for Nappyhood',
  icons: {
    icon: '/nappyhood-logo.svg',
    shortcut: '/nappyhood-logo.svg',
    apple: '/nappyhood-logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <TitleProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </TitleProvider>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}