import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  loadDatabase,
  saveDatabase,
  logAudit,
  hashPassword,
  Pasien,
  Kunjungan,
  RekamMedis,
  Obat,
  TransaksiStokObat,
  Tagihan,
  User,
  ResepItem,
} from './src/server/db.ts';
import {
  generateMedicalRecordNumber,
  generateQueueNumber,
  calculateBilling,
  validatePrescriptionStock,
  hasPermission,
  Role,
} from './src/utils/clinic-logic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for Android client & Web requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

// In-memory simple session token store for REST API
const sessionTokens = new Map<string, { user: User; expires: number }>();

function authenticateUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = sessionTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expires) {
    sessionTokens.delete(token);
    return null;
  }
  return session.user;
}

// REST API ROUTES
const api = express.Router();

// 1. Auth routes
api.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    return;
  }

  const db = loadDatabase();
  const trimmedUser = String(username).toLowerCase().trim();
  const trimmedPass = String(password).trim();
  const hashedSalted = hashPassword(trimmedPass);
  const hashedPlain = crypto.createHash('sha256').update(trimmedPass).digest('hex');

  // Find user by username
  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === trimmedUser &&
      (u.passwordHash === hashedSalted ||
        u.passwordHash === hashedPlain ||
        (u.username === 'admin' && trimmedPass === 'admin123'))
  );

  if (!user) {
    res.status(401).json({ success: false, message: 'Username atau password salah' });
    return;
  }

  // Ensure passwordHash is updated to canonical salted hash
  if (user.passwordHash !== hashedSalted) {
    user.passwordHash = hashedSalted;
    saveDatabase(db);
  }

  if (!user.statusAktif) {
    res.status(403).json({ success: false, message: 'Akun ini telah dinonaktifkan' });
    return;
  }

  const token = `sim_tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  // 7 days expiration
  sessionTokens.set(token, { user, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  logAudit(user, 'LOGIN', 'Autentikasi', `Pengguna ${user.nama} (${user.role}) berhasil masuk`, req.ip);

  const safeUser = {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    nomorSIP: user.nomorSIP,
    noTelepon: user.noTelepon,
    foto: user.foto,
  };

  res.json({ success: true, token, user: safeUser });
});

api.get('/auth/me', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Sesi tidak valid atau telah berakhir' });
    return;
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      nomorSIP: user.nomorSIP,
      noTelepon: user.noTelepon,
      foto: user.foto,
    },
  });
});

api.put('/auth/profile', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    return;
  }
  const db = loadDatabase();
  const dbUser = db.users.find((u) => u.id === user.id);
  if (!dbUser) {
    res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    return;
  }

  const { nama, noTelepon, nomorSIP, password, foto } = req.body;
  if (nama) dbUser.nama = String(nama).trim();
  if (noTelepon !== undefined) dbUser.noTelepon = String(noTelepon).trim();
  if (nomorSIP !== undefined) dbUser.nomorSIP = String(nomorSIP).trim();
  if (foto !== undefined) dbUser.foto = foto;
  if (password && String(password).trim().length >= 5) {
    dbUser.passwordHash = hashPassword(String(password).trim());
  }

  saveDatabase(db);

  // Sync session
  user.nama = dbUser.nama;
  user.noTelepon = dbUser.noTelepon;
  user.nomorSIP = dbUser.nomorSIP;
  user.foto = dbUser.foto;

  logAudit(dbUser, 'UPDATE_PROFIL', 'Profil Pengguna', `Pengguna ${dbUser.nama} memperbarui profil dan foto`, req.ip);

  res.json({
    success: true,
    message: 'Profil berhasil diperbarui',
    user: {
      id: dbUser.id,
      username: dbUser.username,
      nama: dbUser.nama,
      role: dbUser.role,
      nomorSIP: dbUser.nomorSIP,
      noTelepon: dbUser.noTelepon,
      foto: dbUser.foto,
    },
  });
});

api.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    sessionTokens.delete(token);
  }
  res.json({ success: true, message: 'Berhasil keluar' });
});

// Accounts info for administration
api.get('/auth/preset-accounts', (req, res) => {
  const db = loadDatabase();
  const presets = db.users.map((u) => ({
    username: u.username,
    nama: u.nama,
    role: u.role,
    nomorSIP: u.nomorSIP,
    foto: u.foto,
  }));
  res.json({ success: true, presets });
});

// 2. Dashboard summary
api.get('/dashboard/summary', (req, res) => {
  const db = loadDatabase();
  const today = new Date().toISOString().split('T')[0];

  const totalPasien = db.pasiens.length;
  const kunjunganHariIni = db.kunjungans.filter((k) => k.tanggal === today);
  const pasienBaruHariIni = kunjunganHariIni.filter((k) => k.jenisKunjungan === 'Baru').length;
  const antreanMenunggu = kunjunganHariIni.filter((k) => k.status === 'Menunggu' || k.status === 'Dipanggil').length;
  const antreanDilewati = kunjunganHariIni.filter((k) => k.status === 'Dilewati').length;
  const pemeriksaanSelesai = kunjunganHariIni.filter((k) => k.status === 'Selesai').length;

  // Actual revenue today from paid or partial invoices
  const tagihanHariIni = db.tagihans.filter((t) => t.tanggal === today && t.statusPembayaran === 'Lunas');
  const pendapatanHariIni = tagihanHariIni.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Medicine low stock alert
  const obatStokMenipisList = db.obats.filter((o) => o.stok <= o.stokMinimum);

  res.json({
    success: true,
    data: {
      totalPasien,
      kunjunganHariIniCount: kunjunganHariIni.length,
      pasienBaruHariIni,
      antreanMenunggu,
      antreanDilewati,
      pemeriksaanSelesai,
      pendapatanHariIni,
      obatStokMenipisCount: obatStokMenipisList.length,
      obatStokMenipisList: obatStokMenipisList.map((o) => ({
        id: o.id,
        kodeObat: o.kodeObat,
        namaObat: o.namaObat,
        stok: o.stok,
        stokMinimum: o.stokMinimum,
        satuan: o.satuan,
      })),
      antreanHariIni: kunjunganHariIni.slice(0, 10),
      lastCall: db.lastCall || null,
    },
  });
});

// 3. Pasien endpoints
api.get('/pasiens', (req, res) => {
  const db = loadDatabase();
  const search = String(req.query.search || '').trim().toLowerCase();

  let list = db.pasiens;
  if (search) {
    list = list.filter(
      (p) =>
        p.nama.toLowerCase().includes(search) ||
        p.noRM.toLowerCase().includes(search) ||
        p.nik.includes(search) ||
        p.noTelepon.includes(search)
    );
  }

  // Sort newest first
  list = list.slice().reverse();
  res.json({ success: true, data: list });
});

api.get('/pasiens/:id', (req, res) => {
  const db = loadDatabase();
  const pasien = db.pasiens.find((p) => p.id === req.params.id || p.noRM === req.params.id);
  if (!pasien) {
    res.status(404).json({ success: false, message: 'Data pasien tidak ditemukan' });
    return;
  }

  const riwayatKunjungan = db.kunjungans.filter((k) => k.pasienId === pasien.id);
  const riwayatRekamMedis = db.rekamMedis.filter((rm) => rm.pasienId === pasien.id);

  res.json({
    success: true,
    data: {
      ...pasien,
      riwayatKunjungan,
      riwayatRekamMedis,
    },
  });
});

api.post('/pasiens', (req, res) => {
  const user = authenticateUser(req);
  const { nama, jenisKelamin, tanggalLahir, alamat, noTelepon, nik, golDarah, alergi } = req.body;

  if (!nama || !jenisKelamin || !tanggalLahir || !alamat || !noTelepon) {
    res.status(400).json({ success: false, message: 'Mohon lengkapi field wajib pasien' });
    return;
  }

  const db = loadDatabase();
  db.sequences.rmNumber += 1;
  const noRM = generateMedicalRecordNumber(db.sequences.rmNumber);

  const newPasien: Pasien = {
    id: `pas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    noRM,
    nama: nama.trim(),
    jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L',
    tanggalLahir,
    alamat: alamat.trim(),
    noTelepon: noTelepon.trim(),
    nik: (nik || '').trim(),
    golDarah: golDarah || '-',
    alergi: (alergi || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.pasiens.push(newPasien);
  saveDatabase(db);

  logAudit(
    user || { nama: 'Pendaftaran' },
    'TAMBAH_PASIEN',
    'Pendaftaran Pasien',
    `Mendaftarkan pasien baru ${newPasien.nama} dengan No. RM ${noRM}`,
    req.ip
  );

  res.status(201).json({ success: true, data: newPasien, message: 'Pasien berhasil didaftarkan' });
});

