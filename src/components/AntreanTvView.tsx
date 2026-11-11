import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Tv,
  ArrowLeft,
  Users,
  Clock,
  Sparkles,
  CheckCircle,
  Activity,
  Maximize2,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { announceQueueCall } from '../utils/audio-call';
import { AudioSettingsModal } from './AudioSettingsModal';

interface AntreanPoliInfo {
  poli: string;
  prefix: string;
  ruang: string;
  noAntrean: string;
  namaPasien: string;
  status: string;
  waitingCount: number;
}

interface AntreanNext {
  noAntrean: string;
  poli: string;
  ruang: string;
  namaPasien: string;
  waktuDaftar: string;
}

interface RiwayatCall {
  noAntrean: string;
  poli: string;
  ruang: string;
  waktuPanggil?: string;
  status: string;
}

interface TvStatusData {
  lastCall: {
    noAntrean: string;
    namaPasien: string;
    poli: string;
    ruang: string;
    dokter: string;
    timestamp: string;
    callCount: number;
  } | null;
  aktifPerPoli: AntreanPoliInfo[];
  antreanBerikutnya: AntreanNext[];
  riwayatDipanggil: RiwayatCall[];
  statistik: {
    total: number;
    menunggu: number;
    dilayani: number;
    selesai: number;
    dilewati: number;
  };
}

interface AntreanTvViewProps {
  onBackToApp?: () => void;
}

export const AntreanTvView: React.FC<AntreanTvViewProps> = ({ onBackToApp }) => {
  const [data, setData] = useState<TvStatusData | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [lastAnnouncedKey, setLastAnnouncedKey] = useState<string>('');
  const lastKeyRef = useRef<string>('');

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch TV Status data & handle auto speech calling
  const fetchTvStatus = async () => {
    try {
      const res = await fetch('/api/antrean/tv-status');
      const json = await res.json();
      if (json.success) {
        setData(json);

        // Check if there is a new call event
        if (json.lastCall) {
          const currentCallKey = `${json.lastCall.noAntrean}_${json.lastCall.callCount}_${json.lastCall.timestamp}`;
          if (currentCallKey !== lastKeyRef.current) {
            lastKeyRef.current = currentCallKey;
            setLastAnnouncedKey(currentCallKey);

            if (soundEnabled) {
              announceQueueCall({
                noAntrean: json.lastCall.noAntrean,
                dokter: json.lastCall.dokter,
                ruang: json.lastCall.ruang,
                poli: json.lastCall.poli,
                isRecall: (json.lastCall.callCount || 1) > 1,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching TV status:', err);
    }
  };

  useEffect(() => {
    fetchTvStatus();
    const interval = setInterval(fetchTvStatus, 3000); // 3-second auto-sync
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const currentCall = data?.lastCall;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Bar / Header TV */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              SIM KLINIK
            </h1>
          </div>
        </div>

        {/* Live Clock & Action Buttons */}
        <div className="flex items-center gap-6">
          <div className="text-right border-r border-slate-800 pr-6">
            <div className="text-3xl font-extrabold tracking-wider font-mono text-emerald-400">
              {formattedTime}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {formattedDate}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled && currentCall) {
                  announceQueueCall({
                    noAntrean: currentCall.noAntrean,
                    dokter: currentCall.dokter,
                    ruang: currentCall.ruang,
                    poli: currentCall.poli,
                    isRecall: (currentCall.callCount || 1) > 1,
                  });
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                  : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-300'
              }`}
              title="Aktifkan/Nonaktifkan Suara Panggilan"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
              <span>{soundEnabled ? 'Suara Aktif' : 'Suara Muted'}</span>
            </button>

            <button
              onClick={() => setShowAudioModal(true)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Pengaturan Suara Panggilan & Bel"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullScreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Layar Penuh (Full Screen)"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        {/* LEFT COLUMN: PRIMARY CURRENT CALLED NUMBER (Span 7) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Hero Called Card */}
          <div className="relative flex-1 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl shadow-emerald-950/50 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

            {/* Calling Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm tracking-widest uppercase mb-4 animate-pulse">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>NOMOR ANTREAN SEDANG DIPANGGIL</span>
            </div>

            {/* Enormous Queue Number */}
            <div className="text-8xl md:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-emerald-200 via-white to-emerald-400 drop-shadow-[0_10px_25px_rgba(16,185,129,0.3)] my-2">
              {currentCall ? currentCall.noAntrean : '- - -'}
            </div>

            {/* Patient Name & Destination Room */}
            <div className="w-full max-w-xl bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 mt-4 shadow-xl">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Tujuan Pelayanan
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {currentCall ? (currentCall.ruang || currentCall.poli) : 'Menunggu Panggilan Petugas'}
              </div>

              {currentCall && (
                <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-sm">
                  <div className="text-left">
                    <span className="text-slate-400 text-xs">Pasien: </span>
                    <span className="font-bold text-emerald-300">{currentCall.namaPasien}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-xs">Dokter: </span>
                    <span className="font-medium text-slate-200">{currentCall.dokter}</span>
                  </div>
                </div>
              )}
            </div>

            {currentCall && currentCall.callCount > 1 && (
              <div className="mt-3 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Panggilan Ke-{currentCall.callCount}
              </div>
            )}
          </div>

          {/* 3 Poli Quick Glance Cards */}
          <div className="grid grid-cols-3 gap-4">
            {(data?.aktifPerPoli || []).map((poli) => (
              <div
                key={poli.poli}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
                    KODE {poli.prefix}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {poli.waitingCount} Menunggu
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-300 line-clamp-1">{poli.poli}</div>
                <div className="text-4xl font-black font-mono text-white mt-1">
                  {poli.noAntrean}
                </div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {poli.namaPasien !== '-' ? poli.namaPasien : 'Siap Melayani'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING QUEUES & HISTORY (Span 5) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          {/* Upcoming / Next Queues Card */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                ANTREAN BERIKUTNYA
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                {data?.statistik.menunggu || 0} Pasien Antre
              </span>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
              {data?.antreanBerikutnya && data.antreanBerikutnya.length > 0 ? (
                data.antreanBerikutnya.map((ant, idx) => (
                  <div
                    key={ant.noAntrean + idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-black text-xl text-emerald-400 border border-slate-700">
                        {ant.noAntrean}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base leading-tight">
                          {ant.namaPasien}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {ant.poli}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                        Menunggu
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-12">
                  <CheckCircle className="w-10 h-10 text-slate-600 mb-2" />
                  Semua antrean telah dipanggil
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats / History */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Panggilan Terakhir
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {data?.riwayatDipanggil && data.riwayatDipanggil.length > 0 ? (
                data.riwayatDipanggil.slice(0, 4).map((r, i) => (
                  <div
                    key={r.noAntrean + i}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center"
                  >
                    <div className="text-lg font-mono font-bold text-slate-200">
                      {r.noAntrean}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {r.poli.replace('Poli ', '')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center text-xs text-slate-500 py-2">
                  Belum ada riwayat
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Running Text Marquee */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center gap-4 text-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider shrink-0 border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          PENGUMUMAN
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-[marquee_25s_linear_infinite] text-slate-300 text-sm font-medium">
            Selamat datang di SIM Klinik • Harap memperhatikan panggilan nomor antrean Anda • Jaga kenyamanan bersama di ruang tunggu.
          </div>
        </div>
      </footer>

      {showAudioModal && (
        <AudioSettingsModal isOpen={showAudioModal} onClose={() => setShowAudioModal(false)} />
      )}
    </div>
  );
};
