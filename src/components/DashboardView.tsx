import React, { useEffect, useState } from 'react';
import {
  Users,
  CalendarCheck,
  UserPlus,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Stethoscope,
  Pill,
  CreditCard,
} from 'lucide-react';
import { User, DashboardSummaryData } from '../types';
import { apiFetch } from '../api/client';

interface DashboardViewProps {
  user: User;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    const res = await apiFetch<DashboardSummaryData>('/dashboard/summary');
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message || 'Gagal memuat ringkasan dashboard');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
              {user.role}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Selamat Bertugas, {user.nama}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan operasional klinik hari ini.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
            title="Segarkan data aktual"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* 7 Key Dashboard Metrics Required by Specification */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Pasien Terdaftar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Pasien Terdaftar
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : data?.totalPasien ?? 0}
            </span>
            <span className="text-xs text-slate-400">orang</span>
          </div>
        </div>

        {/* 2. Kunjungan Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Kunjungan Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : data?.kunjunganHariIniCount ?? 0}
            </span>
            <span className="text-xs text-slate-400">kunjungan</span>
          </div>
        </div>

        {/* 3. Pasien Baru Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pasien Baru Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : data?.pasienBaruHariIni ?? 0}
            </span>
            <span className="text-xs text-slate-400">pasien baru</span>
          </div>
        </div>

        {/* 4. Pasien Dalam Antrean */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Dalam Antrean
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {loading ? '...' : data?.antreanMenunggu ?? 0}
            </span>
            <span className="text-xs text-slate-400">menunggu</span>
          </div>
        </div>

        {/* 5. Pemeriksaan Selesai */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pemeriksaan Selesai
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '...' : data?.pemeriksaanSelesai ?? 0}
            </span>
            <span className="text-xs text-slate-400">selesai</span>
          </div>
        </div>

        {/* 6. Pendapatan Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Pendapatan Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">
              {loading ? '...' : formatRupiah(data?.pendapatanHariIni || 0)}
            </span>
            <span className="text-xs text-slate-400">lunas</span>
          </div>
        </div>

        {/* 7. Stok Obat Menipis */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs md:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Peringatan Stok Obat Menipis
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold text-rose-600">
                {loading ? '...' : data?.obatStokMenipisCount ?? 0}
              </span>
              <span className="text-xs text-slate-500 ml-1">jenis obat di bawah minimum</span>
            </div>
            <button
              onClick={() => onNavigate('farmasi')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center space-x-1"
            >
              <span>Lihat Farmasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Workflow Buttons */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Aksi Cepat Alur Pelayanan Klinik (Workflow)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigate('pendaftaran')}
            className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Daftar Pasien</div>
              <div className="text-[11px] text-slate-500">Baru & antrean</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('rekam_medis')}
            className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Pemeriksaan Dokter</div>
              <div className="text-[11px] text-slate-500">Isi rekam medis</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('farmasi')}
            className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Resep & Farmasi</div>
              <div className="text-[11px] text-slate-500">Penyerahan obat</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('kasir')}
            className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-xs transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Kasir Pembayaran</div>
              <div className="text-[11px] text-slate-500">Kuitansi lunas</div>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Section: Live Antrean Hari Ini & Stok Obat Menipis List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antrean Pasien Terkini */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Antrean Pasien Hari Ini</h3>
              <p className="text-xs text-slate-500">Pasien yang terdaftar di poli umum hari ini</p>
            </div>
            <button
              onClick={() => onNavigate('pendaftaran')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              Kelola Antrean
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Memuat data antrean...</div>
          ) : !data?.antreanHariIni || data.antreanHariIni.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Belum ada antrean pasien untuk hari ini.
              <div className="mt-2">
                <button
                  onClick={() => onNavigate('pendaftaran')}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700"
                >
                  + Tambah Pasien / Kunjungan Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.antreanHariIni.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                      {item.noAntrean}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{item.namaPasien}</div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span>{item.noRM}</span>
                        <span>•</span>
                        <span>{item.poli}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'Menunggu'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'Dipanggil'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'Sedang Dilayani'
                          ? 'bg-purple-100 text-purple-800'
                          : item.status === 'Dilewati'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Obat Menipis Alert List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Daftar Obat Stok Menipis</h3>
              <p className="text-xs text-slate-500">Stok obat di bawah atau sama dengan batas minimum</p>
            </div>
            <button
              onClick={() => onNavigate('farmasi')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              Restock Gudang
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Memeriksa stok obat...</div>
          ) : !data?.obatStokMenipisList || data.obatStokMenipisList.length === 0 ? (
            <div className="py-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-700 text-xs flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
              <span className="font-semibold">Semua persediaan obat aman</span>
              <span className="text-[11px] text-emerald-600">Tidak ada obat yang mencapai stok minimum</span>
            </div>
          ) : (
            <div className="space-y-2">
              {data.obatStokMenipisList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/40"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.namaObat}</div>
                    <div className="text-xs text-slate-500">{item.kodeObat}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full">
                      Sisa: {item.stok} {item.satuan}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Min: {item.stokMinimum} {item.satuan}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