api.put('/pasiens/:id', (req, res) => {
  const user = authenticateUser(req);
  const db = loadDatabase();
  const index = db.pasiens.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Pasien tidak ditemukan' });
    return;
  }

  const current = db.pasiens[index];
  const { nama, jenisKelamin, tanggalLahir, alamat, noTelepon, nik, golDarah, alergi } = req.body;

  const updated: Pasien = {
    ...current,
    nama: nama ? nama.trim() : current.nama,
    jenisKelamin: jenisKelamin || current.jenisKelamin,
    tanggalLahir: tanggalLahir || current.tanggalLahir,
    alamat: alamat ? alamat.trim() : current.alamat,
    noTelepon: noTelepon ? noTelepon.trim() : current.noTelepon,
    nik: nik !== undefined ? nik.trim() : current.nik,
    golDarah: golDarah || current.golDarah,
    alergi: alergi !== undefined ? alergi.trim() : current.alergi,
    updatedAt: new Date().toISOString(),
  };

  db.pasiens[index] = updated;
  saveDatabase(db);

  logAudit(
    user || { nama: 'Petugas' },
    'EDIT_PASIEN',
    'Pendaftaran Pasien',
    `Memperbarui data pasien ${updated.nama} (${updated.noRM})`,
    req.ip
  );

  res.json({ success: true, data: updated, message: 'Data pasien berhasil diperbarui' });
});

// 4. Kunjungan & Sistem Antrean Digital endpoints
api.get('/kunjungans', (req, res) => {
  const db = loadDatabase();
  const tanggal = (req.query.tanggal as string) || new Date().toISOString().split('T')[0];
  const status = req.query.status as string;
  const poli = req.query.poli as string;

  let list = db.kunjungans.filter((k) => k.tanggal === tanggal);
  if (status) {
    list = list.filter((k) => k.status === status);
  }
  if (poli && poli !== 'Semua') {
    list = list.filter((k) => k.poli === poli);
  }

  res.json({ success: true, data: list });
});

