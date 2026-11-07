import React, { useState } from 'react';
import { Bot, Send, User, ThumbsUp, ThumbsDown } from 'lucide-react';

// Pemandu masalah: pengguna menceritakan masalahnya dengan kata-kata sendiri,
// lalu pemandu memberi penjelasan dan tombol untuk langsung membuka bagian yang tepat.
// Dibuat dengan aturan kata kunci (tanpa AI), jadi jawabannya selalu sama dan tidak mengirim data keluar.

export type GuideTarget = 'WIZARD' | 'MULTI_TAX' | 'DRAFT' | 'DOKUMEN' | 'SETTINGS' | 'ACCOUNTING' | 'ADMIN' | 'PKP' | 'REMINDER' | 'HELP' | 'LEARN';

interface Rule {
  keywords: string[];
  answer: string;
  actions: { label: string; target: GuideTarget }[];
}

const RULES: Rule[] = [
  // Daftar fitur ATLAX: pengguna bisa bertanya "fitur apa saja" atau "bisa apa"
  {
    keywords: ['fitur', 'bisa apa', 'apa saja', 'menu', 'bisa ngapain', 'kegunaan', 'apa aja'],
    answer: 'ATLAX punya enam modul utama: Panduan SPT (hitung pajak tahunan langkah demi langkah), Kalkulator (pajak tertentu), Draf dan jadwal, Pembukuan, Administrasi Pajak, dan Pembukuan PKP. Pilih yang sesuai kebutuhan Anda.',
    actions: [
      { label: 'Panduan SPT', target: 'WIZARD' },
      { label: 'Kalkulator', target: 'MULTI_TAX' },
      { label: 'Draf dan jadwal', target: 'DRAFT' },
      { label: 'Pembukuan', target: 'ACCOUNTING' },
      { label: 'Administrasi Pajak', target: 'ADMIN' },
      { label: 'Pembukuan PKP', target: 'PKP' },
    ],
  },
  {
    keywords: ['hitung', 'kalkulator', 'pph', 'berapa pajak'],
    answer: 'Untuk menghitung pajak tertentu, buka Kalkulator. Di sana Anda pilih jenis pajaknya, lalu isi angkanya.',
    actions: [{ label: 'Buka Kalkulator', target: 'MULTI_TAX' }],
  },
  {
    keywords: ['cetak', 'print', 'pdf', 'simpan pdf'],
    answer: 'Cetak atau simpan sebagai PDF tersedia di Panduan SPT (lembar ringkasan), Kalkulator (ringkasan), Draf, dan Administrasi. Cari tombol Cetak atau Cetak ringkasan.',
    actions: [{ label: 'Panduan SPT', target: 'WIZARD' }, { label: 'Dokumen', target: 'DOKUMEN' }],
  },
  {
    keywords: ['excel', 'csv', 'ekspor', 'unduh', 'download'],
    answer: 'Data bisa diekspor ke Excel dengan tombol Ekspor Excel di Administrasi Pajak dan Pembukuan.',
    actions: [{ label: 'Administrasi Pajak', target: 'ADMIN' }, { label: 'Pembukuan', target: 'ACCOUNTING' }],
  },
  {
    keywords: ['cadangan', 'backup', 'data hilang', 'pindah hp', 'pindah perangkat', 'pulihkan', 'hilang'],
    answer: 'Data tersimpan di perangkat ini. Buat cadangan di bagian Cadangan data pada menu Draf dan jadwal, supaya tidak hilang saat pindah perangkat.',
    actions: [{ label: 'Buka Draf dan jadwal', target: 'DRAFT' }],
  },
  {
    keywords: ['ukuran', 'huruf', 'gelap', 'terang', 'mode', 'warna', 'tampilan'],
    answer: 'Ukuran huruf dan warna (terang atau gelap) bisa diatur lewat tombol Tampilan di bagian atas halaman.',
    actions: [],
  },
  {
    keywords: ['kalender', 'ingatkan', 'pengingat', 'notifikasi', 'reminder'],
    answer: 'Pengingat tanggal bayar bisa diunduh ke kalender lewat menu Jadwal bayar, di tab Pengingat.',
    actions: [{ label: 'Buka Jadwal bayar', target: 'REMINDER' }],
  },
  {
    keywords: ['restitusi', 'kelebihan bayar', 'lebih bayar'],
    answer: 'Kelebihan bayar pajak diurus lewat tab Lainnya di Administrasi Pajak (restitusi dan tagihan).',
    actions: [{ label: 'Administrasi Pajak', target: 'ADMIN' }],
  },
  {
    keywords: ['billing', 'kode bayar', 'e-billing', 'setor', 'bayar pajak'],
    answer: 'Kode bayar (e-Billing) dicatat di Administrasi Pajak, tab Bayar pajak.',
    actions: [{ label: 'Administrasi Pajak', target: 'ADMIN' }],
  },
  {
    keywords: ['kepatuhan', 'dashboard', 'sudah lapor', 'status lapor'],
    answer: 'Status kewajiban tiap bulan ada di dashboard kepatuhan, pada menu Draf dan jadwal.',
    actions: [{ label: 'Buka Draf dan jadwal', target: 'DRAFT' }],
  },
  {
    keywords: ['jurnal', 'posting', 'buku besar', 'neraca', 'laporan keuangan'],
    answer: 'Jurnal dicatat dan diposting di Pembukuan. Laporan keuangan dan buku besar ada di tab Laporan.',
    actions: [{ label: 'Buka Pembukuan', target: 'ACCOUNTING' }],
  },
  {
    keywords: ['coretax', 'djp', 'djp online', 'kirim spt', 'lapor online'],
    answer: 'ATLAX menghitung dan menyiapkan draf saja. Pelaporan resmi dilakukan lewat DJP Online atau Coretax. ATLAX tidak mengirim SPT atau pembayaran.',
    actions: [{ label: 'Lihat dokumen', target: 'DOKUMEN' }, { label: 'Pusat bantuan', target: 'HELP' }],
  },
  {
    keywords: ['bingung', 'mulai', 'tidak tahu', 'gatau', 'ga tahu', 'pemula', 'baru'],
    answer: 'Mulai dari Panduan SPT. Anda hanya menjawab beberapa pertanyaan, dan aplikasi menghitung serta menunjukkan hasilnya.',
    actions: [{ label: 'Buka Panduan SPT', target: 'WIZARD' }, { label: 'Pelajari istilah dulu', target: 'LEARN' }],
  },
  {
    keywords: ['lapor', 'spt', 'tahunan'],
    answer: 'Untuk lapor SPT Tahunan, mulai dari Panduan. Hasilnya bisa disalin atau dicetak sebagai bahan untuk lapor.',
    actions: [{ label: 'Buka Panduan SPT', target: 'WIZARD' }, { label: 'Lihat draf SPT', target: 'DOKUMEN' }],
  },
  {
    keywords: ['gaji', 'karyawan', 'pph 21', 'pph21', 'slip', 'kantor'],
    answer: 'Pajak gaji dihitung dengan PPh 21. Di Kalkulator, pilih PPh 21 lalu isi gaji bulanan dan bonus.',
    actions: [{ label: 'Buka Kalkulator PPh 21', target: 'MULTI_TAX' }],
  },
  {
    keywords: ['telat', 'lupa', 'tenggat', 'batas', 'denda', 'jatuh tempo', 'kapan bayar', 'bayar'],
    answer: 'Cek jadwal bayar dan denda di menu Jadwal bayar. Di sana ada tanggal terdekat dan perkiraan denda jika terlambat.',
    actions: [{ label: 'Buka Jadwal bayar', target: 'REMINDER' }],
  },
  {
    keywords: ['usaha kecil', 'toko', 'omzet', 'umkm', 'warung', 'jualan'],
    answer: 'Untuk usaha kecil dengan omzet, gunakan Kalkulator UMKM. Catat juga uang masuk dan keluar di Pembukuan agar mudah dilaporkan.',
    actions: [{ label: 'Buka Kalkulator', target: 'MULTI_TAX' }, { label: 'Buka Pembukuan', target: 'ACCOUNTING' }],
  },
  {
    keywords: ['ppn', 'pkp', 'faktur', 'pengusaha kena pajak'],
    answer: 'Usaha yang memungut PPN disebut PKP. Atur status PKP di Pembukuan PKP, lalu buat faktur pajak di Administrasi.',
    actions: [{ label: 'Buka Pembukuan PKP', target: 'PKP' }, { label: 'Buka Administrasi', target: 'ADMIN' }],
  },
  {
    keywords: ['bukti potong', 'bupot', 'potong', 'pemotongan'],
    answer: 'Bukti potong dicatat di Administrasi Pajak, di tab Bukti potong. Isi nomor dan nilai yang dipotong.',
    actions: [{ label: 'Buka Administrasi Pajak', target: 'ADMIN' }],
  },
  {
    keywords: ['salah', 'keliru', 'ubah', 'hapus', 'revisi', 'ganti'],
    answer: 'Isian bisa diubah kapan saja. Jurnal yang sudah diposting diperbaiki lewat Revisi atau Pembalikan di Pembukuan, bukan diubah langsung.',
    actions: [{ label: 'Buka Pembukuan', target: 'ACCOUNTING' }],
  },
  {
    keywords: ['artinya', 'apa itu', 'istilah', 'ptkp', 'dpp', 'npwp', 'nik', 'kode billing'],
    answer: 'Arti istilah pajak ada di Pelajari pajak, dengan bahasa sederhana.',
    actions: [{ label: 'Pelajari pajak', target: 'LEARN' }, { label: 'Pusat bantuan', target: 'HELP' }],
  },
];

