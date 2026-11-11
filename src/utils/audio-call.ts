/**
 * Audio Chime and Voice Artist Engine for SIM Klinik (Patient Queue Calling)
 * Designed following professional Indonesian hospital voice-over standards:
 * - 3-Tone Reception Bell: "Ting... Tang... Tung..." (High -> Mid -> Low)
 * - Pacing: Calm, deliberate, slow-to-medium (0.85x speed rate)
 * - Pauses: 0.5s on commas, 0.8s - 1.0s on ellipsis (...) and periods
 * - Enunciation: Clear, crisp articulation for elderly and children in public waiting rooms
 * - Female warm smiling voice with neutral Indonesian accent (id-ID)
 */

export const AUDIO_SETTINGS_STORAGE_KEY = 'sim_klinik_voice_artist_config';

export type VoiceEngineMode = 'natural_studio' | 'browser_synth';

export interface AudioSettings {
  bellVolume: number; // 0.0 to 1.0 (default 0.85)
  voiceVolume: number; // 0.0 to 1.0 (default 1.0)
  rate: number; // 0.70 to 1.20 (default 0.85 - calm, polite Indonesian hospital tempo)
  pitch: number; // 0.80 to 1.25 (default 1.0 - natural warm smiling tone)
  preferredGender: 'female' | 'male' | 'auto'; // default 'female'
  numberFormat: 'digits' | 'words'; // 'digits' -> "A... nol... nol... satu" (default)
  callTemplate: 'standar' | 'formal' | 'ringkas'; // default 'standar'
  selectedVoiceURI?: string;
  chimeStyle: 'ting_tang_tung' | 'hospital_4tone' | 'soothing_3tone'; // default 'ting_tang_tung'
  engine: VoiceEngineMode; // 'natural_studio' (AI / Studio Audio) or 'browser_synth'
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  bellVolume: 0.85,
  voiceVolume: 1.0,
  rate: 0.90, // Tempo pas, mengalir alami, sangat jelas & tidak terburu-buru
  pitch: 1.0,
  preferredGender: 'female',
  numberFormat: 'digits',
  callTemplate: 'standar',
  selectedVoiceURI: undefined,
  chimeStyle: 'ting_tang_tung',
  engine: 'natural_studio',
};

export function loadAudioSettings(): AudioSettings {
  if (typeof window === 'undefined') return DEFAULT_AUDIO_SETTINGS;
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrasikan jika sebelumnya tersimpan setting terlalu lambat (0.70) atau lama (0.85) ke tempo pas (0.90)
      if (parsed.rate === 0.70 || parsed.rate === 0.85 || !parsed.rate) {
        parsed.rate = 0.90;
      }
      return { ...DEFAULT_AUDIO_SETTINGS, ...parsed };
    }
  } catch {
    // fallback
  }
  return DEFAULT_AUDIO_SETTINGS;
}

export function saveAudioSettings(settings: Partial<AudioSettings>): AudioSettings {
  const current = loadAudioSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
  return updated;
}

/**
 * Professional Voice Blocks Library for Hospital & Clinic Queue Calling
 * Complete categorized modular snippets spelled in Indonesian words.
 */