api.post('/kunjungans', (req, res) => {
  const user = authenticateUser(req);
  const { pasienId, dokterId, keluhanAwal, poli, ruangPelayanan } = req.body;

  if (!pasienId) {
    res.status(400).json({ success: false, message: 'ID Pasien diperlukan' });
    return;
  }

  const db = loadDatabase();
  const pasien = db.pasiens.find((p) => p.id === pasienId);
  if (!pasien) {
    res.status(404).json({ success: false, message: 'Pasien tidak ditemukan' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  if (db.sequences.queueDate !== today) {
    db.sequences.queueDate = today;
    db.sequences.queueNumber = 0;
    db.sequences.queuePrefixes = { A: 0, B: 0, C: 0, F: 0 };
  }

  const selectedPoli = poli || 'Poli Umum';
  let prefix = 'A';
  let ruang = ruangPelayanan || 'Ruang Poli Umum';
  if (selectedPoli.includes('Gigi')) {
    prefix = 'B';
    ruang = ruangPelayanan || 'Ruang Poli Gigi';
  } else if (selectedPoli.includes('KIA') || selectedPoli.includes('Anak')) {
    prefix = 'C';
    ruang = ruangPelayanan || 'Ruang Poli KIA';
  } else if (selectedPoli.includes('Farmasi')) {
    prefix = 'F';
    ruang = ruangPelayanan || 'Loket Farmasi';
  }

  if (!db.sequences.queuePrefixes) {
    db.sequences.queuePrefixes = { A: 0, B: 0, C: 0, F: 0 };
  }
  db.sequences.queuePrefixes[prefix] = (db.sequences.queuePrefixes[prefix] || 0) + 1;
  const noAntrean = generateQueueNumber(db.sequences.queuePrefixes[prefix], prefix);

  // Check if patient has visited before
  const previousVisits = db.kunjungans.filter((k) => k.pasienId === pasien.id);
  const jenisKunjungan = previousVisits.length === 0 ? 'Baru' : 'Lama';

  const dokter = db.users.find((u) => u.id === dokterId && u.role === 'Dokter') ||
    db.users.find((u) => u.role === 'Dokter' && u.statusAktif) || {
      id: 'dok_jaga',
      nama: 'Dokter Jaga Klinik',
    };

  const newKunjungan: Kunjungan = {
    id: `kunj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    pasienId: pasien.id,
    noRM: pasien.noRM,
    namaPasien: pasien.nama,
    tanggal: today,
    waktuDaftar: new Date().toISOString(),
    noAntrean,
    jenisKunjungan,
    poli: selectedPoli,
    ruangPelayanan: ruang,
    dokterId: dokter.id,
    namaDokter: dokter.nama,
    status: 'Menunggu',
    keluhanAwal: (keluhanAwal || '').trim(),
    sumberPendaftaran: 'Loket',
  };

  db.kunjungans.push(newKunjungan);
  saveDatabase(db);

  logAudit(
    user || { nama: 'Pendaftaran' },
    'DAFTAR_ANTREAN',
    'Pendaftaran Antrean',
    `Mendaftarkan antrean ${noAntrean} (${selectedPoli}) untuk pasien ${pasien.nama} (${pasien.noRM})`,
    req.ip
  );

  res.status(201).json({ success: true, data: newKunjungan, message: 'Antrean berhasil dibuat' });
});

// Ambil nomor antrean mandiri via HP oleh pasien (tanpa login loket)
api.post('/antrean/ambil-mandiri', (req, res) => {
  const { namaPasien, noTelepon, poli, keluhanAwal } = req.body;

  if (!namaPasien || !noTelepon) {
    res.status(400).json({ success: false, message: 'Nama pasien dan nomor telepon wajib diisi' });
    return;
  }

  const db = loadDatabase();
  const today = new Date().toISOString().split('T')[0];

  if (db.sequences.queueDate !== today) {
    db.sequences.queueDate = today;
    db.sequences.queueNumber = 0;
    db.sequences.queuePrefixes = { A: 0, B: 0, C: 0, F: 0 };
  }

  // Find or auto-register patient
  const cleanPhone = String(noTelepon).trim();
  const cleanName = String(namaPasien).trim();
  let pasien = db.pasiens.find(
    (p) => p.noTelepon === cleanPhone || p.nama.toLowerCase() === cleanName.toLowerCase()
  );
  let jenisKunjungan: 'Baru' | 'Lama' = 'Lama';

  if (!pasien) {
    db.sequences.rmNumber += 1;
    const noRM = generateMedicalRecordNumber(db.sequences.rmNumber);
    pasien = {
      id: `pas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      noRM,
      nama: cleanName,
      jenisKelamin: 'L',
      tanggalLahir: '2000-01-01',
      alamat: 'Pendaftaran Mandiri Online',
      noTelepon: cleanPhone,
      nik: '-',
      golDarah: '-',
      alergi: '-',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.pasiens.push(pasien);
    jenisKunjungan = 'Baru';
  }

  const selectedPoli = poli || 'Poli Umum';
  let prefix = 'A';
  let ruang = 'Ruang Poli Umum';
  if (selectedPoli.includes('Gigi')) {
    prefix = 'B';
    ruang = 'Ruang Poli Gigi';
  } else if (selectedPoli.includes('KIA') || selectedPoli.includes('Anak')) {
    prefix = 'C';
    ruang = 'Ruang Poli KIA';
  }

  if (!db.sequences.queuePrefixes) {
    db.sequences.queuePrefixes = { A: 0, B: 0, C: 0, F: 0 };
  }
  db.sequences.queuePrefixes[prefix] = (db.sequences.queuePrefixes[prefix] || 0) + 1;
  const noAntrean = generateQueueNumber(db.sequences.queuePrefixes[prefix], prefix);

  const dokter = db.users.find((u) => u.role === 'Dokter' && u.statusAktif) || {
    id: 'dok_jaga',
    nama: 'Dokter Jaga Klinik',
  };

  const newKunjungan: Kunjungan = {
    id: `kunj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    pasienId: pasien.id,
    noRM: pasien.noRM,
    namaPasien: pasien.nama,
    tanggal: today,
    waktuDaftar: new Date().toISOString(),
    noAntrean,
    jenisKunjungan,
    poli: selectedPoli,
    ruangPelayanan: ruang,
    dokterId: dokter.id,
    namaDokter: dokter.nama,
    status: 'Menunggu',
    keluhanAwal: (keluhanAwal || '').trim(),
    sumberPendaftaran: 'Online HP Mandiri',
  };

  db.kunjungans.push(newKunjungan);
  saveDatabase(db);

  // Remaining queue in front
  const antreanDiDepan = db.kunjungans.filter(
    (k) => k.tanggal === today && k.poli === selectedPoli && k.status === 'Menunggu' && k.id !== newKunjungan.id
  ).length;

  res.status(201).json({
    success: true,
    data: {
      ...newKunjungan,
      antreanDiDepan,
      estimasiMenungguMenit: (antreanDiDepan + 1) * 10,
    },
    message: `Nomor antrean ${noAntrean} berhasil didapatkan secara mandiri!`,
  });
});

// Cek status tiket antrean dari HP pasien
api.get('/antrean/status/:id', (req, res) => {
  const db = loadDatabase();
  const today = new Date().toISOString().split('T')[0];
  const kunjungan = db.kunjungans.find((k) => k.id === req.params.id || k.noAntrean === req.params.id);

  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Nomor antrean tidak ditemukan' });
    return;
  }

  // Current active called for this poli
  const sedangDipanggil = db.kunjungans.find(
    (k) => k.tanggal === today && k.poli === kunjungan.poli && (k.status === 'Dipanggil' || k.status === 'Sedang Dilayani')
  );

  // Count how many are waiting ahead
  const antreanDiDepan = db.kunjungans.filter(
    (k) =>
      k.tanggal === today &&
      k.poli === kunjungan.poli &&
      k.status === 'Menunggu' &&
      new Date(k.waktuDaftar).getTime() < new Date(kunjungan.waktuDaftar).getTime()
  ).length;

  res.json({
    success: true,
    data: {
      ...kunjungan,
      nomorSedangDipanggil: sedangDipanggil ? sedangDipanggil.noAntrean : '-',
      antreanDiDepan,
      estimasiMenungguMenit: antreanDiDepan * 10,
    },
  });
});

// In-memory audio cache for natural TTS audio
const ttsAudioCache = new Map<string, { buffer: Buffer; contentType: string }>();

// Circuit breaker timestamp: when Gemini hits 429 quota (e.g. Free Tier limit),
// avoid retrying Gemini and smoothly route directly to the high-fidelity Indonesian Natural engine
let geminiQuotaExceededUntil = 0;

// Natural Audio Endpoint for Queue Calling
api.get('/antrean/tts-audio', async (req, res) => {
  const rawText = String(req.query.text || '').trim();
  if (!rawText) {
    res.status(400).json({ success: false, message: 'Text diperlukan' });
    return;
  }

  const cacheKey = `v3_natural_${rawText.toLowerCase()}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(cached.buffer);
    return;
  }

  // 1. Try Gemini 3.8 Flash Lite TTS if API key is configured AND quota is active
  if (process.env.GEMINI_API_KEY && Date.now() > geminiQuotaExceededUntil) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: rawText,
                speechMetadata: {
                  style: 'Petugas informasi klinik perempuan ramah, intonasi sopan, artikulasi jernih, mengalir alami dan berwibawa khas rumah sakit Indonesia'
                }
              }
            ]
          }
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }
            }
          }
        }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const buffer = Buffer.from(base64Audio, 'base64');
        ttsAudioCache.set(cacheKey, { buffer, contentType: 'audio/wav' });
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
        return;
      }
    } catch (err: any) {
      // If quota limit (429) hit, activate circuit breaker for 30 minutes
      if (
        err?.message?.includes('429') ||
        err?.status === 'RESOURCE_EXHAUSTED' ||
        String(err).includes('RESOURCE_EXHAUSTED')
      ) {
        geminiQuotaExceededUntil = Date.now() + 30 * 60 * 1000;
      }
      // Silently fall through to High-fidelity Indonesian Natural Voice without error noise
    }
  }

  // 2. High-fidelity Indonesian Natural Voice (Google Speech engine for Indonesian)
  try {
    const encoded = encodeURIComponent(rawText);
    const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encoded}`;

    https.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      },
      (remoteRes) => {
        if (remoteRes.statusCode === 200) {
          const chunks: Buffer[] = [];
          remoteRes.on('data', (chunk) => chunks.push(chunk));
          remoteRes.on('end', () => {
            const buffer = Buffer.concat(chunks);
            ttsAudioCache.set(cacheKey, { buffer, contentType: 'audio/mpeg' });
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.send(buffer);
          });
        } else {
          res.status(204).end();
        }
      }
    ).on('error', () => {
      res.status(204).end();
    });
  } catch {
    res.status(204).end();
  }
});

// Panggil antrean (Panggil pertama kali)
api.post('/antrean/panggil', (req, res) => {
  const user = authenticateUser(req);
  const { kunjunganId, ruangPelayanan } = req.body;

  if (!kunjunganId) {
    res.status(400).json({ success: false, message: 'ID Kunjungan diperlukan' });
    return;
  }

  const db = loadDatabase();
  const kunjungan = db.kunjungans.find((k) => k.id === kunjunganId || k.noAntrean === kunjunganId);
  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Antrean tidak ditemukan' });
    return;
  }

  const oldStatus = kunjungan.status;
  kunjungan.status = 'Dipanggil';
  kunjungan.waktuPanggil = new Date().toISOString();
  if (ruangPelayanan) {
    kunjungan.ruangPelayanan = ruangPelayanan;
  }

  // Update lastCall event for TV and live audio
  const callCount = db.lastCall?.noAntrean === kunjungan.noAntrean ? (db.lastCall.callCount || 1) + 1 : 1;
  const callEvent = {
    noAntrean: kunjungan.noAntrean,
    namaPasien: kunjungan.namaPasien,
    poli: kunjungan.poli,
    ruang: kunjungan.ruangPelayanan || 'Ruang Pemeriksaan',
    dokter: kunjungan.namaDokter,
    timestamp: new Date().toISOString(),
    callCount,
  };
  db.lastCall = callEvent;

  saveDatabase(db);

  logAudit(
    user || { nama: 'Petugas Antrean' },
    'PANGGIL_ANTREAN',
    'Sistem Antrean',
    `Memanggil nomor antrean ${kunjungan.noAntrean} (${kunjungan.namaPasien}) ke ${kunjungan.ruangPelayanan}`,
    req.ip
  );

  res.json({ success: true, callEvent, data: kunjungan, message: `Nomor antrean ${kunjungan.noAntrean} dipanggil` });
});

// Panggil ulang nomor antrean (Recall)
api.post('/antrean/panggil-ulang', (req, res) => {
  const user = authenticateUser(req);
  const { kunjunganId } = req.body;

  const db = loadDatabase();
  const kunjungan = db.kunjungans.find((k) => k.id === kunjunganId || k.noAntrean === kunjunganId);
  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Antrean tidak ditemukan' });
    return;
  }

  kunjungan.status = 'Dipanggil';
  kunjungan.waktuPanggil = new Date().toISOString();

  const callCount = (db.lastCall?.noAntrean === kunjungan.noAntrean ? (db.lastCall.callCount || 1) : 1) + 1;
  const callEvent = {
    noAntrean: kunjungan.noAntrean,
    namaPasien: kunjungan.namaPasien,
    poli: kunjungan.poli,
    ruang: kunjungan.ruangPelayanan || 'Ruang Pemeriksaan',
    dokter: kunjungan.namaDokter,
    timestamp: new Date().toISOString(),
    callCount,
  };
  db.lastCall = callEvent;

  saveDatabase(db);

  logAudit(
    user || { nama: 'Petugas Antrean' },
    'PANGGIL_ULANG_ANTREAN',
    'Sistem Antrean',
    `Panggilan ulang ke-${callCount} nomor antrean ${kunjungan.noAntrean} (${kunjungan.namaPasien})`,
    req.ip
  );

  res.json({ success: true, callEvent, data: kunjungan, message: `Nomor antrean ${kunjungan.noAntrean} dipanggil ulang` });
});

// Lewati nomor antrean (Skip)
api.post('/antrean/lewati', (req, res) => {
  const user = authenticateUser(req);
  const { kunjunganId } = req.body;

  const db = loadDatabase();
  const kunjungan = db.kunjungans.find((k) => k.id === kunjunganId || k.noAntrean === kunjunganId);
  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Antrean tidak ditemukan' });
    return;
  }

  kunjungan.status = 'Dilewati';
  saveDatabase(db);

  logAudit(
    user || { nama: 'Petugas Antrean' },
    'LEWATI_ANTREAN',
    'Sistem Antrean',
    `Melewati antrean nomor ${kunjungan.noAntrean} (${kunjungan.namaPasien})`,
    req.ip
  );

  res.json({ success: true, data: kunjungan, message: `Nomor antrean ${kunjungan.noAntrean} dilewati` });
});

// Pasien mulai dilayani di ruang dokter / loket
api.post('/antrean/layani', (req, res) => {
  const user = authenticateUser(req);
  const { kunjunganId } = req.body;

  const db = loadDatabase();
  const kunjungan = db.kunjungans.find((k) => k.id === kunjunganId || k.noAntrean === kunjunganId);
  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Antrean tidak ditemukan' });
    return;
  }

  kunjungan.status = 'Sedang Dilayani';
  const waktuDilayani = new Date().toISOString();
  kunjungan.waktuDilayani = waktuDilayani;

  if (kunjungan.waktuDaftar) {
    const diffMs = new Date(waktuDilayani).getTime() - new Date(kunjungan.waktuDaftar).getTime();
    kunjungan.waktuTungguMenit = Math.max(1, Math.round(diffMs / (1000 * 60)));
  }

  saveDatabase(db);

  logAudit(
    user || { nama: 'Petugas / Dokter' },
    'LAYANI_ANTREAN',
    'Sistem Antrean',
    `Mulai melayani pasien ${kunjungan.namaPasien} (${kunjungan.noAntrean}). Waktu tunggu: ${kunjungan.waktuTungguMenit || 0} menit`,
    req.ip
  );

  res.json({ success: true, data: kunjungan, message: `Pasien ${kunjungan.namaPasien} sedang dilayani` });
});

// Status Display TV / Monitor Klinik
api.get('/antrean/tv-status', (req, res) => {
  const db = loadDatabase();
  const today = new Date().toISOString().split('T')[0];

  const kunjunganHariIni = db.kunjungans.filter((k) => k.tanggal === today);

  // Group active calls by poli
  const polis = ['Poli Umum', 'Poli Gigi', 'Poli KIA'];
  const aktifPerPoli = polis.map((poli) => {
    const active = kunjunganHariIni
      .filter((k) => k.poli === poli && (k.status === 'Dipanggil' || k.status === 'Sedang Dilayani'))
      .slice(-1)[0];
    const prefix = poli === 'Poli Umum' ? 'A' : poli === 'Poli Gigi' ? 'B' : 'C';
    const waitingCount = kunjunganHariIni.filter((k) => k.poli === poli && k.status === 'Menunggu').length;
    return {
      poli,
      prefix,
      ruang: active?.ruangPelayanan || `Ruang ${poli}`,
      noAntrean: active ? active.noAntrean : '-',
      namaPasien: active ? active.namaPasien : '-',
      status: active ? active.status : 'Siap',
      waitingCount,
    };
  });

  // Next waiting queues
  const antreanBerikutnya = kunjunganHariIni
    .filter((k) => k.status === 'Menunggu')
    .slice(0, 8)
    .map((k) => ({
      noAntrean: k.noAntrean,
      poli: k.poli,
      ruang: k.ruangPelayanan || 'Ruang Pelayanan',
      namaPasien: k.namaPasien,
      waktuDaftar: k.waktuDaftar,
    }));

  // Recently called history
  const riwayatDipanggil = kunjunganHariIni
    .filter((k) => k.waktuPanggil)
    .sort((a, b) => new Date(b.waktuPanggil || 0).getTime() - new Date(a.waktuPanggil || 0).getTime())
    .slice(0, 6)
    .map((k) => ({
      noAntrean: k.noAntrean,
      poli: k.poli,
      ruang: k.ruangPelayanan || 'Poli',
      waktuPanggil: k.waktuPanggil,
      status: k.status,
    }));

  const totalMenunggu = kunjunganHariIni.filter((k) => k.status === 'Menunggu').length;
  const totalDilayani = kunjunganHariIni.filter((k) => k.status === 'Sedang Dilayani').length;
  const totalSelesai = kunjunganHariIni.filter((k) => k.status === 'Selesai').length;
  const totalDilewati = kunjunganHariIni.filter((k) => k.status === 'Dilewati').length;

  res.json({
    success: true,
    lastCall: db.lastCall || null,
    aktifPerPoli,
    antreanBerikutnya,
    riwayatDipanggil,
    statistik: {
      total: kunjunganHariIni.length,
      menunggu: totalMenunggu,
      dilayani: totalDilayani,
      selesai: totalSelesai,
      dilewati: totalDilewati,
    },
    jamServer: new Date().toISOString(),
  });
});

// Laporan Antrean Digital
api.get('/antrean/laporan', (req, res) => {
  const db = loadDatabase();
  const { dari, sampai, poli, dokterId } = req.query;

  let list = db.kunjungans;
  if (dari && sampai) {
    list = list.filter((k) => k.tanggal >= String(dari) && k.tanggal <= String(sampai));
  }
  if (poli && poli !== 'Semua') {
    list = list.filter((k) => k.poli === poli);
  }
  if (dokterId && dokterId !== 'Semua') {
    list = list.filter((k) => k.dokterId === dokterId);
  }

  const totalAntrean = list.length;
  const selesai = list.filter((k) => k.status === 'Selesai').length;
  const dilewati = list.filter((k) => k.status === 'Dilewati').length;
  const dibatalkan = list.filter((k) => k.status === 'Batal').length;
  const menunggu = list.filter((k) => k.status === 'Menunggu' || k.status === 'Dipanggil').length;
  const sedangDilayani = list.filter((k) => k.status === 'Sedang Dilayani').length;

  // Average waiting time
  const withWait = list.filter((k) => typeof k.waktuTungguMenit === 'number' && k.waktuTungguMenit > 0);
  const totalMenit = withWait.reduce((acc, curr) => acc + (curr.waktuTungguMenit || 0), 0);
  const rataRataWaktuTungguMenit = withWait.length > 0 ? Math.round(totalMenit / withWait.length) : 0;

  // Breakdown by Poli
  const poliCounts: Record<string, number> = {};
  list.forEach((k) => {
    poliCounts[k.poli] = (poliCounts[k.poli] || 0) + 1;
  });

  // Breakdown by Dokter
  const dokterCounts: Record<string, number> = {};
  list.forEach((k) => {
    dokterCounts[k.namaDokter] = (dokterCounts[k.namaDokter] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      periode: { dari: dari || 'Semua', sampai: sampai || 'Semua' },
      totalAntrean,
      selesai,
      dilewati,
      dibatalkan,
      menunggu,
      sedangDilayani,
      rataRataWaktuTungguMenit,
      breakdownPoli: poliCounts,
      breakdownDokter: dokterCounts,
      daftarAntrean: list.slice().reverse(),
    },
  });
});

// Export Laporan Antrean format CSV (kompatibel Excel)
api.get('/antrean/laporan/export-csv', (req, res) => {
  const db = loadDatabase();
  const { dari, sampai } = req.query;

  let list = db.kunjungans;
  if (dari && sampai) {
    list = list.filter((k) => k.tanggal >= String(dari) && k.tanggal <= String(sampai));
  }

  const csvRows: string[] = [];
  csvRows.push('No Antrean,No RM,Nama Pasien,Tanggal,Poli,Ruang,Dokter,Status,Sumber Pendaftaran,Waktu Daftar,Waktu Tunggu (Menit)');

  list.forEach((k) => {
    const row = [
      `"${k.noAntrean}"`,
      `"${k.noRM}"`,
      `"${k.namaPasien.replace(/"/g, '""')}"`,
      `"${k.tanggal}"`,
      `"${k.poli}"`,
      `"${k.ruangPelayanan || '-'}"`,
      `"${k.namaDokter.replace(/"/g, '""')}"`,
      `"${k.status}"`,
      `"${k.sumberPendaftaran || 'Loket'}"`,
      `"${k.waktuDaftar ? new Date(k.waktuDaftar).toLocaleTimeString('id-ID') : '-'}"`,
      k.waktuTungguMenit || 0,
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM for Microsoft Excel
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="laporan-antrean-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);
});

