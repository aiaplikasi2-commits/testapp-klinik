package com.simklinik.mobile.data.model

import com.google.gson.annotations.SerializedName

data class User(
    val id: String,
    val username: String,
    val nama: String,
    val role: String,
    val nomorSIP: String? = null
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val message: String? = null,
    val token: String? = null,
    val user: User? = null
)

data class DashboardSummary(
    val totalPasien: Int,
    val kunjunganHariIniCount: Int,
    val pasienBaruHariIni: Int,
    val antreanMenunggu: Int,
    val pemeriksaanSelesai: Int,
    val pendapatanHariIni: Double,
    val obatStokMenipisCount: Int,
    val obatStokMenipisList: List<ObatSimple>,
    val antreanHariIni: List<VisitQueue>
)

data class ObatSimple(
    val id: String,
    val kodeObat: String,
    val namaObat: String,
    val stok: Int,
    val stokMinimum: Int,
    val satuan: String
)

data class Patient(
    val id: String,
    val noRM: String,
    val nama: String,
    val jenisKelamin: String,
    val tanggalLahir: String,
    val alamat: String,
    val noTelepon: String,
    val nik: String,
    val golDarah: String,
    val alergi: String
)

data class VisitQueue(
    val id: String,
    val pasienId: String,
    val noRM: String,
    val namaPasien: String,
    val tanggal: String,
    val waktuDaftar: String,
    val noAntrean: String,
    val jenisKunjungan: String,
    val poli: String,
    val dokterId: String,
    val namaDokter: String,
    val status: String,
    val keluhanAwal: String,
    val rekamMedisId: String? = null,
    val tagihanId: String? = null
)

data class VitalSigns(
    val tekananDarah: String,
    val suhuTubuh: Double,
    val beratBadan: Double,
    val tinggiBadan: Double,
    val nadi: Int? = 80,
    val respirasi: Int? = 20
)

data class MedicalActionItem(
    val nama: String,
    val biaya: Double
)

data class PrescriptionItem(
    val idObat: String,
    val namaObat: String,
    val jumlah: Int,
    val aturanPakai: String,
    val harga: Double,
    val subtotal: Double
)

data class SaveMedicalRecordRequest(
    val kunjunganId: String,
    val keluhanUtama: String,
    val riwayatPenyakit: String,
    val tandaVital: VitalSigns,
    val hasilPemeriksaanFisik: String,
    val diagnosis: String,
    val tindakanMedis: List<MedicalActionItem>,
    val resep: List<PrescriptionItem>,
    val catatanDokter: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null
)
