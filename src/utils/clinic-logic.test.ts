import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMedicalRecordNumber,
  generateQueueNumber,
  calculateBilling,
  validatePrescriptionStock,
  isStockLow,
  hasPermission,
} from './clinic-logic.ts';
import {
  numberToIndonesianWords,
  formatIndonesianLetter,
  formatDigitsToIndonesianSpoken,
  formatQueueNumberForSpokenIndonesian,
  buildQueueAnnouncementText,
} from './audio-call.ts';

test('generateMedicalRecordNumber creates formatted RM code', () => {
  const fixedDate = new Date(2026, 10, 8); // November 2026
  const rm = generateMedicalRecordNumber(1, fixedDate);
  assert.equal(rm, 'RM-202611-0001');

  const rm2 = generateMedicalRecordNumber(42, fixedDate);
  assert.equal(rm2, 'RM-202611-0042');
});

test('generateQueueNumber formats queue codes correctly', () => {
  assert.equal(generateQueueNumber(1), 'A-001');
  assert.equal(generateQueueNumber(15), 'A-015');
  assert.equal(generateQueueNumber(102, 'B'), 'B-102');
});

test('calculateBilling calculates totals and handles discounts', () => {
  const result = calculateBilling({
    biayaPendaftaran: 15000,
    biayaKonsultasi: 50000,
    biayaTindakan: 25000,
    biayaObat: 30000,
    diskon: 10000,
  });
  assert.equal(result.subtotal, 120000);
  assert.equal(result.diskon, 10000);
  assert.equal(result.total, 110000);
});

test('validatePrescriptionStock catches insufficient or invalid quantities', () => {
  const valid = validatePrescriptionStock([
    { idObat: 'OBT-1', jumlah: 5, stokTersedia: 20 },
    { idObat: 'OBT-2', jumlah: 2, stokTersedia: 2 },
  ]);
  assert.equal(valid.isValid, true);
  assert.equal(valid.errors.length, 0);

  const invalid = validatePrescriptionStock([
    { idObat: 'OBT-1', jumlah: 25, stokTersedia: 10 },
    { idObat: 'OBT-2', jumlah: 0, stokTersedia: 5 },
  ]);
  assert.equal(invalid.isValid, false);
  assert.equal(invalid.errors.length, 2);
});

test('isStockLow triggers when stock is below or equal to minimum', () => {
  assert.equal(isStockLow(5, 10), true);
  assert.equal(isStockLow(10, 10), true);
  assert.equal(isStockLow(11, 10), false);
});

test('hasPermission enforces role boundaries correctly', () => {
  assert.equal(hasPermission('Administrator', 'pendaftaran'), true);
  assert.equal(hasPermission('Dokter', 'rekam_medis'), true);
  assert.equal(hasPermission('Dokter', 'kasir'), false);
  assert.equal(hasPermission('Petugas Farmasi', 'farmasi'), true);
  assert.equal(hasPermission('Kasir', 'rekam_medis'), false);
  assert.equal(hasPermission('Pemilik Klinik', 'laporan'), true);
});

test('numberToIndonesianWords converts digits to natural Indonesian numbers', () => {
  assert.equal(numberToIndonesianWords(0), 'nol');
  assert.equal(numberToIndonesianWords(1), 'satu');
  assert.equal(numberToIndonesianWords(5), 'lima');
  assert.equal(numberToIndonesianWords(10), 'sepuluh');
  assert.equal(numberToIndonesianWords(11), 'sebelas');
  assert.equal(numberToIndonesianWords(12), 'dua belas');
  assert.equal(numberToIndonesianWords(19), 'sembilan belas');
  assert.equal(numberToIndonesianWords(20), 'dua puluh');
  assert.equal(numberToIndonesianWords(21), 'dua puluh satu');
  assert.equal(numberToIndonesianWords(99), 'sembilan puluh sembilan');
  assert.equal(numberToIndonesianWords(100), 'seratus');
  assert.equal(numberToIndonesianWords(105), 'seratus lima');
  assert.equal(numberToIndonesianWords(115), 'seratus lima belas');
  assert.equal(numberToIndonesianWords(243), 'dua ratus empat puluh tiga');
});

test('formatIndonesianLetter maps queue letters to clear Indonesian phonetics', () => {
  assert.equal(formatIndonesianLetter('A'), 'A');
  assert.equal(formatIndonesianLetter('B'), 'B');
  assert.equal(formatIndonesianLetter('C'), 'C');
  assert.equal(formatIndonesianLetter('D'), 'D');
  assert.equal(formatIndonesianLetter('g'), 'G');
});

test('formatDigitsToIndonesianSpoken spells individual digits cleanly', () => {
  assert.equal(formatDigitsToIndonesianSpoken('001'), 'nol nol satu');
  assert.equal(formatDigitsToIndonesianSpoken('015'), 'nol satu lima');
  assert.equal(formatDigitsToIndonesianSpoken('102'), 'satu nol dua');
});

test('formatQueueNumberForSpokenIndonesian generates digit and word modes', () => {
  assert.equal(formatQueueNumberForSpokenIndonesian('A-001', 'digits'), 'A nol nol satu');
  assert.equal(formatQueueNumberForSpokenIndonesian('B-015', 'digits'), 'B nol satu lima');
  assert.equal(formatQueueNumberForSpokenIndonesian('A-001', 'words'), 'A, satu');
  assert.equal(formatQueueNumberForSpokenIndonesian('B-015', 'words'), 'B, lima belas');
});

test('buildQueueAnnouncementText formats target phrases correctly', () => {
  // 1. Standard call
  const t1 = buildQueueAnnouncementText({ noAntrean: 'A-001' });
  assert.equal(t1, 'Nomor antrean... A nol nol satu... silakan menuju ke... ruang pemeriksaan.');

  // 2. Standard call with doctor and room
  const t2 = buildQueueAnnouncementText({
    noAntrean: 'A-001',
    dokter: 'dr. Siti Rahma',
    ruang: 'ruang 1',
  });
  assert.equal(t2, 'Nomor antrean... A nol nol satu... silakan menuju ke... ruang pemeriksaan Dokter Siti Rahma, di Ruang satu.');

  // 3. Recall (pasien belum datang / panggil ulang)
  const t3 = buildQueueAnnouncementText({
    noAntrean: 'A-001',
    isRecall: true,
  });
  assert.equal(t3, 'Nomor antrean... A nol nol satu... kami panggil kembali... silakan menuju ke... ruang pemeriksaan.');

  // 4. Recall with doctor & room
  const t4 = buildQueueAnnouncementText({
    noAntrean: 'A-001',
    dokter: 'dr. Budi Santoso',
    ruang: 'ruang Poli Umum',
    isRecall: true,
  });
  assert.equal(t4, 'Nomor antrean... A nol nol satu... kami panggil kembali... silakan menuju ke... Dokter Budi Santoso, di Ruang Poli Umum.');

  // 5. Formal template
  const t5 = buildQueueAnnouncementText(
    { noAntrean: 'A-001' },
    { callTemplate: 'formal' }
  );
  assert.equal(t5, 'Perhatian... nomor antrean... A nol nol satu... dipersilakan menuju ke... ruang pemeriksaan... Terima kasih.');
});

