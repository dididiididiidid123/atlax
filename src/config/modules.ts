import {
  BookOpen, Calculator, CalendarClock, ClipboardList, Compass, FolderOpen, LucideIcon, Receipt, Settings,
} from 'lucide-react';

// SATU SUMBER definisi modul. Judul, keterangan, warna, dan langkah semua dibaca dari sini.
// Untuk menambah atau mengubah modul, cukup ubah file ini dan menu di beranda ikut berubah.

export type ModeKey = 'WIZARD' | 'MULTI_TAX' | 'DRAFT' | 'DOKUMEN' | 'ACCOUNTING' | 'ADMIN' | 'PKP' | 'SETTINGS';

export interface ModuleDef {
  key: ModeKey;
  title: string; // judul di layar awal dan pembuka modul
  short: string; // nama pendek
  tag: string; // label kecil di kartu
  sub: string; // penjelasan satu kalimat
  icon: LucideIcon;
  steps: string[]; // langkah di pembuka modul
  style: {
    grad: string; // warna tombol dan ikon
    chip: string; // warna label kecil
    text: string; // warna judul bagian
    bar: string; // garis atas kartu
    soft: string; // latar lembut
  };
}

export const MODULES: ModuleDef[] = [
  {
    key: 'WIZARD',
    title: 'Hitung pajak tahunan saya',
    short: 'Panduan SPT',
    tag: 'Paling mudah',
    sub: 'Jawab 4 langkah pertanyaan. Kami hitung dan tunjukkan hasilnya.',
    icon: Compass,
    steps: ['Data diri', 'Penghasilan', 'Hasil', 'Ringkasan'],
    style: { grad: 'from-sky-600 to-sky-700', chip: 'bg-sky-100 text-sky-900', text: 'text-sky-800', bar: 'bg-sky-300', soft: 'from-sky-50 to-slate-50' },
  },
  {
    key: 'MULTI_TAX',
    title: 'Hitung pajak tertentu',
    short: 'Kalkulator Pajak',
    tag: 'Gaji, jasa, usaha',
    sub: 'Pilih jenis pajak, isi angkanya, lalu lihat hasilnya.',
    icon: Calculator,
    steps: ['Pilih jenis pajak', 'Isi angkanya', 'Lihat hasilnya'],
    style: { grad: 'from-violet-600 to-violet-700', chip: 'bg-violet-100 text-violet-900', text: 'text-violet-800', bar: 'bg-violet-300', soft: 'from-violet-50 to-slate-50' },
  },
  {
    key: 'DRAFT',
    title: 'Jadwal bayar dan penjelasan pajak',
    short: 'Jadwal Bayar',
    tag: 'Tanggal penting',
    sub: 'Jadwal tenggat, denda, dan penjelasan pajak.',
    icon: CalendarClock,
    steps: ['Cek jadwal tenggat', 'Baca penjelasan pajak', 'Cek denda keterlambatan'],
    style: { grad: 'from-teal-600 to-teal-700', chip: 'bg-teal-100 text-teal-900', text: 'text-teal-800', bar: 'bg-teal-300', soft: 'from-teal-50 to-slate-50' },
  },
  {
    key: 'DOKUMEN',
    title: 'Dokumen SPT, SSP, SKP, dan STP',
    short: 'Dokumen Pajak',
    tag: 'SPT dan setoran',
    sub: 'SPT Tahunan dan SSP, SKP, STP dibuat otomatis dari hitungan Anda, lalu bisa disimpan.',
    icon: FolderOpen,
    steps: ['Lihat dokumen otomatis', 'Simpan dokumen', 'Cetak atau hapus'],
    style: { grad: 'from-emerald-600 to-emerald-700', chip: 'bg-emerald-100 text-emerald-900', text: 'text-emerald-800', bar: 'bg-emerald-300', soft: 'from-emerald-50 to-slate-50' },
  },
  {
    key: 'ACCOUNTING',
    title: 'Catat keuangan usaha',
    short: 'Pembukuan Usaha',
    tag: 'Untuk usaha',
    sub: 'Catat uang masuk dan keluar, lalu lihat ringkasannya.',
    icon: BookOpen,
    steps: ['Catat transaksi', 'Periksa dan simpan', 'Lihat laporan'],
    style: { grad: 'from-amber-600 to-amber-700', chip: 'bg-amber-100 text-amber-950', text: 'text-amber-900', bar: 'bg-amber-300', soft: 'from-amber-50 to-slate-50' },
  },
  {
    key: 'ADMIN',
    title: 'Simpan bukti potong dan faktur',
    short: 'Bukti & Faktur',
    tag: 'Bukti pajak',
    sub: 'Simpan bukti potong, faktur pajak, dan kode bayar.',
    icon: ClipboardList,
    steps: ['Pilih jenis dokumen', 'Isi nomor dan nominal', 'Simpan dan unduh rekap'],
    style: { grad: 'from-rose-600 to-rose-700', chip: 'bg-rose-100 text-rose-900', text: 'text-rose-800', bar: 'bg-rose-300', soft: 'from-rose-50 to-slate-50' },
  },
  {
    key: 'PKP',
    title: 'Catat penjualan dengan PPN',
    short: 'PKP & PPN',
    tag: 'Usaha ber-PPN',
    sub: 'Catat penjualan dan pembelian, dengan atau tanpa PPN.',
    icon: Receipt,
    steps: ['Pilih status PKP', 'Catat transaksi', 'Lihat jurnal dan PPN'],
    style: { grad: 'from-indigo-600 to-indigo-700', chip: 'bg-indigo-100 text-indigo-900', text: 'text-indigo-800', bar: 'bg-indigo-300', soft: 'from-indigo-50 to-slate-50' },
  },
  {
    key: 'SETTINGS',
    title: 'Pengaturan',
    short: 'Pengaturan',
    tag: 'Tampilan dan akun',
    sub: 'Atur ukuran huruf, warna, nama sapaan, dan status akun.',
    icon: Settings,
    steps: ['Atur tampilan', 'Isi nama sapaan', 'Lihat status akun'],
    style: { grad: 'from-slate-600 to-slate-700', chip: 'bg-slate-100 text-slate-900', text: 'text-slate-800', bar: 'bg-slate-300', soft: 'from-slate-50 to-slate-50' },
  },
];

export const getModule = (key: ModeKey): ModuleDef => MODULES.find((m) => m.key === key) ?? MODULES[0];
