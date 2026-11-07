import React, { useEffect, useMemo, useState } from 'react';
import { Bell, HelpCircle, Menu, RotateCcw, MessageCircleQuestion, Search, UserRound } from 'lucide-react';
import { ProblemGuideModal } from './ProblemGuideModal';
import { GuideTarget } from './ProblemGuide';
import { MODULES } from '../config/modules';
import { PROFIL_EVENT, getNamaSapaan } from '../utils/profil';

interface HeaderProps {
  lastSaved: string;
  namaFormulir: string;
  onOpenReminder: () => void;
  onOpenHelp: () => void;
  onReset: () => void;
  onNavigate: (target: GuideTarget) => void;
}

// Bilah atas yang sederhana: cari fitur, pengingat, bantuan, dan profil.
// Pengaturan tampilan sekarang ada di modul Pengaturan (lewat profil atau menu).
export const Header: React.FC<HeaderProps> = ({
  namaFormulir,
  onOpenReminder,
  onOpenHelp,
  onReset,
  onNavigate,
}) => {
  const [guideOpen, setGuideOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [, setTick] = useState(0);

  // Tombol di beranda bisa membuka pemandu lewat event ini
  useEffect(() => {
    const open = () => setGuideOpen(true);
    window.addEventListener('atlax:open-guide', open);
    return () => window.removeEventListener('atlax:open-guide', open);
  }, []);

  // Sapaan ikut berubah saat nama diganti di Pengaturan
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener(PROFIL_EVENT, refresh);
    return () => window.removeEventListener(PROFIL_EVENT, refresh);
  }, []);

  const nama = getNamaSapaan(namaFormulir);
  const hasil = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MODULES.filter((m) => `${m.title} ${m.short} ${m.sub} ${m.tag}`.toLowerCase().includes(q));
  }, [query]);

  const pilih = (key: GuideTarget) => {
    setQuery('');
    onNavigate(key);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
        {/* HP: menu semua modul di pojok kiri atas, lalu logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('atlax:open-menu'))}
            className="btn-secondary btn-sm"
            aria-label="Buka semua menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/atlax-logo.svg" alt="Logo ATLAX" className="h-9 w-9" />
          <span className="text-xl font-extrabold text-slate-900">ATLAX</span>
        </div>

        {/* Cari fitur: di HP turun ke baris kedua */}
        <div className="relative order-last w-full sm:order-none sm:min-w-[14rem] sm:max-w-sm sm:flex-1">
          <label className="relative block">
            <span className="sr-only">Cari fitur atau info pajak</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setQuery('');
                if (e.key === 'Enter' && hasil[0]) pilih(hasil[0].key);
              }}
              placeholder="Cari fitur, misalnya dokumen atau PPN"
              className="field w-full py-2.5 pl-10 pr-4"
            />
          </label>
          {query.trim() !== '' && (
            <ul className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg" role="listbox">
              {hasil.length > 0 ? (
                hasil.map((m) => (
                  <li key={m.key}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pilih(m.key)}
                      className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="t-label text-slate-900">{m.short}</span>
                      <span className="t-note">{m.sub}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery('');
                      setGuideOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <MessageCircleQuestion className="h-5 w-5 text-slate-700" />
                    <span className="t-body">Tidak ketemu. Tanya pemandu tentang "{query.trim()}".</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setGuideOpen(true)} className="btn-primary btn-sm" aria-label="Tanya pemandu" title="Tanya pemandu">
            <MessageCircleQuestion className="h-5 w-5" />
            <span className="hidden 2xl:inline">Tanya pemandu</span>
          </button>

          <button type="button" onClick={onOpenReminder} className="btn-secondary btn-sm" aria-label="Jadwal bayar" title="Jadwal bayar">
            <Bell className="h-5 w-5 text-amber-700" />
            <span className="hidden 2xl:inline">Jadwal bayar</span>
          </button>

          <button type="button" onClick={onOpenHelp} className="btn-secondary btn-sm" aria-label="Bantuan" title="Bantuan">
            <HelpCircle className="h-5 w-5" />
            <span className="hidden 2xl:inline">Bantuan</span>
          </button>

          <button type="button" onClick={onReset} className="btn-secondary btn-sm" title="Kosongkan semua isian dan mulai dari awal" aria-label="Mulai dari awal">
            <RotateCcw className="h-5 w-5" />
            <span className="hidden 2xl:inline">Mulai dari awal</span>
          </button>

          {/* Profil: sapaan dan pintu ke Pengaturan */}
          <button
            type="button"
            onClick={() => onNavigate('SETTINGS')}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-left transition-colors hover:border-brand-300"
            aria-label={`Hi, ${nama}. Buka Pengaturan`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-900">
              <UserRound className="h-5 w-5" />
            </span>
            <span className="hidden text-base font-bold text-slate-900 md:inline">Hi, {nama}</span>
          </button>
        </div>
      </div>

      <ProblemGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} onNavigate={onNavigate} />
    </header>
  );
};
