// Penyimpanan dokumen yang sudah disimpan pengguna (SPT, SSP, SKP, STP) di perangkat ini.
// Setiap perubahan memicu event "atlax:docs-changed" agar daftar di layar ikut diperbarui.

export type SavedKind = 'SPT' | 'SSP' | 'SKP' | 'STP';

export interface SavedDoc {
  id: string;
  kind: SavedKind;
  title: string;
  amount: number;
  status: string;
  savedAt: string;
  rows: { label: string; value: string }[];
}

export const DOKUMEN_KEY = 'atlax_dokumen_v1';
export const DOKUMEN_EVENT = 'atlax:docs-changed';

export const loadDocs = (): SavedDoc[] => {
  try {
    const raw = localStorage.getItem(DOKUMEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedDoc[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (docs: SavedDoc[]) => {
  try {
    localStorage.setItem(DOKUMEN_KEY, JSON.stringify(docs));
  } catch {
    // penyimpanan penuh atau tidak tersedia: data hanya ada di sesi ini
  }
  window.dispatchEvent(new CustomEvent(DOKUMEN_EVENT));
};

export const saveDoc = (doc: Omit<SavedDoc, 'id' | 'savedAt'>): SavedDoc => {
  const saved: SavedDoc = { ...doc, id: `dok-${Date.now()}`, savedAt: new Date().toISOString() };
  write([saved, ...loadDocs()]);
  return saved;
};

export const deleteDoc = (id: string) => {
  write(loadDocs().filter((d) => d.id !== id));
};