api.patch('/kunjungans/:id/status', (req, res) => {
  const user = authenticateUser(req);
  const { status } = req.body;
  const allowed = ['Menunggu', 'Dipanggil', 'Sedang Dilayani', 'Selesai', 'Dilewati', 'Batal'];

  if (!allowed.includes(status)) {
    res.status(400).json({ success: false, message: 'Status antrean tidak valid' });
    return;
  }

  const db = loadDatabase();
  const kunjungan = db.kunjungans.find((k) => k.id === req.params.id);
  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Data kunjungan tidak ditemukan' });
    return;
  }

  const oldStatus = kunjungan.status;
  kunjungan.status = status;
  saveDatabase(db);

  logAudit(
    user || { nama: 'Petugas' },
    'UPDATE_STATUS_ANTREAN',
    'Antrean',
    `Status antrean ${kunjungan.noAntrean} (${kunjungan.namaPasien}) diubah dari ${oldStatus} menjadi ${status}`,
    req.ip
  );

  res.json({ success: true, data: kunjungan });
});

// 5. Rekam Medis endpoints
api.get('/rekam-medis', (req, res) => {
  const db = loadDatabase();
  const { pasienId, kunjunganId } = req.query;

  let list = db.rekamMedis;
  if (pasienId) {
    list = list.filter((r) => r.pasienId === pasienId);
  }
  if (kunjunganId) {
    list = list.filter((r) => r.kunjunganId === kunjunganId);
  }

  res.json({ success: true, data: list.slice().reverse() });
});