export const VOICE_BLOCKS_LIBRARY = {
  pembuka: [
    { id: 'nomor_antrean', text: 'Nomor antrean...' },
    { id: 'perhatian', text: 'Perhatian... nomor antrean...' },
    { id: 'panggil_kembali', text: 'Nomor antrean... kami panggil kembali...' },
    { id: 'panggilan_ulang', text: 'Panggilan ulang... nomor antrean...' },
  ],
  abjad: [
    { code: 'A', spoken: 'A...' },
    { code: 'B', spoken: 'B...' },
    { code: 'C', spoken: 'C...' },
    { code: 'D', spoken: 'D...' },
    { code: 'E', spoken: 'E...' },
    { code: 'F', spoken: 'Ef...' },
    { code: 'G', spoken: 'Ge...' },
    { code: 'H', spoken: 'Ha...' },
    { code: 'I', spoken: 'I...' },
    { code: 'J', spoken: 'Je...' },
    { code: 'K', spoken: 'Ka...' },
    { code: 'L', spoken: 'El...' },
    { code: 'M', spoken: 'Em...' },
    { code: 'N', spoken: 'En...' },
    { code: 'O', spoken: 'O...' },
    { code: 'P', spoken: 'Pe...' },
    { code: 'Q', spoken: 'Qi...' },
    { code: 'R', spoken: 'Er...' },
    { code: 'S', spoken: 'Es...' },
    { code: 'T', spoken: 'Te...' },
    { code: 'U', spoken: 'U...' },
    { code: 'V', spoken: 'Fe...' },
    { code: 'W', spoken: 'We...' },
    { code: 'X', spoken: 'Eks...' },
    { code: 'Y', spoken: 'Ye...' },
    { code: 'Z', spoken: 'Zet...' },
  ],
  angkaTunggal: [
    { digit: '0', spoken: 'nol...' },
    { digit: '1', spoken: 'satu...' },
    { digit: '2', spoken: 'dua...' },
    { digit: '3', spoken: 'tiga...' },
    { digit: '4', spoken: 'empat...' },
    { digit: '5', spoken: 'lima...' },
    { digit: '6', spoken: 'enam...' },
    { digit: '7', spoken: 'tujuh...' },
    { digit: '8', spoken: 'delapan...' },
    { digit: '9', spoken: 'sembilan...' },
  ],
  bilanganBelasan: [
    { num: 10, spoken: 'sepuluh...' },
    { num: 11, spoken: 'sebelas...' },
    { num: 12, spoken: 'dua belas...' },
    { num: 15, spoken: 'lima belas...' },
  ],
  bilanganPuluhan: [
    { num: 20, spoken: 'dua puluh...' },
    { num: 30, spoken: 'tiga puluh...' },
    { num: 50, spoken: 'lima puluh...' },
  ],
  arahan: [
    { id: 'silakan_menuju', text: 'silakan menuju ke...' },
    { id: 'dipersilakan_menuju', text: 'dipersilakan menuju ke...' },
    { id: 'silakan_masuk', text: 'silakan masuk ke...' },
  ],
  poliDanRuang: [
    { id: 'poli_umum', text: 'Ruang Poli Umum.' },
    { id: 'poli_gigi', text: 'Ruang Poli Gigi.' },
    { id: 'poli_kia', text: 'Ruang Poli Kesehatan Ibu dan Anak.' },
    { id: 'farmasi', text: 'Ruang Farmasi dan Pengambilan Obat.' },
    { id: 'kasir', text: 'Loket Kasir dan Pembayaran.' },
    { id: 'pendaftaran', text: 'Loket Pendaftaran.' },
  ],
  penutup: [
    { id: 'terima_kasih', text: 'Terima kasih.' },
    { id: 'lekas_sembuh', text: 'Semoga lekas sembuh.' },
    { id: 'terima_kasih_kerjasama', text: 'Terima kasih atas kerja sama Anda.' },
  ],
};

/**
 * Converts digit string (e.g. "001", "015") into Indonesian spelled digits:
 * "001" -> "nol nol satu"
 */
export function formatDigitsToIndonesianSpoken(digitsStr: string): string {
  const digitMap: Record<string, string> = {
    '0': 'nol',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  };
  return digitsStr
    .split('')
    .map((d) => digitMap[d] || d)
    .join(' ');
}

/**
 * Converts numbers 0-999 into natural Indonesian words:
 * 1 -> "satu", 12 -> "dua belas", 105 -> "seratus lima"
 */
