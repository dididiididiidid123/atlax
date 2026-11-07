// Data untuk beranda: ringkasan pajak, status tenggat, dan tips yang bergilir.
// Semua angka dibaca dari penyimpanan di perangkat ini. Tidak ada data contoh.
// Tidak ada database: kalau belum ada isian, angkanya nol.

import { getUpcomingDeadlines, UpcomingDeadline } from './deadlineReminder';
import { getYearProgress } from './progress';
import { loadDocs } from './dokumenStore';

const KEPATUHAN_KEY = 'atlax_kepatuhan_v1';
const TENGGAT_KEY = 'atlax_tenggat_v1';
export const TENGGAT_EVENT = 'atlax:tenggat-changed';

const JENIS_KEWAJIBAN = ['SETOR_PPH', 'SPT_MASA_PPH', 'SETOR_PPN', 'SPT_MASA_PPN'] as const;

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const pad = (n: number) => String(n).padStart(2, '0');
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);

// ---------- Ringkasan pajak ----------

export interface RingkasanPajak {
  dihitung: number; // total dari dokumen yang disimpan tahun ini
  disetor: number; // total nominal kewajiban yang sudah ditandai sudah dibayar tahun ini
  belum: number | null; // kewajiban 3 bulan terakhir yang belum ditandai sudah; null bila belum ada catatan kepatuhan tahun ini
  selesai: number; // langkah pelaporan yang sudah selesai
  totalLangkah: number;
  persen: number;
  status: 'Belum mulai' | 'Sedang berjalan' | 'Lengkap';
}

export const getRingkasanPajak = (now: Date = new Date()): RingkasanPajak => {
  const tahun = now.getFullYear();
  const bulanIni = now.getMonth() + 1;
  const kepatuhan = readJson<Record<string, { status?: string; nominal?: number }>>(KEPATUHAN_KEY) ?? {};

  const dihitung = loadDocs()
    .filter((d) => new Date(d.savedAt).getFullYear() === tahun)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  let disetor = 0;
  for (const [key, rec] of Object.entries(kepatuhan)) {
    if (key.startsWith(`${tahun}-`) && rec?.status === 'SUDAH') disetor += Number(rec.nominal) || 0;
  }

  // Tanpa catatan kepatuhan tahun ini, aplikasi tidak tahu kewajiban mana yang sudah dibayar.
  // Angkanya tidak ditebak, jadi ditampilkan sebagai "belum dicatat".
  const adaCatatanTahunIni = Object.keys(kepatuhan).some((key) => key.startsWith(`${tahun}-`));
  let belum: number | null = null;
  if (adaCatatanTahunIni) {
    belum = 0;
    for (let m = Math.max(1, bulanIni - 2); m <= bulanIni; m++) {
      for (const jenis of JENIS_KEWAJIBAN) {
        if (kepatuhan[`${tahun}-${pad(m)}-${jenis}`]?.status !== 'SUDAH') belum++;
      }
    }
  }

  const progress = getYearProgress();
  const selesai = progress.filter((p) => p.done).length;
  const totalLangkah = progress.length;
  const persen = totalLangkah ? Math.round((selesai / totalLangkah) * 100) : 0;
  const status = selesai === 0 ? 'Belum mulai' : selesai === totalLangkah ? 'Lengkap' : 'Sedang berjalan';

  return { dihitung, disetor, belum, selesai, totalLangkah, persen, status };
};

// ---------- Tenggat: status dan tanda selesai ----------

export type StatusTenggat = 'terlambat' | 'hari-ini' | 'segera' | 'mendatang' | 'selesai';

export interface TenggatItem {
  key: string;
  label: string;
  date: Date;
  daysLeft: number;
  status: StatusTenggat;
}

