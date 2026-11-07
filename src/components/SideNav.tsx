import React, { useEffect, useState } from 'react';
import { Home, LucideIcon, Settings, X } from 'lucide-react';
import { MODULES, ModeKey } from '../config/modules';

interface SideNavProps {
  activeMode: ModeKey | null;
  onHome: () => void;
  onSelect: (key: ModeKey) => void;
}

// Menu utama. Di komputer berupa kolom kiri berisi semua menu.
// Di HP berupa bilah bawah dengan dua tombol: Beranda dan Pengaturan.
// Daftar semua modul dibuka dari tombol menu (hamburger) di pojok kiri atas, lewat event "atlax:open-menu".
export const SideNav: React.FC<SideNavProps> = ({ activeMode, onHome, onSelect }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const open = () => setMenuOpen(true);
    window.addEventListener('atlax:open-menu', open);
    return () => window.removeEventListener('atlax:open-menu', open);
  }, []);

  const pick = (key: ModeKey) => {
    setMenuOpen(false);
    onSelect(key);
  };

  return (
    <>
      {/* Kolom kiri: komputer */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <img src="/atlax-logo.svg" alt="" className="h-10 w-10" />
          <div>
            <p className="text-xl font-extrabold leading-tight text-slate-900">ATLAX</p>
            <p className="text-sm text-slate-600">Bantu hitung pajak</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Menu utama">
          <NavItem label="Beranda" icon={Home} active={activeMode === null} onClick={onHome} />
          <p className="mt-6 px-3 pb-1 text-sm font-bold uppercase tracking-wide text-slate-500">Modul</p>
          {MODULES.map((m) => (
            <NavItem key={m.key} label={m.short} icon={m.icon} active={activeMode === m.key} onClick={() => onSelect(m.key)} />
          ))}
        </nav>
      </aside>

      {/* Bilah bawah: HP. Dua tombol: Beranda dan Pengaturan. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-slate-50/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden"
        aria-label="Menu utama"
      >
        <BarItem label="Beranda" icon={Home} active={activeMode === null} onClick={onHome} />
        <BarItem label="Pengaturan" icon={Settings} active={activeMode === 'SETTINGS'} onClick={() => pick('SETTINGS')} />
      </nav>

      {/* Daftar semua menu: dibuka dari tombol menu di pojok kiri atas */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Semua menu"
            className="module-enter w-full rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="t-card">Semua menu</p>
              <button type="button" onClick={() => setMenuOpen(false)} className="btn-secondary btn-sm" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {MODULES.filter((m) => m.key !== 'SETTINGS').map((m) => {
                const Icon = m.icon;
                const active = activeMode === m.key;
                return (
                  <li key={m.key}>
                    <button
                      type="button"
                      onClick={() => pick(m.key)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                        active ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="t-label leading-tight text-slate-900">{m.short}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

const NavItem: React.FC<{ label: string; icon: LucideIcon; active: boolean; onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`relative flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 py-2 text-left text-base font-semibold transition-all duration-200 active:scale-[0.97] ${
      active ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100'
    }`}
  >
    <span
      aria-hidden="true"
      className={`absolute left-0 top-2 bottom-2 w-1 rounded-full bg-brand-600 transition-all duration-300 ${
        active ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
      }`}
    />
    <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? 'scale-110 text-brand-700' : 'text-slate-500'}`} />
    <span>{label}</span>
  </button>
);

const BarItem: React.FC<{ label: string; icon: LucideIcon; active: boolean; onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 transition-colors active:scale-[0.96] ${
      active ? 'text-brand-700' : 'text-slate-500'
    }`}
  >
    <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? 'bg-brand-100' : ''}`}>
      <Icon className="h-5 w-5" />
    </span>
    <span className={`max-w-full whitespace-nowrap text-[0.68rem] font-semibold leading-tight ${active ? 'text-brand-800' : ''}`}>{label}</span>
  </button>
);