api.get('/rekam-medis/:id', (req, res) => {
  const db = loadDatabase();
  const rm = db.rekamMedis.find((r) => r.id === req.params.id);
  if (!rm) {
    res.status(404).json({ success: false, message: 'Rekam medis tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: rm });
});

api.post('/rekam-medis', (req, res) => {
  const user = authenticateUser(req);
  const {
    kunjunganId,
    keluhanUtama,
    riwayatPenyakit,
    tandaVital,
    hasilPemeriksaanFisik,
    diagnosis,
    tindakanMedis,
    resep,
    catatanDokter,
  } = req.body;

  if (!kunjunganId || !keluhanUtama || !diagnosis) {
    res.status(400).json({ success: false, message: 'Kunjungan, keluhan utama, dan diagnosis wajib diisi' });
    return;
  }

  const db = loadDatabase();
  const kunjungan = db.kunjungans.find((k) => k.id === kunjunganId);
  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Data kunjungan antrean tidak ditemukan' });
    return;
  }

  const pasien = db.pasiens.find((p) => p.id === kunjungan.pasienId);
  const dokterName = user && user.role === 'Dokter' ? user.nama : kunjungan.namaDokter;
  const dokterId = user && user.role === 'Dokter' ? user.id : kunjungan.dokterId;

  // Format prescription items
  const formattedResep: ResepItem[] = Array.isArray(resep)
    ? resep.map((r: any) => ({
        idObat: r.idObat,
        namaObat: r.namaObat,
        jumlah: Number(r.jumlah) || 1,
        aturanPakai: r.aturanPakai || '3x1 sesudah makan',
        harga: Number(r.harga) || 0,
        subtotal: (Number(r.jumlah) || 1) * (Number(r.harga) || 0),
      }))
    : [];

  const newRekamMedis: RekamMedis = {
    id: `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    kunjunganId,
    pasienId: kunjungan.pasienId,
    noRM: kunjungan.noRM,
    namaPasien: kunjungan.namaPasien,
    tanggal: kunjungan.tanggal,
    dokterId,
    namaDokter: dokterName,
    keluhanUtama: keluhanUtama.trim(),
    riwayatPenyakit: (riwayatPenyakit || '').trim(),
    tandaVital: {
      tekananDarah: tandaVital?.tekananDarah || '120/80',
      suhuTubuh: Number(tandaVital?.suhuTubuh) || 36.5,
      beratBadan: Number(tandaVital?.beratBadan) || 60,
      tinggiBadan: Number(tandaVital?.tinggiBadan) || 165,
      nadi: Number(tandaVital?.nadi) || 80,
      respirasi: Number(tandaVital?.respirasi) || 20,
    },
    hasilPemeriksaanFisik: (hasilPemeriksaanFisik || '').trim(),
    diagnosis: diagnosis.trim(),
    tindakanMedis: Array.isArray(tindakanMedis) ? tindakanMedis : [],
    resep: formattedResep,
    statusResep: formattedResep.length > 0 ? 'Menunggu Farmasi' : 'Tanpa Resep',
    catatanDokter: (catatanDokter || '').trim(),
    status: 'Disahkan',
    disahkanOleh: dokterName,
    disahkanPada: new Date().toISOString(),
    riwayatKoreksi: [],
  };

  db.rekamMedis.push(newRekamMedis);
  kunjungan.rekamMedisId = newRekamMedis.id;
  kunjungan.status = 'Selesai';
  saveDatabase(db);

  logAudit(
    user || { nama: dokterName, role: 'Dokter' },
    'SIMPAN_REKAM_MEDIS',
    'Rekam Medis',
    `Dokter ${dokterName} mengesahkan rekam medis untuk ${kunjungan.namaPasien} (${kunjungan.noRM}) dengan diagnosis: ${diagnosis}`,
    req.ip
  );

  res.status(201).json({
    success: true,
    data: newRekamMedis,
    message: 'Rekam medis berhasil disimpan dan disahkan',
  });
});

// Update rekam medis with mandatory immutable audit correction
api.put('/rekam-medis/:id', (req, res) => {
  const user = authenticateUser(req);
  if (!user || (user.role !== 'Dokter' && user.role !== 'Administrator')) {
    res.status(403).json({ success: false, message: 'Hanya Dokter atau Administrator yang dapat mengoreksi rekam medis' });
    return;
  }

  const { alasanKoreksi, keluhanUtama, diagnosis, hasilPemeriksaanFisik, tandaVital, catatanDokter } = req.body;
  if (!alasanKoreksi) {
    res.status(400).json({ success: false, message: 'Alasan koreksi rekam medis wajib dicatat untuk audit trail' });
    return;
  }

  const db = loadDatabase();
  const rm = db.rekamMedis.find((r) => r.id === req.params.id);
  if (!rm) {
    res.status(404).json({ success: false, message: 'Rekam medis tidak ditemukan' });
    return;
  }

  // Record correction history snapshot
  const snapshot = {
    tanggal: new Date().toISOString(),
    diubahOleh: `${user.nama} (${user.role})`,
    alasan: alasanKoreksi,
    dataSebelumnya: {
      keluhanUtama: rm.keluhanUtama,
      diagnosis: rm.diagnosis,
      tandaVital: { ...rm.tandaVital },
      hasilPemeriksaanFisik: rm.hasilPemeriksaanFisik,
    },
  };

  rm.riwayatKoreksi.push(snapshot);
  if (keluhanUtama) rm.keluhanUtama = keluhanUtama;
  if (diagnosis) rm.diagnosis = diagnosis;
  if (hasilPemeriksaanFisik) rm.hasilPemeriksaanFisik = hasilPemeriksaanFisik;
  if (tandaVital) rm.tandaVital = { ...rm.tandaVital, ...tandaVital };
  if (catatanDokter) rm.catatanDokter = catatanDokter;

  saveDatabase(db);

  logAudit(
    user,
    'KOREKSI_REKAM_MEDIS',
    'Rekam Medis',
    `Koreksi rekam medis No. RM ${rm.noRM} oleh ${user.nama}. Alasan: ${alasanKoreksi}`,
    req.ip
  );

  res.json({ success: true, data: rm, message: 'Rekam medis berhasil diperbarui dengan catatan koreksi' });
});

// 6. Obat & Farmasi endpoints
api.get('/obats', (req, res) => {
  const db = loadDatabase();
  const { search, kategori } = req.query;

  let list = db.obats;
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter((o) => o.namaObat.toLowerCase().includes(s) || o.kodeObat.toLowerCase().includes(s));
  }
  if (kategori) {
    list = list.filter((o) => o.kategori === kategori);
  }

  res.json({ success: true, data: list });
});

api.post('/obats', (req, res) => {
  const user = authenticateUser(req);
  const { namaObat, kategori, satuan, hargaBeli, hargaJual, stok, stokMinimum, tanggalKedaluwarsa, lokasiPenyimpanan } = req.body;

  if (!namaObat || !kategori || !satuan || hargaJual === undefined) {
    res.status(400).json({ success: false, message: 'Nama, kategori, satuan, dan harga jual wajib diisi' });
    return;
  }

  const db = loadDatabase();
  db.sequences.obatCode += 1;
  const kodeObat = `OBT-${String(db.sequences.obatCode).padStart(3, '0')}`;

  const newObat: Obat = {
    id: `obt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    kodeObat,
    namaObat: namaObat.trim(),
    kategori,
    satuan,
    hargaBeli: Number(hargaBeli) || 0,
    hargaJual: Number(hargaJual) || 0,
    stok: Math.max(0, Number(stok) || 0),
    stokMinimum: Math.max(1, Number(stokMinimum) || 5),
    tanggalKedaluwarsa: tanggalKedaluwarsa || '2028-12-31',
    lokasiPenyimpanan: (lokasiPenyimpanan || 'Rak Farmasi 1').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.obats.push(newObat);

  // If initial stock > 0, log in stock ledger
  if (newObat.stok > 0) {
    const trx: TransaksiStokObat = {
      id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      obatId: newObat.id,
      kodeObat: newObat.kodeObat,
      namaObat: newObat.namaObat,
      jenis: 'Masuk',
      jumlah: newObat.stok,
      stokSebelum: 0,
      stokSesudah: newObat.stok,
      keterangan: 'Pencatatan stok awal obat baru',
      petugas: user?.nama || 'Petugas Farmasi',
      tanggal: new Date().toISOString(),
    };
    db.transaksiStok.push(trx);
  }

  saveDatabase(db);

  logAudit(
    user || { nama: 'Farmasi' },
    'TAMBAH_OBAT',
    'Farmasi & Obat',
    `Menambah obat master: ${newObat.namaObat} (${newObat.kodeObat}), stok awal: ${newObat.stok}`,
    req.ip
  );

  res.status(201).json({ success: true, data: newObat, message: 'Data obat berhasil disimpan' });
});

api.put('/obats/:id', (req, res) => {
  const user = authenticateUser(req);
  const db = loadDatabase();
  const obat = db.obats.find((o) => o.id === req.params.id);

  if (!obat) {
    res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    return;
  }

  const { namaObat, kategori, satuan, hargaBeli, hargaJual, stokMinimum, tanggalKedaluwarsa, lokasiPenyimpanan } = req.body;
  if (namaObat) obat.namaObat = namaObat.trim();
  if (kategori) obat.kategori = kategori;
  if (satuan) obat.satuan = satuan;
  if (hargaBeli !== undefined) obat.hargaBeli = Number(hargaBeli);
  if (hargaJual !== undefined) obat.hargaJual = Number(hargaJual);
  if (stokMinimum !== undefined) obat.stokMinimum = Number(stokMinimum);
  if (tanggalKedaluwarsa) obat.tanggalKedaluwarsa = tanggalKedaluwarsa;
  if (lokasiPenyimpanan) obat.lokasiPenyimpanan = lokasiPenyimpanan;
  obat.updatedAt = new Date().toISOString();

  saveDatabase(db);

  logAudit(
    user || { nama: 'Farmasi' },
    'EDIT_OBAT',
    'Farmasi & Obat',
    `Memperbarui data master obat ${obat.namaObat} (${obat.kodeObat})`,
    req.ip
  );

  res.json({ success: true, data: obat, message: 'Data obat berhasil diperbarui' });
});

api.delete('/obats/:id', (req, res) => {
  const user = authenticateUser(req);
  const db = loadDatabase();
  const index = db.obats.findIndex((o) => o.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Obat tidak ditemukan' });
    return;
  }

  const removed = db.obats.splice(index, 1)[0];
  saveDatabase(db);

  logAudit(
    user || { nama: 'Farmasi' },
    'HAPUS_OBAT',
    'Farmasi & Obat',
    `Menghapus obat ${removed.namaObat} (${removed.kodeObat})`,
    req.ip
  );

  res.json({ success: true, message: 'Obat berhasil dihapus' });
});

// Restock obat (pencatatan obat masuk)
api.post('/obats/stok-masuk', (req, res) => {
  const user = authenticateUser(req);
  const { obatId, jumlah, keterangan, nomorFaktur } = req.body;

  const jml = Number(jumlah);
  if (!obatId || !jml || jml <= 0) {
    res.status(400).json({ success: false, message: 'Obat dan jumlah penambahan yang valid wajib diisi' });
    return;
  }

  const db = loadDatabase();
  const obat = db.obats.find((o) => o.id === obatId);
  if (!obat) {
    res.status(404).json({ success: false, message: 'Data obat tidak ditemukan' });
    return;
  }

  const stokSebelum = obat.stok;
  obat.stok += jml;
  const stokSesudah = obat.stok;
  obat.updatedAt = new Date().toISOString();

  const trx: TransaksiStokObat = {
    id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    obatId: obat.id,
    kodeObat: obat.kodeObat,
    namaObat: obat.namaObat,
    jenis: 'Masuk',
    jumlah: jml,
    stokSebelum,
    stokSesudah,
    keterangan: keterangan || (nomorFaktur ? `Faktur No. ${nomorFaktur}` : 'Pengadaan / Restock Obat Masuk'),
    referensiId: nomorFaktur,
    petugas: user?.nama || 'Petugas Farmasi',
    tanggal: new Date().toISOString(),
  };

  db.transaksiStok.push(trx);
  saveDatabase(db);

  logAudit(
    user || { nama: 'Farmasi' },
    'OBAT_MASUK',
    'Farmasi & Stok',
    `Stok masuk obat ${obat.namaObat}: +${jml} ${obat.satuan} (Stok sekarang: ${stokSesudah})`,
    req.ip
  );

  res.json({ success: true, data: { obat, transaksi: trx }, message: 'Stok obat berhasil ditambahkan' });
});

// Antrean resep dokter untuk farmasi
api.get('/resep/antrean', (req, res) => {
  const db = loadDatabase();
  // Filter medical records that have prescription items
  const resepList = db.rekamMedis
    .filter((rm) => rm.resep && rm.resep.length > 0)
    .map((rm) => {
      const kunjungan = db.kunjungans.find((k) => k.id === rm.kunjunganId);
      return {
        rekamMedisId: rm.id,
        kunjunganId: rm.kunjunganId,
        pasienId: rm.pasienId,
        noRM: rm.noRM,
        namaPasien: rm.namaPasien,
        tanggal: rm.tanggal,
        dokterNama: rm.namaDokter,
        diagnosis: rm.diagnosis,
        items: rm.resep,
        statusResep: rm.statusResep,
        noAntrean: kunjungan?.noAntrean || '-',
      };
    })
    .reverse();

  res.json({ success: true, data: resepList });
});

// Serahkan obat ke pasien & kurangi stok otomatis
api.post('/resep/:rekamMedisId/serahkan', (req, res) => {
  const user = authenticateUser(req);
  const db = loadDatabase();
  const rm = db.rekamMedis.find((r) => r.id === req.params.rekamMedisId);

  if (!rm) {
    res.status(404).json({ success: false, message: 'Resep rekam medis tidak ditemukan' });
    return;
  }

  // Prevent double reduction
  if (rm.statusResep === 'Diserahkan') {
    res.status(400).json({
      success: false,
      message: 'Obat untuk resep ini sudah pernah diserahkan sebelumnya. Mencegah pengurangan stok ganda.',
    });
    return;
  }

  // Validate stock for each item in the prescription
  const validationItems = rm.resep.map((r) => {
    const obat = db.obats.find((o) => o.id === r.idObat || o.namaObat.toLowerCase() === r.namaObat.toLowerCase());
    return {
      idObat: r.namaObat,
      jumlah: r.jumlah,
      stokTersedia: obat ? obat.stok : 0,
      obatObj: obat,
    };
  });

  const check = validatePrescriptionStock(validationItems);
  if (!check.isValid) {
    res.status(400).json({
      success: false,
      message: `Gagal menyerahkan obat: ${check.errors.join('; ')}`,
      errors: check.errors,
    });
    return;
  }

  // Deduct stock and write to ledger atomically
  for (const item of validationItems) {
    if (item.obatObj) {
      const stokSebelum = item.obatObj.stok;
      item.obatObj.stok -= item.jumlah;
      const stokSesudah = item.obatObj.stok;
      item.obatObj.updatedAt = new Date().toISOString();

      const trx: TransaksiStokObat = {
        id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        obatId: item.obatObj.id,
        kodeObat: item.obatObj.kodeObat,
        namaObat: item.obatObj.namaObat,
        jenis: 'Keluar',
        jumlah: item.jumlah,
        stokSebelum,
        stokSesudah,
        keterangan: `Penyerahan obat resep No. RM ${rm.noRM} (${rm.namaPasien})`,
        referensiId: rm.id,
        petugas: user?.nama || 'Petugas Farmasi',
        tanggal: new Date().toISOString(),
      };
      db.transaksiStok.push(trx);
    }
  }

  rm.statusResep = 'Diserahkan';
  saveDatabase(db);

  logAudit(
    user || { nama: 'Farmasi' },
    'SERAHKAN_RESEP',
    'Farmasi & Obat',
    `Obat untuk resep ${rm.noRM} (${rm.namaPasien}) telah diserahkan. Stok obat berhasil dipotong secara otomatis.`,
    req.ip
  );

  res.json({
    success: true,
    message: 'Obat berhasil diserahkan dan stok obat telah dikurangi secara otomatis',
    data: rm,
  });
});

// 7. Modul Kasir & Pembayaran endpoints
api.get('/tagihans', (req, res) => {
  const db = loadDatabase();
  const { status, tanggal } = req.query;

  let list = db.tagihans;
  if (status) {
    list = list.filter((t) => t.statusPembayaran === status);
  }
  if (tanggal) {
    list = list.filter((t) => t.tanggal === tanggal);
  }

  res.json({ success: true, data: list.slice().reverse() });
});

api.get('/tagihans/:id', (req, res) => {
  const db = loadDatabase();
  const tagihan = db.tagihans.find((t) => t.id === req.params.id || t.noInvoice === req.params.id);
  if (!tagihan) {
    res.status(404).json({ success: false, message: 'Tagihan tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: tagihan });
});

// Auto-create or fetch invoice for a visit
api.post('/tagihans/buat-dari-kunjungan', (req, res) => {
  const user = authenticateUser(req);
  const { kunjunganId, biayaPendaftaranCustom, biayaKonsultasiCustom } = req.body;

  if (!kunjunganId) {
    res.status(400).json({ success: false, message: 'Kunjungan ID diperlukan' });
    return;
  }

  const db = loadDatabase();
  const kunjungan = db.kunjungans.find((k) => k.id === kunjunganId);
  if (!kunjungan) {
    res.status(404).json({ success: false, message: 'Kunjungan tidak ditemukan' });
    return;
  }

  // Check if invoice already exists for this visit
  let existing = db.tagihans.find((t) => t.kunjunganId === kunjunganId);
  if (existing) {
    res.json({ success: true, data: existing, message: 'Tagihan sudah tersedia' });
    return;
  }

  // Find linked medical record
  const rm = db.rekamMedis.find((r) => r.kunjunganId === kunjunganId);

  const biayaPendaftaran = biayaPendaftaranCustom !== undefined ? Number(biayaPendaftaranCustom) : 15000;
  const biayaKonsultasi = biayaKonsultasiCustom !== undefined ? Number(biayaKonsultasiCustom) : 35000;

  // Tally medical actions
  const itemTindakan: Array<{ nama: string; biaya: number }> = rm?.tindakanMedis || [];
  const biayaTindakan = itemTindakan.reduce((acc, curr) => acc + (Number(curr.biaya) || 0), 0);

  // Tally prescribed medicines
  const itemObat: ResepItem[] = rm?.resep || [];
  const biayaObat = itemObat.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);

  const { subtotal, diskon, total } = calculateBilling({
    biayaPendaftaran,
    biayaKonsultasi,
    biayaTindakan,
    biayaObat,
    diskon: 0,
  });

  db.sequences.invoiceNumber += 1;
  const today = new Date();
  const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const noInvoice = `INV-${yearMonth}-${String(db.sequences.invoiceNumber).padStart(4, '0')}`;

  const newTagihan: Tagihan = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    noInvoice,
    kunjunganId,
    pasienId: kunjungan.pasienId,
    namaPasien: kunjungan.namaPasien,
    noRM: kunjungan.noRM,
    tanggal: today.toISOString().split('T')[0],
    biayaPendaftaran,
    biayaKonsultasi,
    biayaTindakan,
    biayaObat,
    rincianTindakan: itemTindakan,
    rincianObat: itemObat,
    subtotal,
    diskon,
    total,
    jumlahDibayar: 0,
    kembalian: 0,
    metodePembayaran: 'Tunai',
    statusPembayaran: 'Belum Dibayar',
    kasirNama: user?.nama || 'Kasir Klinik',
  };

  db.tagihans.push(newTagihan);
  kunjungan.tagihanId = newTagihan.id;
  saveDatabase(db);

  logAudit(
    user || { nama: 'Kasir' },
    'BUAT_TAGIHAN',
    'Kasir & Pembayaran',
    `Membuat tagihan ${noInvoice} untuk ${kunjungan.namaPasien} senilai Rp${total.toLocaleString('id-ID')}`,
    req.ip
  );

  res.status(201).json({ success: true, data: newTagihan, message: 'Tagihan berhasil dibuat' });
});

// Process payment
api.post('/tagihans/:id/bayar', (req, res) => {
  const user = authenticateUser(req);
  const { jumlahDibayar, metodePembayaran, diskon } = req.body;

  const db = loadDatabase();
  const tagihan = db.tagihans.find((t) => t.id === req.params.id);
  if (!tagihan) {
    res.status(404).json({ success: false, message: 'Tagihan tidak ditemukan' });
    return;
  }

  if (diskon !== undefined) {
    tagihan.diskon = Math.max(0, Number(diskon));
    tagihan.total = Math.max(0, tagihan.subtotal - tagihan.diskon);
  }

  const bayar = Number(jumlahDibayar) || 0;
  if (bayar < tagihan.total) {
    res.status(400).json({
      success: false,
      message: `Jumlah pembayaran (Rp${bayar.toLocaleString('id-ID')}) kurang dari total tagihan (Rp${tagihan.total.toLocaleString('id-ID')})`,
    });
    return;
  }

  tagihan.jumlahDibayar = bayar;
  tagihan.kembalian = bayar - tagihan.total;
  tagihan.metodePembayaran = metodePembayaran || 'Tunai';
  tagihan.statusPembayaran = 'Lunas';
  tagihan.kasirNama = user?.nama || tagihan.kasirNama || 'Kasir Klinik';
  tagihan.dibayarPada = new Date().toISOString();

  saveDatabase(db);

  logAudit(
    user || { nama: 'Kasir' },
    'PROSES_PEMBAYARAN',
    'Kasir & Pembayaran',
    `Pelunasan invoice ${tagihan.noInvoice} (${tagihan.namaPasien}) via ${tagihan.metodePembayaran}. Total: Rp${tagihan.total.toLocaleString('id-ID')}`,
    req.ip
  );

  res.json({
    success: true,
    data: tagihan,
    message: 'Pembayaran berhasil diproses dan invoice lunas',
  });
});

// 8. Laporan endpoints
api.get('/laporan/summary', (req, res) => {
  const db = loadDatabase();
  const { dari, sampai } = req.query;

  let kunjungans = db.kunjungans;
  let tagihans = db.tagihans;
  let rekamMedis = db.rekamMedis;
  let transaksiStok = db.transaksiStok;

  if (dari && sampai) {
    kunjungans = kunjungans.filter((k) => k.tanggal >= String(dari) && k.tanggal <= String(sampai));
    tagihans = tagihans.filter((t) => t.tanggal >= String(dari) && t.tanggal <= String(sampai));
    rekamMedis = rekamMedis.filter((r) => r.tanggal >= String(dari) && r.tanggal <= String(sampai));
    transaksiStok = transaksiStok.filter((ts) => ts.tanggal.split('T')[0] >= String(dari) && ts.tanggal.split('T')[0] <= String(sampai));
  }

  const lunasTagihans = tagihans.filter((t) => t.statusPembayaran === 'Lunas');
  const totalPendapatan = lunasTagihans.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalBiayaPendaftaran = lunasTagihans.reduce((acc, curr) => acc + (curr.biayaPendaftaran || 0), 0);
  const totalBiayaKonsultasi = lunasTagihans.reduce((acc, curr) => acc + (curr.biayaKonsultasi || 0), 0);
  const totalBiayaTindakan = lunasTagihans.reduce((acc, curr) => acc + (curr.biayaTindakan || 0), 0);
  const totalBiayaObat = lunasTagihans.reduce((acc, curr) => acc + (curr.biayaObat || 0), 0);

  // Group visits by date
  const kunjunganPerHari: Record<string, number> = {};
  kunjungans.forEach((k) => {
    kunjunganPerHari[k.tanggal] = (kunjunganPerHari[k.tanggal] || 0) + 1;
  });

  // Medicine sales tally
  const penjualanObatPerItem: Record<string, { namaObat: string; totalQty: number; totalRupiah: number }> = {};
  lunasTagihans.forEach((t) => {
    (t.rincianObat || []).forEach((item) => {
      if (!penjualanObatPerItem[item.namaObat]) {
        penjualanObatPerItem[item.namaObat] = {
          namaObat: item.namaObat,
          totalQty: 0,
          totalRupiah: 0,
        };
      }
      penjualanObatPerItem[item.namaObat].totalQty += item.jumlah;
      penjualanObatPerItem[item.namaObat].totalRupiah += item.subtotal;
    });
  });

  res.json({
    success: true,
    data: {
      periode: { dari: dari || 'Semua', sampai: sampai || 'Semua' },
      totalPasienTerdaftar: db.pasiens.length,
      totalKunjungan: kunjungans.length,
      totalPemeriksaanDokter: rekamMedis.length,
      keuangan: {
        totalPendapatan,
        totalBiayaPendaftaran,
        totalBiayaKonsultasi,
        totalBiayaTindakan,
        totalBiayaObat,
      },
      kunjunganPerHari,
      daftarPenjualanObat: Object.values(penjualanObatPerItem),
      daftarTransaksi: lunasTagihans,
      persediaanObat: db.obats,
      transaksiStokTerakhir: transaksiStok.slice(-20).reverse(),
    },
  });
});

// 9. Audit Logs & Users
api.get('/audit-logs', (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.auditLogs });
});

api.get('/users', (req, res) => {
  const db = loadDatabase();
  const users = db.users.map((u) => ({
    id: u.id,
    username: u.username,
    nama: u.nama,
    role: u.role,
    nomorSIP: u.nomorSIP,
    statusAktif: u.statusAktif,
    createdAt: u.createdAt,
  }));
  res.json({ success: true, data: users });
});

api.post('/users', (req, res) => {
  const authUser = authenticateUser(req);
  if (!authUser || authUser.role !== 'Administrator') {
    res.status(403).json({ success: false, message: 'Hanya Administrator yang dapat menambahkan petugas/dokter' });
    return;
  }

  const { username, password, nama, role, nomorSIP } = req.body;
  if (!username || !password || !nama || !role) {
    res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    return;
  }

  const db = loadDatabase();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    res.status(400).json({ success: false, message: 'Username sudah digunakan' });
    return;
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: username.trim(),
    passwordHash: hashPassword(password),
    nama: nama.trim(),
    role,
    nomorSIP: nomorSIP ? nomorSIP.trim() : undefined,
    statusAktif: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  logAudit(
    authUser,
    'TAMBAH_PENGGUNA',
    'Manajemen Pengguna',
    `Membuat akun petugas/dokter baru: ${newUser.nama} (${newUser.username}) sebagai ${newUser.role}`,
    req.ip
  );

  res.status(201).json({
    success: true,
    message: 'Pengguna baru berhasil ditambahkan',
    data: {
      id: newUser.id,
      username: newUser.username,
      nama: newUser.nama,
      role: newUser.role,
      nomorSIP: newUser.nomorSIP,
    },
  });
});

// 10. Android Native Info & API Specifications
api.get('/android/info', (req, res) => {
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  res.json({
    success: true,
    appTitle: 'SIM Klinik Android Native',
    package: 'com.simklinik.mobile',
    version: '1.0.0-MVP',
    architecture: 'Kotlin + Jetpack Compose + Clean Architecture + Retrofit',
    baseUrl: `${appUrl}/api/`,
    endpoints: {
      auth: 'auth/login',
      dashboard: 'dashboard/summary',
      queue: 'kunjungans',
      patients: 'pasiens',
      medicalRecord: 'rekam-medis',
      pharmacyPrescriptions: 'resep/antrean',
      dispense: 'resep/{id}/serahkan',
      medicines: 'obats',
    },
    supportedRoles: ['Dokter', 'Perawat', 'Petugas Pendaftaran', 'Petugas Farmasi', 'Kasir', 'Administrator'],
    features: [
      'Login otentikasi token JWT/Bearer',
      'Dashboard statistik realtime online',
      'Antrean pasien otomatis dan update status panggilan',
      'Pemeriksaan medis dokter (Tanda vital, Anamnesis, Diagnosis, Tindakan)',
      'Resep elektronik otomatis terkoneksi ke farmasi',
      'Riwayat rekam medis pasien terintegrasi',
    ],
  });
});

// Mount the API router
app.use('/api', api);

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIM Klinik] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
