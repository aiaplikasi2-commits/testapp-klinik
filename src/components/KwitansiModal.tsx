import React from 'react';
import { Printer, X, CheckCircle, Stethoscope } from 'lucide-react';
import { Tagihan } from '../types';

interface KwitansiModalProps {
  tagihan: Tagihan;
  onClose: () => void;
}

export const KwitansiModal: React.FC<KwitansiModalProps> = ({ tagihan, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Actions bar (hidden in print) */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Kuitansi Pembayaran Pasien
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kuitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div id="printable-receipt" className="space-y-4 text-slate-800">
          {/* Clinic Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <div className="flex items-center justify-center space-x-2">
              <Stethoscope className="w-6 h-6 text-teal-600 print:text-black" />
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                SIM KLINIK PRATAMA
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Jl. Kesehatan No. 88, Kota • Telp: (021) 789-0123
            </p>
            <p className="text-[11px] text-slate-400">
              Izin Operasional Klinik No: 503/446/KLINIK/2024
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 text-xs py-1">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">No. Tagihan / Invoice</div>
              <div className="font-extrabold text-slate-900">{tagihan.noInvoice}</div>
              <div className="text-slate-500 text-[10px] uppercase font-bold mt-1">Tanggal</div>
              <div>{tagihan.tanggal}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Pasien</div>
              <div className="font-extrabold text-slate-900">{tagihan.namaPasien}</div>
              <div className="text-slate-500 text-[10px] uppercase font-bold mt-1">No. Rekam Medis</div>
              <div className="font-semibold text-teal-700 print:text-black">{tagihan.noRM}</div>
            </div>
          </div>

          {/* Line items table */}
          <div className="border-t border-b border-slate-200 py-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left py-1">Rincian Layanan / Obat</th>
                  <th className="text-right py-1">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1.5 text-slate-700">Biaya Administrasi & Pendaftaran</td>
                  <td className="py-1.5 text-right font-medium">
                    {formatRupiah(tagihan.biayaPendaftaran)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-700">Biaya Jasa Konsultasi Dokter</td>
                  <td className="py-1.5 text-right font-medium">
                    {formatRupiah(tagihan.biayaKonsultasi)}
                  </td>
                </tr>

                {/* Tindakan medis items */}
                {(tagihan.rincianTindakan || []).map((t, idx) => (
                  <tr key={`t-${idx}`}>
                    <td className="py-1.5 text-slate-700 pl-3">
                      • Tindakan: {t.nama}
                    </td>
                    <td className="py-1.5 text-right font-medium">
                      {formatRupiah(t.biaya)}
                    </td>
                  </tr>
                ))}

                {/* Obat items */}
                {(tagihan.rincianObat || []).map((o, idx) => (
                  <tr key={`o-${idx}`}>
                    <td className="py-1.5 text-slate-700 pl-3">
                      • Farmasi: {o.namaObat} ({o.jumlah} butir)
                    </td>
                    <td className="py-1.5 text-right font-medium">
                      {formatRupiah(o.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Biaya</span>
              <span>{formatRupiah(tagihan.subtotal)}</span>
            </div>
            {tagihan.diskon > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Potongan / Diskon</span>
                <span>-{formatRupiah(tagihan.diskon)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL DIBAYAR</span>
              <span className="text-teal-700 print:text-black">
                {formatRupiah(tagihan.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 pt-2 text-[11px] text-slate-600">
              <div>
                <div>Metode: <span className="font-semibold">{tagihan.metodePembayaran}</span></div>
                <div>Status: <span className="font-bold text-emerald-700 print:text-black uppercase">{tagihan.statusPembayaran}</span></div>
              </div>
              <div className="text-right">
                <div>Diterima: {formatRupiah(tagihan.jumlahDibayar)}</div>
                <div>Kembalian: {formatRupiah(tagihan.kembalian)}</div>
              </div>
            </div>
          </div>

          {/* Stamp / Signature footer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
            <div className="text-center w-28">
              <div className="border-2 border-emerald-600 text-emerald-700 print:border-black print:text-black font-extrabold text-[10px] uppercase py-1 px-2 rounded-lg rotate-[-6deg]">
                LUNAS
              </div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-slate-400">Petugas Kasir</div>
              <div className="h-10"></div>
              <div className="font-bold text-slate-800 border-t border-slate-400 px-3">
                {tagihan.kasirNama}
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2">
            Terima kasih atas kunjungan Anda. Semoga lekas sembuh!
          </div>
        </div>
      </div>
    </div>
  );
};
