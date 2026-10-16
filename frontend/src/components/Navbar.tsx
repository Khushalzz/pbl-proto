import React from 'react';
import {
  Bell,
  Mail,
  MapPin,
  PlusCircle,
  LogOut,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  onLogout: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenEmailLogs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeScreen,
  setActiveScreen,
  onLogout,
  unreadCount,
  onOpenNotifications,
  onOpenEmailLogs,
}) => {
  const isCitizen = !currentUser || currentUser.role === 'Citizen';
  const isOfficer = currentUser?.role === 'Municipal Officer' || currentUser?.role === 'Administrator';
  const isEngineer = currentUser?.role === 'Field Engineer' || currentUser?.role === 'Administrator';
  const isAdmin = currentUser?.role === 'Administrator';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div
            onClick={() => setActiveScreen(isCitizen ? 'citizen' : isOfficer ? 'officer' : isEngineer ? 'engineer' : 'admin')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                Civic<span className="text-blue-600">Lens</span>
              </span>
              <span className="text-[10px] block font-semibold text-slate-400 tracking-wider uppercase -mt-1">
                Urban AI Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveScreen('citizen')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                activeScreen === 'citizen'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Citizen Home
            </button>
            <button
              onClick={() => setActiveScreen('verify')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                activeScreen === 'verify'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Community Verify
            </button>
            <button
              onClick={() => setActiveScreen('report')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeScreen === 'report'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Report Issue
            </button>

            {isOfficer && (
              <button
                onClick={() => setActiveScreen('officer')}
                className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                  activeScreen === 'officer'
                    ? 'bg-amber-50 text-amber-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Officer Queue
              </button>
            )}

            {isEngineer && (
              <button
                onClick={() => setActiveScreen('engineer')}
                className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                  activeScreen === 'engineer'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Field Ops
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveScreen('admin')}
                className={`px-3 py-2 rounded-lg transition cursor-pointer ${
                  activeScreen === 'admin'
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                GIS & Admin
              </button>
            )}
          </nav>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          {/* Simulated Email Button */}
          <button
            onClick={onOpenEmailLogs}
            title="Open Outgoing Simulated Emails Viewer"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Mail className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline">Email Logs</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="In-App Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth */}
          {currentUser ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                  <span>{currentUser.role}</span>
                  {currentUser.trust_score && (
                    <span className="text-emerald-600 font-semibold text-[10px]" title="Citizen Trust Score">
                      ★{currentUser.trust_score}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveScreen('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveScreen('register')}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