const tenggatKey = (id: string, date: Date) => `${id}|${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const readTenggat = (): Record<string, boolean> => readJson<Record<string, boolean>>(TENGGAT_KEY) ?? {};

export const setTenggatSelesai = (key: string, selesai: boolean) => {
  const current = readTenggat();
  if (selesai) current[key] = true;
  else delete current[key];
  try {
    localStorage.setItem(TENGGAT_KEY, JSON.stringify(current));
  } catch {
    // penyimpanan tidak tersedia: tanda hanya berlaku di sesi ini
  }
  window.dispatchEvent(new CustomEvent(TENGGAT_EVENT));
};

// Tanggal jatuh tempo sebelumnya untuk aturan yang sama (dipakai untuk status "terlambat")
const previousOccurrence = (u: UpcomingDeadline): Date => {
  const y = u.date.getFullYear();
  const m = u.date.getMonth();
  const d = u.date.getDate();
  if (u.id === 'spt-op') return new Date(y - 1, 2, 31);
  if (u.id === 'spt-badan') return new Date(y - 1, 3, 30);
  if (u.id === 'ppn-akhir-bulan') return new Date(y, m, 0);
  return new Date(y, m - 1, d);
};

export const getDaftarTenggat = (now: Date = new Date()): { terlambat: TenggatItem[]; mendatang: TenggatItem[] } => {
  const today = startOfDay(now);
  const done = readTenggat();
  const upcoming = getUpcomingDeadlines(now);

  const overdue: TenggatItem[] = [];
  for (const u of upcoming) {
    const past = previousOccurrence(u);
    if (past < today) {
      const key = tenggatKey(u.id, past);
      overdue.push({ key, label: u.label, date: past, daysLeft: dayDiff(past, today), status: done[key] ? 'selesai' : 'terlambat' });
    }
  }
  overdue.sort((a, b) => b.date.getTime() - a.date.getTime());

  const mendatang: TenggatItem[] = upcoming.slice(0, 5).map((u) => {
    const key = tenggatKey(u.id, u.date);
    let status: StatusTenggat = 'mendatang';
    if (done[key]) status = 'selesai';
    else if (u.daysLeft === 0) status = 'hari-ini';
    else if (u.daysLeft <= 7) status = 'segera';
    return { key, label: u.label, date: u.date, daysLeft: u.daysLeft, status };
  });

  return { terlambat: overdue.slice(0, 2), mendatang: mendatang.slice(0, 4) };
};

// ---------- Tips yang bergilir ----------

export interface KonteksTips {
  adaDokumen: boolean;
  adaSpt: boolean;
  adaDraft: boolean;
  adaBukti: boolean;
  belumTandai: number;
  adaTerlambat: boolean;
}

export const getKonteksTips = (): KonteksTips => {
  const ringkasan = getRingkasanPajak();
  const docs = loadDocs();
  const tax = readJson<{ bukti?: unknown[]; faktur?: unknown[] }>('atlax_pajak_v1');
  let adaDraft = false;
  try {
    adaDraft = !!localStorage.getItem('atlax_tax_draft_v1');
  } catch {
    adaDraft = false;
  }
  return {
    adaDokumen: docs.length > 0,
    adaSpt: docs.some((d) => d.kind === 'SPT'),
    adaDraft,
    adaBukti: (tax?.bukti?.length ?? 0) + (tax?.faktur?.length ?? 0) > 0,
    belumTandai: ringkasan.belum ?? 0,
    adaTerlambat: getDaftarTenggat().terlambat.length > 0,
  };
};

interface TipsItem {
  teks: string;
  tampil: (k: KonteksTips) => boolean;
}

const DAFTAR_TIPS: TipsItem[] = [
  { teks: 'Simpan bukti potong dari kantor. Bukti ini dipakai saat lapor SPT Tahunan.', tampil: (k) => !k.adaBukti },
  { teks: 'Belum pernah lapor di ATLAX? Mulai dari Panduan SPT. Anda cukup menjawab beberapa pertanyaan.', tampil: (k) => !k.adaSpt },
  { teks: 'Ada draf yang belum selesai. Lanjutkan dari Panduan SPT supaya tidak perlu mengisi ulang.', tampil: (k) => k.adaDraft },
  { teks: 'Tandai pembayaran yang sudah disetor di Jadwal bayar, supaya status kewajiban tetap rapi.', tampil: (k) => k.belumTandai > 0 },
  { teks: 'Tenggat yang terlewat bisa kena denda. Lihat besarnya di Jadwal bayar, lalu segera setor.', tampil: (k) => k.adaTerlambat },
  { teks: 'Hasil hitungan adalah perkiraan. Cocokkan dengan bukti potong sebelum melapor.', tampil: () => true },
  { teks: 'Kode billing resmi dibuat di sistem pembayaran, bukan di ATLAX. Catat nomornya di Administrasi.', tampil: (k) => k.adaDokumen },
  { teks: 'Cek penghasilan Anda setiap awal tahun. Status keluarga untuk PTKP juga bisa berubah.', tampil: () => true },
];

// Tips yang relevan dengan kondisi pengguna saat ini. Kalau tidak ada yang cocok, pakai semua.
export const getTipsRelevan = (k: KonteksTips): string[] => {
  const cocok = DAFTAR_TIPS.filter((t) => t.tampil(k)).map((t) => t.teks);
  return cocok.length > 0 ? cocok : DAFTAR_TIPS.map((t) => t.teks);
};
