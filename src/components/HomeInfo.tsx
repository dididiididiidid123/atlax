import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Clock, FileCheck, Lightbulb, MessageCircleQuestion, RefreshCw } from 'lucide-react';
import { BERANDA } from '../config/beranda';
import { ModeKey } from '../config/modules';
import { getYearProgress } from '../utils/progress';
import { DOKUMEN_EVENT, SavedDoc, SavedKind, loadDocs } from '../utils/dokumenStore';
import { PROFIL_EVENT, getNamaSapaan } from '../utils/profil';
import { formatRupiah } from '../utils/taxCalculator';
import {
  StatusTenggat,
  TENGGAT_EVENT,
  TenggatItem,
  getDaftarTenggat,
  getKonteksTips,
  getTipsRelevan,
  setTenggatSelesai,
} from '../utils/berandaData';

interface HomeInfoProps {
  onOpen: (key: ModeKey) => void;
  onOpenHelp: () => void;
  namaFormulir?: string;
}

const KINDS: SavedKind[] = ['SPT', 'SSP', 'SKP', 'STP'];

// Warna lembut dan fungsi tiap dokumen
const KIND_STYLE: Record<SavedKind, { bg: string; text: string; hint: string }> = {
  SPT: { bg: 'bg-violet-50', text: 'text-violet-800', hint: 'Laporan tahunan' },
  SSP: { bg: 'bg-emerald-50', text: 'text-emerald-800', hint: 'Bukti setoran' },
  SKP: { bg: 'bg-amber-50', text: 'text-amber-900', hint: 'Ketetapan KPP' },
  STP: { bg: 'bg-rose-50', text: 'text-rose-800', hint: 'Tagihan KPP' },
};

