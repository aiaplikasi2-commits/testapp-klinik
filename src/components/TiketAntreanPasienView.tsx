import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Volume2,
  BellRing,
} from 'lucide-react';

interface TicketData {
  id: string;
  noAntrean: string;
  namaPasien: string;
  noRM: string;
  poli: string;
  ruangPelayanan?: string;
  tanggal: string;
  waktuDaftar: string;
  status: string;
  namaDokter: string;
  antreanDiDepan: number;
  estimasiMenungguMenit: number;
  nomorSedangDipanggil?: string;
}

export const TiketAntreanPasienView: React.FC<{ onBackToHome?: () => void }> = ({ onBackToHome }) => {
  const [activeTicket, setActiveTicket] = useState<TicketData | null>(() => {
    const saved = localStorage.getItem('sim_active_ticket');
    return saved ? JSON.parse(saved) : null;
  });

  const [namaPasien, setNamaPasien] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [poli, setPoli] = useState('Poli Umum');
  const [keluhanAwal, setKeluhanAwal] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-refresh ticket status every 4 seconds if ticket is active
  useEffect(() => {
    if (!activeTicket?.id) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/antrean/status/${activeTicket.id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setActiveTicket((prev) => {
            const updated = {
              ...prev,
              ...json.data,
            };
            localStorage.setItem('sim_active_ticket', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to update ticket status:', err);
      }
    };

    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  const handleAmbilAntrean = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!namaPasien.trim() || !noTelepon.trim()) {
      setErrorMsg('Mohon isi nama lengkap dan nomor WhatsApp/telepon Anda');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/antrean/ambil-mandiri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaPasien: namaPasien.trim(),
          noTelepon: noTelepon.trim(),
          poli,
          keluhanAwal: keluhanAwal.trim(),
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setActiveTicket(json.data);
        localStorage.setItem('sim_active_ticket', JSON.stringify(json.data));
        setSuccessMsg(json.message || 'Nomor antrean berhasil didapatkan!');
      } else {
        setErrorMsg(json.message || 'Gagal mengambil nomor antrean');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan. Pastikan koneksi internet Anda stabil.');
    } finally {
      setLoading(false);
    }
  };

  const manualRefresh = async () => {
    if (!activeTicket) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/antrean/status/${activeTicket.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveTicket((prev) => ({ ...prev, ...json.data }));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Dipanggil':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
            <BellRing className="w-3.5 h-3.5" />
            SEDANG DIPANGGIL
          </span>
        );
      case 'Sedang Dilayani':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SEDANG DILAYANI
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-600 text-slate-100">
            SELESAI
          </span>
        );
      case 'Dilewati':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">
            DILEWATI
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5" />
            MENUNGGU GILIRAN
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-tight">
                SIM Klinik
              </h1>
            </div>
          </div>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
            >
              Portal Petugas
            </button>
          )}
        </div>

        {/* ACTIVE TICKET CARD */}
        {activeTicket ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Tiket Antrean Online
                  </span>
                </div>
                {getStatusBadge(activeTicket.status)}
              </div>

              {/* Huge Ticket Code */}
              <div className="text-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-5">
                <div className="text-xs font-semibold text-slate-400 mb-1">
                  NOMOR ANTREAN ANDA
                </div>
                <div className="text-6xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100">
                  {activeTicket.noAntrean}
                </div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {activeTicket.poli}
                </div>
              </div>

              {/* Waiting Status Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <div className="text-xs text-slate-400">Antrean di Depan</div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {activeTicket.antreanDiDepan ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-500">Orang</div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <div className="text-xs text-slate-400">Est. Waktu Tunggu</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    ~{activeTicket.estimasiMenungguMenit ?? 10}
                  </div>
                  <div className="text-[10px] text-slate-500">Menit</div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Pasien:</span>
                  <span className="font-semibold text-slate-200">{activeTicket.namaPasien}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Rekam Medis:</span>
                  <span className="font-mono text-emerald-400">{activeTicket.noRM || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ruangan:</span>
                  <span className="font-semibold text-slate-200">{activeTicket.ruangPelayanan || 'Ruang Pemeriksaan'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Waktu Daftar:</span>
                  <span className="text-slate-300">
                    {new Date(activeTicket.waktuDaftar).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} WIB
                  </span>
                </div>
              </div>

              {/* Refresh Action */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={manualRefresh}
                  disabled={refreshing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Memperbarui...' : 'Perbarui Status'}</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Apakah Anda ingin mengambil tiket baru?')) {
                      localStorage.removeItem('sim_active_ticket');
                      setActiveTicket(null);
                    }
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-medium text-xs text-rose-400 transition"
                >
                  Ambil Baru
                </button>
              </div>
            </div>

            {/* Notification advice */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">Pantau Nomor Anda</span>
                Layar ini akan terus terbarui secara otomatis. Harap bersiap di dekat ruang pemeriksaan ketika antrean di depan tersisa 1-2 orang.
              </div>
            </div>
          </div>
        ) : (
          /* FORM AMBIL TIKET MANDIRI */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="mb-5 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
                <Smartphone className="w-3.5 h-3.5" />
                Pendaftaran Mandiri Pasien
              </div>
              <h2 className="text-xl font-bold text-white">Ambil Nomor Antrean</h2>
              <p className="text-xs text-slate-400 mt-1">
                Isi data singkat untuk mendapatkan tiket antrean digital langsung di HP Anda
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAmbilAntrean} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Lengkap Pasien <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rahmat Hidayat"
                    value={namaPasien}
                    onChange={(e) => setNamaPasien(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nomor Telepon / WhatsApp <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={noTelepon}
                    onChange={(e) => setNoTelepon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Poli / Tujuan Pelayanan <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Poli Umum', prefix: 'A', desc: 'Umum & Dewasa' },
                    { id: 'Poli Gigi', prefix: 'B', desc: 'Pemeriksaan Gigi' },
                    { id: 'Poli KIA', prefix: 'C', desc: 'Ibu & Anak' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPoli(p.id)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        poli === p.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black font-mono block text-emerald-400">
                        KODE {p.prefix}
                      </span>
                      <span className="text-xs font-bold text-white block mt-0.5">
                        {p.id}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {p.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Keluhan Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Batuk demam sejak 2 hari"
                  value={keluhanAwal}
                  onChange={(e) => setKeluhanAwal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-extrabold text-sm text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menerbitkan Nomor Antrean...</span>
                  </>
                ) : (
                  <>
                    <span>Ambil Nomor Antrean Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center mt-6 text-xs text-slate-500">
        SIM Klinik
      </div>
    </div>
  );
};
