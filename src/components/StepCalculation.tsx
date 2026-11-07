import React from 'react';
import { TaxCalculationResult } from '../types/tax';
import { formatRupiah } from '../utils/taxCalculator';
import { ResultExplainer } from './ResultExplainer';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Info } from 'lucide-react';

interface StepCalculationProps {
  calculation: TaxCalculationResult;
  onBack: () => void;
  onNext: () => void;
}

// Satu kalimat utama: kenapa hasilnya nihil, kurang bayar, atau lebih bayar.
const heroSentence = (c: TaxCalculationResult): string => {
  if (c.status === 'KURANG_BAYAR') {
    return `Pajak yang harus Anda bayar atas penghasilan ini ${formatRupiah(c.totalTaxDue)}. Yang sudah dipotong baru ${formatRupiah(c.taxPrepaid)}, jadi sisanya harus disetor.`;
  }
  if (c.status === 'LEBIH_BAYAR') {
    return `Pajak yang sudah dipotong ${formatRupiah(c.taxPrepaid)} lebih besar dari pajak terutang ${formatRupiah(c.totalTaxDue)}. Kelebihannya bisa diminta kembali atau dipakai tahun depan.`;
  }
  return 'Pajak terutang dan pajak yang sudah dipotong seimbang, jadi tidak ada selisih yang harus dibayar.';
};

// Penjelasan lengkap, disembunyikan secara default.
const fullReason = (c: TaxCalculationResult): string => {
  if (c.status === 'KURANG_BAYAR') {
    return `Pajak terutang ${formatRupiah(c.totalTaxDue)} lebih besar dari yang sudah dipotong ${formatRupiah(c.taxPrepaid)}, sehingga selisih ${formatRupiah(c.balanceDue)} harus disetor. Penyebab umumnya: pemotongan selama setahun belum menutup pajak yang dihitung dari penghasilan tahunan, misalnya karena bonus atau THR belum ikut dipotong.`;
  }
  if (c.status === 'LEBIH_BAYAR') {
    return `Pajak yang sudah dipotong ${formatRupiah(c.taxPrepaid)} lebih besar dari pajak terutang ${formatRupiah(c.totalTaxDue)}, sehingga kelebihan ${formatRupiah(Math.abs(c.balanceDue))} bisa diminta kembali (restitusi) atau dipakai tahun depan. Penyebabnya biasanya pemotongan bulanan lebih besar daripada perhitungan akhir tahun, misalnya karena penghasilan turun atau tanggungan bertambah.`;
  }
  return 'Pajak terutang dan pajak yang sudah dipotong seimbang. Biasanya ini terjadi karena penghasilan masih di bawah batas bebas pajak, atau pemotongan kantor sudah sesuai perhitungan.';
};

const heroAmount = (c: TaxCalculationResult): number =>
  c.status === 'KURANG_BAYAR' ? c.balanceDue : c.status === 'LEBIH_BAYAR' ? Math.abs(c.balanceDue) : c.totalTaxDue;

// Bagian yang bisa dibuka: rincian disembunyikan dulu agar layar tidak penuh.
const Disclosure: React.FC<{ title: string; hint: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <details className="group card overflow-hidden p-0">
    <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 p-5 transition-colors hover:bg-sky-50">
      <span className="min-w-0">
        <span className="t-body block font-bold text-slate-900">{title}</span>
        <span className="t-note block">{hint}</span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-800 transition-transform duration-300 group-open:rotate-180">
        <ChevronDown className="h-5 w-5" />
      </span>
    </summary>
    <div className="space-y-4 px-5 pb-6">{children}</div>
  </details>
);

