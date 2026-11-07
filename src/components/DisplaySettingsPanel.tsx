import React, { useState } from 'react';
import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { COLOR_MODES, DISPLAY_SIZES, DisplaySettings, loadDisplay, saveDisplay, ColorMode } from '../utils/display';

const MODE_ICON: Record<ColorMode, React.ComponentType<{ className?: string }>> = {
  terang: Sun,
  gelap: Moon,
  perangkat: Monitor,
};

// Isi pengaturan Tampilan: ukuran huruf dan warna. Pilihan langsung berlaku dan disimpan di perangkat.
// Dipakai di halaman Pengaturan.
export const DisplaySettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<DisplaySettings>(loadDisplay);

  const update = (next: DisplaySettings) => {
    setSettings(next);
    saveDisplay(next);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <p className="t-card">Ukuran huruf</p>
          <p className="t-note">Semua tulisan di aplikasi ikut membesar atau mengecil.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {DISPLAY_SIZES.map((size, index) => {
            const active = settings.size === index;
            return (
              <button
                key={size.label}
                type="button"
                aria-pressed={active}
                onClick={() => update({ ...settings, size: index })}
                className={`card-lift flex flex-col items-center gap-2 p-4 text-center ${
                  active ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100' : ''
                }`}
              >
                <span className="font-black leading-none text-slate-900" style={{ fontSize: size.sample }}>Aa</span>
                <span className="t-label">{size.label}</span>
                {active && (
                  <span className="chip-info chip">
                    <Check className="h-4 w-4" />
                    Dipakai
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="t-card">Warna</p>
          <p className="t-note">Pilih yang paling nyaman untuk mata Anda.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {COLOR_MODES.map((mode) => {
            const active = settings.mode === mode.value;
            const Icon = MODE_ICON[mode.value];
            return (
              <button
                key={mode.value}
                type="button"
                aria-pressed={active}
                onClick={() => update({ ...settings, mode: mode.value })}
                className={`card-lift flex flex-col gap-3 p-4 text-left ${
                  active ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100' : ''
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                    <Icon className="h-6 w-6" />
                  </span>
                  {active && <Check className="h-6 w-6 text-brand-700" />}
                </span>
                <span className="t-card">{mode.label}</span>
                <span className="t-note">{mode.hint}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
