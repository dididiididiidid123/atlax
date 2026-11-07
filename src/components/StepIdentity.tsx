import React, { useState } from 'react';
import { UserTaxProfile, PTKPStatus } from '../types/tax';
import { PTKP_RATES, formatRupiah } from '../utils/taxCalculator';
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronDown, Shield, Users } from 'lucide-react';
import { PtkpPicker } from './PtkpPicker';

interface StepIdentityProps {
  profile: UserTaxProfile;
  onChange: (updated: Partial<UserTaxProfile>) => void;
  onNext: () => void;
}

const labelClass = 't-label mb-2 block';
const hintClass = 't-note mt-2';
const errorClass = 't-note mt-2 font-bold text-rose-800';

const TAX_YEAR_OPTIONS = [
  { value: 2025, label: 'Tahun pajak 2025', hint: 'Lapor paling lambat 31 Maret 2026' },
  { value: 2024, label: 'Tahun pajak 2024', hint: 'Lapor paling lambat 31 Maret 2025' },
  { value: 2023, label: 'Tahun pajak 2023', hint: 'Tahun pajak lama' },
];

// Kartu pilihan: saat dipilih muncul ring, latar biru muda, dan tanda centang.
const tileClass = (active: boolean) =>
  `card-lift flex min-h-[72px] w-full flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
    active ? 'border-sky-700 bg-sky-50 ring-4 ring-sky-100' : 'border-slate-200 bg-white hover:border-sky-300'
  }`;

const CheckBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    aria-hidden="true"
    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
      active ? 'border-sky-700 bg-sky-700 text-white' : 'border-slate-300 bg-white text-transparent'
    }`}
  >
    <Check className="h-4 w-4" strokeWidth={3} />
  </span>
);

export const StepIdentity: React.FC<StepIdentityProps> = ({ profile, onChange, onNext }) => {
  const [activeGroup, setActiveGroup] = useState<'ALL' | 'TK' | 'K' | 'KI'>('ALL');
  const npwpDigits = profile.npwp.replace(/\D/g, '');
  // NPWP bersifat opsional. Yang wajib untuk menyalin atau mencetak laporan: nama dan NIK.
  const isIdentityComplete = profile.fullName.trim().length > 0
    && /^\d{16}$/.test(profile.nik);

  const allStatuses = Object.keys(PTKP_RATES) as PTKPStatus[];
  const filteredStatuses = allStatuses.filter((key) => {
    if (activeGroup === 'ALL') return true;
    return PTKP_RATES[key].categoryGroup === activeGroup;
  });

  const selectedInfo = PTKP_RATES[profile.ptkpStatus] || PTKP_RATES['TK/0'];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Penjelasan satu baris untuk tahap ini */}
      <div className="card relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 " />
        <h2 className="t-section">Langkah 1: isi data diri Anda</h2>
        <p className="t-body mt-3">
          Isi nama dan NIK Anda, lalu jawab tiga pertanyaan status keluarga. Jawaban ini menentukan batas penghasilan yang tidak kena pajak.
        </p>
        <p className="t-note mt-3">
          <span className="font-bold text-sky-800">Apa itu PTKP?</span> Penghasilan tahunan yang tidak dikenai pajak, sesuai status keluarga Anda.
        </p>
      </div>

      {/* Identitas */}
      <div className="card space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fld-stepidentity-3" className={labelClass}>
              Nama lengkap <span className="text-rose-800">(wajib)</span>
            </label>
            <input id="fld-stepidentity-3"
              type="text"
              value={profile.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder="Nama sesuai KTP"
              className="field"
            />
          </div>

          <div>
            <label htmlFor="fld-stepidentity-2" className={labelClass}>
              NIK, 16 digit <span className="text-rose-800">(wajib)</span>
            </label>
            <input id="fld-stepidentity-2"
              type="text"
              inputMode="numeric"
              maxLength={16}
              value={profile.nik}
              onChange={(e) => onChange({ nik: e.target.value.replace(/\D/g, '') })}
              placeholder="Masukkan 16 digit NIK"
              className="field"
            />
            {profile.nik.length > 0 && profile.nik.length !== 16 && (
              <p className={errorClass}>NIK harus terdiri dari 16 digit.</p>
            )}
          </div>

          <div>
            <label htmlFor="fld-stepidentity-1" className={labelClass}>
              NPWP, 15 atau 16 digit <span className="font-normal text-slate-600">(boleh kosong)</span>
            </label>
            <input id="fld-stepidentity-1"
              type="text"
              inputMode="numeric"
              maxLength={16}
              value={profile.npwp.replace(/\D/g, '')}
              onChange={(e) => onChange({ npwp: e.target.value.replace(/\D/g, '').slice(0, 16) })}
              placeholder="Masukkan NPWP jika punya"
              className="field"
            />
            {profile.npwp.length > 0 && npwpDigits.length !== 15 && npwpDigits.length !== 16 && (
              <p className={errorClass}>NPWP harus terdiri dari 15 atau 16 digit.</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <p className="t-body mb-3 font-bold text-slate-900">Laporan ini untuk tahun pajak berapa?</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TAX_YEAR_OPTIONS.map((opt) => {
                const active = profile.taxYear === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ taxYear: opt.value })}
                    className={tileClass(active)}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="t-body font-bold text-slate-900">{opt.label}</span>
                      <CheckBadge active={active} />
                    </span>
                    <span className="t-note">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status PTKP: tiga pertanyaan singkat */}
      <div className="card space-y-6">
        <div>
          <h3 className="t-card text-slate-900">Status keluarga Anda</h3>
          <p className="t-note mt-2">
            Jawab tiga pertanyaan. Batas bebas pajak Anda akan muncul otomatis di bawah.
          </p>
        </div>

        <PtkpPicker
          value={profile.ptkpStatus}
          onChange={(status) => onChange({ ptkpStatus: status })}
        />

        <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 p-4 transition-colors hover:bg-sky-50">
            <span className="min-w-0">
              <span className="t-body block font-bold text-slate-900">Lihat semua 12 status (untuk yang ingin tahu)</span>
              <span className="t-note block">Biasanya tidak perlu. Tiga pertanyaan di atas sudah cukup.</span>
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 transition-transform duration-300 group-open:rotate-180">
              <ChevronDown className="h-5 w-5" />
            </span>
          </summary>
          <div className="space-y-5 px-4 pb-5">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
              <p className="t-body flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
                <span>Dipilih: {selectedInfo.code} ({formatRupiah(selectedInfo.amount)})</span>
              </p>
            </div>

            {/* Filter golongan PTKP */}
            <div className="flex flex-wrap gap-3">
              {([
                { id: 'ALL', label: `Semua (${allStatuses.length})` },
                { id: 'TK', label: 'Belum kawin (TK)' },
                { id: 'K', label: 'Kawin, suami bekerja (K)' },
                { id: 'KI', label: 'Kawin, penghasilan istri digabung (K/I)' },
              ] as const).map((g) => {
                const active = activeGroup === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveGroup(g.id)}
                    className={`t-note min-h-[44px] rounded-full border-2 px-4 py-2 font-bold transition-all duration-200 ${
                      active
                        ? 'border-sky-700 bg-sky-700 text-white shadow-md'
                        : 'border-slate-300 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredStatuses.map((statusKey) => {
                const item = PTKP_RATES[statusKey];
                const isSelected = profile.ptkpStatus === statusKey;

                return (
                  <button
                    key={statusKey}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChange({ ptkpStatus: statusKey })}
                    className={tileClass(isSelected)}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="t-body block font-bold text-slate-900">{item.label}</span>
                        <span className="t-note mt-1 block font-semibold text-slate-800">{item.description}</span>
                        <span className="t-note block">{item.familyDetail}</span>
                      </span>
                      <CheckBadge active={isSelected} />
                    </span>
                    <span className="t-body mt-2 block font-bold text-sky-900">{formatRupiah(item.amount)} per tahun</span>
                  </button>
                );
              })}
            </div>

            <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 p-4 transition-colors hover:bg-sky-50">
                <span className="flex items-center gap-3">
                  <Users className="h-6 w-6 shrink-0 text-sky-800" />
                  <span className="t-body font-bold text-slate-900">Aturan tanggungan (untuk yang ingin tahu)</span>
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-sky-800 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="space-y-4 px-4 pb-5">
                <ul className="t-body list-disc space-y-3 pl-6">
                  <li>
                    <strong>Siapa yang boleh jadi tanggungan?</strong> Orang tua kandung, mertua, anak kandung, dan anak angkat.
                  </li>
                  <li>
                    <strong>Syaratnya:</strong> tidak punya penghasilan sendiri dan seluruh biaya hidupnya Anda tanggung.
                  </li>
                  <li>
                    <strong>Batas maksimal:</strong> 3 orang. Tanggungan ke-4 dan seterusnya tidak menambah batas bebas pajak.
                  </li>
                  <li>
                    <strong>Penghasilan istri digabung (K/I):</strong> dipakai jika suami dan istri sama-sama bekerja dan tidak memisahkan harta. Batas bebas pajak keduanya digabung.
                  </li>
                </ul>
                <p className="t-note">Dasar aturan: UU HPP No. 7 Tahun 2021 dan PMK 101/PMK.010/2016.</p>
              </div>
            </details>
          </div>
        </details>
      </div>

      {/* Tombol lanjut dan catatan privasi */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onNext}
          className="btn-primary w-full bg-sky-700 hover:bg-sky-800 sm:w-auto"
        >
          <span>Lanjut ke penghasilan</span>
          <ArrowRight className="h-5 w-5" />
        </button>

        {!isIdentityComplete && (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-800" />
            <p className="t-body text-amber-950">
              NIK dan nama belum lengkap. Anda tetap bisa lanjut menghitung, tetapi NIK dan nama wajib diisi sebelum laporan bisa disalin atau dicetak.
            </p>
          </div>
        )}

        <p className="t-note flex items-start gap-2">
          <Shield className="mt-1 h-5 w-5 shrink-0 text-sky-800" />
          <span>Data hanya diolah di perangkat lokal Anda.</span>
        </p>
      </div>
    </div>
  );
};
