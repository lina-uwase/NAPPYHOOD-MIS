'use client';

import React from 'react';
import './globals.css';
import { TitleProvider } from '../contexts/TitleContext';
import { ToastProvider } from '../components/Toast';
import { AuthProvider } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProtectedRoute from '../components/ProtectedRoute';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/nappyhood-logo.png" />
        <link rel="shortcut icon" href="/nappyhood-logo.png" />
        <link rel="apple-touch-icon" href="/nappyhood-logo.png" />
        <title>Nappyhood Salon Management System</title>
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <TitleProvider>
              {isLoginPage ? (
                children
              ) : (
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header />
                      <main className="flex-1 overflow-auto p-6">
                        {children}
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              )}
            </TitleProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}