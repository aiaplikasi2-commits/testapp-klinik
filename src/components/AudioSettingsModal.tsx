import React, { useState, useEffect } from 'react';
import {
  Volume2,
  X,
  Play,
  RotateCcw,
  Check,
  Sparkles,
  Music,
  User as UserIcon,
  Bell,
  Mic,
  BookOpen,
  Sliders,
  AudioWaveform,
} from 'lucide-react';
import {
  AudioSettings,
  loadAudioSettings,
  saveAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  announceQueueCall,
  playTingTangTungChime,
  playQueueChime,
  getIndonesianVoicesCategorized,
  speakVoiceBlock,
  VOICE_BLOCKS_LIBRARY,
} from '../utils/audio-call';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pengaturan' | 'pustaka'>('pengaturan');
  const [settings, setSettings] = useState<AudioSettings>(loadAudioSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testing, setTesting] = useState<'bell' | 'voice' | 'all' | string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = (updated: Partial<AudioSettings>) => {
    const next = saveAudioSettings(updated);
    setSettings(next);
  };

  const handleTestChimeOnly = async () => {
    setTesting('bell');
    try {
      if (settings.chimeStyle === 'ting_tang_tung') {
        await playTingTangTungChime(settings.bellVolume);
      } else {
        await playQueueChime(settings.chimeStyle);
      }
    } finally {
      setTesting(null);
    }
  };

  const handleTestVoiceOnly = async () => {
    setTesting('voice');
    try {
      const sampleText =
        settings.numberFormat === 'digits'
          ? 'Nomor antrean A nol nol satu, silakan menuju ke ruang pemeriksaan.'
          : 'Nomor antrean A satu, silakan menuju ke ruang pemeriksaan.';
      await speakVoiceBlock(sampleText);
    } finally {
      setTesting(null);
    }
  };

  const handleTestFullCall = async () => {
    setTesting('all');
    try {
      await announceQueueCall({
        noAntrean: 'A-001',
        ruang: 'ruang pemeriksaan',
      });
    } finally {
      setTesting(null);
    }
  };

  const handlePlayBlock = async (text: string, blockId: string) => {
    setTesting(blockId);
    try {
      await speakVoiceBlock(text);
    } finally {
      setTesting(null);
    }
  };

  const handleReset = () => {
    const next = saveAudioSettings(DEFAULT_AUDIO_SETTINGS);
    setSettings(next);
  };

  const { allIndonesian, female, male } = getIndonesianVoicesCategorized();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-800/80 rounded-xl">
              <Volume2 className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Sistem Suara Panggilan Antrean</h3>
              <p className="text-xs text-teal-100">Standar Voice Artist Klinik Indonesia & Bel Ting... Tang... Tung...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-teal-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs between Settings & Voice Blocks Library */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pengaturan')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'pengaturan'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pengaturan & Uji Cepat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pustaka')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'pustaka'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pustaka Potongan Suara (Voice Blocks)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: PENGATURAN & UJI SUARA */}
          {activeTab === 'pengaturan' && (
            <>
              {/* Voice Artist Persona Card */}
              <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AudioWaveform className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-teal-900 flex items-center gap-1.5">
                    <span>Karakter Voice Artist Aktif:</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-200/60 text-teal-800 font-semibold text-[11px]">
                      Penyiar Informasi Perempuan (Natural & Ramah)
                    </span>
                  </div>
                  <div className="text-teal-700 mt-1 leading-relaxed">
                    Artikulasi jernih & tajam, tempo ideal & mengalir alami, tidak terburu-buru dan tidak menyeret agar jelas dan nyaman didengar seluruh pasien di ruang tunggu.
                  </div>
                </div>
              </div>

              {/* Mesin Pemroses Suara (Natural AI Studio vs Browser) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Pilihan Mesin Pemroses Suara
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave({ engine: 'natural_studio' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      settings.engine === 'natural_studio'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>Suara Natural Studio AI ★</span>
                      </span>
                      {settings.engine === 'natural_studio' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Suara asli manusia sangat natural, halus, dan nyaman didengar (Gemini 3.8 Flash TTS & HD Neural Voice).
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave({ engine: 'browser_synth' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      settings.engine === 'browser_synth'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Sintesis Peramban (Web Speech)</span>
                      {settings.engine === 'browser_synth' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Sintesis suara bawaan sistem HP/Komputer untuk mode tanpa koneksi internet (offline).
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Audio Test Action Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-teal-600" />
                      <span>Uji Coba Langsung Suara Pemanggilan</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      "Nomor antrean A nol nol satu, silakan menuju ke ruang pemeriksaan."
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleTestChimeOnly}
                    disabled={testing !== null}
                    className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>{testing === 'bell' ? 'Membunyikan...' : 'Tes Bel Saja'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestVoiceOnly}
                    disabled={testing !== null}
                    className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                    <span>{testing === 'voice' ? 'Bicara...' : 'Tes Penyiar Saja'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestFullCall}
                    disabled={testing !== null}
                    className="px-2.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{testing === 'all' ? 'Memanggil...' : 'Tes Lengkap'}</span>
                  </button>
                </div>
              </div>

              {/* Model Bel Pembuka */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Suara Pembuka Bel (Chime)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave({ chimeStyle: 'ting_tang_tung' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      settings.chimeStyle === 'ting_tang_tung'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Ting... Tang... Tung...</span>
                      {settings.chimeStyle === 'ting_tang_tung' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Bel 3-Nada Resepsionis Klinik (Wajib)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave({ chimeStyle: 'hospital_4tone' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      settings.chimeStyle === 'hospital_4tone'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Klinik 4-Nada</span>
                      {settings.chimeStyle === 'hospital_4tone' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Harmonis (Do-Mi-Sol-Do')</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave({ chimeStyle: 'soothing_3tone' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      settings.chimeStyle === 'soothing_3tone'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Lembut Pentatonis</span>
                      {settings.chimeStyle === 'soothing_3tone' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">Tenang & Menenangkan</span>
                  </button>
                </div>
              </div>

              {/* Volume Terpisah: Bel vs Penyiar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>Volume Bel</span>
                    </span>
                    <span className="text-teal-700 font-semibold">{Math.round(settings.bellVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.00"
                    step="0.05"
                    value={settings.bellVolume}
                    onChange={(e) => handleSave({ bellVolume: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5 text-blue-600" />
                      <span>Volume Penyiar</span>
                    </span>
                    <span className="text-teal-700 font-semibold">{Math.round(settings.voiceVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="1.00"
                    step="0.05"
                    value={settings.voiceVolume}
                    onChange={(e) => handleSave({ voiceVolume: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600"
                  />
                </div>
              </div>

              {/* Karakter Suara Penyiar (Perempuan vs Laki-Laki) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  2. Karakter Suara Penyiar (Aksen Indonesia Asli)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave({ preferredGender: 'female', selectedVoiceURI: undefined })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      settings.preferredGender === 'female' && !settings.selectedVoiceURI
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Perempuan (Ramah)</span>
                    {settings.preferredGender === 'female' && !settings.selectedVoiceURI && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave({ preferredGender: 'male', selectedVoiceURI: undefined })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      settings.preferredGender === 'male' && !settings.selectedVoiceURI
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Laki-Laki (Berwibawa)</span>
                    {settings.preferredGender === 'male' && !settings.selectedVoiceURI && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave({ preferredGender: 'auto', selectedVoiceURI: undefined })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      settings.preferredGender === 'auto' && !settings.selectedVoiceURI
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Otomatis Sistem</span>
                    {settings.preferredGender === 'auto' && !settings.selectedVoiceURI && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Format Pengucapan Nomor Antrean */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  3. Pengucapan Nomor Antrean
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave({ numberFormat: 'digits' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      settings.numberFormat === 'digits'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Eja Tiap Digit (Standar Klinik)</span>
                      {settings.numberFormat === 'digits' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">"A nol nol satu" (Sangat Jelas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave({ numberFormat: 'words' })}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      settings.numberFormat === 'words'
                        ? 'border-teal-500 bg-teal-50/70 text-teal-900 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Bilangan Utuh</span>
                      {settings.numberFormat === 'words' && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">"A, satu"</span>
                  </button>
                </div>
              </div>

              {/* Kecepatan Bicara (Tempo) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider">
                    4. Kecepatan Bicara (Tempo)
                  </span>
                  <span className="text-teal-700 font-semibold">
                    {settings.rate.toFixed(2)}x {settings.rate === 0.90 ? '(Ideal & Alami ★)' : settings.rate < 0.85 ? '(Lebih Santai)' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave({ rate: 0.82 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                      settings.rate === 0.82
                        ? 'bg-teal-600 text-white border-teal-600 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Santai (0.82x)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave({ rate: 0.90 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                      settings.rate === 0.90
                        ? 'bg-teal-600 text-white border-teal-600 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Pas & Alami (0.90x) ★
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave({ rate: 1.00 })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                      settings.rate === 1.00
                        ? 'bg-teal-600 text-white border-teal-600 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Standar (1.00x)
                  </button>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="1.15"
                  step="0.02"
                  value={settings.rate}
                  onChange={(e) => handleSave({ rate: parseFloat(e.target.value) })}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Template Kalimat Panggilan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  5. Format Kalimat Panggilan
                </label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'standar',
                      label: 'Standar Klinik (Rekomendasi Voice Artist)',
                      preview: '"Nomor antrean... A nol nol satu... silakan menuju ke... ruang pemeriksaan."',
                    },
                    {
                      id: 'formal',
                      label: 'Formal Lengkap Santun',
                      preview: '"Perhatian... nomor antrean... A nol nol satu... dipersilakan menuju ke... ruang pemeriksaan... Terima kasih."',
                    },
                    {
                      id: 'ringkas',
                      label: 'Ringkas Langsung',
                      preview: '"Nomor antrean... A nol nol satu... ruang pemeriksaan."',
                    },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSave({ callTemplate: tmpl.id as any })}
                      className={`w-full p-2.5 rounded-xl border text-left transition ${
                        settings.callTemplate === tmpl.id
                          ? 'border-teal-500 bg-teal-50/70 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>{tmpl.label}</span>
                        {settings.callTemplate === tmpl.id && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tmpl.preview}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PUSTAKA POTONGAN SUARA (VOICE BLOCKS) */}
          {activeTab === 'pustaka' && (
            <div className="space-y-5">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Klik tombol <Play className="w-3 h-3 inline text-teal-600 mx-0.5" /> untuk menguji potongan kata dan frasa individual standar Voice Artist rumah sakit Indonesia.
              </div>

              {/* 1. Pembuka */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Frasa Pembuka Panggilan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_BLOCKS_LIBRARY.pembuka.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handlePlayBlock(b.text, b.id)}
                      disabled={testing !== null}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/40 text-left transition flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">"{b.text}"</span>
                      <Play className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Abjad Fonetik Kode Antrean */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Abjad Fonetik Kode Antrean (A - Z)
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {VOICE_BLOCKS_LIBRARY.abjad.slice(0, 12).map((a) => (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => handlePlayBlock(a.spoken, `abjad_${a.code}`)}
                      disabled={testing !== null}
                      className="p-2 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50 text-center transition text-xs font-bold text-slate-800"
                    >
                      <span>{a.code}</span>
                      <span className="block text-[10px] font-normal text-slate-400">{a.spoken}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Angka Tunggal (Eja Digit) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Digit Angka (Eja Digit 0 - 9)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {VOICE_BLOCKS_LIBRARY.angkaTunggal.map((d) => (
                    <button
                      key={d.digit}
                      type="button"
                      onClick={() => handlePlayBlock(d.spoken, `digit_${d.digit}`)}
                      disabled={testing !== null}
                      className="p-2 rounded-lg border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50 text-center transition text-xs font-bold text-slate-800"
                    >
                      <span>{d.digit}</span>
                      <span className="block text-[10px] font-normal text-slate-400">{d.spoken}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Poli & Ruang Pelayanan */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Nama Loket & Poli Pelayanan Klinik
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_BLOCKS_LIBRARY.poliDanRuang.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlayBlock(p.text, p.id)}
                      disabled={testing !== null}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/40 text-left transition flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{p.text}</span>
                      <Play className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Penutup Santun */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Frasa Penutup Santun
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_BLOCKS_LIBRARY.penutup.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handlePlayBlock(c.text, c.id)}
                      disabled={testing !== null}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/40 text-left transition flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">"{c.text}"</span>
                      <Play className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleReset}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Standar</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
          >
            Selesai & Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
