import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  Code,
  Download,
  Server,
  Play,
  RotateCcw,
  CheckCircle2,
  Stethoscope,
  Users,
  Clock,
  Heart,
  Pill,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { User, Kunjungan, DashboardSummaryData } from '../types';
import { apiFetch } from '../api/client';
import { announceQueueCall } from '../utils/audio-call';

interface AndroidSimulatorViewProps {
  currentUser: User;
}

export const AndroidSimulatorView: React.FC<AndroidSimulatorViewProps> = ({ currentUser }) => {
  const [deviceType, setDeviceType] = useState<'phone' | 'tablet'>('phone');
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'guide'>('simulator');

  // Simulated Android Native App State
  const [simScreen, setSimScreen] = useState<'dashboard' | 'antrean' | 'periksa' | 'resep'>('dashboard');
  const [simSummary, setSimSummary] = useState<DashboardSummaryData | null>(null);
  const [simAntrean, setSimAntrean] = useState<Kunjungan[]>([]);
  const [selectedExamItem, setSelectedExamItem] = useState<Kunjungan | null>(null);

  // Examination inputs in Android Simulator
  const [simKeluhan, setSimKeluhan] = useState('');
  const [simTD, setSimTD] = useState('120/80');
  const [simSuhu, setSimSuhu] = useState('36.6');
  const [simBB, setSimBB] = useState('62');
  const [simTB, setSimTB] = useState('168');
  const [simDiagnosis, setSimDiagnosis] = useState('');
  const [simResepText, setSimResepText] = useState('Paracetamol 500mg (3x1)');
  const [simFeedback, setSimFeedback] = useState('');

  const fetchLiveSimData = async () => {
    const resSummary = await apiFetch<DashboardSummaryData>('/dashboard/summary');
    if (resSummary.success && resSummary.data) {
      setSimSummary(resSummary.data);
    }
    const resAntrean = await apiFetch<Kunjungan[]>('/kunjungans');
    if (resAntrean.success && resAntrean.data) {
      setSimAntrean(resAntrean.data);
    }
  };

  useEffect(() => {
    fetchLiveSimData();
  }, []);

  const handleSimulateExamine = (item: Kunjungan) => {
    setSelectedExamItem(item);
    setSimKeluhan(item.keluhanAwal || 'Demam dan sakit kepala');
    setSimDiagnosis('ISPA Akut (J06.9)');
    setSimScreen('periksa');
  };

  const handleSimulateSaveExam = async () => {
    if (!selectedExamItem) return;
    setSimFeedback('Menyimpan ke REST API pusat...');

    const res = await apiFetch('/rekam-medis', {
      method: 'POST',
      body: JSON.stringify({
        kunjunganId: selectedExamItem.id,
        keluhanUtama: simKeluhan,
        diagnosis: simDiagnosis,
        tandaVital: {
          tekananDarah: simTD,
          suhuTubuh: Number(simSuhu) || 36.5,
          beratBadan: Number(simBB) || 60,
          tinggiBadan: Number(simTB) || 165,
        },
        tindakanMedis: [{ nama: 'Pemeriksaan Dokter Native Android', biaya: 0 }],
        resep: [],
        catatanDokter: 'Pemeriksaan melalui aplikasi Android Native',
      }),
    });

    if (res.success) {
      setSimFeedback('Rekam medis berhasil disahkan via Android Native!');
      setTimeout(() => {
        setSimFeedback('');
        setSimScreen('antrean');
        fetchLiveSimData();
      }, 1500);
    } else {
      setSimFeedback(res.message || 'Gagal menyimpan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Android Native (Kotlin & Jetpack Compose)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            Aplikasi Android Native & Simulator Interaktif
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Aplikasi Android untuk dokter dan petugas klinik terhubung langsung dengan sistem klinik.
          </p>
        </div>

        {/* View Switcher: Simulator vs Code vs Guide */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'simulator'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Companion Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'code'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Source Code Kotlin & Compose
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'guide'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Panduan Build APK
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          {/* Device Controls */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-700">Tampilan Perangkat Android:</span>
              <button
                onClick={() => setDeviceType('phone')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  deviceType === 'phone'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Smartphone Android (Portrait)</span>
              </button>
              <button
                onClick={() => setDeviceType('tablet')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                  deviceType === 'tablet'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Tablet className="w-4 h-4" />
                <span>Tablet Android (Landscape)</span>
              </button>
            </div>

            <button
              onClick={fetchLiveSimData}
              className="text-xs text-teal-600 font-semibold hover:underline flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sinkronkan API</span>
            </button>
          </div>

          {/* Device Frame */}
          <div className="flex justify-center py-4 bg-slate-200/60 rounded-3xl p-4 sm:p-8">
            <div
              className={`bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-700 transition-all ${
                deviceType === 'phone'
                  ? 'w-[360px] sm:w-[390px] min-h-[700px]'
                  : 'w-full max-w-3xl min-h-[580px]'
              }`}
            >
              {/* Speaker / Camera Notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
              </div>

              {/* Inner Screen Surface */}
              <div className="bg-slate-50 rounded-[28px] overflow-hidden flex flex-col h-[640px] border border-slate-800 relative">
                {/* Android Status Bar */}
                <div className="bg-teal-800 text-teal-100 text-[11px] px-4 py-1 flex justify-between items-center font-mono">
                  <span>09:41</span>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span>4G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Jetpack Compose TopAppBar */}
                <div className="bg-teal-700 text-white p-3.5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">SIM Klinik Mobile</h3>
                    <div className="text-[10px] text-teal-200">
                      {currentUser.nama} • {currentUser.role}
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>

                {/* Screen Body */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                  {simFeedback && (
                    <div className="p-2.5 rounded-xl bg-teal-100 text-teal-900 text-xs font-semibold flex items-center space-x-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                      <span>{simFeedback}</span>
                    </div>
                  )}

                  {/* 1. Dashboard Screen */}
                  {simScreen === 'dashboard' && (
                    <div className="space-y-3 text-xs">
                      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-2xl shadow-sm">
                        <div className="text-[11px] opacity-80">Database Pusat Terhubung</div>
                        <div className="text-base font-bold mt-0.5">Poli Umum & Dokter</div>
                        <div className="text-[11px] opacity-90 mt-1">
                          Semua aksi dokter di sini tersinkronisasi langsung ke Web Kasir & Farmasi.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Total Pasien</div>
                          <div className="text-xl font-extrabold text-slate-800 mt-0.5">
                            {simSummary?.totalPasien || 0}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Kunjungan Hari Ini</div>
                          <div className="text-xl font-extrabold text-blue-600 mt-0.5">
                            {simSummary?.kunjunganHariIniCount || 0}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Antrean Menunggu</div>
                          <div className="text-xl font-extrabold text-amber-600 mt-0.5">
                            {simSummary?.antreanMenunggu || 0}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="text-slate-400 text-[10px] uppercase font-bold">Selesai Periksa</div>
                          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                            {simSummary?.pemeriksaanSelesai || 0}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSimScreen('antrean')}
                        className="w-full py-2.5 bg-teal-600 text-white font-bold rounded-xl text-xs hover:bg-teal-700 transition flex items-center justify-center space-x-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Buka Antrean Pasien Dokter</span>
                      </button>
                    </div>
                  )}

                  {/* 2. Antrean Screen */}
                  {simScreen === 'antrean' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center pb-1">
                        <span className="font-bold text-slate-800">Antrean Pasien Live</span>
                        <span className="text-[10px] text-teal-700 font-medium">
                          {simAntrean.length} pasien terdaftar
                        </span>
                      </div>

                      {simAntrean.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                          Belum ada antrean pasien untuk hari ini.
                        </div>
                      ) : (
                        simAntrean.map((k) => (
                          <div
                            key={k.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1.5"
                          >
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 rounded bg-teal-600 text-white font-bold text-xs">
                                {k.noAntrean}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                {k.status}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 text-sm">{k.namaPasien}</div>
                            <div className="text-[11px] text-slate-500">
                              No. RM: {k.noRM} • Keluhan: {k.keluhanAwal || '-'}
                            </div>

                            {k.status !== 'Selesai' && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    announceQueueCall({
                                      noAntrean: k.noAntrean,
                                      dokter: currentUser.nama,
                                      ruang: k.ruangPelayanan || 'Ruang Poli Umum',
                                      poli: k.poli,
                                      isRecall: k.status === 'Dipanggil',
                                    });
                                  }}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition flex items-center gap-1 shrink-0 border border-blue-200"
                                  title="Panggil pasien dengan bel Ting Tang Tung dan suara TTS"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Panggil</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSimulateExamine(k)}
                                  className="flex-1 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs transition border border-teal-200 text-center"
                                >
                                  Mulai Periksa
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* 3. Examination Screen */}
                  {simScreen === 'periksa' && selectedExamItem && (
                    <div className="space-y-2.5 text-xs">
                      <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                        <div className="font-bold text-teal-900 text-sm">
                          {selectedExamItem.namaPasien} ({selectedExamItem.noAntrean})
                        </div>
                        <div className="text-[11px] text-teal-700">No. RM: {selectedExamItem.noRM}</div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                          Keluhan Utama (Anamnesis)
                        </label>
                        <input
                          type="text"
                          value={simKeluhan}
                          onChange={(e) => setSimKeluhan(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Tekanan Darah (TD)
                          </label>
                          <input
                            type="text"
                            value={simTD}
                            onChange={(e) => setSimTD(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            Suhu (°C)
                          </label>
                          <input
                            type="text"
                            value={simSuhu}
                            onChange={(e) => setSimSuhu(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                          Diagnosis Medis
                        </label>
                        <input
                          type="text"
                          value={simDiagnosis}
                          onChange={(e) => setSimDiagnosis(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <button
                        onClick={handleSimulateSaveExam}
                        className="w-full py-2 bg-teal-600 text-white font-bold rounded-xl text-xs hover:bg-teal-700 transition"
                      >
                        Sahkan Rekam Medis (Android Native)
                      </button>
                    </div>
                  )}
                </div>

                {/* Jetpack Compose BottomNavigationBar */}
                <div className="bg-white border-t border-slate-200 px-3 py-2 flex justify-around text-[10px] font-bold text-slate-500">
                  <button
                    onClick={() => setSimScreen('dashboard')}
                    className={`flex flex-col items-center space-y-0.5 ${
                      simScreen === 'dashboard' ? 'text-teal-700 font-extrabold' : ''
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setSimScreen('antrean')}
                    className={`flex flex-col items-center space-y-0.5 ${
                      simScreen === 'antrean' || simScreen === 'periksa'
                        ? 'text-teal-700 font-extrabold'
                        : ''
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Antrean</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NATIVE SOURCE CODE (KOTLIN & COMPOSE) */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 font-mono text-xs overflow-x-auto border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <span className="text-teal-400 font-bold">Android Native Project Structure</span>
              <p className="text-slate-400 text-[11px] font-sans mt-0.5">
                Semua berkas Kotlin murni, Jetpack Compose UI, dan Retrofit API service berada di direktori /android
              </p>
            </div>
            <span className="px-2.5 py-1 bg-teal-900/60 text-teal-300 rounded border border-teal-700 text-[11px]">
              Kotlin 2.0 • Jetpack Compose • Retrofit
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-slate-400 font-bold">// 1. Android Manifest Permissions</div>
            <pre className="text-teal-300 bg-slate-950 p-3 rounded-lg overflow-x-auto">
{`<!-- /android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`}
            </pre>

            <div className="text-slate-400 font-bold mt-4">// 2. Retrofit REST API Interface (Koneksi ke Centralized Backend)</div>
            <pre className="text-emerald-300 bg-slate-950 p-3 rounded-lg overflow-x-auto">
{`// /android/app/src/main/java/com/simklinik/mobile/data/api/ClinicApiService.kt
interface ClinicApiService {
    @POST("auth/login")
    suspend fun login(@Body req: LoginRequest): Response<LoginResponse>

    @GET("dashboard/summary")
    suspend fun getDashboardSummary(@Header("Authorization") token: String): Response<ApiResponse<DashboardSummary>>

    @GET("kunjungans")
    suspend fun getQueueList(@Header("Authorization") token: String): Response<ApiResponse<List<VisitQueue>>>

    @POST("rekam-medis")
    suspend fun saveMedicalRecord(@Header("Authorization") token: String, @Body record: SaveMedicalRecordRequest): Response<ApiResponse<Any>>
}`}
            </pre>

            <div className="text-slate-400 font-bold mt-4">// 3. Jetpack Compose UI (MainActivity.kt)</div>
            <pre className="text-sky-300 bg-slate-950 p-3 rounded-lg overflow-x-auto">
{`// /android/app/src/main/java/com/simklinik/mobile/MainActivity.kt
@Composable
fun SIMKlinikApp() {
    MaterialTheme(colorScheme = lightColorScheme(primary = Color(0xFF0D9488))) {
        Scaffold(
            topBar = { TopAppBar(title = { Text("SIM Klinik Native") }) },
            bottomBar = { NavigationBar { ... } }
        ) { padding ->
            ...
        }
    }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: BUILD APK GUIDE */}
      {activeTab === 'guide' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Panduan Build APK Android & Konfigurasi Online
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <p>
              Proyek Android di dalam folder <code>/android</code> telah dikonfigurasi lengkap dengan Gradle build script, Android SDK 35, Jetpack Compose Material 3, dan OkHttp/Retrofit HTTP client.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">Langkah Kompilasi APK dengan Gradle:</div>
              <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] text-slate-900">
                <li>cd android</li>
                <li>./gradlew assembleDebug</li>
              </ol>
              <div className="text-[11px] text-slate-500 mt-1">
                File APK akan otomatis terbentuk di folder:{' '}
                <code>android/app/build/outputs/apk/debug/app-debug.apk</code>
              </div>
            </div>

            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 space-y-2">
              <div className="font-bold text-teal-900">Konfigurasi Endpoint REST API:</div>
              <p className="text-[11px] text-teal-800">
                Aplikasi Android terhubung ke domain backend SIM Klinik:
              </p>
              <code className="block p-2 bg-white rounded border border-teal-300 font-mono text-teal-900">
                buildConfigField("String", "BASE_URL", "\"https://ais-dev-gvynw3kxtec72lhzeb63mn-446282900270.asia-east1.run.app/api/\"")
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
