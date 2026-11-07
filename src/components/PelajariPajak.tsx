import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MATERI_PAJAK } from '../data/materiPajak';

// Satu tombol untuk belajar pajak. Isi materinya diambil dari src/data/materiPajak.ts,
// jadi cukup ganti isi file itu untuk mengubah materi tanpa mengubah tampilan ini.
export const PelajariPajak: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const total = MATERI_PAJAK.length;
  const materi = MATERI_PAJAK[index];

  // Tutup dengan tombol Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, total]);

  const modal = open && (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6 grayscale" role="dialog" aria-modal="true" aria-label="Pelajari pajak">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-600">Pelajari pajak</p>
              <p className="text-sm font-bold text-slate-900">Materi {index + 1} dari {total}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-base font-bold text-slate-800 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
            Tutup
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <label htmlFor="fld-pelajari-materi" className="block text-sm font-bold text-slate-700">Pilih materi</label>
          <select
            id="fld-pelajari-materi"
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="field"
          >
            {MATERI_PAJAK.map((m, i) => (
              <option key={m.judul} value={i}>{i + 1}. {m.judul}</option>
            ))}
          </select>

          <article className="space-y-4">
            <h3 className="text-2xl font-extrabold leading-snug text-slate-900">{materi.judul}</h3>
            <p className="text-lg leading-relaxed text-slate-800">{materi.ringkasan}</p>

            {materi.poin && (
              <ul className="space-y-3">
                {materi.poin.map((p) => (
                  <li key={p} className="flex gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-base leading-relaxed text-slate-800">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-900" aria-hidden="true" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {materi.daftar && (
              <div className="space-y-3">
                {materi.daftar.map((d) => (
                  <div key={d.judul} className="rounded-2xl border-2 border-slate-200 bg-white p-4">
                    <p className="text-base font-extrabold text-slate-900">{d.judul}</p>
                    <p className="mt-1 text-base leading-relaxed text-slate-700">{d.isi}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <p className="text-sm leading-relaxed text-slate-500">
            Ini ringkasan untuk belajar, bukan teks resmi. Cek peraturan terbaru sebelum dipakai untuk kewajiban pajak.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0}
            className="inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl border-2 border-slate-400 bg-white text-base font-extrabold text-slate-900 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
            disabled={index === total - 1}
            className="btn-primary min-h-[3.5rem] text-lg"
          >
            Berikutnya
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        className="flex w-full items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-left text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <span className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50/15">
            <BookOpen className="h-7 w-7" />
          </span>
          <span>
            <span className="block text-xl font-extrabold">Pelajari pajak</span>
            <span className="mt-1 block text-base text-slate-200">Penjelasan singkat dan mudah, dari dasar sampai istilah.</span>
          </span>
        </span>
        <ChevronRight className="h-7 w-7 shrink-0" />
      </button>
      {modal && createPortal(modal, document.body)}
    </>
  );
};
