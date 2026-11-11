import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  Users,
  Pill,
  Stethoscope,
  Filter,
  FileText,
} from 'lucide-react';
import { User } from '../types';
import { apiFetch } from '../api/client';

interface LaporanViewProps {
  currentUser: User;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ currentUser }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [dariTanggal, setDariTanggal] = useState(todayStr);
  const [sampaiTanggal, setSampaiTanggal] = useState(todayStr);

  const [activeReport, setActiveReport] = useState<'pendapatan' | 'kunjungan' | 'antrean' | 'obat' | 'persediaan'>('pendapatan');
  const [reportData, setReportData] = useState<any | null>(null);
  const [antreanReportData, setAntreanReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchLaporan = async () => {
    setLoading(true);
    const [summaryRes, antreanRes] = await Promise.all([
      apiFetch<any>(`/laporan/summary?dari=${encodeURIComponent(dariTanggal)}&sampai=${encodeURIComponent(sampaiTanggal)}`),
      apiFetch<any>(`/antrean/laporan?dari=${encodeURIComponent(dariTanggal)}&sampai=${encodeURIComponent(sampaiTanggal)}`),
    ]);
    if (summaryRes.success && summaryRes.data) {
      setReportData(summaryRes.data);
    }
    if (antreanRes.success && antreanRes.data) {
      setAntreanReportData(antreanRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Pelaporan & Statistik Eksekutif
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Laporan Kunjungan, Antrean & Keuangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Data aktual dari database terpusat, dapat difilter tanggal dan diekspor ke PDF atau Excel.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={`/api/antrean/laporan/export-csv?dari=${encodeURIComponent(dariTanggal)}&sampai=${encodeURIComponent(sampaiTanggal)}`}
            download
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (.csv)</span>
          </a>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar (Hidden in Print) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-slate-700 uppercase flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Periode:</span>
          </span>
          <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
            <span className="text-slate-400">Dari:</span>
            <input
              type="date"
              value={dariTanggal}
              onChange={(e) => setDariTanggal(e.target.value)}
              className="text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
            <span className="text-slate-400">Sampai:</span>
            <input
              type="date"
              value={sampaiTanggal}
              onChange={(e) => setSampaiTanggal(e.target.value)}
              className="text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchLaporan}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl"
          >
            Terapkan Filter
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveReport('pendapatan')}
            className={`px-3 py-1 rounded-lg transition ${
              activeReport === 'pendapatan' ? 'bg-teal-600 text-white' : 'text-slate-600'
            }`}
          >
            Pendapatan & Kasir
          </button>
          <button
            onClick={() => setActiveReport('antrean')}
            className={`px-3 py-1 rounded-lg transition ${
              activeReport === 'antrean' ? 'bg-teal-600 text-white font-bold' : 'text-slate-600'
            }`}
          >
            Antrean
          </button>
          <button
            onClick={() => setActiveReport('kunjungan')}
            className={`px-3 py-1 rounded-lg transition ${
              activeReport === 'kunjungan' ? 'bg-teal-600 text-white' : 'text-slate-600'
            }`}
          >
            Kunjungan Pasien
          </button>
          <button
            onClick={() => setActiveReport('obat')}
            className={`px-3 py-1 rounded-lg transition ${
              activeReport === 'obat' ? 'bg-teal-600 text-white' : 'text-slate-600'
            }`}
          >
            Penjualan Obat
          </button>
          <button
            onClick={() => setActiveReport('persediaan')}
            className={`px-3 py-1 rounded-lg transition ${
              activeReport === 'persediaan' ? 'bg-teal-600 text-white' : 'text-slate-600'
            }`}
          >
            Persediaan Gudang
          </button>
        </div>
      </div>

      {/* REPORT CONTENT (FORMATTED FOR PRINT & DISPLAY) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center">
          <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900">
            SIM KLINIK PRATAMA
          </h1>
          <p className="text-xs text-slate-600">
            LAPORAN OPERASIONAL & EKSEKUTIF KLINIK
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Periode: {dariTanggal} s/d {sampaiTanggal} • Dicetak oleh: {currentUser.nama} ({currentUser.role})
          </p>
        </div>

        {/* Key Totals Box */}
        {reportData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-[11px] uppercase font-bold text-slate-500">Total Kunjungan</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {reportData.totalKunjungan || 0}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-[11px] uppercase font-bold text-slate-500">Pemeriksaan Dokter</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {reportData.totalPemeriksaanDokter || 0}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-[11px] uppercase font-bold text-slate-500">Pasien Terdaftar</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {reportData.totalPasienTerdaftar || 0}
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <div className="text-[11px] uppercase font-bold text-emerald-800">Total Pendapatan</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                {formatRupiah(reportData.keuangan?.totalPendapatan || 0)}
              </div>
            </div>
          </div>
        )}

        {/* TAB REPORT: PENDAPATAN & KASIR */}
        {activeReport === 'pendapatan' && reportData && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Rincian Komponen Pendapatan Klinik
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500">Biaya Pendaftaran</div>
                <div className="text-base font-bold text-slate-900">
                  {formatRupiah(reportData.keuangan?.totalBiayaPendaftaran || 0)}
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500">Jasa Konsultasi Dokter</div>
                <div className="text-base font-bold text-slate-900">
                  {formatRupiah(reportData.keuangan?.totalBiayaKonsultasi || 0)}
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500">Tindakan Medis</div>
                <div className="text-base font-bold text-slate-900">
                  {formatRupiah(reportData.keuangan?.totalBiayaTindakan || 0)}
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500">Penjualan Obat Farmasi</div>
                <div className="text-base font-bold text-slate-900">
                  {formatRupiah(reportData.keuangan?.totalBiayaObat || 0)}
                </div>
              </div>
            </div>

            <h4 className="font-bold text-slate-900 text-sm pt-3">
              Daftar Transaksi Pembayaran Selesai
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">No. Invoice</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Pasien</th>
                    <th className="p-3">No. RM</th>
                    <th className="p-3">Metode</th>
                    <th className="p-3 text-right">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(reportData.daftarTransaksi || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Belum ada transaksi pembayaran lunas pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    reportData.daftarTransaksi.map((t: any) => (
                      <tr key={t.id}>
                        <td className="p-3 font-semibold text-slate-900">{t.noInvoice}</td>
                        <td className="p-3 text-slate-600">{t.tanggal}</td>
                        <td className="p-3 font-medium text-slate-800">{t.namaPasien}</td>
                        <td className="p-3 text-slate-500">{t.noRM}</td>
                        <td className="p-3 text-slate-600">{t.metodePembayaran}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {formatRupiah(t.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB REPORT: PENJUALAN OBAT */}
        {activeReport === 'obat' && reportData && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Laporan Penjualan & Pemakaian Obat Resep
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nama Obat</th>
                    <th className="p-3 text-center">Jumlah Terjual (Qty)</th>
                    <th className="p-3 text-right">Total Nilai Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(reportData.daftarPenjualanObat || []).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-400">
                        Belum ada penjualan obat pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    reportData.daftarPenjualanObat.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-900">{p.namaObat}</td>
                        <td className="p-3 text-center font-semibold text-slate-700">
                          {p.totalQty} butir
                        </td>
                        <td className="p-3 text-right font-bold text-teal-800">
                          {formatRupiah(p.totalRupiah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB REPORT: PERSEDIAAN OBAT */}
        {activeReport === 'persediaan' && reportData && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Laporan Status Stok & Persediaan Gudang Farmasi
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Kode & Nama Obat</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Satuan</th>
                    <th className="p-3">Harga Beli</th>
                    <th className="p-3">Harga Jual</th>
                    <th className="p-3 text-center">Sisa Stok</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(reportData.persediaanObat || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        Tidak ada data obat di gudang.
                      </td>
                    </tr>
                  ) : (
                    reportData.persediaanObat.map((o: any) => {
                      const isLow = o.stok <= o.stokMinimum;
                      return (
                        <tr key={o.id}>
                          <td className="p-3">
                            <span className="font-bold text-slate-900">{o.namaObat}</span>
                            <span className="text-[10px] text-slate-400 block">{o.kodeObat}</span>
                          </td>
                          <td className="p-3 text-slate-600">{o.kategori}</td>
                          <td className="p-3 text-slate-600">{o.satuan}</td>
                          <td className="p-3 text-slate-600">{formatRupiah(o.hargaBeli)}</td>
                          <td className="p-3 font-semibold text-teal-800">{formatRupiah(o.hargaJual)}</td>
                          <td className="p-3 text-center font-bold text-slate-900">{o.stok}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isLow ? 'Stok Menipis' : 'Aman'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB REPORT: ANTREAN DIGITAL */}
        {activeReport === 'antrean' && antreanReportData && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Laporan Antrean
                </h3>
                <p className="text-xs text-slate-500">
                  Statistik pemanggilan, waktu tunggu, dan distribusi pelayanan
                </p>
              </div>

              <a
                href={`/api/antrean/laporan/export-csv?dari=${encodeURIComponent(dariTanggal)}&sampai=${encodeURIComponent(sampaiTanggal)}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Data Excel (.csv)</span>
              </a>
            </div>

            {/* Antrean KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Antrean</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {antreanReportData.totalAntrean || 0}
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <div className="text-[10px] font-bold uppercase text-emerald-800">Selesai Dilayani</div>
                <div className="text-2xl font-black text-emerald-700 mt-0.5">
                  {antreanReportData.selesai || 0}
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
                <div className="text-[10px] font-bold uppercase text-rose-800">Dilewati</div>
                <div className="text-2xl font-black text-rose-700 mt-0.5">
                  {antreanReportData.dilewati || 0}
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                <div className="text-[10px] font-bold uppercase text-blue-800">Antre / Dilayani</div>
                <div className="text-2xl font-black text-blue-700 mt-0.5">
                  {(antreanReportData.menunggu || 0) + (antreanReportData.sedangDilayani || 0)}
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase text-amber-800">Rata-rata Tunggu</div>
                <div className="text-2xl font-black text-amber-750 font-mono mt-0.5">
                  {antreanReportData.rataRataWaktuTungguMenit || 0} <span className="text-xs font-semibold">mnt</span>
                </div>
              </div>
            </div>

            {/* Breakdowns: Poli & Dokter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Distribusi Antrean Berdasarkan Poli
                </h4>
                <div className="space-y-2">
                  {Object.entries(antreanReportData.breakdownPoli || {}).map(([poliName, count]) => (
                    <div key={poliName} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-800">{poliName}</span>
                      <span className="font-bold text-teal-700 font-mono">{count as number} Pasien</span>
                    </div>
                  ))}
                  {Object.keys(antreanReportData.breakdownPoli || {}).length === 0 && (
                    <div className="text-xs text-slate-400 py-2 text-center">Belum ada data</div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Distribusi Antrean Berdasarkan Dokter
                </h4>
                <div className="space-y-2">
                  {Object.entries(antreanReportData.breakdownDokter || {}).map(([dokName, count]) => (
                    <div key={dokName} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-800">{dokName}</span>
                      <span className="font-bold text-teal-700 font-mono">{count as number} Pasien</span>
                    </div>
                  ))}
                  {Object.keys(antreanReportData.breakdownDokter || {}).length === 0 && (
                    <div className="text-xs text-slate-400 py-2 text-center">Belum ada data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Detail Antrean Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rincian Riwayat Antrean Pasien
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">No. Antrean</th>
                      <th className="p-3">Waktu Daftar</th>
                      <th className="p-3">Pasien (No. RM)</th>
                      <th className="p-3">Poli / Ruang</th>
                      <th className="p-3">Dokter</th>
                      <th className="p-3">Sumber</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Waktu Tunggu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {antreanReportData.daftarAntrean && antreanReportData.daftarAntrean.length > 0 ? (
                      antreanReportData.daftarAntrean.map((k: any) => (
                        <tr key={k.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-teal-700">{k.noAntrean}</td>
                          <td className="p-3 text-slate-500">
                            {k.waktuDaftar ? new Date(k.waktuDaftar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-900">{k.namaPasien}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{k.noRM}</span>
                          </td>
                          <td className="p-3 text-slate-600">{k.poli}</td>
                          <td className="p-3 text-slate-600">{k.namaDokter}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              k.sumberPendaftaran === 'Online HP Mandiri' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {k.sumberPendaftaran || 'Loket'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              k.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                              k.status === 'Dipanggil' ? 'bg-amber-100 text-amber-800' :
                              k.status === 'Dilewati' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {k.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-700">
                            {k.waktuTungguMenit ? `${k.waktuTungguMenit} mnt` : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Tidak ada data antrean dalam periode ini
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB REPORT: KUNJUNGAN */}
        {activeReport === 'kunjungan' && reportData && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Rekap Kunjungan Harian Poli Umum
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(reportData.kunjunganPerHari || {}).map(([tgl, count]) => (
                <div key={tgl} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Tanggal: {tgl}</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">
                    {count as number} Pasien
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Box for Official Reports */}
        <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-700">
          <div>
            <div>Mengetahui,</div>
            <div className="font-semibold text-slate-900">Pemilik / Pimpinan SIM Klinik</div>
            <div className="h-14"></div>
            <div className="font-bold border-t border-slate-400 pt-1">
              H. Suryadi, S.E.
            </div>
          </div>

          <div className="text-right">
            <div>Dibuat di Kota, {todayStr}</div>
            <div className="font-semibold text-slate-900">Petugas Pembuat Laporan</div>
            <div className="h-14"></div>
            <div className="font-bold border-t border-slate-400 pt-1">
              {currentUser.nama}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
