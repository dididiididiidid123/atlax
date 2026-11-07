import { saveDoc } from '../utils/dokumenStore';
import { notify } from '../utils/toast';
import { printArea } from '../utils/printArea';
import { ResultExplainer } from './ResultExplainer';
import React, { useState } from 'react';
import { Save, Check, CircleAlert, CircleCheck, FileText, FileWarning, Hourglass, Info, Minus, Printer, Receipt } from 'lucide-react';
import { TaxFormData, ComprehensiveTaxState, UniversalTaxResult, TaxCalculationResult } from '../types/tax';
import { formatRupiah } from '../utils/taxCalculator';

type DocKind = 'SPT' | 'SSP' | 'SKP' | 'STP';

interface DraftDocumentsProps {
  wizardData: TaxFormData;
  wizardCalc: TaxCalculationResult;
  multiState: ComprehensiveTaxState;
  multiCalc: UniversalTaxResult;
  // Dokumen yang ditampilkan di modul ini (default: semua)
  kinds?: DocKind[];
}

interface Field {
  label: string;
  value: string;
}

interface Item {
  uraian: string;
  jumlah: string;
}

const DOC_TABS: { id: DocKind; title: string; subtitle: string; guide: { apa: string; kapan: string; siapa: string }; Icon: React.ElementType }[] = [
  {
    id: 'SPT',
    title: 'SPT Tahunan',
    subtitle: 'Isian SPT Tahunan dari panduan 4 tahap',
    guide: { apa: 'Laporan penghasilan dan pajak Anda setahun.', kapan: 'Dilaporkan tiap tahun, paling lambat 31 Maret.', siapa: 'Anda sendiri, lewat sistem DJP Online.' },
    Icon: FileText,
  },
  {
    id: 'SSP',
    title: 'SSP',
    subtitle: 'Data setoran pajak yang perlu dibayar',
    guide: { apa: 'Bukti setoran pajak yang dibayar lewat bank atau sistem billing.', kapan: 'Saat ada pajak yang harus disetor.', siapa: 'Dibuat sendiri, lalu dibayar lewat bank persepsi.' },
    Icon: Receipt,
  },
  {
    id: 'SKP',
    title: 'SKP',
    subtitle: 'Gambaran surat ketetapan jika ada kurang bayar',
    guide: { apa: 'Surat ketetapan pajak dari kantor pajak (KPP) jika kewajiban belum dipenuhi.', kapan: 'Hanya jika KPP menetapkan kekurangan.', siapa: 'Diterbitkan oleh KPP, bukan oleh Anda.' },
    Icon: FileWarning,
  },
  {
    id: 'STP',
    title: 'STP',
    subtitle: 'Gambaran surat tagihan jika ada tunggakan',
    guide: { apa: 'Surat tagihan untuk pokok, bunga, atau denda yang belum dibayar.', kapan: 'Hanya jika ada tunggakan yang ditagih KPP.', siapa: 'Diterbitkan oleh KPP, bukan oleh Anda.' },
    Icon: Hourglass,
  },
];

const STATUS_TEXT: Record<string, string> = {
  NIHIL: 'Nihil',
  KURANG_BAYAR: 'Kurang bayar',
  LEBIH_BAYAR: 'Lebih bayar',
};

const DRAFT_NOTICE =
  'DRAF ATLAX, bukan dokumen resmi DJP. Nomor dokumen, kode billing, NTPN, dan nomor BPE hanya diterbitkan oleh sistem DJP atau bank persepsi.';

const CHECKLIST = [
  'Angka sudah dicek ke bukti potong atau bukti setor',
  'Sudah dicek lagi sesuai aturan pajak yang berlaku',
];

const RESULT_SENTENCE: Record<string, string> = {
  NIHIL: 'Hasilnya nihil. Tidak ada pajak yang harus dibayar.',
  KURANG_BAYAR: 'Kurang bayar. Jumlah ini masih harus Anda bayar.',
  LEBIH_BAYAR: 'Lebih bayar. Kelebihan ini bisa diminta kembali atau dihitung untuk tahun berikutnya.',
};