export function numberToIndonesianWords(n: number): string {
  if (n < 0) return String(n);
  if (n === 0) return 'nol';

  const satuan = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ];

  if (n < 12) return satuan[n];
  if (n < 20) return `${satuan[n - 10]} belas`;
  if (n < 100) {
    const puluhan = Math.floor(n / 10);
    const sisa = n % 10;
    return `${satuan[puluhan]} puluh${sisa > 0 ? ' ' + satuan[sisa] : ''}`;
  }
  if (n < 200) {
    const sisa = n - 100;
    return `seratus${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  if (n < 1000) {
    const ratusan = Math.floor(n / 100);
    const sisa = n % 100;
    return `${satuan[ratusan]} ratus${sisa > 0 ? ' ' + numberToIndonesianWords(sisa) : ''}`;
  }
  return String(n);
}

/**
 * Ensures clean Indonesian alphabet pronunciation
 */
export function formatIndonesianLetter(letter: string): string {
  const clean = letter.toUpperCase().trim();
  const map: Record<string, string> = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    E: 'E',
    F: 'F',
    G: 'G',
    H: 'H',
    I: 'I',
    J: 'J',
    K: 'K',
    L: 'L',
    M: 'M',
    N: 'N',
    O: 'O',
    P: 'P',
    Q: 'Q',
    R: 'R',
    S: 'S',
    T: 'T',
    U: 'U',
    V: 'V',
    W: 'W',
    X: 'X',
    Y: 'Y',
    Z: 'Z',
  };
  return map[clean] || clean;
}

/**
 * Formats queue code e.g. "A-001" according to chosen format:
 * 'digits' -> "A nol nol satu"
 * 'words' -> "A, satu"
 */
export function formatQueueNumberForSpokenIndonesian(
  noAntrean: string,
  format: 'digits' | 'words' = 'digits'
): string {
  const parts = noAntrean.split('-');
  if (parts.length === 2) {
    const letter = formatIndonesianLetter(parts[0]);
    const numPart = parts[1].trim();

    if (format === 'digits') {
      const spokenDigits = formatDigitsToIndonesianSpoken(numPart);
      return `${letter} ${spokenDigits}`;
    } else {
      const numVal = parseInt(numPart, 10) || 0;
      const spokenNum = numberToIndonesianWords(numVal);
      return `${letter}, ${spokenNum}`;
    }
  }
  return noAntrean;
}

export interface QueueAnnouncementParams {
  noAntrean: string;
  dokter?: string;
  ruang?: string;
  poli?: string;
  isRecall?: boolean;
}

/**
 * Converts numbers inside room names into Indonesian words:
 * "ruang 1" -> "ruang satu"
 * "ruang 2" -> "ruang dua"
 */
function normalizeClinicLocationForSpeech(rawRuang?: string, rawPoli?: string): string {
  let target = (rawRuang || rawPoli || '').trim();
  if (!target) return '';

  // Clean KIA polyclinic full title
  if (target.toLowerCase() === 'poli kia' || target.toLowerCase() === 'kia') {
    return 'Ruang Poli Kesehatan Ibu dan Anak';
  }
  if (target.toLowerCase() === 'poli gigi') {
    return 'Ruang Poli Gigi';
  }
  if (target.toLowerCase() === 'poli umum') {
    return 'Ruang Poli Umum';
  }
  if (target.toLowerCase().includes('farmasi') || target.toLowerCase().includes('obat')) {
    return 'Ruang Farmasi dan Pengambilan Obat';
  }
  if (target.toLowerCase().includes('kasir')) {
    return 'Loket Kasir dan Pembayaran';
  }

  // Convert digits in room labels (e.g. "ruang 1" -> "ruang satu")
  target = target.replace(/\b1\b/g, 'satu')
    .replace(/\b2\b/g, 'dua')
    .replace(/\b3\b/g, 'tiga')
    .replace(/\b4\b/g, 'empat')
    .replace(/\b5\b/g, 'lima');

  if (target.toLowerCase().startsWith('ruang ')) {
    return 'Ruang ' + target.slice(6).trim();
  }
  if (target.toLowerCase().startsWith('loket ')) {
    return 'Loket ' + target.slice(6).trim();
  }
  return `ruang ${target}`;
}

/**
 * Cleans doctor title for natural, respectful speech
 */
function cleanDoctorNameForSpeech(rawDoctor?: string): string {
  if (!rawDoctor || !rawDoctor.trim()) return '';
  let d = rawDoctor.trim();
  if (d.toLowerCase().startsWith('dr. ') || d.toLowerCase().startsWith('dr.')) {
    d = d.replace(/^dr\.\s*/i, '');
  } else if (d.toLowerCase().startsWith('dokter ')) {
    d = d.replace(/^dokter\s*/i, '');
  }
  return `Dokter ${d}`;
}

/**
 * Constructs the announcement text dynamically with deliberate Voice Artist pauses (...)
 * so elderly and pediatric patients can clearly follow every syllable.
 */
export function buildQueueAnnouncementText(
  params: QueueAnnouncementParams,
  settings?: Partial<AudioSettings>
): string {
  const currentSettings = { ...loadAudioSettings(), ...(settings || {}) };
  const spokenNumber = formatQueueNumberForSpokenIndonesian(
    params.noAntrean,
    currentSettings.numberFormat
  );

  const cleanDoc = cleanDoctorNameForSpeech(params.dokter);
  const cleanLoc = normalizeClinicLocationForSpeech(params.ruang, params.poli);

  let targetTujuan = '';
  if (cleanDoc && cleanLoc) {
    targetTujuan = ` ${cleanDoc}, di ${cleanLoc}`;
  } else if (cleanDoc) {
    targetTujuan = ` ${cleanDoc}`;
  } else if (cleanLoc) {
    targetTujuan = ` ${cleanLoc}`;
  }

  const template = currentSettings.callTemplate || 'standar';

  if (params.isRecall) {
    // Pasien belum datang / Panggilan ulang
    if (targetTujuan) {
      return `Nomor antrean... ${spokenNumber}... kami panggil kembali... silakan menuju ke...${targetTujuan}.`;
    }
    return `Nomor antrean... ${spokenNumber}... kami panggil kembali... silakan menuju ke... ruang pemeriksaan.`;
  }

  if (template === 'formal') {
    if (targetTujuan) {
      return `Perhatian... nomor antrean... ${spokenNumber}... dipersilakan menuju ke...${targetTujuan}... Terima kasih.`;
    }
    return `Perhatian... nomor antrean... ${spokenNumber}... dipersilakan menuju ke... ruang pemeriksaan... Terima kasih.`;
  }

  if (template === 'ringkas') {
    if (targetTujuan) {
      return `Nomor antrean... ${spokenNumber}... silakan ke...${targetTujuan}.`;
    }
    return `Nomor antrean... ${spokenNumber}... ruang pemeriksaan.`;
  }

  // Default Standar Voice Artist
  if (targetTujuan) {
    return `Nomor antrean... ${spokenNumber}... silakan menuju ke... ruang pemeriksaan${targetTujuan}.`;
  }
  return `Nomor antrean... ${spokenNumber}... silakan menuju ke... ruang pemeriksaan.`;
}

/**
 * Physical acoustic synthesis of 3-tone clinic receptionist bell: "Ting... Tang... Tung..."
 * Ting = High bell (B5 987.77 Hz)
 * Tang = Mid bell (G#5 830.61 Hz)
 * Tung = Low resonant bell (E5 659.25 Hz)
 */
export function playTingTangTungChime(volume = 0.85): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        resolve();
        return;
      }

      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterVol = Math.max(0.05, Math.min(1.0, volume));

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(masterVol * 0.35, now);
      masterGain.connect(ctx.destination);

      // Acoustic chime tone generator with realistic metallic shimmer & resonance
      const playChimeNote = (
        freq: number,
        startDelay: number,
        duration: number,
        sustainDecay: number,
        gainWeight = 1.0
      ) => {
        const noteStart = now + startDelay;
        const noteEnd = noteStart + duration;

        // 1. Fundamental chime frequency
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, noteStart);

        // Immediate crisp bell strike (4ms attack)
        gain1.gain.setValueAtTime(0.0001, noteStart);
        gain1.gain.linearRampToValueAtTime(0.45 * gainWeight, noteStart + 0.004);
        // Exponential bell decay
        gain1.gain.exponentialRampToValueAtTime(0.0001, noteStart + sustainDecay);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(noteStart);
        osc1.stop(noteEnd);

        // 2. Harmonic overtone (2.0x frequency) for crystal shimmer
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.0, noteStart);

        gain2.gain.setValueAtTime(0.0001, noteStart);
        gain2.gain.linearRampToValueAtTime(0.12 * gainWeight, noteStart + 0.004);
        gain2.gain.exponentialRampToValueAtTime(0.0001, noteStart + Math.min(0.35, sustainDecay));

        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(noteStart);
        osc2.stop(noteEnd);

        // 3. High inharmonic partial (3.4x frequency) for metallic tingle
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 3.41, noteStart);

        gain3.gain.setValueAtTime(0.0001, noteStart);
        gain3.gain.linearRampToValueAtTime(0.04 * gainWeight, noteStart + 0.003);
        gain3.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.18);

        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.start(noteStart);
        osc3.stop(noteEnd);
      };

      // 1. Ting (High bell: B5 987.77 Hz)
      playChimeNote(987.77, 0.0, 0.7, 0.65, 0.95);

      // 2. Tang (Mid bell: G#5 830.61 Hz)
      playChimeNote(830.61, 0.38, 0.7, 0.65, 1.0);

      // 3. Tung (Low resonant bell: E5 659.25 Hz)
      playChimeNote(659.25, 0.76, 1.2, 1.15, 1.1);

      // Total chime duration: 0.76s + 1.15s ~ 1.9s
      setTimeout(() => {
        resolve();
      }, 1850);
    } catch {
      resolve();
    }
  });
}

/**
 * Backward compatibility alias for playing chime
 */
export function playQueueChime(style?: AudioSettings['chimeStyle']): Promise<void> {
  const chosen = style || loadAudioSettings().chimeStyle;
  const vol = loadAudioSettings().bellVolume;

  if (chosen === 'ting_tang_tung') {
    return playTingTangTungChime(vol);
  }

  return new Promise((resolve) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        resolve();
        return;
      }
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.3, now);
      gain.connect(ctx.destination);

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + start);
        g.gain.setValueAtTime(0.001, now + start);
        g.gain.linearRampToValueAtTime(0.35, now + start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.connect(g);
        g.connect(gain);
        osc.start(now + start);
        osc.stop(now + start + dur);
      };

      if (chosen === 'hospital_4tone') {
        playTone(523.25, 0.0, 0.7);
        playTone(659.25, 0.22, 0.8);
        playTone(783.99, 0.44, 0.9);
        playTone(1046.5, 0.68, 1.2);
        setTimeout(resolve, 1800);
      } else {
        playTone(349.23, 0.0, 0.8);
        playTone(440.0, 0.25, 0.9);
        playTone(523.25, 0.52, 1.1);
        setTimeout(resolve, 1600);
      }
    } catch {
      resolve();
    }
  });
}

/**
 * Discovers and categorizes available voices in browser
 */
export function getIndonesianVoicesCategorized(): {
  allIndonesian: SpeechSynthesisVoice[];
  female: SpeechSynthesisVoice[];
  male: SpeechSynthesisVoice[];
  other: SpeechSynthesisVoice[];
} {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { allIndonesian: [], female: [], male: [], other: [] };
  }
  const voices = window.speechSynthesis.getVoices() || [];

  const indonesian = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return (
      lang.includes('id') ||
      lang.includes('in-') ||
      lang === 'in' ||
      name.includes('indonesia') ||
      name.includes('damayanti') ||
      name.includes('gadis') ||
      name.includes('andika') ||
      name.includes('ardi')
    );
  });

  const female: SpeechSynthesisVoice[] = [];
  const male: SpeechSynthesisVoice[] = [];
  const other: SpeechSynthesisVoice[] = [];

  for (const v of indonesian) {
    const name = v.name.toLowerCase();
    if (
      name.includes('female') ||
      name.includes('wanita') ||
      name.includes('perempuan') ||
      name.includes('gadis') ||
      name.includes('damayanti') ||
      name.includes('siti')
    ) {
      female.push(v);
    } else if (
      name.includes('male') ||
      name.includes('pria') ||
      name.includes('laki') ||
      name.includes('andika') ||
      name.includes('ardi')
    ) {
      male.push(v);
    } else {
      if (name.includes('google')) {
        female.push(v);
      } else {
        other.push(v);
      }
    }
  }

  return { allIndonesian: indonesian, female, male, other };
}

export function pickBestIndonesianVoice(
  voices: SpeechSynthesisVoice[],
  settings: AudioSettings
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  // 1. Explicit URI chosen by user
  if (settings.selectedVoiceURI) {
    const matched = voices.find((v) => v.voiceURI === settings.selectedVoiceURI);
    if (matched) return matched;
  }

  const { allIndonesian, female, male } = getIndonesianVoicesCategorized();

  // 2. Gender preference (Female by default for friendly hospital front-desk voice)
  if (settings.preferredGender === 'female' && female.length > 0) {
    return female[0];
  }
  if (settings.preferredGender === 'male' && male.length > 0) {
    return male[0];
  }

  // 3. Best available Indonesian voice
  if (allIndonesian.length > 0) {
    const preferred = allIndonesian.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes('natural') ||
        name.includes('google') ||
        name.includes('damayanti') ||
        name.includes('gadis') ||
        name.includes('andika')
      );
    });
    return preferred || allIndonesian[0];
  }

  // 4. Fallback: starts with id
  const fallback = voices.find((v) => (v.lang || '').toLowerCase().startsWith('id'));
  if (fallback) return fallback;

  // 5. Default system voice
  return voices.find((v) => v.default) || voices[0] || null;
}

// Global audio queue chain to prevent overlapping/colliding calls
let queueLockPromise: Promise<void> = Promise.resolve();
// Active audio element reference to control and prevent overlapping audio
let currentAudioElement: HTMLAudioElement | null = null;
let currentUtteranceRef: SpeechSynthesisUtterance | null = null;

/**
 * Normalizes text for fluent, natural Indonesian human speech
 * Converts stuttery ellipsis into natural conversational phrasing
 */
export function cleanTextForNaturalVoice(text: string): string {
  return text
    .replace(/\.{2,}/g, ', ')
    .replace(/,\s*,/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Plays high-fidelity natural Indonesian voice audio from the clinic server
 * Backed by Gemini 3.8 Flash Lite TTS and high-fidelity Indonesian neural voice
 */
export function playNaturalVoiceAudio(text: string, volume = 1.0): Promise<void> {
  return new Promise((resolve) => {
    try {
      const cleanText = cleanTextForNaturalVoice(text);
      if (!cleanText) {
        resolve();
        return;
      }

      // Stop previous audio if still running
      if (currentAudioElement) {
        currentAudioElement.pause();
        currentAudioElement.src = '';
        currentAudioElement = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const settings = loadAudioSettings();
      const targetRate = Math.max(0.70, Math.min(1.25, settings.rate || 0.90));

      const audioUrl = `/api/antrean/tts-audio?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      currentAudioElement = audio;
      audio.volume = Math.max(0.05, Math.min(1.0, volume));
      audio.playbackRate = targetRate;
      if ('preservesPitch' in audio) {
        (audio as any).preservesPitch = true;
      }

      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          if (currentAudioElement === audio) {
            currentAudioElement = null;
          }
          resolve();
        }
      };

      audio.onended = finish;
      audio.onerror = () => {
        // Fallback to browser synthesis if network fails
        speakWithBrowserSynth(cleanText, volume).then(finish);
      };

      // Safety timeout scaled by rate
      const wordCount = cleanText.split(' ').length;
      const timeoutMs = Math.max(6000, ((wordCount * 750 + 3500) / targetRate));
      setTimeout(finish, timeoutMs);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to browser synthesis if autoplay blocked
          speakWithBrowserSynth(cleanText, volume).then(finish);
        });
      }
    } catch {
      speakWithBrowserSynth(text, volume).then(resolve);
    }
  });
}

