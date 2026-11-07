import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Lightbulb } from 'lucide-react';

interface ResultExplainerProps {
  // Kalimat-kalimat yang menjelaskan dari angka yang diisi sampai ke hasil akhir
  lines: string[];
  status: 'NIHIL' | 'KURANG_BAYAR' | 'LEBIH_BAYAR';
  statusText: string;
  // Judul dan keterangan dibuat berbeda di tiap layar agar tidak terlihat dobel
  title?: string;
  hint?: string;
}

// Penjelasan urutan hitungan disembunyikan dulu agar layar tidak penuh.
export const ResultExplainer: React.FC<ResultExplainerProps> = ({
  lines,
  status,
  statusText,
  title = 'Urutan hitungan dari angka Anda',
  hint = 'Penjelasan singkat, langkah demi langkah',
}) => {
  const isKurang = status === 'KURANG_BAYAR';
  const isLebih = status === 'LEBIH_BAYAR';
  const borderTone = isKurang ? 'border-rose-200' : isLebih ? 'border-emerald-200' : 'border-sky-200';
  const resultTone = isKurang
    ? 'bg-rose-50 text-rose-900'
    : isLebih
    ? 'bg-emerald-50 text-emerald-900'
    : 'bg-sky-50 text-sky-900';
  const ResultIcon = isKurang ? AlertTriangle : CheckCircle2;

  return (
    <details className={`card group overflow-hidden p-0 ${borderTone}`}>
      <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 p-5 transition-colors hover:bg-violet-50">
        <span className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
            <Lightbulb className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="t-body block font-bold text-slate-900">{title}</span>
            <span className="t-note block">{hint}</span>
          </span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800 transition-transform duration-300 group-open:rotate-180">
          <ChevronDown className="h-5 w-5" />
        </span>
      </summary>
      <div className="space-y-5 border-t border-slate-100 px-5 pb-6 pt-5">
        <ol className="space-y-4">
          {lines.map((line, index) => (
            <li
              key={index}
              className="module-enter flex items-start gap-4"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="t-label mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white">
                {index + 1}
              </span>
              <span className="t-body min-w-0">{line}</span>
            </li>
          ))}
        </ol>
        <p className={`t-body flex items-start gap-3 rounded-2xl px-4 py-4 font-bold ${resultTone}`}>
          <ResultIcon className="mt-1 h-6 w-6 shrink-0" />
          <span>{statusText}</span>
        </p>
      </div>
    </details>
  );
};
