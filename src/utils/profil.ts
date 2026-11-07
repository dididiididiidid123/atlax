// Profil ringan: nama untuk sapaan. Disimpan di perangkat ini saja, tidak dikirim ke mana pun.
// Tanpa akun, sapaan memakai nama dari formulir Panduan SPT, atau "Pengguna" bila belum diisi.

export interface Profil {
  namaSapaan: string;
}

export const PROFIL_KEY = 'atlax_profil_v1';
export const PROFIL_EVENT = 'atlax:profil-changed';
export const NAMA_DEFAULT = 'Pengguna';

export const loadProfil = (): Profil => {
  try {
    const raw = localStorage.getItem(PROFIL_KEY);
    if (!raw) return { namaSapaan: '' };
    const parsed = JSON.parse(raw) as Partial<Profil>;
    return { namaSapaan: typeof parsed.namaSapaan === 'string' ? parsed.namaSapaan : '' };
  } catch {
    return { namaSapaan: '' };
  }
};

export const saveProfil = (profil: Profil) => {
  try {
    localStorage.setItem(PROFIL_KEY, JSON.stringify(profil));
  } catch {
    // penyimpanan tidak tersedia: nama hanya berlaku di sesi ini
  }
  window.dispatchEvent(new CustomEvent(PROFIL_EVENT));
};

// Nama untuk sapaan: nama di profil, lalu nama di formulir, lalu nama default
export const getNamaSapaan = (namaFormulir = ''): string => {
  const dariProfil = loadProfil().namaSapaan.trim();
  if (dariProfil) return dariProfil;
  const dariFormulir = namaFormulir.trim();
  if (dariFormulir) return dariFormulir.split(' ')[0];
  return NAMA_DEFAULT;
};