/**
 * Speaks text using local browser SpeechSynthesis (Offline fallback)
 */
export function speakWithBrowserSynth(text: string, volume = 1.0): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const settings = loadAudioSettings();
      const cleanText = cleanTextForNaturalVoice(text);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'id-ID';
      utterance.rate = Math.max(0.70, Math.min(1.25, settings.rate || 0.90)); // Balanced natural hospital tempo
      utterance.pitch = settings.pitch;
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices() || [];
      const chosenVoice = pickBestIndonesianVoice(voices, settings);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      currentUtteranceRef = utterance;

      utterance.onend = () => {
        currentUtteranceRef = null;
        resolve();
      };
      utterance.onerror = () => {
        currentUtteranceRef = null;
        resolve();
      };

      const wordCount = cleanText.split(' ').length;
      const estimatedMs = Math.max(4000, (wordCount / 2.2) * 1000 + 2500);
      const timer = setTimeout(() => {
        currentUtteranceRef = null;
        resolve();
      }, estimatedMs);

      const origEnd = utterance.onend;
      utterance.onend = (e) => {
        clearTimeout(timer);
        if (origEnd) origEnd.call(utterance, e);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

/**
 * Speaks a custom text block directly using current voice settings
 */
export async function speakVoiceBlock(text: string): Promise<void> {
  const settings = loadAudioSettings();
  if (settings.engine === 'natural_studio') {
    return playNaturalVoiceAudio(text, settings.voiceVolume);
  }
  return speakWithBrowserSynth(text, settings.voiceVolume);
}

/**
 * Central Queue Announcement Function
 * Strictly implements the 5-step playback order:
 * 1. Takes queue details
 * 2. Plays "Ting... Tang... Tung..." bell
 * 3. Waits 450ms natural pause
 * 4. Speaks natural Indonesian announcement
 * 5. Guarantees completion before next call plays
 */
export function announceQueueCall(
  noAntreanOrParams: string | QueueAnnouncementParams,
  destination?: string,
  room?: string,
  isRecall = false
): Promise<void> {
  // Normalize parameters
  let params: QueueAnnouncementParams;
  if (typeof noAntreanOrParams === 'string') {
    params = {
      noAntrean: noAntreanOrParams,
      poli: destination || 'Poli Umum',
      ruang: room,
      isRecall,
    };
  } else {
    params = noAntreanOrParams;
  }

  // Chain into single-flight audio queue
  const nextCall = queueLockPromise.then(() => performSingleCall(params));
  queueLockPromise = nextCall.catch(() => {});
  return nextCall;
}

async function performSingleCall(params: QueueAnnouncementParams): Promise<void> {
  const settings = loadAudioSettings();

  // Stop any previous speech
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.src = '';
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // 1. Play "Ting... Tang... Tung..." bell first
  await playTingTangTungChime(settings.bellVolume);

  // 2. Pause 450ms between bell and voice
  await new Promise((resolve) => setTimeout(resolve, 450));

  // 3. Play Natural Indonesian Voice
  const textToSpeak = buildQueueAnnouncementText(params, settings);

  if (settings.engine === 'natural_studio') {
    await playNaturalVoiceAudio(textToSpeak, settings.voiceVolume);
  } else {
    await speakWithBrowserSynth(textToSpeak, settings.voiceVolume);
  }
}
