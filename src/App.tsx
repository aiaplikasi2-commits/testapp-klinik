import React, { useState, useEffect } from 'react';
import { User } from './types';
import { apiFetch, getAuthToken, setAuthToken } from './api/client';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { PendaftaranView } from './components/PendaftaranView';
import { RekamMedisView } from './components/RekamMedisView';
import { FarmasiView } from './components/FarmasiView';
import { KasirView } from './components/KasirView';
import { LaporanView } from './components/LaporanView';
import { PenggunaView } from './components/PenggunaView';
import { AndroidSimulatorView } from './components/AndroidSimulatorView';
import { AntreanTvView } from './components/AntreanTvView';
import { TiketAntreanPasienView } from './components/TiketAntreanPasienView';
import { ProfilUserModal } from './components/ProfilUserModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAndroidSimulatorMode, setIsAndroidSimulatorMode] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Check existing session token on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        const res = await apiFetch<User>('/auth/me');
        if (res.success && res.data) {
          setCurrentUser(res.data);
        } else {
          setAuthToken(null);
        }
      }
      setInitializing(false);
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setAuthToken(null);
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat sistem SIM Klinik...</span>
        </div>
      </div>
    );
  }

  // Standalone TV Monitor View (Fullscreen mode)
  if (activeView === 'antrean_tv') {
    return <AntreanTvView onBackToApp={() => setActiveView(currentUser ? 'dashboard' : 'login')} />;
  }

  // Standalone Patient Mobile Self-Ticketing View
  if (activeView === 'tiket_mandiri') {
    return <TiketAntreanPasienView onBackToHome={() => setActiveView(currentUser ? 'dashboard' : 'login')} />;
  }

  // If not logged in, show Login Screen (with links to TV & Ticket)
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onOpenTv={() => setActiveView('antrean_tv')}
        onOpenPatientTicket={() => setActiveView('tiket_mandiri')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Header */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        isAndroidSimulatorMode={isAndroidSimulatorMode}
        setIsAndroidSimulatorMode={setIsAndroidSimulatorMode}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          user={currentUser}
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view);
            setIsAndroidSimulatorMode(false);
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Workspace Area (Responsive & Adaptive) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {isAndroidSimulatorMode ? (
            <AndroidSimulatorView currentUser={currentUser} />
          ) : (
            <>
              {activeView === 'dashboard' && (
                <DashboardView user={currentUser} onNavigate={setActiveView} />
              )}
              {activeView === 'pendaftaran' && (
                <PendaftaranView
                  currentUser={currentUser}
                  onNavigateToRekamMedis={() => setActiveView('rekam_medis')}
                  onOpenTv={() => setActiveView('antrean_tv')}
                  onOpenPatientTicket={() => setActiveView('tiket_mandiri')}
                />
              )}
              {activeView === 'rekam_medis' && (
                <RekamMedisView currentUser={currentUser} />
              )}
              {activeView === 'farmasi' && <FarmasiView currentUser={currentUser} />}
              {activeView === 'kasir' && <KasirView currentUser={currentUser} />}
              {activeView === 'laporan' && <LaporanView currentUser={currentUser} />}
              {activeView === 'pengguna' && <PenggunaView currentUser={currentUser} />}
              {activeView === 'android_native' && (
                <AndroidSimulatorView currentUser={currentUser} />
              )}
            </>
          )}
        </main>
      </div>

      {/* User Profile Modal */}
      {currentUser && isProfileModalOpen && (
        <ProfilUserModal
          user={currentUser}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileUpdated={(updated) => setCurrentUser(updated)}
        />
      )}
    </div>
  );
}
