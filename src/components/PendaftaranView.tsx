import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Users,
  Clock,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Edit2,
  FileText,
  Volume2,
  Play,
  Check,
  SkipForward,
  RotateCcw,
  Sparkles,
  Ticket,
  Tv,
  SlidersHorizontal,
} from 'lucide-react';
import { Pasien, Kunjungan, User } from '../types';
import { apiFetch } from '../api/client';
import { announceQueueCall } from '../utils/audio-call';
import { AudioSettingsModal } from './AudioSettingsModal';

interface PendaftaranViewProps {
  currentUser: User;
  onNavigateToRekamMedis?: () => void;
  onOpenTv?: () => void;
  onOpenPatientTicket?: () => void;
}

export const PendaftaranView: React.FC<PendaftaranViewProps> = ({
  currentUser,
  onNavigateToRekamMedis,
  onOpenTv,
  onOpenPatientTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'antrean' | 'pasien' | 'baru'>('antrean');

  // Pasien states
  const [pasiens, setPasiens] = useState<Pasien[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingPasiens, setLoadingPasiens] = useState(false);

  // Form Pasien Baru state
  const [formNama, setFormNama] = useState('');
  const [formJK, setFormJK] = useState<'L' | 'P'>('L');
  const [formTanggalLahir, setFormTanggalLahir] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formTelepon, setFormTelepon] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formGolDarah, setFormGolDarah] = useState('-');
  const [formAlergi, setFormAlergi] = useState('');
  const [formKeluhanAwal, setFormKeluhanAwal] = useState('');
  const [formPoli, setFormPoli] = useState('Poli Umum');
  const [autoDaftarKunjungan, setAutoDaftarKunjungan] = useState(true);

  // Filter antrean per poli
  const [filterPoli, setFilterPoli] = useState('Semua');

  // Edit Pasien modal state
  const [editingPasien, setEditingPasien] = useState<Pasien | null>(null);

  // Antrean state
  const [antreanList, setAntreanList] = useState<Kunjungan[]>([]);
  const [loadingAntrean, setLoadingAntrean] = useState(false);

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  // Selected patient for visit history modal
  const [detailPasien, setDetailPasien] = useState<any | null>(null);

  // Fetch patients
  const fetchPasiens = async (search = '') => {
    setLoadingPasiens(true);
    const res = await apiFetch<Pasien[]>(`/pasiens?search=${encodeURIComponent(search)}`);
    if (res.success && res.data) {
      setPasiens(res.data);
    }
    setLoadingPasiens(false);
  };

  // Fetch antrean
  const fetchAntrean = async () => {
    setLoadingAntrean(true);
    const res = await apiFetch<Kunjungan[]>('/kunjungans');
    if (res.success && res.data) {
      setAntreanList(res.data);
    }
    setLoadingAntrean(false);
  };

  useEffect(() => {
    fetchPasiens();
    fetchAntrean();
    const interval = setInterval(fetchAntrean, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPasiens(searchQuery);
  };

  // Submit new patient
  const handleRegisterPasien = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const payload = {
      nama: formNama,
      jenisKelamin: formJK,
      tanggalLahir: formTanggalLahir,
      alamat: formAlamat,
      noTelepon: formTelepon,
      nik: formNik,
      golDarah: formGolDarah,
      alergi: formAlergi,
    };

    const res = await apiFetch<Pasien>('/pasiens', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      const createdPasien = res.data;

      // If auto-queue selected, register visit right away with selected Poli
      if (autoDaftarKunjungan) {
        await apiFetch('/kunjungans', {
          method: 'POST',
          body: JSON.stringify({
            pasienId: createdPasien.id,
            poli: formPoli,
            keluhanAwal: formKeluhanAwal || `Kunjungan ${formPoli}`,
          }),
        });
      }

      setSuccessMsg(
        `Pasien ${createdPasien.nama} berhasil didaftarkan dengan No. Rekam Medis: ${createdPasien.noRM}!`
      );
      // Reset form
      setFormNama('');
      setFormTanggalLahir('');
      setFormAlamat('');
      setFormTelepon('');
      setFormNik('');
      setFormAlergi('');
      setFormKeluhanAwal('');

      fetchPasiens();
      fetchAntrean();
      setActiveTab('antrean');
    } else {
      setErrorMsg(res.message || 'Gagal mendaftarkan pasien');
    }
    setIsSubmitting(false);
  };

  // Edit patient submit
  const handleUpdatePasien = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasien) return;

    setIsSubmitting(true);
    const res = await apiFetch<Pasien>(`/pasiens/${editingPasien.id}`, {
      method: 'PUT',
      body: JSON.stringify(editingPasien),
    });

    if (res.success && res.data) {
      setSuccessMsg(`Data pasien ${res.data.nama} berhasil diperbarui`);
      setEditingPasien(null);
      fetchPasiens(searchQuery);
    } else {
      setErrorMsg(res.message || 'Gagal memperbarui data pasien');
    }
    setIsSubmitting(false);
  };

  // Register existing patient into today's queue
  const handleDaftarKunjunganLama = async (pasien: Pasien, poliTujuan = 'Poli Umum') => {
    setIsSubmitting(true);
    setErrorMsg('');
    const res = await apiFetch<Kunjungan>('/kunjungans', {
      method: 'POST',
      body: JSON.stringify({
        pasienId: pasien.id,
        poli: poliTujuan,
        keluhanAwal: `Pemeriksaan ${poliTujuan} pasien lama`,
      }),
    });

    if (res.success && res.data) {
      setSuccessMsg(
        `Berhasil mendaftarkan antrean ${res.data.noAntrean} (${res.data.poli}) untuk ${pasien.nama} (${pasien.noRM})`
      );
      fetchAntrean();
      setActiveTab('antrean');
    } else {
      setErrorMsg(res.message || 'Gagal membuat antrean');
    }
    setIsSubmitting(false);
  };

  // Calling queue actions with audio chime and Bahasa Indonesia speech
  const handlePanggil = async (item: Kunjungan) => {
    try {
      const res = await apiFetch<any>('/antrean/panggil', {
        method: 'POST',
        body: JSON.stringify({
          kunjunganId: item.id,
          ruangPelayanan: item.ruangPelayanan || item.poli,
        }),
      });
      if (res.success) {
        announceQueueCall({
          noAntrean: item.noAntrean,
          dokter: item.namaDokter,
          ruang: item.ruangPelayanan || item.poli,
          poli: item.poli,
          isRecall: false,
        });
        setSuccessMsg(`Memanggil antrean ${item.noAntrean} (${item.namaPasien}) ke ${item.ruangPelayanan || item.poli}`);
        fetchAntrean();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePanggilUlang = async (item: Kunjungan) => {
    try {
      const res = await apiFetch<any>('/antrean/panggil-ulang', {
        method: 'POST',
        body: JSON.stringify({ kunjunganId: item.id }),
      });
      if (res.success) {
        announceQueueCall({
          noAntrean: item.noAntrean,
          dokter: item.namaDokter,
          ruang: item.ruangPelayanan || item.poli,
          poli: item.poli,
          isRecall: true,
        });
        setSuccessMsg(`Panggilan ulang ${item.noAntrean} (${item.namaPasien})`);
        fetchAntrean();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLewati = async (item: Kunjungan) => {
    try {
      const res = await apiFetch<any>('/antrean/lewati', {
        method: 'POST',
        body: JSON.stringify({ kunjunganId: item.id }),
      });
      if (res.success) {
        setSuccessMsg(`Antrean ${item.noAntrean} dilewati`);
        fetchAntrean();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLayani = async (item: Kunjungan) => {
    try {
      const res = await apiFetch<any>('/antrean/layani', {
        method: 'POST',
        body: JSON.stringify({ kunjunganId: item.id }),
      });
      if (res.success) {
        setSuccessMsg(`Pasien ${item.namaPasien} (${item.noAntrean}) mulai dilayani`);
        fetchAntrean();
        if (onNavigateToRekamMedis && (currentUser.role === 'Dokter' || currentUser.role === 'Perawat')) {
          onNavigateToRekamMedis();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePanggilBerikutnya = () => {
    const filtered = antreanList.filter(
      (k) => k.status === 'Menunggu' && (filterPoli === 'Semua' || k.poli === filterPoli)
    );
    if (filtered.length > 0) {
      handlePanggil(filtered[0]);
    } else {
      setErrorMsg('Tidak ada antrean berstatus Menunggu untuk dipanggil.');
    }
  };

  const handleUpdateStatus = async (kunjunganId: string, status: string) => {
    const res = await apiFetch(`/kunjungans/${kunjunganId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      fetchAntrean();
    }
  };

  // View patient detail & history
  const handleLihatRiwayat = async (pasienId: string) => {
    const res = await apiFetch<any>(`/pasiens/${pasienId}`);
    if (res.success && res.data) {
      setDetailPasien(res.data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Pendaftaran & Antrean Pasien
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola pendaftaran pasien baru, antrean live poli umum, dan data rekam medis pasien.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('antrean')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'antrean'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Antrean Hari Ini ({antreanList.length})
          </button>
          <button
            onClick={() => setActiveTab('pasien')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'pasien'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Pasien ({pasiens.length})
          </button>
          <button
            onClick={() => setActiveTab('baru')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'baru'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Pasien Baru
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs text-emerald-600 underline">
            Tutup
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-xs text-rose-600 underline">
            Tutup
          </button>
        </div>
      )}

      {/* TAB 1: ANTREAN HARI INI */}
      {activeTab === 'antrean' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Daftar Antrean Hari Ini
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePanggilBerikutnya}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm transition"
              >
                <Volume2 className="w-4 h-4" />
                <span>Panggil Berikutnya</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAudioModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200"
                title="Atur Intonasi, Kecepatan, Bel, & Tes Suara Panggilan"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                <span>Pengaturan Suara</span>
              </button>

              {onOpenTv && (
                <button
                  type="button"
                  onClick={onOpenTv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition"
                >
                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Layar TV</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('baru')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
              >
                + Pasien Baru
              </button>
            </div>
          </div>

          {/* Filter by Poli */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-slate-500 font-semibold mr-1">Filter Poli:</span>
              {['Semua', 'Poli Umum', 'Poli Gigi', 'Poli KIA'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPoli(p)}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    filterPoli === p
                      ? 'bg-teal-600 text-white shadow-xs font-bold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="text-slate-500 text-xs hidden sm:block">
              Total: {antreanList.length} Antrean
            </div>
          </div>

          {loadingAntrean && antreanList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data antrean...</div>
          ) : antreanList.filter((k) => filterPoli === 'Semua' || k.poli === filterPoli).length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-600">Belum ada pasien dalam antrean {filterPoli !== 'Semua' ? filterPoli : 'hari ini'}</div>
              <p className="text-xs mt-1">
                Daftarkan pasien baru atau ambil nomor antrean mandiri secara online.
              </p>
              <button
                onClick={() => setActiveTab('baru')}
                className="mt-4 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
              >
                + Daftarkan Pasien Sekarang
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {antreanList
                .filter((k) => filterPoli === 'Semua' || k.poli === filterPoli)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                      {/* Queue Ticket Badge */}
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm ${
                        item.status === 'Dipanggil'
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-200 animate-pulse'
                          : item.status === 'Sedang Dilayani'
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : item.status === 'Dilewati'
                          ? 'bg-rose-500 text-white opacity-80'
                          : 'bg-teal-600 text-white'
                      }`}>
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">No. Antre</span>
                        <span className="text-xl font-black font-mono leading-none">{item.noAntrean}</span>
                      </div>

                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                            {item.namaPasien}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
                            {item.noRM}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                            {item.poli}
                          </span>
                          {item.sumberPendaftaran === 'Online HP Mandiri' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Ticket className="w-3 h-3" />
                              Online HP
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>Ruang: <strong className="text-slate-700">{item.ruangPelayanan || item.poli}</strong></span>
                          <span>•</span>
                          <span>Dokter: {item.namaDokter}</span>
                          <span>•</span>
                          <span>Keluhan: {item.keluhanAwal || '-'}</span>
                          {item.waktuTungguMenit !== undefined && item.waktuTungguMenit > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">Tunggu: {item.waktuTungguMenit} mnt</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Complete Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Status indicator */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === 'Menunggu'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : item.status === 'Dipanggil'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                            : item.status === 'Sedang Dilayani'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.status === 'Dilewati'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>

                      {/* CALL ACTIONS */}
                      {item.status === 'Menunggu' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePanggil(item)}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                            title="Panggil nomor antrean dengan suara bahasa Indonesia"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Panggil Suara</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLewati(item)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-rose-600 text-xs font-semibold transition"
                          >
                            Lewati
                          </button>
                        </>
                      )}

                      {item.status === 'Dipanggil' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePanggilUlang(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition"
                            title="Panggil ulang nomor antrean"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Panggil Ulang</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLayani(item)}
                            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Mulai Layani</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLewati(item)}
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                          >
                            Lewati
                          </button>
                        </>
                      )}

                      {item.status === 'Sedang Dilayani' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'Selesai')}
                            className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Selesaikan</span>
                          </button>

                          {onNavigateToRekamMedis && (
                            <button
                              type="button"
                              onClick={onNavigateToRekamMedis}
                              className="px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition"
                            >
                              Rekam Medis
                            </button>
                          )}
                        </>
                      )}

                      {item.status === 'Dilewati' && (
                        <button
                          type="button"
                          onClick={() => handlePanggil(item)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Panggil Kembali</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DAFTAR PASIEN & CARI PASIEN */}
      {activeTab === 'pasien' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pasien berdasarkan Nama, No. RM, NIK, atau No. Telepon..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-teal-700 transition"
              >
                Cari
              </button>
            </form>
          </div>

          {loadingPasiens ? (
            <div className="p-8 text-center text-xs text-slate-400">Mencari data pasien...</div>
          ) : pasiens.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-700">Tidak ada data pasien yang cocok</div>
              <p className="text-xs mt-1">Coba kata kunci lain atau daftarkan sebagai pasien baru.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pasiens.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-base">{p.nama}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800">
                        {p.noRM}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ({p.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lahir: {p.tanggalLahir}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.noTelepon}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.alamat}</span>
                      </span>
                    </div>

                    {p.alergi && (
                      <div className="text-xs text-rose-600 font-medium">
                        ⚠️ Alergi Obat: {p.alergi}
                      </div>
                    )}
                  </div>

                  {/* Actions for Existing Patient */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDaftarKunjunganLama(p)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold transition"
                      title="Daftarkan antrean kunjungan hari ini tanpa mengulang pengisian identitas"
                    >
                      + Buat Antrean Kunjungan
                    </button>
                    <button
                      onClick={() => handleLihatRiwayat(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                    >
                      Riwayat Kunjungan
                    </button>
                    <button
                      onClick={() => setEditingPasien(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      title="Edit Data Pasien"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORM PENDAFTARAN PASIEN BARU */}
      {activeTab === 'baru' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-7">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Formulir Pendaftaran Pasien Baru</h3>
            <p className="text-xs text-slate-500">
              Nomor Rekam Medis (No. RM) akan otomatis dibuat unik oleh sistem berformat RM-YYYYMM-XXXX.
            </p>
          </div>

          <form onSubmit={handleRegisterPasien} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Pasien *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  value={formJK}
                  onChange={(e) => setFormJK(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  required
                  value={formTanggalLahir}
                  onChange={(e) => setFormTanggalLahir(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formTelepon}
                  onChange={(e) => setFormTelepon(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  NIK / Nomor Identitas (KTP)
                </label>
                <input
                  type="text"
                  value={formNik}
                  onChange={(e) => setFormNik(e.target.value)}
                  placeholder="16 digit NIK (opsional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Golongan Darah
                </label>
                <select
                  value={formGolDarah}
                  onChange={(e) => setFormGolDarah(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="-">Tidak Tahu / Belum Cek</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Domisili Lengkap *
              </label>
              <textarea
                required
                rows={2}
                value={formAlamat}
                onChange={(e) => setFormAlamat(e.target.value)}
                placeholder="Jl. Mawar No. 12, Kelurahan / Desa, Kecamatan"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Riwayat Alergi Obat / Makanan
              </label>
              <input
                type="text"
                value={formAlergi}
                onChange={(e) => setFormAlergi(e.target.value)}
                placeholder="Contoh: Alergi Amoksisilin, Parasetamol, Makanan laut (Kosongkan bila tidak ada)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200">
              <label className="flex items-center space-x-2 text-xs font-semibold text-teal-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDaftarKunjungan}
                  onChange={(e) => setAutoDaftarKunjungan(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>Langsung masukkan pasien ke nomor antrean hari ini</span>
              </label>

              {autoDaftarKunjungan && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Poli / Tujuan Pelayanan
                    </label>
                    <select
                      value={formPoli}
                      onChange={(e) => setFormPoli(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Poli Umum">Poli Umum (Kode Antrean A)</option>
                      <option value="Poli Gigi">Poli Gigi (Kode Antrean B)</option>
                      <option value="Poli KIA">Poli KIA / Ibu & Anak (Kode Antrean C)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keluhan Utama / Alasan Kunjungan
                    </label>
                    <input
                      type="text"
                      value={formKeluhanAwal}
                      onChange={(e) => setFormKeluhanAwal(e.target.value)}
                      placeholder="Contoh: Demam 2 hari, batuk pilek, pusing"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('antrean')}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Daftarkan Pasien'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT DATA PASIEN */}
      {editingPasien && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Edit Data Pasien: {editingPasien.noRM}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Perbarui informasi identitas pasien</p>

            <form onSubmit={handleUpdatePasien} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pasien</label>
                <input
                  type="text"
                  required
                  value={editingPasien.nama}
                  onChange={(e) => setEditingPasien({ ...editingPasien, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editingPasien.jenisKelamin}
                    onChange={(e) =>
                      setEditingPasien({
                        ...editingPasien,
                        jenisKelamin: e.target.value as 'L' | 'P',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editingPasien.tanggalLahir}
                    onChange={(e) => setEditingPasien({ ...editingPasien, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                <input
                  type="tel"
                  value={editingPasien.noTelepon}
                  onChange={(e) => setEditingPasien({ ...editingPasien, noTelepon: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
                <textarea
                  rows={2}
                  value={editingPasien.alamat}
                  onChange={(e) => setEditingPasien({ ...editingPasien, alamat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alergi Obat</label>
                <input
                  type="text"
                  value={editingPasien.alergi}
                  onChange={(e) => setEditingPasien({ ...editingPasien, alergi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPasien(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT KUNJUNGAN PASIEN */}
      {detailPasien && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Riwayat Kunjungan & Rekam Medis
                </h3>
                <p className="text-xs text-slate-500">
                  {detailPasien.nama} ({detailPasien.noRM})
                </p>
              </div>
              <button
                onClick={() => setDetailPasien(null)}
                className="text-xs px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kunjungan Tercatat ({detailPasien.riwayatKunjungan?.length || 0})
              </div>

              {!detailPasien.riwayatKunjungan || detailPasien.riwayatKunjungan.length === 0 ? (
                <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">
                  Belum ada riwayat kunjungan sebelumnya.
                </div>
              ) : (
                <div className="space-y-2">
                  {detailPasien.riwayatKunjungan.map((k: any) => (
                    <div key={k.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>Tanggal: {k.tanggal}</span>
                        <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {k.noAntrean} - {k.status}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">Dokter: {k.namaDokter}</div>
                      <div className="text-slate-500">Keluhan: {k.keluhanAwal}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
                Rekam Medis Terdokumentasi ({detailPasien.riwayatRekamMedis?.length || 0})
              </div>

              {!detailPasien.riwayatRekamMedis || detailPasien.riwayatRekamMedis.length === 0 ? (
                <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-xl">
                  Belum ada rekam medis tersimpan.
                </div>
              ) : (
                <div className="space-y-2">
                  {detailPasien.riwayatRekamMedis.map((rm: any) => (
                    <div key={rm.id} className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 text-xs">
                      <div className="flex justify-between font-bold text-teal-900">
                        <span>Diagnosis: {rm.diagnosis}</span>
                        <span>{rm.tanggal}</span>
                      </div>
                      <div className="text-slate-700 mt-1">Anamnesis: {rm.keluhanUtama}</div>
                      <div className="text-slate-500 text-[11px] mt-1">
                        Tanda Vital: TD {rm.tandaVital?.tekananDarah} mmHg, Suhu {rm.tandaVital?.suhuTubuh} °C, BB {rm.tandaVital?.beratBadan} kg, TB {rm.tandaVital?.tinggiBadan} cm
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAudioModal && (
        <AudioSettingsModal isOpen={showAudioModal} onClose={() => setShowAudioModal(false)} />
      )}
    </div>
  );
};
