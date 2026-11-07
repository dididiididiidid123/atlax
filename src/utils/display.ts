// Pengaturan tampilan: ukuran huruf dan mode warna (terang, gelap, atau ikuti perangkat).
// Disimpan di perangkat ini. Diterapkan ke elemen <html> sebelum aplikasi tampil, supaya tidak berkedip.

export type ColorMode = 'terang' | 'gelap' | 'perangkat';

export interface DisplaySettings {
  size: number; // indeks ke DISPLAY_SIZES
  mode: ColorMode;
}

// Enam pilihan ukuran. "Biasa" adalah ukuran awal. "Sangat kecil" dan "Kecil" untuk tampilan yang lebih rapat.
export const DISPLAY_SIZES = [
  { label: 'Sangat kecil', scale: '75%', sample: '0.8rem' },
  { label: 'Kecil', scale: '87.5%', sample: '1rem' },
  { label: 'Biasa', scale: '100%', sample: '1.25rem' },
  { label: 'Besar', scale: '112.5%', sample: '1.45rem' },
  { label: 'Lebih besar', scale: '125%', sample: '1.65rem' },
  { label: 'Sangat besar', scale: '137.5%', sample: '1.85rem' },
];
export const DEFAULT_SIZE_INDEX = 2;

export const COLOR_MODES: { value: ColorMode; label: string; hint: string }[] = [
  { value: 'terang', label: 'Terang', hint: 'Latar putih dan lembut. Cocok untuk siang hari.' },
  { value: 'gelap', label: 'Gelap', hint: 'Latar gelap. Lebih nyaman di ruangan redup dan menghemat baterai di layar tertentu.' },
  { value: 'perangkat', label: 'Ikuti perangkat', hint: 'Mengikuti pengaturan terang atau gelap di HP atau komputer Anda.' },
];

const KEY = 'atlax_tampilan_v3';
const DEFAULT: DisplaySettings = { size: DEFAULT_SIZE_INDEX, mode: 'terang' };

export const loadDisplay = (): DisplaySettings => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<DisplaySettings>;
    const size = Number.isInteger(parsed.size) && parsed.size! >= 0 && parsed.size! < DISPLAY_SIZES.length ? parsed.size! : DEFAULT_SIZE_INDEX;
    const mode = COLOR_MODES.some((m) => m.value === parsed.mode) ? (parsed.mode as ColorMode) : 'terang';
    return { size, mode };
  } catch {
    return DEFAULT;
  }
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export const applyDisplay = (settings: DisplaySettings) => {
  const root = document.documentElement;
  // Ukuran dasar diatur lewat variabel, sehingga aturan khusus HP tetap bisa berlaku di bawahnya
  root.style.setProperty('--ui-scale', String(parseFloat(DISPLAY_SIZES[settings.size].scale) / 100));
  const dark = settings.mode === 'gelap' || (settings.mode === 'perangkat' && systemPrefersDark());
  root.classList.toggle('dark', dark);
};

export const saveDisplay = (settings: DisplaySettings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // penyimpanan tidak tersedia: pengaturan hanya berlaku di sesi ini
  }
  applyDisplay(settings);
};

// Jika memilih "Ikuti perangkat", tampilan ikut berubah saat pengaturan perangkat diganti
export const watchSystemMode = (getSettings: () => DisplaySettings) => {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mq) return () => {};
  const onChange = () => {
    const s = getSettings();
    if (s.mode === 'perangkat') applyDisplay(s);
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};
