"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useTitle } from '../contexts/TitleContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Header: React.FC = () => {
  const { title } = useTitle();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const [, setTick] = useState(0);
  React.useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('profileAvatarUpdated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profileAvatarUpdated', handler);
      }
    };
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-[#F8FAFC] rounded-lg relative">
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 hover:bg-[#F8FAFC] rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#5A8621] flex items-center justify-center">
                {user?.profile_picture || (typeof window !== 'undefined' && localStorage.getItem('profileAvatar')) ? (
                  <Image 
                    src={user?.profile_picture || (typeof window !== 'undefined' ? localStorage.getItem('profileAvatar') || '' : '')} 
                    alt="avatar" 
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const initialsSpan = parent.querySelector('.initials-fallback');
                        if (initialsSpan) {
                          (initialsSpan as HTMLElement).style.display = 'flex';
                        }
                      }
                    }}
                  />
                ) : null}
                <span className="text-sm font-medium text-white initials-fallback" style={{ display: user?.profile_picture || (typeof window !== 'undefined' && localStorage.getItem('profileAvatar')) ? 'none' : 'flex' }}>
                  {getInitials(user?.names)}
                </span>
              </div>
              <div className="text-sm text-left">
                <div className="font-medium text-gray-900">{user?.names || 'User'}</div>
                <div className="text-gray-500 text-xs">{user?.role}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900">{user?.phone}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;