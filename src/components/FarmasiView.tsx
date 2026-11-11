import React, { useState, useEffect } from 'react';
import {
  Pill,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  PackagePlus,
  Send,
  AlertCircle,
  FileCheck,
  Edit2,
  Trash2,
  History,
} from 'lucide-react';
import { Obat, TransaksiStokObat, User } from '../types';
import { apiFetch } from '../api/client';

interface FarmasiViewProps {
  currentUser: User;
}

export const FarmasiView: React.FC<FarmasiViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'resep' | 'obat' | 'restock' | 'mutasi'>('resep');

  // Medicines state
  const [obats, setObats] = useState<Obat[]>([]);
  const [loadingObats, setLoadingObats] = useState(false);
  const [searchObat, setSearchObat] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  // Prescription queue state
  const [antreanResep, setAntreanResep] = useState<any[]>([]);
  const [loadingResep, setLoadingResep] = useState(false);

  // Stock mutation ledger
  const [mutasiList, setMutasiList] = useState<TransaksiStokObat[]>([]);

  // Form tambah / edit obat master
  const [showModalObat, setShowModalObat] = useState(false);
  const [editingObatId, setEditingObatId] = useState<string | null>(null);
  const [formNamaObat, setFormNamaObat] = useState('');
  const [formKategori, setFormKategori] = useState('Analgesik & Antipiretik');
  const [formSatuan, setFormSatuan] = useState('Tablet');
  const [formHargaBeli, setFormHargaBeli] = useState<number>(500);
  const [formHargaJual, setFormHargaJual] = useState<number>(1000);
  const [formStokAwal, setFormStokAwal] = useState<number>(100);
  const [formStokMinimum, setFormStokMinimum] = useState<number>(10);
  const [formExpDate, setFormExpDate] = useState('2028-12-31');
  const [formLokasi, setFormLokasi] = useState('Rak Farmasi 1');

  // Restock form state
  const [restockObatId, setRestockObatId] = useState('');
  const [restockJumlah, setRestockJumlah] = useState<number>(50);
  const [restockKeterangan, setRestockKeterangan] = useState('Pengadaan / Pembelian Faktur');
  const [restockNoFaktur, setRestockNoFaktur] = useState('');

  // Status feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kategoriOptions = [
    'Analgesik & Antipiretik',
    'Antibiotik',
    'Antihistamin',
    'Vitamin & Suplemen',
    'Obat Batuk & Flu',
    'Gastrointestinal / Maag',
    'Kardiovaskular / Hipertensi',
    'Topikal / Kulit & Salep',
    'Alat Kesehatan & Cairan',
    'Lainnya',
  ];

  const satuanOptions = ['Tablet', 'Kapsul', 'Sirup / Botol', 'Salep / Tube', 'Injeksi / Ampul', 'Pcs / Box'];

  const fetchObats = async () => {
    setLoadingObats(true);
    let url = `/obats?search=${encodeURIComponent(searchObat)}`;
    if (filterKategori) url += `&kategori=${encodeURIComponent(filterKategori)}`;
    const res = await apiFetch<Obat[]>(url);
    if (res.success && res.data) {
      setObats(res.data);
      if (res.data.length > 0 && !restockObatId) {
        setRestockObatId(res.data[0].id);
      }
    }
    setLoadingObats(false);
  };

  const fetchAntreanResep = async () => {
    setLoadingResep(true);
    const res = await apiFetch<any[]>('/resep/antrean');
    if (res.success && res.data) {
      setAntreanResep(res.data);
    }
    setLoadingResep(false);
  };

  const fetchLaporanMutasi = async () => {
    const res = await apiFetch<any>('/laporan/summary');
    if (res.success && res.data && res.data.transaksiStokTerakhir) {
      setMutasiList(res.data.transaksiStokTerakhir);
    }
  };

  useEffect(() => {
    fetchObats();
    fetchAntreanResep();
    fetchLaporanMutasi();
  }, []);

  // Dispense prescription & automatically deduct inventory
  const handleSerahkanObat = async (rekamMedisId: string) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await apiFetch(`/resep/${rekamMedisId}/serahkan`, {
      method: 'POST',
    });

    if (res.success) {
      setSuccessMsg('Resep berhasil diverifikasi dan obat diserahkan ke pasien! Stok otomatis terpotong.');
      fetchAntreanResep();
      fetchObats();
      fetchLaporanMutasi();
    } else {
      setErrorMsg(res.message || 'Gagal menyerahkan obat');
    }
    setIsSubmitting(false);
  };

  // Save new or edited medicine
  const handleSaveObat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      namaObat: formNamaObat,
      kategori: formKategori,
      satuan: formSatuan,
      hargaBeli: Number(formHargaBeli),
      hargaJual: Number(formHargaJual),
      stok: Number(formStokAwal),
      stokMinimum: Number(formStokMinimum),
      tanggalKedaluwarsa: formExpDate,
      lokasiPenyimpanan: formLokasi,
    };

    let res;
    if (editingObatId) {
      res = await apiFetch<Obat>(`/obats/${editingObatId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiFetch<Obat>('/obats', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    if (res.success) {
      setSuccessMsg(
        editingObatId ? 'Data obat berhasil diperbarui' : `Obat ${formNamaObat} berhasil ditambahkan ke inventaris`
      );
      setShowModalObat(false);
      resetObatForm();
      fetchObats();
      fetchLaporanMutasi();
    } else {
      setErrorMsg(res.message || 'Gagal menyimpan data obat');
    }
    setIsSubmitting(false);
  };

  const handleEditObat = (obat: Obat) => {
    setEditingObatId(obat.id);
    setFormNamaObat(obat.namaObat);
    setFormKategori(obat.kategori);
    setFormSatuan(obat.satuan);
    setFormHargaBeli(obat.hargaBeli);
    setFormHargaJual(obat.hargaJual);
    setFormStokAwal(obat.stok);
    setFormStokMinimum(obat.stokMinimum);
    setFormExpDate(obat.tanggalKedaluwarsa);
    setFormLokasi(obat.lokasiPenyimpanan);
    setShowModalObat(true);
  };

  const handleDeleteObat = async (id: string, nama: string) => {
    if (!window.confirm(`Hapus obat ${nama} dari inventaris?`)) return;
    const res = await apiFetch(`/obats/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg(`Obat ${nama} berhasil dihapus`);
      fetchObats();
    } else {
      setErrorMsg(res.message || 'Gagal menghapus obat');
    }
  };

  const resetObatForm = () => {
    setEditingObatId(null);
    setFormNamaObat('');
    setFormKategori('Analgesik & Antipiretik');
    setFormSatuan('Tablet');
    setFormHargaBeli(500);
    setFormHargaJual(1000);
    setFormStokAwal(100);
    setFormStokMinimum(10);
    setFormExpDate('2028-12-31');
    setFormLokasi('Rak Farmasi 1');
  };

  // Submit Restock (Obat Masuk)
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockObatId || !restockJumlah || restockJumlah <= 0) {
      setErrorMsg('Pilih obat dan jumlah penambahan yang valid');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await apiFetch('/obats/stok-masuk', {
      method: 'POST',
      body: JSON.stringify({
        obatId: restockObatId,
        jumlah: Number(restockJumlah),
        keterangan: restockKeterangan,
        nomorFaktur: restockNoFaktur,
      }),
    });

    if (res.success) {
      setSuccessMsg(`Berhasil menambahkan stok obat (+${restockJumlah}) ke inventaris!`);
      fetchObats();
      fetchLaporanMutasi();
      setActiveTab('obat');
    } else {
      setErrorMsg(res.message || 'Gagal menambah stok');
    }
    setIsSubmitting(false);
  };

  // Low stock counter
  const lowStockCount = obats.filter((o) => o.stok <= o.stokMinimum).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Instalasi Farmasi & Gudang Obat
            </span>
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{lowStockCount} Obat Menipis</span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Modul Obat, Farmasi & Buku Mutasi Stok
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Penyaluran resep dokter otomatis terintegrasi, pemotongan stok transparan tanpa pengurangan ganda.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('resep')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'resep'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Antrean Resep ({antreanResep.filter((r) => r.statusResep !== 'Diserahkan').length})
          </button>
          <button
            onClick={() => setActiveTab('obat')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'obat'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Data Obat ({obats.length})
          </button>
          <button
            onClick={() => setActiveTab('restock')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'restock'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Stok Masuk (Restock)
          </button>
          <button
            onClick={() => setActiveTab('mutasi')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              activeTab === 'mutasi'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buku Mutasi Stok
          </button>
        </div>
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

      {/* TAB 1: ANTREAN RESEP DOKTER */}
      {activeTab === 'resep' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Antrean Resep Elektronik Dokter</h3>
              <p className="text-xs text-slate-500">
                Resep yang ditulis oleh dokter pada modul rekam medis masuk ke sini untuk diserahkan ke pasien
              </p>
            </div>
            <button
              onClick={fetchAntreanResep}
              className="text-xs text-teal-600 font-semibold hover:underline"
            >
              Segarkan
            </button>
          </div>

          {loadingResep ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat antrean resep...</div>
          ) : antreanResep.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Pill className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-600">Belum ada resep obat dari dokter</div>
              <p className="text-xs mt-1">
                Ketika dokter mengesahkan rekam medis dengan resep obat, data resep akan langsung muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {antreanResep.map((r) => {
                const isDiserahkan = r.statusResep === 'Diserahkan';

                return (
                  <div
                    key={r.rekamMedisId}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/70 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-extrabold flex items-center justify-center text-xs">
                          {r.noAntrean}
                        </span>
                        <span className="font-bold text-slate-900 text-base">{r.namaPasien}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                          {r.noRM}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            isDiserahkan
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.statusResep}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        Dokter: {r.dokterNama} • Diagnosis: {r.diagnosis} • Tanggal: {r.tanggal}
                      </div>

                      {/* Prescribed Items Box */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2 space-y-1">
                        <div className="text-[11px] font-bold text-slate-700 uppercase">
                          Rincian Obat Yang Diresepkan:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {r.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-slate-800 flex justify-between bg-white p-2 rounded border border-slate-100">
                              <div>
                                <span className="font-bold text-teal-900">{item.namaObat}</span>
                                <div className="text-[11px] text-slate-500 italic">{item.aturanPakai}</div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-700">{item.jumlah} butir</span>
                                <div className="text-[10px] text-slate-400">
                                  Rp{item.subtotal.toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex md:flex-col items-center justify-end">
                      {!isDiserahkan ? (
                        <button
                          onClick={() => handleSerahkanObat(r.rekamMedisId)}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs hover:shadow transition flex items-center justify-center space-x-1.5"
                          title="Serahkan obat ke pasien dan kurangi stok obat otomatis di gudang"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Serahkan Obat & Potong Stok</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Telah Diserahkan (Stok Terpotong)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER DATA OBAT */}
      {activeTab === 'obat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Katalog & Persediaan Master Obat</h3>
              <p className="text-xs text-slate-500">
                Pencatatan harga beli, harga jual, stok fisik, dan batas minimum obat
              </p>
            </div>
            <button
              onClick={() => {
                resetObatForm();
                setShowModalObat(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Obat Baru</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchObat}
                onChange={(e) => setSearchObat(e.target.value)}
                placeholder="Cari obat berdasarkan nama atau kode..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white"
              />
            </div>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white"
            >
              <option value="">Semua Kategori</option>
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <button
              onClick={fetchObats}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900"
            >
              Filter
            </button>
          </div>

          {loadingObats ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data obat...</div>
          ) : obats.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Pill className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-600">Gudang obat masih kosong</div>
              <p className="text-xs mt-1">Klik tombol "+ Tambah Obat Baru" di atas untuk mendaftarkan obat pertama.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">Kode & Nama Obat</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Satuan</th>
                    <th className="p-3.5">Harga Beli</th>
                    <th className="p-3.5">Harga Jual</th>
                    <th className="p-3.5">Stok Fisik</th>
                    <th className="p-3.5">Kedaluwarsa</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {obats.map((o) => {
                    const isMenipis = o.stok <= o.stokMinimum;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{o.namaObat}</div>
                          <div className="text-[11px] text-slate-400">{o.kodeObat}</div>
                        </td>
                        <td className="p-3.5 text-slate-600">{o.kategori}</td>
                        <td className="p-3.5 text-slate-600">{o.satuan}</td>
                        <td className="p-3.5 text-slate-600">Rp{o.hargaBeli.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 font-semibold text-teal-800">
                          Rp{o.hargaJual.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-xs ${
                                isMenipis
                                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {o.stok}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              (Min: {o.stokMinimum})
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">{o.tanggalKedaluwarsa}</td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex space-x-1">
                            <button
                              onClick={() => handleEditObat(o)}
                              className="p-1 rounded text-slate-500 hover:text-teal-600 hover:bg-slate-100"
                              title="Edit obat"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteObat(o.id, o.namaObat)}
                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                              title="Hapus obat"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STOK MASUK / RESTOCK FORM */}
      {activeTab === 'restock' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-7 max-w-xl mx-auto">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">Pencatatan Obat Masuk (Restock Faktur)</h3>
            <p className="text-xs text-slate-500">
              Tambahkan stok fisik obat dari pengadaan distributor atau faktur pembelian.
            </p>
          </div>

          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Obat yang Ditambah Stok *
              </label>
              <select
                required
                value={restockObatId}
                onChange={(e) => setRestockObatId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              >
                {obats.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.namaObat} ({o.kodeObat}) - Stok Saat Ini: {o.stok} {o.satuan}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Obat Masuk *
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockJumlah}
                onChange={(e) => setRestockJumlah(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Faktur / Surat Jalan (Opsional)
              </label>
              <input
                type="text"
                value={restockNoFaktur}
                onChange={(e) => setRestockNoFaktur(e.target.value)}
                placeholder="Contoh: INV-DIST-2026-081"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Nama Distributor
              </label>
              <input
                type="text"
                value={restockKeterangan}
                onChange={(e) => setRestockKeterangan(e.target.value)}
                placeholder="Contoh: Pengadaan rutin PT Kimia Farma Trading"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan Stok Masuk & Catat Buku Mutasi'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: BUKU MUTASI STOK OBAT */}
      {activeTab === 'mutasi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Buku Mutasi & Log Pergerakan Stok</h3>
              <p className="text-xs text-slate-500">
                Catatan terperinci setiap transaksi obat masuk dan keluar yang dapat ditelusuri
              </p>
            </div>
            <button
              onClick={fetchLaporanMutasi}
              className="text-xs text-teal-600 font-semibold hover:underline"
            >
              Segarkan
            </button>
          </div>

          {mutasiList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <History className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-600">Belum ada mutasi stok tercatat</div>
              <p className="text-xs mt-1">Semua mutasi obat masuk dan keluar otomatis terekam di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Waktu & Tanggal</th>
                    <th className="p-3">Jenis</th>
                    <th className="p-3">Nama Obat</th>
                    <th className="p-3">Jumlah</th>
                    <th className="p-3">Sebelum</th>
                    <th className="p-3">Sesudah</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mutasiList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{m.tanggal.split('T')[0]}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.jenis === 'Masuk'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.jenis === 'Masuk' ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{m.jenis}</span>
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{m.namaObat}</td>
                      <td className="p-3 font-bold text-slate-800">{m.jumlah}</td>
                      <td className="p-3 text-slate-500">{m.stokSebelum}</td>
                      <td className="p-3 font-semibold text-teal-800">{m.stokSesudah}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{m.keterangan}</td>
                      <td className="p-3 text-slate-500">{m.petugas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT OBAT MASTER */}
      {showModalObat && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingObatId ? 'Edit Data Master Obat' : 'Tambah Obat Baru ke Master'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Isi data detail obat untuk katalog dan resep klinik
            </p>

            <form onSubmit={handleSaveObat} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Obat Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formNamaObat}
                  onChange={(e) => setFormNamaObat(e.target.value)}
                  placeholder="Contoh: Paracetamol 500mg, Amoxicillin 500mg..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Obat *
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {kategoriOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan Obat *
                  </label>
                  <select
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {satuanOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Beli (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formHargaBeli}
                    onChange={(e) => setFormHargaBeli(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formHargaJual}
                    onChange={(e) => setFormHargaJual(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok {editingObatId ? 'Fisik' : 'Awal'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStokAwal}
                    onChange={(e) => setFormStokAwal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Minimum (Peringatan) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formStokMinimum}
                    onChange={(e) => setFormStokMinimum(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Kedaluwarsa
                  </label>
                  <input
                    type="date"
                    value={formExpDate}
                    onChange={(e) => setFormExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    placeholder="Rak A1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalObat(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data Obat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
