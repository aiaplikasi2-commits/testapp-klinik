import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  Printer,
  DollarSign,
  AlertCircle,
  Clock,
  Search,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { Tagihan, Kunjungan, User } from '../types';
import { apiFetch } from '../api/client';
import { KwitansiModal } from './KwitansiModal';

interface KasirViewProps {
  currentUser: User;
}

export const KasirView: React.FC<KasirViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'menunggu' | 'riwayat'>('menunggu');

  // Queues waiting for payment & existing invoices
  const [antreanKunjungan, setAntreanKunjungan] = useState<Kunjungan[]>([]);
  const [tagihanList, setTagihanList] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected visit to bill
  const [selectedKunjungan, setSelectedKunjungan] = useState<Kunjungan | null>(null);
  const [currentTagihan, setCurrentTagihan] = useState<Tagihan | null>(null);

  // Payment form states
  const [metodeBayar, setMetodeBayar] = useState<'Tunai' | 'Transfer Bank' | 'QRIS'>('Tunai');
  const [jumlahUang, setJumlahUang] = useState<number>(0);
  const [diskon, setDiskon] = useState<number>(0);

  // Receipt modal state
  const [receiptToShow, setReceiptToShow] = useState<Tagihan | null>(null);

  // Status feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchData = async () => {
    setLoading(true);
    // Fetch visits today
    const resKunj = await apiFetch<Kunjungan[]>('/kunjungans');
    if (resKunj.success && resKunj.data) {
      setAntreanKunjungan(resKunj.data);
    }

    // Fetch invoices
    const resTag = await apiFetch<Tagihan[]>('/tagihans');
    if (resTag.success && resTag.data) {
      setTagihanList(resTag.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initiate invoice creation from a visit
  const handlePilihKunjungan = async (kunj: Kunjungan) => {
    setSelectedKunjungan(kunj);
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const res = await apiFetch<Tagihan>('/tagihans/buat-dari-kunjungan', {
      method: 'POST',
      body: JSON.stringify({
        kunjunganId: kunj.id,
        biayaPendaftaranCustom: 15000,
        biayaKonsultasiCustom: 35000,
      }),
    });

    if (res.success && res.data) {
      setCurrentTagihan(res.data);
      setJumlahUang(res.data.total);
    } else {
      setErrorMsg(res.message || 'Gagal menyiapkan tagihan');
    }
    setIsSubmitting(false);
  };

  // Process payment
  const handleProsesBayar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTagihan) return;

    if (jumlahUang < currentTagihan.total - diskon) {
      setErrorMsg('Uang yang dibayarkan kurang dari total tagihan');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await apiFetch<Tagihan>(`/tagihans/${currentTagihan.id}/bayar`, {
      method: 'POST',
      body: JSON.stringify({
        jumlahDibayar: jumlahUang,
        metodePembayaran: metodeBayar,
        diskon,
      }),
    });

    if (res.success && res.data) {
      setSuccessMsg(
        `Pembayaran untuk ${res.data.namaPasien} (${res.data.noInvoice}) BERHASIL & LUNAS!`
      );
      setReceiptToShow(res.data);
      setCurrentTagihan(null);
      setSelectedKunjungan(null);
      fetchData();
    } else {
      setErrorMsg(res.message || 'Gagal memproses pembayaran');
    }
    setIsSubmitting(false);
  };

  // Open invoice directly from riwayat
  const handleOpenExistingTagihan = (tag: Tagihan) => {
    if (tag.statusPembayaran === 'Lunas') {
      setReceiptToShow(tag);
    } else {
      setCurrentTagihan(tag);
      setJumlahUang(tag.total);
      setActiveTab('menunggu');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Kasir & Pelunasan Tagihan
            </span>
            <span className="text-xs text-slate-400">• Petugas Kasir: {currentUser.nama}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Kasir, Pembayaran & Kuitansi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Penghitungan tagihan otomatis dari pendaftaran, konsultasi dokter, tindakan medis, dan obat farmasi.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('menunggu')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'menunggu'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Antrean Pembayaran
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'riwayat'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Transaksi Lunas ({tagihanList.length})
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

      {/* TAB 1: ANTREAN PEMBAYARAN & PROSES BAYAR */}
      {activeTab === 'menunggu' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of visits ready for payment (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pasien Siap Bayar Hari Ini
                </span>
                <button onClick={fetchData} className="text-xs text-teal-600 font-semibold hover:underline">
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Memuat data...</div>
              ) : antreanKunjungan.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Belum ada kunjungan pasien untuk hari ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                  {antreanKunjungan.map((k) => {
                    // Check if already paid
                    const tagihan = tagihanList.find((t) => t.kunjunganId === k.id);
                    const isLunas = tagihan?.statusPembayaran === 'Lunas';
                    const isSelected = selectedKunjungan?.id === k.id;

                    return (
                      <div
                        key={k.id}
                        onClick={() => handlePilihKunjungan(k)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                            : isLunas
                            ? 'border-slate-200 bg-slate-50/60'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-teal-700 text-white">
                            {k.noAntrean}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLunas
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isLunas ? 'LUNAS' : 'Belum Dibayar'}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-sm">{k.namaPasien}</div>
                        <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                          <span>{k.noRM}</span>
                          <span>Dokter: {k.namaDokter}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Billing & Payment Processing Form (7 cols) */}
          <div className="lg:col-span-7">
            {!currentTagihan ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <h3 className="text-base font-bold text-slate-700">Pilih Pasien Untuk Membuat Tagihan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Pilih salah satu antrean pasien di sebelah kiri untuk melihat rincian biaya pendaftaran, konsultasi dokter, tindakan medis, dan obat.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProsesBayar} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-7 space-y-5">
                {/* Header Tagihan */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Rincian Tagihan
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {currentTagihan.noInvoice}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">{currentTagihan.namaPasien}</div>
                    <div className="text-xs text-teal-700 font-semibold">{currentTagihan.noRM}</div>
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Biaya Administrasi & Pendaftaran</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(currentTagihan.biayaPendaftaran)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">Biaya Konsultasi Dokter</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(currentTagihan.biayaKonsultasi)}
                    </span>
                  </div>

                  {/* Tindakan Medis Items */}
                  {(currentTagihan.rincianTindakan || []).map((t, idx) => (
                    <div key={`t-${idx}`} className="flex justify-between py-1.5 border-b border-slate-100 pl-3">
                      <span className="text-slate-600">• Tindakan: {t.nama}</span>
                      <span className="font-bold text-slate-800">{formatRupiah(t.biaya)}</span>
                    </div>
                  ))}

                  {/* Resep Obat Items */}
                  {(currentTagihan.rincianObat || []).map((o, idx) => (
                    <div key={`o-${idx}`} className="flex justify-between py-1.5 border-b border-slate-100 pl-3">
                      <span className="text-slate-600">
                        • Farmasi: {o.namaObat} ({o.jumlah} butir)
                      </span>
                      <span className="font-bold text-slate-800">{formatRupiah(o.subtotal)}</span>
                    </div>
                  ))}

                  {/* Subtotal & Diskon */}
                  <div className="flex justify-between pt-2 text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatRupiah(currentTagihan.subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-600">Diskon / Potongan (Rp)</span>
                    <input
                      type="number"
                      min="0"
                      value={diskon}
                      onChange={(e) => setDiskon(Number(e.target.value))}
                      className="w-32 px-2.5 py-1 text-right border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between pt-3 border-t-2 border-slate-900 text-base font-extrabold text-slate-900">
                    <span>TOTAL HARUS DIBAYAR</span>
                    <span className="text-teal-700 text-lg">
                      {formatRupiah(Math.max(0, currentTagihan.subtotal - diskon))}
                    </span>
                  </div>
                </div>

                {/* Form Pembayaran */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Metode & Pembayaran
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['Tunai', 'Transfer Bank', 'QRIS'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodeBayar(m)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          metodeBayar === m
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Jumlah Uang Diterima (Rp) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={jumlahUang}
                        onChange={(e) => setJumlahUang(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Kembalian (Rp)
                      </label>
                      <div className="px-3 py-2 bg-slate-200 rounded-xl text-sm font-extrabold text-slate-800">
                        {formatRupiah(Math.max(0, jumlahUang - (currentTagihan.subtotal - diskon)))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTagihan(null);
                      setSelectedKunjungan(null);
                    }}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Memproses...' : 'Proses Bayar & Kuitansi Lunas'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT TRANSAKSI PEMBAYARAN */}
      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Riwayat Transaksi Kasir</h3>
              <p className="text-xs text-slate-500">
                Semua kuitansi dan transaksi pembayaran yang telah diproses
              </p>
            </div>
            <button
              onClick={fetchData}
              className="text-xs text-teal-600 font-semibold hover:underline"
            >
              Segarkan
            </button>
          </div>

          {tagihanList.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-semibold text-slate-600">Belum ada riwayat transaksi kasir</div>
              <p className="text-xs mt-1">Tagihan yang telah dibayar akan muncul di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">No. Invoice</th>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Pasien & No. RM</th>
                    <th className="p-3.5">Metode</th>
                    <th className="p-3.5">Total Biaya</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Kasir</th>
                    <th className="p-3.5 text-right">Kuitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tagihanList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{t.noInvoice}</td>
                      <td className="p-3.5 text-slate-600">{t.tanggal}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{t.namaPasien}</div>
                        <div className="text-[11px] text-teal-700">{t.noRM}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">{t.metodePembayaran}</td>
                      <td className="p-3.5 font-extrabold text-emerald-700">
                        {formatRupiah(t.total)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            t.statusPembayaran === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.statusPembayaran}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{t.kasirNama}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenExistingTagihan(t)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-teal-700 font-semibold rounded-lg text-xs inline-flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Kwitansi Modal */}
      {receiptToShow && (
        <KwitansiModal tagihan={receiptToShow} onClose={() => setReceiptToShow(null)} />
      )}
    </div>
  );
};
