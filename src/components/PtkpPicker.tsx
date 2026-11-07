import React from 'react';
import { Check } from 'lucide-react';
import { PTKPStatus } from '../types/tax';
import { PTKP_RATES, formatRupiah } from '../utils/taxCalculator';

interface PtkpPickerProps {
  value: PTKPStatus;
  onChange: (status: PTKPStatus) => void;
}

// Kartu pilihan: saat dipilih muncul ring, latar ungu muda, dan tanda centang.
const tileClass = (active: boolean) =>
  `card-lift flex min-h-[64px] w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
    active
      ? 'border-violet-700 bg-violet-50 ring-4 ring-violet-100'
      : 'border-slate-200 bg-white hover:border-violet-300'
  }`;

const CheckBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    aria-hidden="true"
    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
      active ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 bg-white text-transparent'
    }`}
  >
    <Check className="h-4 w-4" strokeWidth={3} />
  </span>
);

const TileButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button type="button" aria-pressed={active} onClick={onClick} className={tileClass(active)}>
    <span className={`t-body font-bold ${active ? 'text-violet-950' : 'text-slate-900'}`}>{label}</span>
    <CheckBadge active={active} />
  </button>
);

// Status PTKP dipilih lewat tiga pertanyaan singkat, bukan daftar 12 status.
export const PtkpPicker: React.FC<PtkpPickerProps> = ({ value, onChange }) => {
  const isMarried = !value.startsWith('TK/');
  const isJoint = value.startsWith('K/I/');
  const dependents = Number(value.slice(-1));

  const set = (married: boolean, joint: boolean, count: number) => {
    const n = Math.min(3, Math.max(0, count));
    const code = !married ? `TK/${n}` : joint ? `K/I/${n}` : `K/${n}`;
    onChange(code as PTKPStatus);
  };

  const info = PTKP_RATES[value] ?? PTKP_RATES['TK/0'];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="t-body font-bold text-slate-900">1. Apakah Anda sudah menikah?</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[{ v: false, l: 'Belum menikah' }, { v: true, l: 'Sudah menikah' }].map((o) => (
            <TileButton
              key={String(o.v)}
              active={isMarried === o.v}
              onClick={() => set(o.v, o.v ? isJoint : false, dependents)}
              label={o.l}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="t-body font-bold text-slate-900">2. Berapa orang yang Anda tanggung?</p>
        <p className="t-note">
          Misalnya orang tua, mertua, atau anak yang seluruh biayanya Anda tanggung. Maksimal 3 orang.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((n) => (
            <TileButton
              key={n}
              active={dependents === n}
              onClick={() => set(isMarried, isJoint, n)}
              label={`${n} orang`}
            />
          ))}
        </div>
      </div>

      {isMarried && (
        <div className="space-y-3">
          <p className="t-body font-bold text-slate-900">3. Penghasilan istri digabung dengan suami?</p>
          <p className="t-note">Pilih &quot;Ya&quot; hanya jika Anda dan istri sama-sama bekerja dan tidak memisahkan harta.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[{ v: false, l: 'Tidak digabung' }, { v: true, l: 'Ya, digabung' }].map((o) => (
              <TileButton
                key={String(o.v)}
                active={isJoint === o.v}
                onClick={() => set(true, o.v, dependents)}
                label={o.l}
              />
            ))}
          </div>
        </div>
      )}

      <div key={value} className="module-enter rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <p className="t-note font-bold text-emerald-900">Batas penghasilan tidak kena pajak Anda per tahun</p>
        <p className="t-section mt-2 break-words text-emerald-900">{formatRupiah(info.amount)}</p>
        <p className="t-note mt-3 text-slate-800">
          Kode status Anda: <span className="font-bold text-slate-900">{value}</span>
        </p>
      </div>
    </div>
  );
};
