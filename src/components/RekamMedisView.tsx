import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Clock,
  History,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Activity,
  Pill,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Volume2,
} from 'lucide-react';
import { Kunjungan, RekamMedis, Obat, User, ResepItem, TindakanItem } from '../types';
import { apiFetch } from '../api/client';
import { announceQueueCall } from '../utils/audio-call';

interface RekamMedisViewProps {
  currentUser: User;
}

export const RekamMedisView: React.FC<RekamMedisViewProps> = ({ currentUser }) => {
  // Queue & active examination
  const [antreanList, setAntreanList] = useState<Kunjungan[]>([]);
  const [selectedKunjungan, setSelectedKunjungan] = useState<Kunjungan | null>(null);
  const [availableMedicines, setAvailableMedicines] = useState<Obat[]>([]);

  // Medical examination form fields
  const [keluhanUtama, setKeluhanUtama] = useState('');
  const [riwayatPenyakit, setRiwayatPenyakit] = useState('');
  const [tekananDarah, setTekananDarah] = useState('120/80');
  const [suhuTubuh, setSuhuTubuh] = useState<number>(36.5);
  const [beratBadan, setBeratBadan] = useState<number>(60);
  const [tinggiBadan, setTinggiBadan] = useState<number>(165);
  const [nadi, setNadi] = useState<number>(80);
  const [respirasi, setRespirasi] = useState<number>(20);
  const [hasilPemeriksaanFisik, setHasilPemeriksaanFisik] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [catatanDokter, setCatatanDokter] = useState('');

  // Simple medical actions list
  const [tindakanList, setTindakanList] = useState<TindakanItem[]>([]);
  const [inputNamaTindakan, setInputNamaTindakan] = useState('');
  const [inputBiayaTindakan, setInputBiayaTindakan] = useState<number>(25000);

  // Prescription items
  const [resepList, setResepList] = useState<ResepItem[]>([]);
  const [selectedObatId, setSelectedObatId] = useState('');
  const [inputJumlahObat, setInputJumlahObat] = useState<number>(10);
  const [inputAturanPakai, setInputAturanPakai] = useState('3 x 1 tablet sesudah makan');

  // Past medical records of selected patient
  const [patientHistory, setPatientHistory] = useState<RekamMedis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Correction state (audit trail)
  const [correctionTarget, setCorrectionTarget] = useState<RekamMedis | null>(null);
  const [alasanKoreksi, setAlasanKoreksi] = useState('');

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch queue waiting/being examined
  const fetchAntrean = async () => {
    setLoading(true);
    const res = await apiFetch<Kunjungan[]>('/kunjungans');
    if (res.success && res.data) {
      setAntreanList(res.data);
      // Auto-select first waiting patient if not selected
      const waiting = res.data.find((k) => k.status === 'Menunggu' || k.status === 'Dipanggil' || k.status === 'Sedang Dilayani');
      if (waiting && !selectedKunjungan) {
        selectPatientForExam(waiting);
      }
    }
    setLoading(false);
  };

  // Fetch medicines for electronic prescription dropdown
  const fetchMedicines = async () => {
    const res = await apiFetch<Obat[]>('/obats');
    if (res.success && res.data) {
      setAvailableMedicines(res.data);
      if (res.data.length > 0 && !selectedObatId) {
        setSelectedObatId(res.data[0].id);
      }
    }
  };

  useEffect(() => {
    fetchAntrean();
    fetchMedicines();
  }, []);

  const selectPatientForExam = async (k: Kunjungan) => {
    setSelectedKunjungan(k);
    setKeluhanUtama(k.keluhanAwal || '');
    setDiagnosis('');
    setHasilPemeriksaanFisik('Keadaan umum baik, compos mentis.');
    setTindakanList([]);
    setResepList([]);
    setSuccessMsg('');
    setErrorMsg('');

    // Fetch patient history
    setLoadingHistory(true);
    const res = await apiFetch<RekamMedis[]>(`/rekam-medis?pasienId=${k.pasienId}`);
    if (res.success && res.data) {
      setPatientHistory(res.data);
    }
    setLoadingHistory(false);
  };

  // Add action item
  const handleAddTindakan = (nama: string, biaya: number) => {
    if (!nama) return;
    setTindakanList([...tindakanList, { nama, biaya: Number(biaya) || 0 }]);
    setInputNamaTindakan('');
  };

  const handleRemoveTindakan = (index: number) => {
    setTindakanList(tindakanList.filter((_, i) => i !== index));
  };

  // Add prescription item
  const handleAddResep = () => {
    const obat = availableMedicines.find((o) => o.id === selectedObatId);
    if (!obat) {
      setErrorMsg('Pilih obat terlebih dahulu');
      return;
    }
    const jumlah = Number(inputJumlahObat) || 1;
    const harga = obat.hargaJual;
    const subtotal = jumlah * harga;

    setResepList([
      ...resepList,
      {
        idObat: obat.id,
        namaObat: obat.namaObat,
        jumlah,
        aturanPakai: inputAturanPakai,
        harga,
        subtotal,
      },
    ]);
  };

  const handleRemoveResep = (index: number) => {
    setResepList(resepList.filter((_, i) => i !== index));
  };

  // Submit and finalize examination (Sahkan Rekam Medis)
  const handleSubmitRekamMedis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKunjungan) {
      setErrorMsg('Pilih pasien yang sedang dalam antrean terlebih dahulu');
      return;
    }
    if (!keluhanUtama.trim()) {
      setErrorMsg('Keluhan utama (anamnesis) wajib diisi');
      return;
    }
    if (!diagnosis.trim()) {
      setErrorMsg('Diagnosis medis dokter wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      kunjunganId: selectedKunjungan.id,
      keluhanUtama,
      riwayatPenyakit,
      tandaVital: {
        tekananDarah,
        suhuTubuh: Number(suhuTubuh),
        beratBadan: Number(beratBadan),
        tinggiBadan: Number(tinggiBadan),
        nadi: Number(nadi),
        respirasi: Number(respirasi),
      },
      hasilPemeriksaanFisik,
      diagnosis,
      tindakanMedis: tindakanList,
      resep: resepList,
      catatanDokter,
    };

    const res = await apiFetch<RekamMedis>('/rekam-medis', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success && res.data) {
      setSuccessMsg(
        `Rekam Medis untuk ${selectedKunjungan.namaPasien} (${selectedKunjungan.noRM}) berhasil disimpan dan disahkan!`
      );
      // Refresh queue and select next
      fetchAntrean();
      setSelectedKunjungan(null);
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan rekam medis');
    }
    setSubmitting(false);
  };

  // Submit correction audit
  const handleKoreksiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !alasanKoreksi.trim()) {
      setErrorMsg('Alasan koreksi rekam medis wajib diisi untuk audit trail');
      return;
    }

    setSubmitting(true);
    const res = await apiFetch(`/rekam-medis/${correctionTarget.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        alasanKoreksi,
        diagnosis: correctionTarget.diagnosis,
        keluhanUtama: correctionTarget.keluhanUtama,
        catatanDokter: correctionTarget.catatanDokter,
      }),
    });

    if (res.success) {
      setSuccessMsg('Koreksi rekam medis berhasil dicatat beserta riwayat perubahannya');
      setCorrectionTarget(null);
      setAlasanKoreksi('');
      if (selectedKunjungan) {
        selectPatientForExam(selectedKunjungan);
      }
    } else {
      setErrorMsg(res.message || 'Gagal mengoreksi rekam medis');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Poli Umum & Rekam Medis
            </span>
            <span className="text-xs text-slate-400">• Dokter Pemeriksa: {currentUser.nama}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Pemeriksaan Pasien & Rekam Medis Elektronik
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Formulir klinis, tanda-tanda vital, tindakan medis, dan e-resep otomatis terhubung ke farmasi.
          </p>
        </div>

        {selectedKunjungan && (
          <button
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Lihat Riwayat Medis Pasien ({patientHistory.length})</span>
          </button>
        )}
      </div>

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

      {/* Main Two Column / Adaptive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Waiting Queue (3 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Antrean Poli Hari Ini ({antreanList.length})
              </span>
              <button onClick={fetchAntrean} className="text-xs text-teal-600 hover:underline">
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Memuat antrean...</div>
            ) : antreanList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Tidak ada pasien menunggu di poli hari ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {antreanList.map((item) => {
                  const isSelected = selectedKunjungan?.id === item.id;
                  const isDone = item.status === 'Selesai';

                  return (
                    <div
                      key={item.id}
                      onClick={() => !isDone && selectPatientForExam(item)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                          : isDone
                          ? 'border-slate-200 bg-slate-50 opacity-60'
                          : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-teal-700 text-white">
                          {item.noAntrean}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Menunggu'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'Dipanggil'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'Sedang Dilayani'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{item.namaPasien}</div>
                      <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                        <span>{item.noRM}</span>
                        <span>{item.jenisKunjungan}</span>
                      </div>
                      {item.keluhanAwal && (
                        <div className="text-[11px] text-slate-600 italic mt-1 line-clamp-1">
                          "{item.keluhanAwal}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Examination Form (8 cols on desktop) */}
        <div className="lg:col-span-8">
          {!selectedKunjungan ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-12 text-center text-slate-400">
              <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <h3 className="text-base font-bold text-slate-700">Pilih Pasien Dari Antrean</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Klik salah satu pasien pada daftar antrean sebelah kiri untuk memulai pemeriksaan rekam medis.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitRekamMedis} className="space-y-5 bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-2xs">
              {/* Header Info of Current Patient */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-teal-600 text-white font-extrabold flex items-center justify-center text-xs">
                      {selectedKunjungan.noAntrean}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">
                        {selectedKunjungan.namaPasien}
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span className="font-semibold text-teal-700">{selectedKunjungan.noRM}</span>
                        <span>•</span>
                        <span>{selectedKunjungan.poli}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      announceQueueCall({
                        noAntrean: selectedKunjungan.noAntrean,
                        dokter: currentUser.nama,
                        ruang: selectedKunjungan.ruangPelayanan || 'Ruang Pemeriksaan Dokter',
                        poli: selectedKunjungan.poli,
                        isRecall: true,
                      });
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
                    title="Panggil pasien ini dengan bel Ting Tang Tung dan suara TTS"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Panggil Pasien</span>
                  </button>
                  <span className="text-xs font-semibold px-2.5 py-1.5 bg-teal-50 text-teal-800 rounded-xl border border-teal-200">
                    Status: Sedang Diperiksa
                  </span>
                </div>
              </div>

              {/* SECTION 1: ANAMNESIS & KELUHAN UTAMA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Anamnesis / Keluhan Utama *
                </label>
                <textarea
                  required
                  rows={2}
                  value={keluhanUtama}
                  onChange={(e) => setKeluhanUtama(e.target.value)}
                  placeholder="Keluhan yang dirasakan pasien, lama keluhan, faktor pencetus..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Riwayat Penyakit Terdahulu / Riwayat Keluarga
                </label>
                <input
                  type="text"
                  value={riwayatPenyakit}
                  onChange={(e) => setRiwayatPenyakit(e.target.value)}
                  placeholder="Contoh: Riwayat Maag, Hipertensi, Alergi antibiotik..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* SECTION 2: TANDA-TANDA VITAL (VITAL SIGNS) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>2. Tanda-Tanda Vital & Pemeriksaan Fisik</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tekanan Darah
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tekananDarah}
                        onChange={(e) => setTekananDarah(e.target.value)}
                        placeholder="120/80"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">mmHg</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Suhu Tubuh
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={suhuTubuh}
                        onChange={(e) => setSuhuTubuh(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">°C</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Berat Badan
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={beratBadan}
                        onChange={(e) => setBeratBadan(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">kg</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tinggi Badan
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={tinggiBadan}
                        onChange={(e) => setTinggiBadan(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <span className="absolute right-2 top-2 text-[10px] text-slate-400">cm</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Hasil Pemeriksaan Fisik
                  </label>
                  <input
                    type="text"
                    value={hasilPemeriksaanFisik}
                    onChange={(e) => setHasilPemeriksaanFisik(e.target.value)}
                    placeholder="Kepala/leher, toraks, abdomen, ekstremitas..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* SECTION 3: DIAGNOSIS DOKTER */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Diagnosis Klinis (ICD-10 / Deskripsi Medis) *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Contoh: ISPA (J06.9), Faringitis Akut (J02.9), Dispepsia (K30), Hipertensi Primer (I10)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                />
              </div>

              {/* SECTION 4: TINDAKAN MEDIS SEDERHANA */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    4. Tindakan Medis Sederhana
                  </div>
                  <span className="text-[11px] text-slate-500">Biaya tindakan otomatis masuk ke tagihan kasir</span>
                </div>

                {/* Action input: Nama Tindakan & Biaya */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputNamaTindakan}
                    onChange={(e) => setInputNamaTindakan(e.target.value)}
                    placeholder="Ketik nama tindakan medis (misal: Nebulisasi, Jahit Luka, Injeksi)..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={inputBiayaTindakan}
                      onChange={(e) => setInputBiayaTindakan(Number(e.target.value))}
                      placeholder="Tarif (Rp)"
                      className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTindakan(inputNamaTindakan, inputBiayaTindakan)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition"
                    >
                      + Tambah Tindakan
                    </button>
                  </div>
                </div>

                {/* List of actions added */}
                {tindakanList.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {tindakanList.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <span className="font-medium text-slate-800">{t.nama}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-teal-700">
                            Rp{t.biaya.toLocaleString('id-ID')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTindakan(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 5: RESEP ELEKTRONIK DOKTER */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>5. Resep Obat Elektronik (Koneksi Langsung ke Farmasi)</span>
                  </div>
                  <span className="text-[11px] text-teal-700">Pengurangan stok otomatis saat diserahkan farmasi</span>
                </div>

                {availableMedicines.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs">
                    Katalog obat kosong. Silakan tambahkan data obat pada modul "Obat & Farmasi" terlebih dahulu.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Pilih Obat
                      </label>
                      <select
                        value={selectedObatId}
                        onChange={(e) => setSelectedObatId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {availableMedicines.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.namaObat} ({m.satuan}) - Stok: {m.stok} - Rp{m.hargaJual.toLocaleString('id-ID')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Jumlah
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={inputJumlahObat}
                        onChange={(e) => setInputJumlahObat(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Aturan Pakai / Signa
                      </label>
                      <input
                        type="text"
                        value={inputAturanPakai}
                        onChange={(e) => setInputAturanPakai(e.target.value)}
                        placeholder="Contoh: 3x1 sesudah makan"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddResep}
                        className="w-full py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition"
                      >
                        + Resep
                      </button>
                    </div>
                  </div>
                )}

                {/* Prescription items list */}
                {resepList.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {resepList.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-teal-200 text-xs"
                      >
                        <div>
                          <span className="font-bold text-teal-900">{r.namaObat}</span>
                          <span className="text-slate-500 ml-2">Qty: {r.jumlah}</span>
                          <span className="text-teal-700 font-medium ml-2 italic">({r.aturanPakai})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-700">
                            Rp{r.subtotal.toLocaleString('id-ID')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveResep(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Edukasi Pasien
                </label>
                <input
                  type="text"
                  value={catatanDokter}
                  onChange={(e) => setCatatanDokter(e.target.value)}
                  placeholder="Contoh: Istirahat cukup, hindari makanan berlemak, kontrol kembali jika 3 hari demam belum reda..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {/* Submit / Sahkan Rekam Medis */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Rekam medis yang telah disahkan akan tercatat permanen</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{submitting ? 'Mengesahkan...' : 'Sahkan & Simpan Rekam Medis'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODAL: RIWAYAT REKAM MEDIS & KOREKSI AUDIT */}
      {showHistoryModal && selectedKunjungan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Riwayat Pemeriksaan Pasien: {selectedKunjungan.namaPasien}
                </h3>
                <p className="text-xs text-slate-500">No. RM: {selectedKunjungan.noRM}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-xs px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat riwayat medis...</div>
            ) : patientHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Belum ada rekam medis sebelumnya untuk pasien ini.
              </div>
            ) : (
              <div className="space-y-4">
                {patientHistory.map((rm) => (
                  <div key={rm.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                          Tanggal: {rm.tanggal}
                        </span>
                        <div className="font-bold text-slate-800 text-sm mt-1">
                          Diagnosis: {rm.diagnosis}
                        </div>
                        <div className="text-xs text-slate-500">Dokter: {rm.namaDokter}</div>
                      </div>

                      {/* Tombol Koreksi Rekam Medis Berlisensi */}
                      <button
                        onClick={() => {
                          setCorrectionTarget(rm);
                          setShowHistoryModal(false);
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100 flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Koreksi Resmi</span>
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div><span className="font-semibold">Anamnesis:</span> {rm.keluhanUtama}</div>
                      <div className="text-slate-500 text-[11px] mt-1">
                        Tanda Vital: TD {rm.tandaVital?.tekananDarah} mmHg | Suhu {rm.tandaVital?.suhuTubuh}°C | BB {rm.tandaVital?.beratBadan}kg | TB {rm.tandaVital?.tinggiBadan}cm
                      </div>
                    </div>

                    {/* Resep lampau */}
                    {rm.resep && rm.resep.length > 0 && (
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">Resep: </span>
                        {rm.resep.map((r) => `${r.namaObat} (${r.aturanPakai})`).join(', ')}
                      </div>
                    )}

                    {/* Riwayat Koreksi Audit Trail */}
                    {rm.riwayatKoreksi && rm.riwayatKoreksi.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                        <div className="font-bold">Riwayat Koreksi Resmi:</div>
                        {rm.riwayatKoreksi.map((k, kIdx) => (
                          <div key={kIdx} className="border-t border-amber-200 pt-1">
                            <div>• Oleh: {k.diubahOleh} pada {k.tanggal}</div>
                            <div>Alasan: "{k.alasan}"</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: FORM KOREKSI RESMI REKAM MEDIS (AUDIT TRAIL) */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Koreksi Resmi Rekam Medis
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Perubahan rekam medis wajib disertai alasan koreksi dan akan disimpan dalam jejak audit permanen.
            </p>

            <form onSubmit={handleKoreksiSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnosis Medis
                </label>
                <input
                  type="text"
                  value={correctionTarget.diagnosis}
                  onChange={(e) =>
                    setCorrectionTarget({ ...correctionTarget, diagnosis: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keluhan Utama / Catatan
                </label>
                <textarea
                  rows={2}
                  value={correctionTarget.keluhanUtama}
                  onChange={(e) =>
                    setCorrectionTarget({ ...correctionTarget, keluhanUtama: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Alasan Koreksi (Wajib Diisi Untuk Audit) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={alasanKoreksi}
                  onChange={(e) => setAlasanKoreksi(e.target.value)}
                  placeholder="Contoh: Koreksi ejaan nama diagnosis, revisi keluhan utama setelah hasil anamnesis lanjutan..."
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Koreksi & Catat Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
