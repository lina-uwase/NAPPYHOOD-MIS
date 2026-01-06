"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Bell, ChevronDown, LogOut, User, Info, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useTitle } from '../contexts/TitleContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import ConfirmationModal from './ConfirmationModal';

const Header: React.FC = () => {
  const { title } = useTitle();
  const { user, logout } = useAuth();
  const { history, unreadCount, markAsRead, markAllAsRead, clearHistory } = useNotification();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
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
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-[#F8FAFC] rounded-lg relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {history.length > 0 ? (
                      history.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors relative group ${!notification.read ? 'bg-blue-50/30' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${notification.type === 'success' ? 'bg-green-100 text-green-600' :
                              notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-blue-100 text-blue-600'
                              }`}>
                              {notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                                notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                                  notification.type === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                                    <Info className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 mb-0.5">{notification.title}</p>
                              {notification.message && (
                                <p className="text-sm text-gray-500 leading-snug mb-1">{notification.message}</p>
                              )}
                              <p className="text-xs text-gray-400">
                                {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'Just now'}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}
                  </div>

                  <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                    <button
                      onClick={() => markAllAsRead()}
                      className="w-full py-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors text-center"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

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


                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowLogoutConfirmation(true);
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


      <ConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={logout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />
    </header >
  );
};

export default Header;