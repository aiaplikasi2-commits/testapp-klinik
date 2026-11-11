import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  nama: string;
  role:
    | 'Administrator'
    | 'Pemilik Klinik'
    | 'Dokter'
    | 'Perawat'
    | 'Petugas Pendaftaran'
    | 'Petugas Farmasi'
    | 'Kasir';
  nomorSIP?: string;
  noTelepon?: string;
  foto?: string; // Base64 data URL
  statusAktif: boolean;
  createdAt: string;
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
  tanggal: string; // YYYY-MM-DD
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
  tindakanMedis: Array<{ nama: string; biaya: number }>;
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
  rincianTindakan: Array<{ nama: string; biaya: number }>;
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

export interface AuditLog {
  id: string;
  userId: string;
  nama: string;
  role: string;
  aksi: string;
  modul: string;
  detail: string;
  timestamp: string;
  ip?: string;
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

export interface DatabaseSchema {
  users: User[];
  pasiens: Pasien[];
  kunjungans: Kunjungan[];
  rekamMedis: RekamMedis[];
  obats: Obat[];
  transaksiStok: TransaksiStokObat[];
  tagihans: Tagihan[];
  auditLogs: AuditLog[];
  lastCall?: CallQueueEvent;
  sequences: {
    rmNumber: number;
    queueNumber: number;
    queueDate: string;
    queuePrefixes: Record<string, number>;
    invoiceNumber: number;
    obatCode: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sim_klinik.json');

export function hashPassword(plainText: string): string {
  return crypto.createHash('sha256').update(plainText + '_sim_salt_2026').digest('hex');
}

// Initial system accounts: ONLY Administrator Utama so there are NO dummy doctors/nurses!
// Admin creates real doctors, nurses, staff with custom passwords.
function getDefaultUsers(): User[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'usr_admin',
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      nama: 'Administrator Utama',
      role: 'Administrator',
      noTelepon: '08123456789',
      statusAktif: true,
      createdAt: now,
    },
  ];
}

function getDefaultDatabase(): DatabaseSchema {
  const today = new Date().toISOString().split('T')[0];
  return {
    users: getDefaultUsers(),
    pasiens: [], // Clean empty state
    kunjungans: [], // Clean empty state
    rekamMedis: [], // Clean empty state
    obats: [], // Clean empty state
    transaksiStok: [], // Clean empty state
    tagihans: [], // Clean empty state
    auditLogs: [],
    sequences: {
      rmNumber: 0,
      queueNumber: 0,
      queueDate: today,
      queuePrefixes: {
        A: 0, // Poli Umum
        B: 0, // Poli Gigi
        C: 0, // Poli KIA / Ibu & Anak
        F: 0, // Farmasi
      },
      invoiceNumber: 0,
      obatCode: 0,
    },
  };
}

let cachedDb: DatabaseSchema | null = null;

export function loadDatabase(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(data);
      // Ensure users exist
      if (!cachedDb?.users || cachedDb.users.length === 0) {
        cachedDb!.users = getDefaultUsers();
      }
      if (!cachedDb?.sequences?.queuePrefixes) {
        cachedDb!.sequences.queuePrefixes = { A: 0, B: 0, C: 0, F: 0 };
      }
      return cachedDb!;
    }
  } catch (err) {
    console.error('Error reading database file, resetting to default schema:', err);
  }

  const initial = getDefaultDatabase();
  cachedDb = initial;
  saveDatabase(initial);
  return initial;
}

export function saveDatabase(db: DatabaseSchema): void {
  cachedDb = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export function logAudit(
  user: { id?: string; nama?: string; role?: string },
  aksi: string,
  modul: string,
  detail: string,
  ip?: string
) {
  const db = loadDatabase();
  const entry: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id || 'system',
    nama: user.nama || 'System',
    role: user.role || 'System',
    aksi,
    modul,
    detail,
    timestamp: new Date().toISOString(),
    ip,
  };
  db.auditLogs.unshift(entry);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  saveDatabase(db);
}
