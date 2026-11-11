import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Pill,
  CreditCard,
  BarChart3,
  Users,
  Smartphone,
  ChevronRight,
  Tv,
  Ticket,
} from 'lucide-react';
import { User } from '../types';
import { hasPermission, Role } from '../utils/clinic-logic';

interface SidebarProps {
  user: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeView,
  setActiveView,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const role = (user?.role || 'Administrator') as Role;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Ringkasan operasional klinik',
      permission: 'dashboard',
    },
    {
      id: 'pendaftaran',
      label: 'Pendaftaran & Antrean',
      icon: UserPlus,
      description: 'Pasien baru/lama & antrean',
      permission: 'pendaftaran',
    },
    {
      id: 'rekam_medis',
      label: 'Rekam Medis (Dokter)',
      icon: FileText,
      description: 'Pemeriksaan, vital & diagnosis',
      permission: 'rekam_medis',
    },
    {
      id: 'farmasi',
      label: 'Obat & Farmasi',
      icon: Pill,
      description: 'Resep dokter & stok gudang',
      permission: 'farmasi',
    },
    {
      id: 'kasir',
      label: 'Kasir & Pembayaran',
      icon: CreditCard,
      description: 'Tagihan, pembayaran & kuitansi',
      permission: 'kasir',
    },
    {
      id: 'laporan',
      label: 'Laporan Klinik',
      icon: BarChart3,
      description: 'Kunjungan, pendapatan, obat',
      permission: 'laporan',
    },
    {
      id: 'pengguna',
      label: 'Pengguna & Hak Akses',
      icon: Users,
      description: 'Dokter, perawat, kasir & log',
      permission: 'pengguna',
    },
    {
      id: 'antrean_tv',
      label: 'Layar TV Antrean',
      icon: Tv,
      description: 'Tampilan monitor ruang tunggu klinik',
      permission: 'antrean_tv',
    },
    {
      id: 'tiket_mandiri',
      label: 'Tiket Mandiri Pasien',
      icon: Ticket,
      description: 'Pendaftaran online smartphone pasien',
      permission: 'antrean_digital',
    },
    {
      id: 'android_native',
      label: 'Android Native & APK',
      icon: Smartphone,
      description: 'Source code & live simulator',
      permission: 'android_native',
    },
  ];

  const handleSelect = (id: string) => {
    setActiveView(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-35 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-1 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isAllowed = user ? hasPermission(role, item.permission) : false;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => isAllowed && handleSelect(item.id)}
                disabled={!isAllowed}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200 shadow-xs'
                    : isAllowed
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 cursor-not-allowed opacity-60'
                }`}
                title={!isAllowed ? `Menu ini khusus untuk jabatan tertentu` : item.description}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-teal-600' : isAllowed ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  />
                  <div>
                    <span className="block leading-tight">{item.label}</span>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-teal-600" />}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">SIM Klinik</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sistem Aktif"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