const FALLBACK: Rule = {
  keywords: [],
  answer: 'Maaf, saya belum paham maksudnya. Coba ceritakan dengan kata lain, atau pilih salah satu cara di bawah.',
  actions: [{ label: 'Buka Panduan SPT', target: 'WIZARD' }, { label: 'Pusat bantuan', target: 'HELP' }],
};

const QUICK = ['Saya mau lapor SPT Tahunan', 'Saya lupa batas bayar', 'Saya punya usaha kecil', 'Saya salah isi angka', 'Fitur apa saja di ATLAX?'];

// Mencari aturan yang paling cocok. Jika cerita menyebut dua hal, dua jawaban digabung.
const findRule = (text: string): Rule => {
  const t = text.toLowerCase();
  const scored = RULES.map((r) => ({ r, score: r.keywords.filter((k) => t.includes(k)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return FALLBACK;
  const top = scored.slice(0, 2).map((x) => x.r);
  const actions = top.flatMap((r) => r.actions);
  const unique = actions.filter((a, i) => actions.findIndex((b) => b.target === a.target) === i).slice(0, 6);
  return {
    keywords: [],
    answer: top.map((r) => r.answer).join(' '),
    actions: unique,
  };
};

interface ProblemGuideProps {
  onNavigate: (target: GuideTarget) => void;
}

type Message = { from: 'user' | 'bot'; text: string; rule?: Rule; feedback?: 'yes' | 'no' };

export const ProblemGuide: React.FC<ProblemGuideProps> = ({ onNavigate }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const ask = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const rule = findRule(clean);
    setMessages((prev) => [...prev, { from: 'user', text: clean }, { from: 'bot', text: rule.answer, rule }]);
    setInput('');
  };

  const feedback = (index: number, value: 'yes' | 'no') => {
    setMessages((prev) => {
      const next = prev.map((m, i) => (i === index ? { ...m, feedback: value } : m));
      const reply: Message =
        value === 'yes'
          ? { from: 'bot', text: 'Senang bisa membantu. Anda bisa langsung membuka menunya di atas.' }
          : { from: 'bot', text: 'Coba ceritakan lagi dengan kata lain, misalnya "saya ingin tahu pajak gaji saya".' };
      return [...next, reply];
    });
  };

  return (
    <section className="card">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Bot className="h-6 w-6" />
        </span>
        <div>
          <p className="t-card">Ada masalah pajak? Ceritakan di sini</p>
          <p className="t-note">Tulis dengan kata-kata Anda. Pemandu akan menunjukkan bagian yang tepat.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => ask(q)} className="btn-soft btn-sm">{q}</button>
        ))}
      </div>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label htmlFor="fld-problem-guide" className="sr-only">Ceritakan masalah Anda</label>
        <input
          id="fld-problem-guide"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Contoh: saya lupa tanggal bayar pajak gaji"
          className="field"
        />
        <button type="submit" className="btn-primary sm:w-auto" disabled={!input.trim()}>
          <Send className="h-5 w-5" />
          <span>Kirim</span>
        </button>
      </form>

      {messages.length > 0 && (
        <div className="mt-5 space-y-4">
          {messages.map((m, index) =>
            m.from === 'user' ? (
              <div key={index} className="module-enter flex justify-end gap-3">
                <p className="t-body max-w-md rounded-2xl rounded-tr-sm bg-slate-900 px-4 py-3 font-bold text-white">{m.text}</p>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                  <User className="h-5 w-5" />
                </span>
              </div>
            ) : (
              <div key={index} className="module-enter space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div className="max-w-2xl space-y-3 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3">
                    <p className="t-body text-slate-900">{m.text}</p>
                    {m.rule && m.feedback === undefined && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="t-note">Apakah ini membantu?</span>
                        <button type="button" onClick={() => feedback(index, 'yes')} className="btn-success btn-sm">
                          <ThumbsUp className="h-5 w-5" /> Ya
                        </button>
                        <button type="button" onClick={() => feedback(index, 'no')} className="btn-secondary btn-sm">
                          <ThumbsDown className="h-5 w-5" /> Belum
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {m.rule && m.rule.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-12">
                    {m.rule.actions.map((a) => (
                      <button key={a.label} type="button" onClick={() => onNavigate(a.target)} className="btn-primary btn-sm">
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
};
