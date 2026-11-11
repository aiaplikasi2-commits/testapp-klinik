import React from 'react';
import {
  Activity,
  LogOut,
  Menu,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
  X,
  Stethoscope,
  Tv,
  Ticket,
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  isAndroidSimulatorMode: boolean;
  setIsAndroidSimulatorMode: (val: boolean) => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  setActiveView,
  isAndroidSimulatorMode,
  setIsAndroidSimulatorMode,
  onOpenProfile,
}) => {
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="bg-teal-700 text-white shadow-md sticky top-0 z-40 border-b border-teal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-teal-100 hover:text-white hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Buka navigasi menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveView('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-white text-teal-700 flex items-center justify-center shadow-inner font-bold text-lg">
                <Stethoscope className="w-6 h-6 text-teal-600" />
              </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">SIM Klinik</h1>
                </div>
            </div>
          </div>

          {/* Center: Quick Links to TV & Ticket */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              onClick={() => setActiveView('antrean_tv')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-800/90 text-teal-100 border border-teal-600 hover:bg-teal-600 transition"
              title="Buka Layar Monitor TV Antrean"
            >
              <Tv className="w-4 h-4 text-emerald-300" />
              <span>Layar TV Antrean</span>
            </button>

            <button
              onClick={() => setActiveView('tiket_mandiri')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-800/90 text-teal-100 border border-teal-600 hover:bg-teal-600 transition"
              title="Tiket Antrean Mandiri Pasien Online"
            >
              <Ticket className="w-4 h-4 text-amber-300" />
              <span>Tiket Pasien</span>
            </button>
          </div>

          {/* Right: Simulator Toggle, User Info & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Native Android Preview toggle button */}
            <button
              onClick={() => setIsAndroidSimulatorMode(!isAndroidSimulatorMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isAndroidSimulatorMode
                  ? 'bg-amber-400 text-teal-950 border-amber-300 shadow-sm'
                  : 'bg-teal-800 text-teal-100 border-teal-600 hover:bg-teal-650'
              }`}
              title="Uji coba tampilan Android Native (Smartphone & Tablet)"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">
                {isAndroidSimulatorMode ? 'Kembali ke Web' : 'Android Native Companion'}
              </span>
              <span className="md:hidden">Android</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                {/* Profile Clickable Box */}
                <button
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2.5 text-left p-1.5 rounded-xl hover:bg-teal-600/70 transition"
                  title="Klik untuk melihat & mengedit profil"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-white leading-tight">{user.nama}</div>
                    <div className="text-xs text-teal-200 flex items-center justify-end space-x-1">
                      <ShieldCheck className="w-3 h-3 text-teal-300" />
                      <span>{user.role}</span>
                    </div>
                  </div>

                  {user.foto ? (
                    <img
                      src={user.foto}
                      alt={user.nama}
                      className="w-9 h-9 rounded-full object-cover border-2 border-teal-300 shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-teal-800 border-2 border-teal-300 flex items-center justify-center text-white font-bold text-sm">
                      {user.nama.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-teal-200 hover:text-white hover:bg-teal-600 transition"
                  title="Keluar dari akun"
                  aria-label="Tombol Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-xs text-teal-100">
                <UserIcon className="w-4 h-4" />
                <span>Belum Masuk</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
