import React from 'react';
import { TaxFormData, TaxCategory } from '../types/tax';
import { ArrowLeft, ArrowRight, Briefcase, Check, CheckCircle2, ChevronDown, Laptop, Store } from 'lucide-react';
import { formatRupiah } from '../utils/taxCalculator';
import { RupiahInput } from './RupiahInput';

interface StepIncomeProps {
  data: TaxFormData;
  onChangeCategory: (category: TaxCategory) => void;
  onChangeKaryawan: (updated: Partial<TaxFormData['karyawan']>) => void;
  onChangeUMKM: (updated: Partial<TaxFormData['umkm']>) => void;
  onChangeFreelance: (updated: Partial<TaxFormData['freelance']>) => void;
  onBack: () => void;
  onNext: () => void;
}

const labelClass = 't-label mb-2 block';
const hintClass = 't-note mt-2';

const CATEGORY_OPTIONS: { id: TaxCategory; title: string; desc: string; icon: React.ElementType }[] = [
  { id: 'karyawan', title: 'Karyawan', desc: 'Menerima gaji tiap bulan dari kantor', icon: Briefcase },
  { id: 'umkm', title: 'Punya toko atau usaha kecil', desc: 'Pajak dihitung dari omzet (UMKM)', icon: Store },
  { id: 'freelance', title: 'Freelance', desc: 'Dibayar per proyek atau per jasa', icon: Laptop },
];

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

export const StepIncome: React.FC<StepIncomeProps> = ({
  data,
  onChangeCategory,
  onChangeKaryawan,
  onChangeUMKM,
  onChangeFreelance,
  onBack,
  onNext,
}) => {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">

      {/* Penjelasan satu baris untuk tahap ini */}
      <div className="card relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 " />
        <h2 className="t-section">Langkah 2: apa pekerjaan utama Anda?</h2>
        <p className="t-body mt-3">
          Pilih satu. Isian di bawah akan menyesuaikan dengan pilihan Anda.
        </p>
      </div>

      {/* Pilihan kategori */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CATEGORY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = data.category === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChangeCategory(opt.id)}
              className={`card-lift flex h-full min-h-[120px] flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                active ? 'border-sky-700 bg-sky-50 ring-4 ring-sky-100' : 'border-slate-200 bg-white hover:border-sky-300'
              }`}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <CheckBadge active={active} />
              </span>
              <span className="min-w-0">
                <span className="t-body block font-bold text-slate-900">{opt.title}</span>
                <span className="t-note mt-1 block">{opt.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Form Karyawan */}
      {data.category === 'karyawan' && (
        <div className="card space-y-6">
          <div>
            <label htmlFor="fld-stepincome-1" className={labelClass}>
              Gaji kotor per bulan (rata-rata)
            </label>
            <p className="t-note mb-2">Gaji sebelum dipotong pajak dan iuran.</p>
            <RupiahInput id="fld-stepincome-1"
              value={data.karyawan.grossSalaryMonthly}
              onChange={(monthly) => onChangeKaryawan({
                grossSalaryMonthly: monthly,
                grossSalaryAnnual: monthly * 12,
              })}
              placeholder="Contoh: 8000000"
            />
            <p className={hintClass}>
              Setara {formatRupiah((data.karyawan.grossSalaryMonthly || 0) * 12)} per tahun.
            </p>
          </div>

          <div>
            <label htmlFor="fld-stepincome-2" className={labelClass}>
              Pajak yang sudah dipotong kantor setahun
            </label>
            <RupiahInput id="fld-stepincome-2"
              value={data.karyawan.withholdingTaxPaid}
              onChange={(v) => onChangeKaryawan({ withholdingTaxPaid: v })}
            />
            <p className={hintClass}>
              Angkanya ada di Formulir 1721-A1 nomor 20. Biasanya kantor memberikannya.
            </p>
          </div>

          {/* Isian tambahan */}
          <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 p-4 transition-colors hover:bg-sky-50">
              <span className="min-w-0">
                <span className="t-body block font-bold text-slate-900">Ada bonus, THR, atau iuran pensiun?</span>
                <span className="t-note block">Isian tambahan (opsional)</span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 transition-transform duration-300 group-open:rotate-180">
                <ChevronDown className="h-5 w-5" />
              </span>
            </summary>
            <div className="space-y-5 px-4 pb-4">
              <div>
                <label htmlFor="fld-stepincome-3" className={labelClass}>
                  Bonus atau THR setahun
                </label>
                <RupiahInput id="fld-stepincome-3"
                  value={data.karyawan.bonusThr}
                  onChange={(v) => onChangeKaryawan({ bonusThr: v })}
                />
              </div>
              <div>
                <label htmlFor="fld-stepincome-4" className={labelClass}>
                  Iuran pensiun atau JHT per bulan
                </label>
                <RupiahInput id="fld-stepincome-4"
                  value={data.karyawan.pensionContributionMonthly}
                  onChange={(v) => onChangeKaryawan({ pensionContributionMonthly: v })}
                />
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Form UMKM */}
      {data.category === 'umkm' && (
        <div className="card space-y-5">
          <div>
            <label htmlFor="fld-stepincome-5" className={labelClass}>
              Total penjualan setahun
            </label>
            <p className="t-note mb-2">Jumlah omzet, bukan keuntungan.</p>
            <RupiahInput id="fld-stepincome-5"
              value={data.umkm.annualTurnover}
              onChange={(v) => onChangeUMKM({ annualTurnover: v })}
              placeholder="Contoh: 350000000"
            />
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />
            <p className="t-body text-emerald-950">
              <strong>Bebas pajak untuk usaha kecil:</strong> pemilik usaha perorangan dengan omzet sampai <strong>Rp 500 juta per tahun</strong> tidak kena pajak (0%). Aturannya ada di PP 55/2022.
            </p>
          </div>
        </div>
      )}

      {/* Form Freelance */}
      {data.category === 'freelance' && (
        <div className="card space-y-6">
          <div>
            <label htmlFor="fld-stepincome-6" className={labelClass}>
              Total penghasilan jasa setahun
            </label>
            <RupiahInput id="fld-stepincome-6"
              value={data.freelance.annualRevenue}
              onChange={(v) => onChangeFreelance({ annualRevenue: v })}
              placeholder="Contoh: 150000000"
            />
            <p className={hintClass}>Tidak perlu pembukuan. Pajak dihitung dari 50% penghasilan.</p>
          </div>

          <div>
            <label htmlFor="fld-stepincome-7" className={labelClass}>
              Pajak yang sudah dipotong klien (jika ada bukti potong)
            </label>
            <RupiahInput id="fld-stepincome-7"
              value={data.freelance.withholdingTaxPaid}
              onChange={(v) => onChangeFreelance({ withholdingTaxPaid: v })}
            />
          </div>
        </div>
      )}

      {/* Navigasi */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary w-full sm:w-auto"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn-primary w-full bg-sky-700 hover:bg-sky-800 sm:w-auto"
        >
          <span>Hitung pajak saya</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
