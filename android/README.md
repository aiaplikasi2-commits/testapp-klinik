# SIM Klinik - Android Native Application (Kotlin + Jetpack Compose)

Proyek ini adalah implementasi **Native Android murni** untuk **SIM Klinik** menggunakan bahasa **Kotlin**, **Jetpack Compose (Material 3)**, dan **Retrofit** untuk berkomunikasi langsung dengan REST API backend online terpusat.

## 1. Fitur Aplikasi Android
- **Autentikasi Aman**: Login token JWT/Bearer berbasis hak akses (Dokter, Perawat, Petugas).
- **Dashboard Realtime**: Membaca ringkasan statistik klinik dari database pusat online.
- **Antrean Pasien Live**: Menampilkan antrean hari ini, status antrean (Menunggu, Dipanggil, Diperiksa, Selesai).
- **Pemeriksaan Dokter (Rekam Medis)**:
  - Anamnesis / Keluhan Utama
  - Tanda-tanda vital (Tekanan darah, Suhu tubuh, Berat badan, Tinggi badan)
  - Diagnosis klinis
  - Resep obat elektronik langsung terhubung ke farmasi
- **Data Pasien**: Pencarian cepat berdasarkan Nama dan Nomor Rekam Medis (No. RM).

## 2. Struktur Proyek
```
android/
├── build.gradle.kts
├── settings.gradle.kts
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        └── java/com/simklinik/mobile/
            ├── MainActivity.kt
            ├── data/
            │   ├── model/Models.kt
            │   └── api/ClinicApiService.kt
            └── ui/
                └── screens/
```

## 3. Cara Build APK Android

### Prasyarat
- Android Studio Ladybug (2024.2+) atau lebih baru
- JDK 17 atau 21
- Android SDK 35 (Android 15)

### Perintah Build Debug APK via Terminal:
```bash
cd android
./gradlew assembleDebug
```
File APK akan dibuat pada:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Konfigurasi Base URL REST API:
Buka `android/app/build.gradle.kts` dan sesuaikan `BASE_URL` ke domain backend server SIM Klinik:
```kotlin
buildConfigField("String", "BASE_URL", "\"https://your-domain.run.app/api/\"")
```