// Warna hasil: kurang bayar rose, lebih bayar emerald, nihil sky. Selalu disertai teks dan ikon.
const RESULT_TONE: Record<string, { box: string; text: string; chip: string; Icon: React.ElementType }> = {
  KURANG_BAYAR: { box: 'border-rose-200 bg-rose-50', text: 'text-rose-800', chip: 'chip-bad', Icon: CircleAlert },
  LEBIH_BAYAR: { box: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-800', chip: 'chip-ok', Icon: CircleCheck },
  NIHIL: { box: 'border-sky-200 bg-sky-50', text: 'text-sky-800', chip: 'chip-info', Icon: Minus },
};

// Angka utama hasil, ditampilkan besar di atas dokumen.
const ResultBanner: React.FC<{ label: string; status: string; amount: number }> = ({ label, status, amount }) => {
  const tone = RESULT_TONE[status] ?? RESULT_TONE.NIHIL;
  const { Icon } = tone;
  return (
    <div className={`module-enter print:hidden rounded-3xl border-2 p-6 ${tone.box}`}>
      <p className="t-label">{label}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={tone.chip}>
          <Icon className="h-5 w-5" aria-hidden="true" />
          {STATUS_TEXT[status] ?? ''}
        </span>
      </div>
      <p className={`t-result mt-3 break-words ${tone.text}`}>{formatRupiah(Math.abs(amount))}</p>
      <p className="t-body mt-3 text-slate-900">{RESULT_SENTENCE[status] ?? ''}</p>
    </div>
  );
};

const DocSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200">
    <div className="border-b border-slate-200 bg-teal-50 px-4 py-3">
      <p className="t-label uppercase tracking-wide text-teal-900">{title}</p>
    </div>
    {children}
  </div>
);

const FieldGrid: React.FC<{ fields: Field[] }> = ({ fields }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2">
    {fields.map((field) => (
      <div key={field.label} className="border-b border-slate-200 px-4 py-3 sm:odd:border-r">
        <p className="t-label text-slate-600">{field.label}</p>
        <p className="t-body font-semibold text-slate-900 break-words">{field.value}</p>
      </div>
    ))}
  </div>
);

