import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, BookOpen, HelpCircle, Check } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GLOSSARY_ITEMS = [
  {
    term: 'PTKP (Penghasilan Tidak Kena Pajak)',
    meaning: 'Batas penghasilan yang bebas pajak. Contoh: untuk orang lajang tanpa tanggungan (TK/0), batasnya Rp 54 juta per tahun (Rp 4,5 juta per bulan). Kalau penghasilan Anda di bawah batas ini, pajak Anda Rp 0 (nihil).',
    category: 'Dasar',
  },
  {
    term: 'PKP (Penghasilan Kena Pajak)',
    meaning: 'Penghasilan yang benar-benar kena pajak. Didapat dari penghasilan bersih dikurangi PTKP. Angka ini lalu dikalikan tarif pajak yang bertingkat (5%, 15%, 25%, dan seterusnya).',
    category: 'Perhitungan',
  },
  {
    term: 'Bruto dan netto',
    meaning: 'Bruto adalah seluruh uang yang Anda terima, sebelum dipotong apa pun. Netto adalah penghasilan bersih, yaitu bruto dikurangi biaya yang boleh dikurangkan, misalnya biaya jabatan.',
    category: 'Dasar',
  },
  {
    term: 'TER (Tarif Efektif Rata-Rata, PP 58/2023)',
    meaning: 'Cara potong pajak bulanan dari gaji yang berlaku sejak 2024. Perusahaan memotong pajak dengan tarif tetap setiap bulan, lalu disesuaikan di bulan Desember.',
    category: 'Karyawan',
  },
  {
    term: 'Bukti Potong 1721-A1 / 1721-A2',
    meaning: 'Surat dari kantor tempat Anda bekerja, biasanya diberikan di awal tahun. Isinya total gaji Anda setahun dan pajak yang sudah dipotong atas nama Anda. Dipakai saat lapor SPT Tahunan.',
    category: 'Karyawan',
  },
  {
    term: 'Fasilitas bebas pajak UMKM (PP 55/2022)',
    meaning: 'Untuk pemilik usaha kecil (UMKM) orang pribadi. Omzet sampai Rp 500 juta per tahun tidak kena PPh Final (0%). Pajak 0,5% hanya dihitung dari kelebihan omzet di atas Rp 500 juta.',
    category: 'UMKM',
  },
  {
    term: 'NPPN (Norma Penghitungan Penghasilan Neto)',
    meaning: 'Cara hitung cepat untuk pekerja bebas, misalnya freelancer, dokter, atau konsultan. Anda tidak perlu mencatat semua biaya. Pemerintah menetapkan persentase tetap (misalnya 50%), lalu penghasilan bersih dihitung dari omzet dikali persentase itu.',
    category: 'Freelance',
  },
  {
    term: 'Coretax DJP',
    meaning: 'Sistem pajak digital resmi dari Direktorat Jenderal Pajak (DJP). Dipakai untuk lapor SPT, bayar pajak, dan mengurus data wajib pajak.',
    category: 'Sistem',
  },
];

// Warna label kategori: setiap kelompok punya warna lembut sendiri, dan teks tetap dibaca dari namanya.
const CATEGORY_TONE: Record<string, string> = {
  Dasar: 'bg-sky-100 text-sky-900',
  Perhitungan: 'bg-teal-100 text-teal-900',
  Karyawan: 'bg-emerald-100 text-emerald-900',
  UMKM: 'bg-amber-100 text-amber-950',
  Freelance: 'bg-violet-100 text-violet-900',
  Sistem: 'bg-slate-100 text-slate-800',
};

const FAQS = [
  {
    q: 'Apakah gaji di bawah Rp 4,5 juta per bulan tetap wajib lapor SPT?',
    a: 'Kalau NPWP atau NIK Anda sudah terdaftar dan aktif, Anda tetap wajib lapor SPT Tahunan, walaupun hasilnya nihil (Rp 0). Kalau Anda sudah tidak punya penghasilan, Anda bisa mengajukan status Non-Efektif (NE).',
  },
  {
    q: 'Apa bedanya ATLAX dengan situs resmi DJP Online?',
    a: 'ATLAX membantu menyederhanakan istilah, menghitung rumus pajak secara otomatis, dan menyiapkan draf angkanya. Setelah angkanya siap, Anda isi ulang di portal resmi DJP Online atau Coretax.',
  },
  {
    q: 'Bagaimana kalau saya karyawan sekaligus punya toko online?',
    a: 'Laporkan penghasilan karyawan Anda dari bukti potong 1721-A1. Lalu tambahkan omzet toko online Anda di formulir 1770, pada bagian penghasilan final UMKM (PP 55/2022).',
  },
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'glossary' | 'faq'>('glossary');

  if (!isOpen) return null;

  const filteredGlossary = GLOSSARY_ITEMS.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TABS = [
    { id: 'glossary' as const, label: `Arti istilah (${GLOSSARY_ITEMS.length})`, icon: BookOpen },
    { id: 'faq' as const, label: `Tanya jawab (${FAQS.length})`, icon: HelpCircle },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm animate-fadeIn sm:p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

        {/* Judul */}
        <div className="flex items-start justify-between gap-4  p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-800 shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="t-section">Pusat bantuan</h3>
              <p className="mt-1 t-note text-slate-800">Arti istilah pajak dengan bahasa sederhana, dan jawaban untuk pertanyaan umum.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="btn-secondary btn-sm shrink-0 px-2.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pilihan bagian dan pencarian */}
        <div className="flex flex-col gap-4 border-b border-teal-100 bg-teal-50/50 p-4 sm:p-5">
          <div role="tablist" aria-label="Bagian pusat bantuan" className="grid grid-cols-2 gap-3">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`card-lift relative flex min-h-14 items-center gap-3 p-3 text-left sm:p-4 ${
                    active ? 'border-teal-400 bg-teal-50 ring-4 ring-teal-200' : 'hover:border-teal-300'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      active ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="t-body font-extrabold text-slate-900">{tab.label}</span>
                  {active && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === 'glossary' && (
            <div className="space-y-2">
              <label htmlFor="fld-helpcenter-cari" className="block t-label">Cari istilah</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-700" />
                <input
                  id="fld-helpcenter-cari"
                  type="text"
                  placeholder="Contoh: PTKP atau UMKM"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="field w-full pl-12"
                />
              </div>
            </div>
          )}
        </div>

        {/* Isi yang bisa digulir */}
        <div className="module-enter space-y-4 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'glossary' ? (
            <div className="space-y-4">
              {filteredGlossary.length === 0 ? (
                <p className="rounded-2xl bg-teal-50 p-5 text-center t-body">
                  Istilah "{searchTerm}" tidak ditemukan. Coba kata lain, misalnya "PTKP", "PKP", atau "UMKM".
                </p>
              ) : (
                filteredGlossary.map((item) => (
                  <div key={item.term} className="card space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="t-card">{item.term}</h4>
                      <span className={`chip ${CATEGORY_TONE[item.category] ?? CATEGORY_TONE.Sistem}`}>{item.category}</span>
                    </div>
                    <p className="t-body">{item.meaning}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.q} className="card space-y-3 bg-teal-50/60">
                  <h4 className="flex items-start gap-2 t-card">
                    <span className="shrink-0 text-teal-800">Tanya:</span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="t-body">
                    <span className="font-bold text-teal-900">Jawab:</span> {faq.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tombol tutup besar di bawah */}
        <div className="border-t border-slate-200 p-4 sm:p-5">
          <button type="button" onClick={onClose} className="btn-secondary w-full">
            Tutup
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