const STATUS_CHIP: Record<StatusTenggat, { label: string; cls: string }> = {
  terlambat: { label: 'Terlambat', cls: 'bg-rose-100 text-rose-900' },
  'hari-ini': { label: 'Jatuh tempo hari ini', cls: 'bg-amber-100 text-amber-900' },
  segera: { label: 'Segera jatuh tempo', cls: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200' },
  mendatang: { label: 'Mendatang', cls: 'bg-slate-100 text-slate-800' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-900' },
};

const tanggalLengkap = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

// Ilustrasi sederhana: kalkulator, dokumen, grafik, dan kalender dalam warna ATLAX
const Ilustrasi: React.FC = () => (
  <svg viewBox="0 0 240 160" className="h-36 w-56" aria-hidden="true">
    <rect x="14" y="44" width="78" height="100" rx="12" fill="#3558e0" />
    <rect x="26" y="56" width="54" height="22" rx="5" fill="#dbe6ff" />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r}-${c}`} x={26 + c * 19} y={88 + r * 16} width="13" height="10" rx="3" fill="#9db6ff" />
      )),
    )}
    <rect x="96" y="18" width="84" height="108" rx="12" fill="#ffffff" />
    <rect x="108" y="34" width="50" height="6" rx="3" fill="#c9d6f7" />
    <rect x="108" y="48" width="60" height="6" rx="3" fill="#c9d6f7" />
    <rect x="108" y="62" width="40" height="6" rx="3" fill="#c9d6f7" />
    <circle cx="150" cy="102" r="13" fill="#6fd3b0" />
    <path d="M144 102 l4 4 l8 -8" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="182" y="78" width="16" height="36" rx="4" fill="#6fd3b0" />
    <rect x="202" y="60" width="16" height="54" rx="4" fill="#3558e0" />
    <rect x="164" y="92" width="16" height="22" rx="4" fill="#9db6ff" />
    <rect x="160" y="2" width="72" height="54" rx="10" fill="#1d2b57" />
    <rect x="160" y="2" width="72" height="16" rx="8" fill="#6fd3b0" />
    <rect x="172" y="28" width="10" height="8" rx="2" fill="#ffffff" />
    <rect x="188" y="28" width="10" height="8" rx="2" fill="#ffffff" />
    <rect x="204" y="28" width="10" height="8" rx="2" fill="#ffffff" />
  </svg>
);

export const HomeInfo: React.FC<HomeInfoProps> = ({ onOpen, onOpenHelp, namaFormulir = '' }) => {
  const [docs, setDocs] = useState<SavedDoc[]>(loadDocs);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refreshDocs = () => setDocs(loadDocs());
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener(DOKUMEN_EVENT, refreshDocs);
    window.addEventListener(TENGGAT_EVENT, refresh);
    window.addEventListener(PROFIL_EVENT, refresh);
    return () => {
      window.removeEventListener(DOKUMEN_EVENT, refreshDocs);
      window.removeEventListener(TENGGAT_EVENT, refresh);
      window.removeEventListener(PROFIL_EVENT, refresh);
    };
  }, []);

  const nama = getNamaSapaan(namaFormulir);
  const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  const tenggat = useMemo(() => getDaftarTenggat(), [tick]);
  const konteks = useMemo(() => getKonteksTips(), [docs, tick]);
  const tips = useMemo(() => getTipsRelevan(konteks), [konteks]);
  const progress = useMemo(() => getYearProgress(), [tick]);
  const percent = Math.round((progress.filter((p) => p.done).length / progress.length) * 100);
  const istilah = BERANDA.istilah[Math.floor(Date.now() / 86_400_000) % BERANDA.istilah.length];

  // Tips bergilir: mulai dari tips sesuai hari, lalu bisa diganti dengan tombol
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Date.now() / 86_400_000));
  const tipAktif = tips[tipIdx % tips.length];

  const semuaTenggat = [...tenggat.terlambat, ...tenggat.mendatang].slice(0, 4);
  const terdekat = tenggat.mendatang[0];
  const sisa = terdekat ? Math.max(0, Math.min(30, terdekat.daysLeft)) : 30;

  const totalSsp = docs.filter((d) => d.kind === 'SSP').reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const recent = [...docs]
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 2);
  const ring = 2 * Math.PI * 38;

  return (
    <div className="space-y-5">
      {/* Sambutan */}
      <section className="relative overflow-hidden rounded-3xl bg-[#1d2b57] p-6 text-white shadow-soft sm:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="text-sm text-white/70 capitalize">{tanggal}</p>
            <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">Selamat Datang di ATLAX!</h2>
            <p className="font-display text-xl font-bold">Hi, {nama}! 👋</p>
            <p className="max-w-xl text-base leading-relaxed text-white/85">
              Kelola pajak dengan lebih mudah. Pantau, hitung, dan laporkan pajakmu dalam satu tempat.
            </p>
            <button
              type="button"
              onClick={() => onOpen(BERANDA.ajakanModul)}
              className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-[#1d2b57] transition-transform hover:-translate-y-0.5"
            >
              {BERANDA.ajakan}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          <div className="hidden justify-self-end md:block">
            <Ilustrasi />
          </div>
        </div>
      </section>

      {/* Baris 1: tenggat terdekat, kemajuan, istilah */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => onOpen('DRAFT')}
          className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-amber-50 p-6 text-left transition-colors hover:border-amber-300 md:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center gap-2 text-amber-900">
            <Clock className="h-5 w-5" />
            <span className="t-label">Tenggat terdekat</span>
          </div>
          {terdekat ? (
            <div className="mt-4">
              <p className="font-display text-5xl font-extrabold leading-none text-amber-950">
                {terdekat.daysLeft === 0 ? 'Hari ini' : terdekat.daysLeft}
                {terdekat.daysLeft > 0 && <span className="ml-2 text-xl font-bold">hari lagi</span>}
              </p>
              <p className="t-body mt-3 text-amber-950">{terdekat.label}</p>
            </div>
          ) : (
            <p className="t-body mt-4 text-amber-950">Belum ada tenggat dekat.</p>
          )}
          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${100 - (sisa / 30) * 100}%` }} />
            </div>
            <p className="t-note mt-2 text-amber-900">Bilah menunjukkan jarak ke tenggat dalam 30 hari.</p>
          </div>
        </button>

        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-6">
          <p className="t-label text-sky-900">Kemajuan lapor</p>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 96 96" className="h-24 w-24 shrink-0 -rotate-90" aria-hidden="true">
              <circle cx="48" cy="48" r="38" fill="none" stroke="#ffffff" strokeWidth="10" />
              <circle
                cx="48"
                cy="48"
                r="38"
                fill="none"
                stroke="#3558e0"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ring}
                strokeDashoffset={ring - (ring * percent) / 100}
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <p className="font-display text-4xl font-extrabold text-sky-950">{percent}%</p>
          </div>
          <p className="t-note text-sky-900">Langkahnya ada di bagian bawah.</p>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-6">
          <div className="flex items-center gap-2 text-violet-900">
            <BookOpen className="h-5 w-5" />
            <span className="t-label">Istilah hari ini</span>
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold text-violet-950">{istilah.kata}</p>
            <p className="t-note mt-2 text-violet-900">{istilah.arti}</p>
          </div>
          <button type="button" onClick={() => onOpen('DRAFT')} className="btn-secondary btn-sm self-start">
            Pelajari
          </button>
        </div>
      </section>

      {/* Baris 2: dokumen dan tenggat berikutnya */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800">
              <FileCheck className="h-5 w-5" />
              <span className="t-label">Dokumen tersimpan</span>
            </div>
            <span className="t-note">Total setoran SSP: <span className="font-bold text-slate-900">{formatRupiah(totalSsp)}</span></span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KINDS.map((k) => (
              <div key={k} className={`rounded-xl p-4 ${KIND_STYLE[k].bg}`}>
                <p className={`text-sm font-bold ${KIND_STYLE[k].text}`}>{k}</p>
                <p className={`font-display text-3xl font-extrabold ${KIND_STYLE[k].text}`}>{docs.filter((d) => d.kind === k).length}</p>
                <p className={`t-note ${KIND_STYLE[k].text}`}>{KIND_STYLE[k].hint}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="t-note font-bold text-slate-700">Aktivitas terakhir</p>
            {recent.length === 0 ? (
              <p className="t-note text-slate-600">Belum ada dokumen. Simpan hasil dari Kalkulator atau Panduan SPT.</p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                {recent.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="t-note min-w-0 break-words text-slate-900">
                      <span className="font-bold">{d.kind}</span> · {d.title}
                    </span>
                    <span className="t-note shrink-0 font-bold text-slate-900">{formatRupiah(d.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="button" onClick={() => onOpen('DOKUMEN')} className="btn-secondary btn-sm mt-auto self-start">
            Lihat semua dokumen
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="t-label text-slate-800">Tenggat berikutnya</p>
            <button type="button" onClick={() => onOpen('DRAFT')} className="btn-secondary btn-sm">Lihat jadwal</button>
          </div>
          {semuaTenggat.length === 0 ? (
            <p className="t-body mt-5 text-slate-700">Belum ada tenggat dekat.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {semuaTenggat.map((item: TenggatItem, i: number) => {
                const chip = STATUS_CHIP[item.status];
                const selesai = item.status === 'selesai';
                const tonjol = i === 0 && !selesai;
                return (
                  <li key={item.key} className="flex items-center gap-3">
                    <span
                      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                        tonjol ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="font-display text-lg font-extrabold leading-none">{item.date.getDate()}</span>
                      <span className="text-[10px] font-bold uppercase">{item.date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`chip ${chip.cls}`}>{chip.label}</span>
                      <p className="t-body mt-1 font-semibold leading-snug text-slate-900">{item.label}</p>
                      <p className="t-note">{tanggalLengkap(item.date)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTenggatSelesai(item.key, !selesai)}
                      aria-pressed={selesai}
                      aria-label={selesai ? `Batalkan tanda selesai: ${item.label}` : `Tandai selesai: ${item.label}`}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        selesai ? 'border-emerald-300 bg-emerald-100 text-emerald-900' : 'border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      {/* Baris 3: tips dan bantuan */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-900">
              <Lightbulb className="h-5 w-5" />
              <span className="t-label">Tips</span>
            </div>
            <p className="t-body text-teal-950">{tipAktif}</p>
          </div>
          <button type="button" onClick={() => setTipIdx((i) => i + 1)} className="btn-secondary btn-sm self-start">
            <RefreshCw className="h-4 w-4" />
            Tips berikutnya
          </button>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <MessageCircleQuestion className="h-6 w-6" />
            </span>
            <div>
              <p className="t-body text-white/90">Kesulitan atau bingung? Ceritakan dengan kata-kata Anda.</p>
              <button type="button" onClick={onOpenHelp} className="mt-1 text-sm font-bold text-white/80 underline">
                Pusat bantuan
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('atlax:open-guide'))}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-5 py-3 text-base font-bold text-slate-900 transition-transform hover:translate-x-0.5"
          >
            Tanya pemandu
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
};
