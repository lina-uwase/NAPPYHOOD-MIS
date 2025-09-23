"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scissors,
  Users2,
  Calendar,
  Users,
  Moon
} from 'lucide-react';
import NappyhoodLogo from './NappyhoodLogo';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Services', icon: Scissors, href: '/services', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Customers', icon: Users2, href: '/customers', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Visits', icon: Calendar, href: '/visits', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { name: 'Staff', icon: Users, href: '/staff', roles: ['ADMIN', 'MANAGER'] },
  ];

  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(user?.role || 'STAFF')
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <NappyhoodLogo width={43} height={56} />
          <span className="text-2xl font-semibold text-gray-900">Nappyhood</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">MENU</div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (pathname.startsWith(item.href) && item.href !== '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={`group flex items-center px-4 py-3 text-base font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:!bg-\[#F8FAFC\] focus-visible:!text-\[#5A8621\] ${
                  isActive
                    ? 'bg-[#F8FAFC] text-[#5A8621]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-[#5A8621]' : 'text-gray-500'} group-focus-visible:!text-\[#5A8621\]`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center px-4 py-3">
          <Moon className="mr-3 h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-600 flex-1">Dark Mode</span>
          <button
            onClick={() => {
              const newDarkMode = !darkMode;
              setDarkMode(newDarkMode);
              localStorage.setItem('darkMode', newDarkMode.toString());
              if (newDarkMode) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-[#5A8621]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;