export const StepCalculation: React.FC<StepCalculationProps> = ({ calculation, onBack, onNext }) => {
  const c = calculation;
  const heroTone =
    c.status === 'NIHIL'
      ? 'border-sky-200 bg-sky-50 text-sky-950'
      : c.status === 'KURANG_BAYAR'
      ? 'border-rose-200 bg-rose-50 text-rose-950'
      : 'border-emerald-200 bg-emerald-50 text-emerald-950';
  const HeroIcon = c.status === 'KURANG_BAYAR' ? AlertTriangle : CheckCircle2;

  const headline =
    c.status === 'NIHIL'
      ? 'Tidak ada pajak yang harus dibayar'
      : c.status === 'KURANG_BAYAR'
      ? `Anda kurang bayar ${formatRupiah(heroAmount(c))}`
      : `Anda lebih bayar ${formatRupiah(heroAmount(c))}`;

  const keyNumbers = [
    { label: 'Penghasilan kotor', value: formatRupiah(c.grossIncome) },
    { label: 'Pengurang dan batas bebas pajak', value: formatRupiah(c.deductions + c.ptkpAmount) },
    { label: 'Yang dikenai pajak', value: formatRupiah(c.taxableIncome) },
    { label: 'Pajak sudah dipotong', value: formatRupiah(c.taxPrepaid) },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Hasil utama: besar, dengan satu kalimat penjelas */}
      <section className={`module-enter rounded-3xl border-2 p-6 sm:p-8 ${heroTone}`}>
        <div className="flex items-start gap-4">
          <span className="float-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
            <HeroIcon className="h-8 w-8" />
          </span>
          <div className="min-w-0">
            <p className="t-kicker text-current">Hasil hitungan Anda</p>
            <h2 className="t-section mt-2 break-words text-current">{headline}</h2>
          </div>
        </div>
        <p className="t-body mt-5 text-current">{heroSentence(c)}</p>
      </section>

      {/* Empat angka kunci */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {keyNumbers.map((m) => (
          <div key={m.label} className="card min-w-0 p-5">
            <p className="t-label text-slate-700">{m.label}</p>
            <p className="t-card mt-2 break-words text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Rincian penghitungan: tarif per lapisan */}
      <Disclosure title="Rincian tarif per lapisan" hint="Berapa pajak yang dikenakan di setiap lapisan penghasilan">
        {c.taxBracketBreakdown.length === 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-emerald-700" />
            <span className="t-body text-emerald-950">Penghasilan Anda masih di bawah batas bebas pajak, jadi belum ada tarif yang dikenakan.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
            {c.taxBracketBreakdown.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="t-body font-bold text-slate-900">{item.bracket}</p>
                  <p className="t-note">
                    {(item.rate * 100).toFixed(1)}% dari {formatRupiah(item.amount)}
                  </p>
                </div>
                <span className="t-card break-words text-slate-900">{formatRupiah(item.tax)}</span>
              </div>
            ))}
          </div>
        )}

        {c.notes.length > 0 && (
          <div className="space-y-3">
            {c.notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <Info className="mt-1 h-6 w-6 shrink-0 text-amber-800" />
                <span className="t-body text-amber-950">{note}</span>
              </div>
            ))}
          </div>
        )}
      </Disclosure>

      {/* Penjelasan berurutan dari angka yang diisi sampai hasil akhir */}
      <ResultExplainer
        title="Urutan hitungan dari penghasilan Anda"
        hint="Dari penghasilan kotor sampai hasil akhir"
        lines={[
          `Penghasilan kotor Anda ${formatRupiah(c.grossIncome)}.`,
          `Setelah dikurangi biaya dan iuran yang diakui (${formatRupiah(c.deductions)}) dan batas bebas pajak (${formatRupiah(c.ptkpAmount)}), yang masih dikenai pajak tinggal ${formatRupiah(c.taxableIncome)}.`,
          `Pajak terutang dari jumlah itu: ${formatRupiah(c.totalTaxDue)}.`,
          c.taxPrepaid > 0
            ? `Pajak yang sudah dipotong kantor atau klien ${formatRupiah(c.taxPrepaid)} dikurangkan dari pajak terutang.`
            : 'Belum ada pajak yang sudah dipotong, jadi seluruh pajak terutang harus dibayar.',
        ]}
        status={c.status}
        statusText={
          c.status === 'NIHIL'
            ? 'Hasil: nihil, tidak ada pajak yang harus dibayar.'
            : c.status === 'KURANG_BAYAR'
            ? `Hasil: kurang bayar ${formatRupiah(Math.abs(c.balanceDue))}.`
            : `Hasil: lebih bayar ${formatRupiah(Math.abs(c.balanceDue))}, bisa dikembalikan atau dipakai tahun depan.`
        }
      />

      {/* Navigasi */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary w-full sm:w-auto"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Ubah angka</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn-primary w-full bg-sky-700 hover:bg-sky-800 sm:w-auto"
        >
          <span>Lanjut: lihat draf</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