const ItemTable: React.FC<{ items: Item[]; totalLabel?: string; total?: string }> = ({ items, totalLabel, total }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[480px] border-collapse">
      <thead className="bg-slate-50">
        <tr>
          <th className="t-label w-12 p-3 text-left align-bottom">No.</th>
          <th className="t-label p-3 text-left align-bottom">Uraian</th>
          <th className="t-label p-3 text-right align-bottom">Jumlah / keterangan</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.uraian} className="border-t border-slate-200">
            <td className="t-body p-3 align-top">{index + 1}</td>
            <td className="t-body p-3 align-top">{item.uraian}</td>
            <td className="t-body p-3 text-right align-top font-semibold">{item.jumlah}</td>
          </tr>
        ))}
        {totalLabel && total && (
          <tr className="border-t-2 border-teal-200 bg-teal-50">
            <td className="p-3" />
            <td className="t-body p-3 font-bold">{totalLabel}</td>
            <td className="t-body p-3 text-right font-extrabold text-teal-900">{total}</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// Daftar cek: kotak dicentang sendiri oleh pengguna sebelum dokumen dipakai.
const Checklist: React.FC = () => (
  <div>
    <p className="t-note px-4 pt-4">Centang kotak di sebelah kiri jika sudah dicek.</p>
    <ul className="divide-y divide-slate-200">
      {CHECKLIST.map((text) => (
        <li key={text}>
          <label className="flex cursor-pointer items-start gap-4 px-4 py-4 transition-colors hover:bg-teal-50">
            <input type="checkbox" className="peer mt-1 h-6 w-6 shrink-0 accent-teal-700" />
            <span className="t-body text-slate-900 peer-checked:font-bold peer-checked:text-teal-900">{text}</span>
          </label>
        </li>
      ))}
    </ul>
  </div>
);

const DocFrame: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-teal-700 pb-4">
      <div className="flex items-center gap-4">
        <img src="/atlax-logo.svg" alt="Logo ATLAX" className="h-11 w-11 shrink-0" />
        <div>
          <p className="t-kicker text-teal-800">ATLAX, Make Tax Reporting Simpler</p>
          <h3 className="t-section">{title}</h3>
        </div>
      </div>
      <span className="chip-warn shrink-0">DRAF</span>
    </div>
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <Info className="mt-0.5 h-6 w-6 shrink-0 text-amber-900" aria-hidden="true" />
      <p className="t-body text-amber-950">{DRAFT_NOTICE}</p>
    </div>
    {children}
  </div>
);

// Penjelasan angka SPT dari data kalkulator sederhana (wizard): kenapa nilainya nol atau begitu.
const explainWizard = (data: TaxFormData, calc: TaxCalculationResult): string[] => {
  const lines: string[] = [];
  if (data.category === 'umkm') {
    lines.push(`Angka yang Anda isi adalah omzet setahun ${formatRupiah(data.umkm.annualTurnover || 0)}.`);
    lines.push(calc.taxableIncome === 0
      ? 'Omzet sampai Rp 500 juta per tahun bebas pajak untuk usaha perorangan (PP 55/2022), jadi PPh terutang nol.'
      : `Omzet di atas Rp 500 juta dikenai tarif 0,5%, sehingga PPh terutang ${formatRupiah(calc.totalTaxDue)}.`);
    lines.push('Pada skema UMKM, pajak dihitung dari omzet, bukan dari laba. Biaya dan PTKP tidak dikurangkan, jadi angka pengurang nol.');
  } else if (data.category === 'freelance') {
    lines.push(`Penghasilan jasa setahun ${formatRupiah(data.freelance.annualRevenue || 0)} dihitung dengan norma ${Math.round((data.freelance.nppnRate || 0) * 100)}% sebagai penghasilan neto.`);
    lines.push(`Penghasilan neto dikurangi PTKP ${formatRupiah(calc.ptkpAmount)} menghasilkan dasar pajak ${formatRupiah(calc.taxableIncome)}.`);
    if (calc.taxableIncome === 0) lines.push('Jika penghasilan neto masih di bawah PTKP, tidak ada pajak yang terutang.');
  } else {
    lines.push(`Penghasilan bruto ${formatRupiah(calc.grossIncome)} berasal dari gaji setahun ditambah bonus atau THR.`);
    lines.push(`Biaya jabatan 5% (maksimal Rp 6 juta setahun) dan iuran pensiun dikurangkan, total pengurang ${formatRupiah(calc.deductions)}.`);
    lines.push(`Batas bebas pajak untuk status ${data.profile.ptkpStatus} adalah ${formatRupiah(calc.ptkpAmount)}.`);
    lines.push(calc.taxableIncome === 0
      ? 'Penghasilan bersih masih di bawah batas bebas pajak, jadi tidak ada penghasilan kena pajak dan PPh terutang nol.'
      : `Sisanya ${formatRupiah(calc.taxableIncome)} dikenai tarif progresif, sehingga PPh terutang ${formatRupiah(calc.totalTaxDue)}.`);
  }
  if (calc.status === 'NIHIL') lines.push('Status nihil berarti tidak ada pajak yang harus dibayar atau dilunasi.');
  return lines;
};

// Penjelasan angka dari kalkulator per jenis pajak.
const explainMulti = (calc: UniversalTaxResult): string[] => {
  const lines: string[] = [`Jenis pajak: ${calc.taxTypeName}.`];
  lines.push(calc.taxBase === 0
    ? 'Dasar pengenaan pajak nol. Biasanya angka di kalkulator belum diisi, atau angkanya masih di bawah batas bebas pajak.'
    : `Dasar pengenaan pajak ${formatRupiah(calc.taxBase)} dari angka yang Anda isi.`);
  lines.push(`Tarif yang berlaku: ${calc.applicableRateText}.`);
  lines.push(`Pajak terutang: ${formatRupiah(calc.calculatedTax)}.`);
  lines.push(calc.creditsOrPrepaid === 0
    ? 'Kredit atau pajak yang sudah dibayar nol, karena belum ada bukti potong atau setoran yang diisi.'
    : `Kredit atau pajak yang sudah dibayar ${formatRupiah(calc.creditsOrPrepaid)} dikurangkan dari pajak terutang.`);
  return lines;
};
export const DraftDocuments: React.FC<DraftDocumentsProps> = ({ wizardData, wizardCalc, multiState, multiCalc, kinds = ['SPT', 'SSP', 'SKP', 'STP'] }) => {
  const visibleTabs = DOC_TABS.filter((t) => kinds.includes(t.id));
  const [active, setActive] = useState<DocKind>(kinds[0] ?? 'SPT');
  const profile = wizardData.profile;
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2026, multiState.selectedMonth - 1, 1));
  const period = multiState.reportingPeriod === 'MONTHLY'
    ? `Masa ${monthLabel} ${multiState.profile.taxYear}`
    : `Tahun Pajak ${multiState.profile.taxYear}`;
  const outstanding = Math.max(0, multiCalc.finalBalanceDue);
  const mp = multiState.profile;
  const multiIdentity: Field[] = [
    { label: 'Nama wajib pajak', value: mp.fullName || '(belum diisi)' },
    { label: 'NPWP', value: mp.npwp || '(belum diisi)' },
    { label: 'NIK', value: mp.nik || '(belum diisi)' },
    { label: 'Jenis pajak', value: multiCalc.taxTypeName },
    { label: 'Masa / tahun pajak', value: period },
    { label: 'Nomor dokumen', value: 'Diisi sistem DJP' },
  ];
  const handleSave = () => {
    const isSpt = active === 'SPT';
    const rawAmount = isSpt ? wizardCalc.balanceDue : multiCalc.finalBalanceDue;
    const status = isSpt ? wizardCalc.status : multiCalc.status;
    const statusText = status === 'NIHIL' ? 'Nihil, tidak ada yang harus dibayar' : status === 'KURANG_BAYAR' ? 'Kurang bayar' : 'Lebih bayar';
    const name = isSpt ? (profile.fullName || 'Wajib pajak') : (mp.fullName || 'Wajib pajak');
    saveDoc({
      kind: active,
      title: `${currentTab?.title ?? active} · ${isSpt ? `Tahun pajak ${profile.taxYear}` : period}`,
      amount: Math.abs(rawAmount),
      status: statusText,
      rows: [
        { label: 'Nama', value: name },
        { label: 'Jenis dokumen', value: currentTab?.title ?? active },
        { label: 'Periode', value: isSpt ? `Tahun pajak ${profile.taxYear}` : period },
        { label: 'Jenis pajak', value: isSpt ? 'SPT Tahunan' : multiCalc.taxTypeName },
      ],
    });
    notify('ok', 'Dokumen disimpan. Lihat di Dokumen tersimpan.');
  };

  const currentTab = DOC_TABS.find((t) => t.id === active);

  return (
    <section className="space-y-5 print:space-y-0">
      <div className="h-1.5 rounded-full  print:hidden" aria-hidden="true" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 print:hidden">
        {visibleTabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              aria-pressed={isActive}
              className={`card-lift flex min-h-[7rem] flex-col justify-between gap-3 p-4 text-left ${isActive ? 'border-teal-700 bg-teal-50 ring-4 ring-teal-200' : 'hover:border-teal-300'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <tab.Icon className={`h-6 w-6 ${isActive ? 'text-teal-800' : 'text-slate-600'}`} aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-teal-700 text-white' : 'border-2 border-slate-300 bg-white'}`}
                >
                  {isActive && <Check className="h-4 w-4" />}
                </span>
              </div>
              <span className={`t-body font-bold ${isActive ? 'text-teal-900' : 'text-slate-900'}`}>{tab.title}</span>
            </button>
          );
        })}
      </div>

      <ResultBanner
        label={active === 'SPT' ? 'Hasil SPT Tahunan Anda' : 'Hasil dokumen ini'}
        status={active === 'SPT' ? wizardCalc.status : multiCalc.status}
        amount={active === 'SPT' ? wizardCalc.balanceDue : multiCalc.finalBalanceDue}
      />

      <div className="card module-enter space-y-3 print:hidden">
        <p className="t-card">{currentTab?.subtitle}</p>
        <p className="t-body"><span className="font-bold text-teal-800">Apa ini?</span> {currentTab?.guide.apa}</p>
        <p className="t-body"><span className="font-bold text-teal-800">Kapan dipakai?</span> {currentTab?.guide.kapan}</p>
        <p className="t-body"><span className="font-bold text-teal-800">Siapa yang membuat?</span> {currentTab?.guide.siapa}</p>
      </div>

      {active !== 'SPT' && (
        <details className="t-body text-slate-800 print:hidden">
          <summary className="cursor-pointer py-2 font-bold text-teal-800 underline">Lihat penjelasan angka</summary>
          <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <ResultExplainer title="Cara angka di draf ini dihitung" hint="Penjelasan singkat dari penghasilan sampai hasil akhir"
              lines={explainMulti(multiCalc)}
              status={multiCalc.status}
              statusText={
                multiCalc.status === 'NIHIL'
                  ? 'Hasil: nihil, tidak ada pajak yang harus dibayar.'
                  : multiCalc.status === 'KURANG_BAYAR'
                  ? `Hasil: kurang bayar ${formatRupiah(Math.abs(multiCalc.finalBalanceDue))}.`
                  : `Hasil: lebih bayar ${formatRupiah(Math.abs(multiCalc.finalBalanceDue))}.`
              }
            />
          </div>
        </details>
      )}
      <div className="print-area module-enter space-y-5">
        {active === 'SPT' && (
          <DocFrame title="Draf Isi SPT Tahunan Orang Pribadi">
            <DocSection title="I. Identitas dan data dokumen">
              <FieldGrid
                fields={[
                  { label: 'Nama wajib pajak', value: profile.fullName || '(belum diisi)' },
                  { label: 'NPWP', value: profile.npwp || '(belum diisi)' },
                  { label: 'NIK', value: profile.nik || '(belum diisi)' },
                  { label: 'Jenis SPT', value: 'SPT Tahunan Orang Pribadi' },
                  { label: 'Tahun pajak', value: String(profile.taxYear) },
                  { label: 'Batas lapor', value: `31 Maret ${profile.taxYear + 1}` },
                  { label: 'Status PTKP', value: `${profile.ptkpStatus} (kode batas bebas pajak)` },
                  { label: 'Nomor dokumen', value: 'Diisi sistem DJP' },
                ]}
              />
            </DocSection>
            <details className="t-body text-slate-800 print:hidden">
              <summary className="cursor-pointer py-2 font-bold text-teal-800 underline">Lihat penjelasan angka</summary>
              <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                <ResultExplainer title="Cara angka di draf ini dihitung" hint="Penjelasan singkat dari penghasilan sampai hasil akhir"
                  lines={explainWizard(wizardData, wizardCalc)}
                  status={wizardCalc.status}
                  statusText={
                    wizardCalc.status === 'NIHIL'
                      ? 'Hasil: nihil, tidak ada pajak yang harus dibayar.'
                      : wizardCalc.status === 'KURANG_BAYAR'
                      ? `Hasil: kurang bayar ${formatRupiah(Math.abs(wizardCalc.balanceDue))}.`
                      : `Hasil: lebih bayar ${formatRupiah(Math.abs(wizardCalc.balanceDue))}.`
                  }
                />
              </div>
            </details>
            <DocSection title="II. Rincian penghitungan">
              <ItemTable
                items={[
                  { uraian: 'Penghasilan bruto', jumlah: formatRupiah(wizardCalc.grossIncome) },
                  { uraian: 'Pengurang (biaya jabatan, iuran pensiun) dan batas bebas pajak', jumlah: formatRupiah(wizardCalc.deductions + wizardCalc.ptkpAmount) },
                  { uraian: 'Penghasilan kena pajak (dasar hitung pajak)', jumlah: formatRupiah(wizardCalc.taxableIncome) },
                  { uraian: 'PPh terutang (pajak yang seharusnya dibayar)', jumlah: formatRupiah(wizardCalc.totalTaxDue) },
                  { uraian: 'Pajak sudah dipotong atau dibayar', jumlah: formatRupiah(wizardCalc.taxPrepaid) },
                  { uraian: `Hasil akhir: ${STATUS_TEXT[wizardCalc.status] ?? wizardCalc.status}`, jumlah: formatRupiah(Math.abs(wizardCalc.balanceDue)) },
                ]}
              />
            </DocSection>
            <DocSection title="III. Cek sebelum dipakai">
              <Checklist />
            </DocSection>
          </DocFrame>
        )}

        {active === 'SSP' && (
          <DocFrame title="Draf Data Setoran Pajak (SSP)">
            <DocSection title="I. Identitas dan data dokumen">
              <FieldGrid fields={multiIdentity} />
            </DocSection>
            <DocSection title="II. Rincian setoran">
              <ItemTable
                items={[
                  { uraian: 'Dasar pengenaan pajak', jumlah: formatRupiah(multiCalc.taxBase) },
                  { uraian: 'Pajak terutang', jumlah: formatRupiah(multiCalc.calculatedTax) },
                  { uraian: 'Kredit atau sudah dibayar', jumlah: formatRupiah(multiCalc.creditsOrPrepaid) },
                  { uraian: `Batas setor: ${multiCalc.paymentDeadline}`, jumlah: '' },
                ]}
                totalLabel="Jumlah yang perlu disetor"
                total={formatRupiah(outstanding)}
              />
              <p className="t-note p-4">Kode billing dan NTPN dibuat di sistem pembayaran resmi, bukan di ATLAX.</p>
            </DocSection>
            <DocSection title="III. Cek sebelum dipakai">
              <Checklist />
            </DocSection>
          </DocFrame>
        )}

        {active === 'SKP' && (
          <DocFrame title="Gambaran Surat Ketetapan Pajak (SKP)">
            <DocSection title="I. Identitas dan data dokumen">
              <FieldGrid fields={multiIdentity} />
            </DocSection>
            <DocSection title="II. Rincian perkiraan">
              <ItemTable
                items={[
                  { uraian: `Sanksi telat lapor: ${multiCalc.lateFilingFeeText}`, jumlah: 'Lihat aturan' },
                  { uraian: `Sanksi telat bayar: ${multiCalc.latePaymentInterestRule}`, jumlah: 'Lihat aturan' },
                ]}
                totalLabel="Pajak kurang bayar (perkiraan)"
                total={formatRupiah(outstanding)}
              />
              <p className="t-note p-4">Nilai final ditentukan KPP.</p>
            </DocSection>
            <DocSection title="III. Cek sebelum dipakai">
              <Checklist />
            </DocSection>
          </DocFrame>
        )}

        {active === 'STP' && (
          <DocFrame title="Gambaran Surat Tagihan Pajak (STP)">
            <DocSection title="I. Identitas dan data dokumen">
              <FieldGrid fields={multiIdentity} />
            </DocSection>
            <DocSection title="II. Rincian tagihan perkiraan">
              <ItemTable
                items={[
                  { uraian: `Denda telat lapor: ${multiCalc.lateFilingFeeText}`, jumlah: 'Lihat aturan' },
                  { uraian: `Bunga telat bayar: ${multiCalc.latePaymentInterestRule}`, jumlah: 'Lihat aturan' },
                ]}
                totalLabel="Pokok kurang bayar (perkiraan)"
                total={formatRupiah(outstanding)}
              />
              <p className="t-note p-4">Total final ditentukan KPP.</p>
            </DocSection>
            <DocSection title="III. Cek sebelum dipakai">
              <Checklist />
            </DocSection>
          </DocFrame>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3 print:hidden">
        <button type="button" onClick={handleSave} className="btn-secondary">
          <Save className="h-5 w-5" aria-hidden="true" />
          <span>Simpan dokumen</span>
        </button>
        <button
          type="button"
          onClick={() => printArea()}
          className="btn-primary"
        >
          <Printer className="h-5 w-5" aria-hidden="true" />
          <span>Cetak / Simpan PDF</span>
        </button>
      </div>
    </section>
  );
};
