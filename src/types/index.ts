export type UserRole =
  | 'Administrator'
  | 'Pemilik Klinik'
  | 'Dokter'
  | 'Perawat'
  | 'Petugas Pendaftaran'
  | 'Petugas Farmasi'
  | 'Kasir';

export interface User {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  nomorSIP?: string;
  noTelepon?: string;
  foto?: string; // Base64 data URL
  statusAktif?: boolean;
  createdAt?: string;
}

export interface Pasien {
  id: string;
  noRM: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  tanggalLahir: string;
  alamat: string;
  noTelepon: string;
  nik: string;
  golDarah: string;
  alergi: string;
  createdAt: string;
  updatedAt: string;
}

export type QueueStatus =
  | 'Menunggu'
  | 'Dipanggil'
  | 'Sedang Dilayani'
  | 'Selesai'
  | 'Dilewati'
  | 'Batal';

export interface Kunjungan {
  id: string;
  pasienId: string;
  noRM: string;
  namaPasien: string;
  tanggal: string;
  waktuDaftar: string;
  waktuPanggil?: string;
  waktuDilayani?: string;
  waktuSelesai?: string;
  waktuTungguMenit?: number;
  noAntrean: string;
  jenisKunjungan: 'Baru' | 'Lama';
  poli: string;
  ruangPelayanan?: string;
  dokterId: string;
  namaDokter: string;
  status: QueueStatus;
  keluhanAwal: string;
  sumberPendaftaran: 'Loket' | 'Online HP Mandiri';
  rekamMedisId?: string;
  tagihanId?: string;
}

export interface ResepItem {
  idObat: string;
  namaObat: string;
  jumlah: number;
  aturanPakai: string;
  harga: number;
  subtotal: number;
}

export interface TindakanItem {
  nama: string;
  biaya: number;
}

export interface RekamMedis {
  id: string;
  kunjunganId: string;
  pasienId: string;
  noRM: string;
  namaPasien: string;
  tanggal: string;
  dokterId: string;
  namaDokter: string;
  keluhanUtama: string;
  riwayatPenyakit: string;
  tandaVital: {
    tekananDarah: string;
    suhuTubuh: number;
    beratBadan: number;
    tinggiBadan: number;
    nadi?: number;
    respirasi?: number;
  };
  hasilPemeriksaanFisik: string;
  diagnosis: string;
  tindakanMedis: TindakanItem[];
  resep: ResepItem[];
  statusResep: 'Menunggu Farmasi' | 'Diserahkan' | 'Tanpa Resep';
  catatanDokter: string;
  status: 'Disahkan' | 'Draft';
  disahkanOleh: string;
  disahkanPada: string;
  riwayatKoreksi: Array<{
    tanggal: string;
    diubahOleh: string;
    alasan: string;
    dataSebelumnya: any;
  }>;
}

export interface Obat {
  id: string;
  kodeObat: string;
  namaObat: string;
  kategori: string;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  tanggalKedaluwarsa: string;
  lokasiPenyimpanan: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransaksiStokObat {
  id: string;
  obatId: string;
  kodeObat: string;
  namaObat: string;
  jenis: 'Masuk' | 'Keluar' | 'Koreksi';
  jumlah: number;
  stokSebelum: number;
  stokSesudah: number;
  keterangan: string;
  referensiId?: string;
  petugas: string;
  tanggal: string;
}

export interface Tagihan {
  id: string;
  noInvoice: string;
  kunjunganId: string;
  pasienId: string;
  namaPasien: string;
  noRM: string;
  tanggal: string;
  biayaPendaftaran: number;
  biayaKonsultasi: number;
  biayaTindakan: number;
  biayaObat: number;
  rincianTindakan: TindakanItem[];
  rincianObat: ResepItem[];
  subtotal: number;
  diskon: number;
  total: number;
  jumlahDibayar: number;
  kembalian: number;
  metodePembayaran: 'Tunai' | 'Transfer Bank' | 'QRIS';
  statusPembayaran: 'Belum Dibayar' | 'Sebagian' | 'Lunas';
  kasirNama: string;
  dibayarPada?: string;
}

export interface CallQueueEvent {
  noAntrean: string;
  namaPasien: string;
  poli: string;
  ruang: string;
  dokter: string;
  timestamp: string;
  callCount: number;
}

export interface DashboardSummaryData {
  totalPasien: number;
  kunjunganHariIniCount: number;
  pasienBaruHariIni: number;
  antreanMenunggu: number;
  antreanDilewati: number;
  pemeriksaanSelesai: number;
  pendapatanHariIni: number;
  obatStokMenipisCount: number;
  obatStokMenipisList: Array<{
    id: string;
    kodeObat: string;
    namaObat: string;
    stok: number;
    stokMinimum: number;
    satuan: string;
  }>;
  antreanHariIni: Kunjungan[];
  lastCall?: CallQueueEvent;
}

export interface AuditLog {
  id: string;
  userId: string;
  nama: string;
  role: string;
  aksi: string;
  modul: string;
  detail: string;
  timestamp: string;
}
