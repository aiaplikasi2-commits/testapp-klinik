/**
 * Core business logic and calculations for SIM Klinik
 */

export interface BillingInput {
  biayaPendaftaran: number;
  biayaKonsultasi: number;
  biayaTindakan: number;
  biayaObat: number;
  diskon?: number;
}

export interface StockDeductionItem {
  idObat: string;
  jumlah: number;
  stokTersedia: number;
}

/**
 * Generates unique formatted Medical Record Number (No. RM)
 * Example: RM-202611-0001
 */
export function generateMedicalRecordNumber(sequenceNumber: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return `RM-${year}${month}-${seq}`;
}

/**
 * Generates Queue Number
 * Example: A-001, A-002
 */
export function generateQueueNumber(sequenceNumber: number, prefix: string = 'A'): string {
  const seq = String(sequenceNumber).padStart(3, '0');
  return `${prefix}-${seq}`;
}

/**
 * Calculate total billing
 */
export function calculateBilling(input: BillingInput): {
  subtotal: number;
  diskon: number;
  total: number;
} {
  const pendaftaran = Math.max(0, Number(input.biayaPendaftaran) || 0);
  const konsultasi = Math.max(0, Number(input.biayaKonsultasi) || 0);
  const tindakan = Math.max(0, Number(input.biayaTindakan) || 0);
  const obat = Math.max(0, Number(input.biayaObat) || 0);
  const diskon = Math.max(0, Number(input.diskon) || 0);

  const subtotal = pendaftaran + konsultasi + tindakan + obat;
  const total = Math.max(0, subtotal - diskon);

  return { subtotal, diskon, total };
}

/**
 * Validates stock availability for prescription dispensing
 */
export function validatePrescriptionStock(items: StockDeductionItem[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const item of items) {
    if (item.jumlah <= 0) {
      errors.push(`Jumlah obat ${item.idObat} harus lebih dari 0`);
    }
    if (item.jumlah > item.stokTersedia) {
      errors.push(
        `Stok obat ${item.idObat} tidak mencukupi (diminta: ${item.jumlah}, tersedia: ${item.stokTersedia})`
      );
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if medicine stock is low
 */
export function isStockLow(stok: number, stokMinimum: number): boolean {
  return stok <= stokMinimum;
}

/**
 * Role permissions check
 */
export type Role =
  | 'Administrator'
  | 'Pemilik Klinik'
  | 'Dokter'
  | 'Perawat'
  | 'Petugas Pendaftaran'
  | 'Petugas Farmasi'
  | 'Kasir';

export const PERMISSIONS: Record<Role, string[]> = {
  Administrator: ['dashboard', 'pendaftaran', 'rekam_medis', 'farmasi', 'kasir', 'laporan', 'pengguna', 'antrean_digital', 'antrean_tv', 'android_native'],
  'Pemilik Klinik': ['dashboard', 'laporan', 'pengguna', 'antrean_tv', 'android_native'],
  Dokter: ['dashboard', 'rekam_medis', 'farmasi_lihat', 'antrean_digital', 'antrean_tv', 'android_native'],
  Perawat: ['dashboard', 'pendaftaran', 'rekam_medis_tanda_vital', 'antrean_digital', 'antrean_tv', 'android_native'],
  'Petugas Pendaftaran': ['dashboard', 'pendaftaran', 'antrean_digital', 'antrean_tv'],
  'Petugas Farmasi': ['dashboard', 'farmasi', 'antrean_tv'],
  Kasir: ['dashboard', 'kasir', 'laporan_kasir', 'antrean_tv'],
};

export function hasPermission(role: Role, feature: string): boolean {
  const allowed = PERMISSIONS[role] || [];
  return allowed.includes(feature) || allowed.includes('all');
}
