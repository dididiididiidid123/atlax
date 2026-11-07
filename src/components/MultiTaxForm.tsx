import React from 'react';
import {
  ComprehensiveTaxState,
  UniversalTaxResult,
  PTKPStatus
} from '../types/tax';
import { PTKP_RATES, TAX_BRACKETS, formatRupiah } from '../utils/taxCalculator';
import { ResultExplainer } from './ResultExplainer';
import { Save } from 'lucide-react';
import { saveDoc } from '../utils/dokumenStore';
import { notify } from '../utils/toast';
import { PtkpPicker } from './PtkpPicker';
import { AnimatedRupiah } from './AnimatedRupiah';
import { RupiahInput } from './RupiahInput';
import { pph24Breakdown } from '../utils/taxCalculationEngine';
import { printArea } from '../utils/printArea';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, Clock, Copy, Info, Lightbulb, Printer, Sparkles } from 'lucide-react';

interface MultiTaxFormProps {
  state: ComprehensiveTaxState;
  calculation: UniversalTaxResult | null;
  onChangeState: (updated: Partial<ComprehensiveTaxState>) => void;
  onUpdatePph21: (data: Partial<ComprehensiveTaxState['pph21']>) => void;
  onUpdatePph22: (data: Partial<ComprehensiveTaxState['pph22']>) => void;
  onUpdatePph23: (data: Partial<ComprehensiveTaxState['pph23']>) => void;
  onUpdatePph24: (data: Partial<ComprehensiveTaxState['pph24']>) => void;
  onUpdatePph25: (data: Partial<ComprehensiveTaxState['pph25']>) => void;
  onUpdatePph26: (data: Partial<ComprehensiveTaxState['pph26']>) => void;
  onUpdatePph28: (data: Partial<ComprehensiveTaxState['pph28']>) => void;
  onUpdatePph29: (data: Partial<ComprehensiveTaxState['pph29']>) => void;
  onUpdatePph15: (data: Partial<ComprehensiveTaxState['pph15']>) => void;
  onUpdatePph42: (data: Partial<ComprehensiveTaxState['pph42']>) => void;
  onUpdateUmkm: (data: Partial<ComprehensiveTaxState['umkm']>) => void;
  onUpdatePpn: (data: Partial<ComprehensiveTaxState['ppn']>) => void;
}

// Mata uang untuk penghasilan dan pajak dari luar negeri (PPh 24)
const PPH24_CURRENCIES = [
  { code: 'USD', name: 'Dolar Amerika Serikat' },
  { code: 'SGD', name: 'Dolar Singapura' },
  { code: 'MYR', name: 'Ringgit Malaysia' },
  { code: 'EUR', name: 'Euro' },
  { code: 'JPY', name: 'Yen Jepang' },
  { code: 'CNY', name: 'Yuan China' },
  { code: 'AUD', name: 'Dolar Australia' },
  { code: 'GBP', name: 'Poundsterling Inggris' },
  { code: 'THB', name: 'Baht Thailand' },
  { code: 'KRW', name: 'Won Korea Selatan' },
  { code: 'HKD', name: 'Dolar Hong Kong' },
  { code: 'IDR', name: 'Rupiah (tanpa konversi)' },
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PPH21_MODES = [
  { v: 'KARYAWAN', l: 'Karyawan (menerima gaji)', d: 'Gaji dipotong PPh 21 oleh kantor setiap bulan.' },
  { v: 'FREELANCER', l: 'Freelancer (bekerja bebas)', d: 'Dibayar per proyek atau jasa. Sebagian penghasilan dianggap biaya, dengan persentase tetap (norma).' },
] as const;

const PERIOD_OPTIONS = [
  { v: 'MONTHLY', l: 'Per bulan', d: 'Pajak yang dipotong atau dibayar tiap bulan (estimasi).' },
  { v: 'ANNUAL', l: 'Setahun penuh', d: 'Pajak terutang untuk satu tahun, dipakai untuk SPT Tahunan.' },
] as const;

const USER_TYPE_OPTIONS = [
  { v: 'OP', l: 'Orang pribadi', d: 'Perorangan, bukan badan usaha.' },
  { v: 'BADAN', l: 'Badan usaha', d: 'Perseroan, CV, koperasi, atau badan lain.' },
] as const;

const PKP_OPTIONS = [
  { v: false, l: 'Belum PKP', d: 'Tidak boleh memungut PPN atau membuat faktur pajak.' },
  { v: true, l: 'Sudah PKP', d: 'Wajib memungut PPN dan membuat faktur pajak.' },
] as const;

const PPH22_TYPES = [
  { v: 'PEMERINTAH', l: 'Pengadaan barang oleh bendahara pemerintah (1,5%)' },
  { v: 'IMPOR_API', l: 'Impor yang memakai API (2,5%)' },
  { v: 'IMPOR_NON_API', l: 'Impor tanpa API (7,5%)' },
  { v: 'INDUSTRI_SEMEN', l: 'Penjualan semen dalam negeri (0,25%)' },
  { v: 'INDUSTRI_KERTAS', l: 'Penjualan kertas dalam negeri (0,1%)' },
  { v: 'INDUSTRI_OTOMOTIF', l: 'Penjualan kendaraan bermotor (0,45%)' },
  { v: 'BARANG_MEWAH', l: 'Penjualan barang sangat mewah (5%)' },
];

const PPH23_TYPES = [
  { v: 'JASA', l: 'Jasa teknik, manajemen, konsultan, dan jasa lain (tarif 2%)' },
  { v: 'SEWA_NON_TANAH', l: 'Sewa barang selain tanah dan bangunan (tarif 2%)' },
  { v: 'DIVIDEN', l: 'Dividen dari badan dalam negeri (tarif 15%)' },
  { v: 'BUNGA', l: 'Bunga pinjaman selain bank (tarif 15%)' },
  { v: 'ROYALTI', l: 'Royalti hak cipta atau paten (tarif 15%)' },
  { v: 'HADIAH_PENGHARGAAN', l: 'Hadiah atau penghargaan kegiatan (tarif 15%)' },
];

const PPH15_CATEGORIES = [
  { v: 'PELAYARAN_DN', l: 'Pelayaran dalam negeri' },
  { v: 'PELAYARAN_LN', l: 'Pelayaran luar negeri' },
  { v: 'PENERBANGAN_DN', l: 'Penerbangan dalam negeri' },
  { v: 'PENERBANGAN_LN', l: 'Penerbangan luar negeri' },
  { v: 'LAINNYA', l: 'Kategori usaha tertentu lainnya' },
];

const PPH42_OBJECTS = [
  { v: 'SEWA_TANAH_BANGUNAN', l: 'Sewa tanah atau bangunan' },
  { v: 'KONSTRUKSI', l: 'Jasa konstruksi' },
  { v: 'UMKM', l: 'Usaha UMKM' },
  { v: 'LAINNYA', l: 'Objek lainnya' },
] as const;

const UMKM_CATEGORIES = [
  { v: 'OP', l: 'Wajib pajak orang pribadi', d: 'Bebas pajak untuk omzet sampai Rp 500 juta per tahun.' },
  { v: 'PT_PERORANGAN', l: 'Orang pribadi dan PT perorangan', d: 'PPh Final 0,5% dari omzet, sampai Rp 4,8 miliar per tahun.' },
  { v: 'KOPERASI', l: 'Koperasi', d: 'PPh Final 0,5%, paling lama 4 tahun sejak terdaftar.' },
  { v: 'BADAN_LAIN', l: 'Badan usaha lain (CV, firma, dan lainnya)', d: 'Tidak memakai PPh Final UMKM. Dihitung di SPT Badan.' },
] as const;

const labelClass = 't-label mb-2 block';
const hintClass = 't-note mt-2';
const errorClass = 't-note mt-2 font-bold text-rose-800';
const innerCardClass = 'space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6';

// Catatan berwarna yang selalu disertai ikon, agar tidak hanya mengandalkan warna.
const noteTone = {
  amber: { box: 'border-amber-200 bg-amber-50', text: 'text-amber-950', icon: 'text-amber-800' },
  sky: { box: 'border-sky-200 bg-sky-50', text: 'text-sky-950', icon: 'text-sky-800' },
} as const;

const Note: React.FC<{ tone: 'amber' | 'sky'; className?: string; role?: string; children: React.ReactNode }> = ({ tone, className = '', role, children }) => {
  const t = noteTone[tone];
  const Icon = tone === 'amber' ? Lightbulb : Info;
  return (
    <div role={role} className={`flex items-start gap-3 rounded-2xl border p-4 ${t.box} ${className}`}>
      <Icon className={`mt-1 h-6 w-6 shrink-0 ${t.icon}`} />
      <div className={`t-body min-w-0 flex-1 space-y-3 ${t.text}`}>{children}</div>
    </div>
  );
};

// Kartu pilihan: saat dipilih muncul ring, latar ungu muda, dan tanda centang.
const choiceClass = (active: boolean) =>
  `card-lift flex min-h-[64px] w-full flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
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

// Pilihan besar (kartu), dipakai untuk pilihan yang jumlahnya sedikit.
const ChoiceButton: React.FC<{ active: boolean; onClick: () => void; title: string; hint?: string }> = ({ active, onClick, title, hint }) => (
  <button type="button" aria-pressed={active} onClick={onClick} className={choiceClass(active)}>
    <span className="flex w-full items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="t-body block font-bold text-slate-900">{title}</span>
        {hint && <span className="t-note mt-1 block">{hint}</span>}
      </span>
      <CheckBadge active={active} />
    </span>
  </button>
);

// Kotak centang yang besar dan berlabel jelas.
const ToggleCard: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; title: string; hint?: string }> = ({ checked, onChange, title, hint }) => (
  <label
    className={`card-lift flex min-h-[64px] cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 ${
      checked ? 'border-violet-700 bg-violet-50 ring-4 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-300'
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-6 w-6 shrink-0 accent-violet-700"
    />
    <span className="min-w-0">
      <span className="t-body block font-bold text-slate-900">{title}</span>
      {hint && <span className="t-note mt-1 block">{hint}</span>}
    </span>
  </label>
);

// Isian uang dalam Rupiah. Label selalu terlihat di atas kolom.
const MoneyField: React.FC<{ id: string; label: string; value: number; onChange: (value: number) => void; hint?: React.ReactNode; placeholder?: string }> = ({ id, label, value, onChange, hint, placeholder }) => (
  <div>
    <label htmlFor={id} className={labelClass}>{label}</label>
    <RupiahInput id={id} value={value} onChange={onChange} placeholder={placeholder} />
    {hint && <p className={hintClass}>{hint}</p>}
  </div>
);

// Angka desimal (misalnya tarif 0,5%). Koma atau titik keduanya diterima.
const parseDecimal = (text: string): number => {
  const cleaned = text.replace(/[^0-9,.]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
const toDecimalText = (value: number) => (value ? String(value).replace('.', ',') : '');

const DecimalField: React.FC<{ id: string; label: string; value: number; onChange: (value: number) => void; suffix?: string; placeholder?: string; hint?: string }> = ({ id, label, value, onChange, suffix, placeholder, hint }) => {
  const [text, setText] = React.useState(() => toDecimalText(value));
  React.useEffect(() => {
    // Ikuti nilai dari luar (misalnya setelah reset), tanpa menghapus koma yang sedang diketik.
    setText((prev) => (parseDecimal(prev) === value ? prev : toDecimalText(value)));
  }, [value]);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          placeholder={placeholder ?? '0'}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseDecimal(e.target.value));
          }}
          className="field pr-14"
        />
        {suffix && (
          <span className="t-label pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-700">{suffix}</span>
        )}
      </div>
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
};

// Bagian yang jarang dibutuhkan disembunyikan dulu, tetapi tetap bisa dibuka.
const Collapsible: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <details className="group card overflow-hidden p-0">
    <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 p-5 transition-colors hover:bg-violet-50">
      <span className="min-w-0">
        <span className="t-body block font-bold text-slate-900">{title}</span>
        {hint && <span className="t-note mt-1 block">{hint}</span>}
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800 transition-transform duration-300 group-open:rotate-180">
        <ChevronDown className="h-5 w-5" />
      </span>
    </summary>
    <div className="space-y-5 px-5 pb-6">{children}</div>
  </details>
);

export const MultiTaxForm: React.FC<MultiTaxFormProps> = ({
  state,
  calculation,
  onChangeState,
  onUpdatePph21,
  onUpdatePph22,
  onUpdatePph23,
  onUpdatePph24,
  onUpdatePph25,
  onUpdatePph26,
  onUpdatePph28,
  onUpdatePph29,
  onUpdatePph15,
  onUpdatePph42,
  onUpdateUmkm,
  onUpdatePpn,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState('');
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(
    new Date(2026, state.selectedMonth - 1, 1)
  );
  const npwpLength = state.profile.npwp.replace(/\D/g, '').length;
  const hasValidNpwp = npwpLength === 15 || npwpLength === 16;
  // NPWP opsional; yang wajib untuk menyalin atau mencetak adalah NIK dan nama.
  const isIdentityComplete = /^\d{16}$/.test(state.profile.nik)
    && Boolean(state.profile.fullName.trim());
  const isAnnualOnlyType = ['PPH_24', 'PPH_28', 'PPH_29'].includes(state.selectedReportingType);
  const displayedPpnbmRate = Math.min(100, Math.max(0, state.ppn.ppnbmRate || 0));
  const readyToPrepareReport = isIdentityComplete;

  const buktiSource = state.selectedReportingType === 'PPH_15'
    ? state.pph15
    : state.selectedReportingType === 'PPH_4_2'
      ? state.pph42
      : null;
  const buktiLine = buktiSource
    ? `\nBukti potong / NTPN: ${buktiSource.buktiNomor || '-'} (tanggal ${buktiSource.buktiTanggal || '-'})`
    : '';

  const handleSaveToDokumen = () => {
    if (!calculation) return;
    const balance = calculation.finalBalanceDue;
    const status = calculation.status === 'NIHIL' ? 'Nihil' : calculation.status === 'KURANG_BAYAR' ? 'Kurang bayar' : 'Lebih bayar';
    const periodeLabel = state.reportingPeriod === 'MONTHLY' ? 'Masa ' + state.selectedMonth + '/' + state.profile.taxYear : 'Tahun pajak ' + state.profile.taxYear;
    saveDoc({
      kind: balance > 0 ? 'SSP' : 'SPT',
      title: calculation.taxTypeName + ' · ' + periodeLabel,
      amount: Math.abs(balance),
      status,
      rows: [
        { label: 'Jenis pajak', value: calculation.taxTypeName },
        { label: 'Dasar pengenaan', value: formatRupiah(calculation.taxBase) },
        { label: 'Pajak terutang', value: formatRupiah(calculation.calculatedTax) },
        { label: 'Sudah dibayar atau dipotong', value: formatRupiah(calculation.creditsOrPrepaid) },
      ],
    });
    notify('ok', 'Disimpan ke Dokumen. SSP, SKP, STP, dan SPT akan memakai data ini.');
  };
  const handleCopySummary = async () => {
    if (!calculation) return;
    setCopyError('');
    const text = `
=== DRAF KALKULASI ATLAX ===
Jenis Pajak: ${calculation.taxTypeName}
Periode: ${state.reportingPeriod === 'MONTHLY' ? `${monthLabel} ${state.profile.taxYear}` : `Tahun Pajak ${state.profile.taxYear}`}
Nama WP: ${state.profile.fullName} (NIK: ${state.profile.nik || '-'}, NPWP: ${state.profile.npwp || '-'})${buktiLine}
Dasar Pengenaan Pajak (DPP): ${formatRupiah(calculation.taxBase)}
Tarif: ${calculation.applicableRateText}
Pajak Terhitung: ${formatRupiah(calculation.calculatedTax)}
Kredit / Potongan: ${formatRupiah(calculation.creditsOrPrepaid)}
Status Akhir: ${calculation.status} (${formatRupiah(Math.abs(calculation.finalBalanceDue))})
Batas Setor: ${calculation.paymentDeadline}
Batas Lapor: ${calculation.reportingDeadline}
Sanksi Telat Lapor: ${calculation.lateFilingFeeText}
============================
Draf perhitungan ATLAX. SPT belum dikirim; lakukan pelaporan melalui Coretax DJP.
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError('Tidak dapat menyalin otomatis. Izinkan akses clipboard atau gunakan Cetak / PDF.');
    }
  };

  // Data diri untuk laporan: opsional untuk menghitung, wajib untuk menyalin atau mencetak.
  const identityPanel = (
    <Collapsible
      title="Data diri dan tahun pajak (opsional)"
      hint="Hanya perlu diisi jika Anda ingin menyalin atau mencetak ringkasan."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="fld-multitaxform-4" className={labelClass}>
            Nama lengkap <span className="text-rose-800">(wajib untuk laporan)</span>
          </label>
          <input id="fld-multitaxform-4"
            type="text"
            value={state.profile.fullName}
            onChange={(e) => onChangeState({ profile: { ...state.profile, fullName: e.target.value } })}
            className="field"
            placeholder="Nama sesuai KTP"
          />
        </div>
        <div>
          <label htmlFor="fld-multitaxform-3" className={labelClass}>
            NIK, 16 digit <span className="text-rose-800">(wajib untuk laporan)</span>
          </label>
          <input id="fld-multitaxform-3"
            type="text"
            inputMode="numeric"
            maxLength={16}
            value={state.profile.nik}
            onChange={(e) => onChangeState({ profile: { ...state.profile, nik: e.target.value.replace(/\D/g, '') } })}
            className="field"
            placeholder="Masukkan 16 digit NIK"
          />
          {state.profile.nik.length > 0 && state.profile.nik.length !== 16 && (
            <p className={errorClass}>NIK harus terdiri dari 16 digit.</p>
          )}
        </div>
        <div>
          <label htmlFor="fld-multitaxform-2" className={labelClass}>
            NPWP, 15 atau 16 digit <span className="font-normal text-slate-600">(boleh kosong)</span>
          </label>
          <input id="fld-multitaxform-2"
            type="text"
            inputMode="numeric"
            maxLength={16}
            value={state.profile.npwp.replace(/\D/g, '')}
            onChange={(e) => onChangeState({ profile: { ...state.profile, npwp: e.target.value.replace(/\D/g, '').slice(0, 16) } })}
            className="field"
            placeholder="Masukkan NPWP jika punya"
          />
          {state.profile.npwp.length > 0 && !hasValidNpwp && (
            <p className={errorClass}>NPWP harus terdiri dari 15 atau 16 digit.</p>
          )}
        </div>
        <div>
          <p className="t-body mb-3 font-bold text-slate-900">Sudah PKP (Pengusaha Kena Pajak)?</p>
          <div className="grid grid-cols-1 gap-4">
            {PKP_OPTIONS.map((opt) => (
              <ChoiceButton
                key={String(opt.v)}
                active={(state.profile.isPkp ?? false) === opt.v}
                onClick={() => onChangeState({ profile: { ...state.profile, isPkp: opt.v } })}
                title={opt.l}
                hint={opt.d}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="t-body mb-3 font-bold text-slate-900">Jenis wajib pajak</p>
          <div className="grid grid-cols-1 gap-4">
            {USER_TYPE_OPTIONS.map((opt) => (
              <ChoiceButton
                key={opt.v}
                active={(state.profile.userType || 'OP') === opt.v}
                onClick={() => onChangeState({ profile: { ...state.profile, userType: opt.v } })}
                title={opt.l}
                hint={opt.d}
              />
            ))}
          </div>
        </div>
        {state.profile.userType !== 'BADAN' && (
          <div className="sm:col-span-2">
            <label htmlFor="fld-multitaxform-6" className={labelClass}>Status PTKP (status keluarga untuk batas bebas pajak)</label>
            <select id="fld-multitaxform-6"
              value={state.profile.ptkpStatus}
              onChange={(e) => onChangeState({ profile: { ...state.profile, ptkpStatus: e.target.value as PTKPStatus } })}
              className="field"
            >
              {(Object.keys(PTKP_RATES) as PTKPStatus[]).map((status) => (
                <option key={status} value={status}>
                  {status} - {PTKP_RATES[status].description}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="fld-multitaxform-7" className={labelClass}>Tahun pajak</label>
          <input id="fld-multitaxform-7"
            type="number"
            min={2000}
            max={2100}
            value={state.profile.taxYear}
            onChange={(e) => onChangeState({ profile: { ...state.profile, taxYear: Number(e.target.value) } })}
            className="field"
          />
        </div>
      </div>
    </Collapsible>
  );

  if (!calculation) return null;

  const isKurang = calculation.status === 'KURANG_BAYAR';
  const isLebih = calculation.status === 'LEBIH_BAYAR';
  const isNihil = calculation.status === 'NIHIL';
  const balanceAbs = Math.abs(calculation.finalBalanceDue);
  const heroTone = isNihil
    ? 'border-sky-200 bg-sky-50 text-sky-950'
    : isKurang
      ? 'border-rose-200 bg-rose-50 text-rose-950'
      : 'border-emerald-200 bg-emerald-50 text-emerald-950';
  const HeroIcon = isKurang ? AlertTriangle : CheckCircle2;
  const heroSentence = isNihil
    ? 'Pajak yang terhitung dan kredit yang sudah ada seimbang. Biasanya karena penghasilan masih di bawah batas bebas pajak.'
    : isKurang
      ? `Pajak terhitung ${formatRupiah(calculation.calculatedTax)}, sedangkan yang sudah dipotong atau dibayar baru ${formatRupiah(calculation.creditsOrPrepaid)}. Selisihnya harus Anda setor.`
      : `Yang sudah dipotong atau dibayar ${formatRupiah(calculation.creditsOrPrepaid)} lebih besar dari pajak terhitung ${formatRupiah(calculation.calculatedTax)}. Kelebihannya bisa dikembalikan atau dipakai berikutnya.`;

  const periodText = state.reportingPeriod === 'MONTHLY'
    ? `masa ${monthLabel} ${state.profile.taxYear}`
    : `rekap tahun ${state.profile.taxYear}`;

  // Pilihan periode: dipakai oleh semua jenis pajak yang bisa bulanan atau setahunan.
  const periodSection = isAnnualOnlyType ? (
    <div className={innerCardClass}>
      <p className="t-body font-bold text-slate-900">Periode laporan</p>
      <p className="t-body">Tahunan, terintegrasi dengan SPT Tahunan.</p>
    </div>
  ) : (
    <div className={innerCardClass}>
      <div>
        <p className="t-body font-bold text-slate-900">Periode hitung</p>
        <p className={hintClass}>Pilih per bulan untuk pajak yang dibayar tiap bulan. Pilih setahun untuk rekap satu tahun penuh.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERIOD_OPTIONS.map((opt) => (
          <ChoiceButton
            key={opt.v}
            active={state.reportingPeriod === opt.v}
            onClick={() => onChangeState({ reportingPeriod: opt.v })}
            title={opt.l}
            hint={opt.d}
          />
        ))}
      </div>
      {state.reportingPeriod === 'MONTHLY' && (
        <div>
          <label htmlFor="fld-multitaxform-9" className={labelClass}>Masa pajak (bulan)</label>
          <select id="fld-multitaxform-9" value={state.selectedMonth} onChange={(e) => onChangeState({ selectedMonth: Number(e.target.value) })} className="field">
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>{name}</option>
            ))}
          </select>
          {state.selectedReportingType === 'PPH_21' && state.selectedMonth === 12 && (
            <p className={hintClass}>
              Desember adalah bulan penyesuaian akhir tahun: pajak setahun dikurangi yang sudah dipotong Januari sampai November.
            </p>
          )}
        </div>
      )}
      {state.reportingPeriod === 'ANNUAL' && !['PPH_21', 'PPH_24', 'PPH_28', 'PPH_29'].includes(state.selectedReportingType) && (
        <Note tone="amber">
          Untuk jenis pajak ini, pilihan setahun adalah rekap angka setahun, bukan pengganti SPT Masa bulanan.
        </Note>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {identityPanel}

      {/* Hasil sementara: selalu terlihat saat angka diubah, jadi tidak perlu kolom kedua yang bisa kosong */}
      <div className="sticky top-28 z-20">
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 px-5 py-3 shadow-lg backdrop-blur-md ${heroTone}`}>
          <p className="t-label">Hasil sementara</p>
          <p className="t-card break-words">
            {isNihil && 'Tidak ada pajak yang harus dibayar'}
            {isKurang && <>Kurang bayar {formatRupiah(balanceAbs)}</>}
            {isLebih && <>Lebih bayar {formatRupiah(balanceAbs)}</>}
          </p>
        </div>
      </div>


      {/* Isian lalu hasil, satu kolom di semua ukuran layar */}
      <div className="space-y-6">
      <div className="min-w-0 space-y-6">

      {/* FORMULIR SESUAI JENIS PAJAK */}
      <section className="card relative space-y-6 overflow-hidden pt-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-violet-100 to-violet-200" />
        <div className="border-b border-slate-100 pb-5">
          <h3 className="t-section">
            Isi angka untuk {calculation.taxTypeName}
          </h3>
          <p className="t-body mt-3">
            Masukkan angka sesuai bukti transaksi untuk {periodText}.
          </p>
          <p className="t-note mt-3">
            <span className="font-bold text-violet-800">Apa ini?</span> Angka di bawah ini dipakai untuk menghitung pajak Anda. Ambil dari bukti potong, faktur, atau catatan Anda.
          </p>
        </div>

        {/* PPh 21: jenis pekerjaan dan status PTKP */}
        {state.selectedReportingType === 'PPH_21' && (
          <div className="space-y-6">
            <div className={innerCardClass}>
              <div>
                <p className="t-body font-bold text-slate-900">Anda bekerja sebagai apa?</p>
                <p className={hintClass}>Pilih satu.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PPH21_MODES.map((opt) => (
                  <ChoiceButton
                    key={opt.v}
                    active={state.pph21.mode === opt.v}
                    onClick={() => onUpdatePph21({ mode: opt.v })}
                    title={opt.l}
                    hint={opt.d}
                  />
                ))}
              </div>
            </div>

            <div className={innerCardClass}>
              <div>
                <p className="t-body font-bold text-slate-900">Status Anda untuk batas bebas pajak</p>
                <p className={hintClass}>Pilih sesuai status Anda per 1 Januari.</p>
              </div>
              <PtkpPicker
                value={state.profile.ptkpStatus}
                onChange={(status) => onChangeState({ profile: { ...state.profile, ptkpStatus: status } })}
              />
            </div>
          </div>
        )}

        {periodSection}

        {/* 1. PPh 21 */}
        {state.selectedReportingType === 'PPH_21' && state.pph21.mode === 'FREELANCER' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <MoneyField
              id="fld-pph21-freelance-revenue"
              label="Total penghasilan jasa atau fee setahun"
              value={state.pph21.freelanceRevenueAnnual}
              onChange={(v) => onUpdatePph21({ freelanceRevenueAnnual: v })}
            />
            <DecimalField
              id="fld-pph21-nppn"
              label="Persentase biaya (norma)"
              value={state.pph21.freelanceNppnPercent}
              onChange={(v) => onUpdatePph21({ freelanceNppnPercent: v })}
              suffix="%"
              placeholder="50"
              hint="Persentase penghasilan yang dianggap sebagai biaya. Sesuaikan dengan jenis usaha Anda."
            />
            <MoneyField
              id="fld-pph21-freelance-prepaid"
              label="Pajak yang sudah dipotong klien (dari bukti potong)"
              value={state.pph21.freelancePrepaid}
              onChange={(v) => onUpdatePph21({ freelancePrepaid: v })}
            />
            <Note tone="sky" className="sm:col-span-2">
              Penghitungan ini memakai tarif bertingkat setahun, setelah dikurangi persentase biaya (norma) dan batas bebas pajak. Cek persentase ini sesuai jenis usaha Anda.
            </Note>
          </div>
        )}

        {state.selectedReportingType === 'PPH_21' && state.pph21.mode === 'KARYAWAN' && (
          <div className="space-y-5">
            <div className="space-y-4">
              <ToggleCard
                checked={state.pph21.noNpwp}
                onChange={(v) => onUpdatePph21({ noNpwp: v })}
                title="Penerima tidak punya NPWP"
              />
              <ToggleCard
                checked={state.pph21.nikGiven}
                onChange={(v) => onUpdatePph21({ nikGiven: v })}
                title="Penerima sudah memberi NIK"
              />
              {state.pph21.noNpwp && !state.pph21.nikGiven && (
                <Note tone="amber">Tanpa NPWP dan tanpa NIK, PPh 21 dihitung 120% dari tarif normal.</Note>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <MoneyField
                id="fld-multitaxform-10"
                label="Gaji kotor per bulan (rata-rata)"
                value={state.pph21.grossSalaryMonthly}
                onChange={(v) => onUpdatePph21({ grossSalaryMonthly: v })}
              />
              <MoneyField
                id="fld-multitaxform-11"
                label="Bonus, THR, dan tunjangan tahunan (total setahun)"
                value={state.pph21.bonusThr}
                onChange={(v) => onUpdatePph21({ bonusThr: v })}
              />
              <MoneyField
                id="fld-multitaxform-12"
                label="Iuran pensiun atau JHT mandiri per bulan"
                value={state.pph21.pensionContributionMonthly}
                onChange={(v) => onUpdatePph21({ pensionContributionMonthly: v })}
              />
              {state.reportingPeriod === 'ANNUAL' && (
                <div className="sm:col-span-2">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor="fld-pph21-withholding" className="t-label">
                      Total PPh 21 yang sudah dipotong setahun
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdatePph21({ withholdingTaxPaid: calculation?.taxType === 'PPH_21' ? calculation.calculatedTax : 0 })}
                      className="btn-soft btn-sm"
                    >
                      Isi estimasi dari sistem
                    </button>
                  </div>
                  <RupiahInput
                    id="fld-pph21-withholding"
                    value={state.pph21.withholdingTaxPaid}
                    onChange={(v) => onUpdatePph21({ withholdingTaxPaid: v })}
                  />
                  <p className={hintClass}>
                    Estimasi sistem sama dengan PPh terutang setahun. Ganti dengan angka dari bukti potong 1721-A1 jika sudah ada.
                  </p>
                </div>
              )}
              {state.reportingPeriod === 'MONTHLY' && state.selectedMonth === 12 && (
                <div className="sm:col-span-2">
                  <MoneyField
                    id="fld-multitaxform-13"
                    label="Akumulasi PPh 21 yang dipotong Januari sampai November"
                    value={state.pph21.withholdingTaxJanToNov}
                    onChange={(v) => onUpdatePph21({ withholdingTaxJanToNov: v })}
                    placeholder="Total sesuai bukti potong Januari sampai November"
                    hint="Desember menghitung ulang PPh setahun, lalu mengurangkan potongan Januari sampai November."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {state.selectedReportingType === 'PPH_21' && (
          <Collapsible title="Lihat tabel tarif dan PTKP" hint="Untuk yang ingin tahu dasar hitungannya.">
            <div className="space-y-6">
              <div>
                <p className="t-body mb-3 font-bold text-slate-900">Tarif progresif Pasal 17 UU HPP</p>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full border-collapse bg-white">
                    <thead className="bg-violet-50">
                      <tr>
                        <th className="t-label border-b border-slate-200 p-4 text-left">Lapisan penghasilan kena pajak</th>
                        <th className="t-label border-b border-slate-200 p-4 text-right">Tarif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAX_BRACKETS.map((bracket) => (
                        <tr key={bracket.label} className="border-b border-slate-200 last:border-b-0">
                          <td className="t-body p-4">{bracket.label}</td>
                          <td className="t-body p-4 text-right font-bold text-slate-900">{Math.round(bracket.rate * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <p className="t-body mb-3 font-bold text-slate-900">Nilai PTKP per tahun (PMK 101/PMK.010/2016)</p>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full border-collapse bg-white">
                    <thead className="bg-violet-50">
                      <tr>
                        <th className="t-label border-b border-slate-200 p-4 text-left">Status</th>
                        <th className="t-label border-b border-slate-200 p-4 text-left">Keterangan</th>
                        <th className="t-label border-b border-slate-200 p-4 text-right">PTKP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(PTKP_RATES).map((item) => (
                        <tr key={item.code} className="border-b border-slate-200 last:border-b-0">
                          <td className="t-body p-4 font-bold">{item.label}</td>
                          <td className="t-body p-4">{item.description}</td>
                          <td className="t-body p-4 text-right font-bold text-slate-900">{formatRupiah(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="t-note">
                Penghitungan karyawan memakai biaya jabatan 5% (maksimal Rp 6 juta setahun). PKP dibulatkan ke bawah per Rp 1.000.
              </p>
            </div>
          </Collapsible>
        )}

        {/* 2. PPh 22 */}
        {state.selectedReportingType === 'PPH_22' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fld-multitaxform-14" className={labelClass}>Jenis transaksi (objek PPh Pasal 22)</label>
                <select id="fld-multitaxform-14"
                  value={state.pph22.transactionType}
                  onChange={(e) => onUpdatePph22({ transactionType: e.target.value as any })}
                  className="field"
                >
                  {PPH22_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <MoneyField
                id="fld-multitaxform-15"
                label="Nilai transaksi atau nilai impor (DPP)"
                value={state.pph22.transactionValue}
                onChange={(v) => onUpdatePph22({ transactionValue: v })}
              />
            </div>

            <ToggleCard
              checked={state.pph22.hasNpwp}
              onChange={(v) => onUpdatePph22({ hasNpwp: v })}
              title="Pihak lawan transaksi punya NPWP"
              hint="Jika tidak punya NPWP, tarif dinaikkan 100% (Pasal 22 ayat 3 UU PPh)."
            />
            <MoneyField
              id="fld-multitaxform-16"
              label={`PPh 22 yang sudah dibayar atau disetor ${state.reportingPeriod === 'ANNUAL' ? 'setahun' : 'pada masa ini'}`}
              value={state.pph22.taxAlreadyPaid}
              onChange={(v) => onUpdatePph22({ taxAlreadyPaid: v })}
            />
          </div>
        )}

        {/* 3. PPh 23 */}
        {state.selectedReportingType === 'PPH_23' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fld-multitaxform-17" className={labelClass}>Jenis penghasilan (objek PPh Pasal 23)</label>
                <select id="fld-multitaxform-17"
                  value={state.pph23.incomeType}
                  onChange={(e) => onUpdatePph23({ incomeType: e.target.value as any })}
                  className="field"
                >
                  {PPH23_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <MoneyField
                id="fld-multitaxform-18"
                label="Jumlah penghasilan bruto (DPP)"
                value={state.pph23.grossAmount}
                onChange={(v) => onUpdatePph23({ grossAmount: v })}
              />
            </div>

            <ToggleCard
              checked={state.pph23.hasNpwp}
              onChange={(v) => onUpdatePph23({ hasNpwp: v })}
              title="Penerima punya NPWP"
              hint="Jika tidak punya NPWP, tarif dinaikkan 100% (tarif 2% jadi 4%, 15% jadi 30%)."
            />
            <MoneyField
              id="fld-multitaxform-19"
              label={`PPh 23 yang sudah dibayar atau disetor ${state.reportingPeriod === 'ANNUAL' ? 'setahun' : 'pada masa ini'}`}
              value={state.pph23.taxAlreadyPaid}
              onChange={(v) => onUpdatePph23({ taxAlreadyPaid: v })}
            />
          </div>
        )}

        {/* 4. PPh 24 */}
        {state.selectedReportingType === 'PPH_24' && (() => {
          const b = pph24Breakdown(state.pph24);
          const updateCountry = (id: string, patch: Partial<ComprehensiveTaxState['pph24']['countries'][number]>) =>
            onUpdatePph24({ countries: state.pph24.countries.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
          return (
            <div className="space-y-6">
              <Note tone="amber">
                Kredit PPh 24 dihitung per negara sesuai batas kredit. Isi kurs dengan kurs pajak resmi yang berlaku, bukan kurs pasar.
              </Note>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <MoneyField
                  id="fld-pph24-neto"
                  label="Penghasilan neto dari dalam negeri"
                  value={state.pph24.domesticNetIncome}
                  onChange={(v) => onUpdatePph24({ domesticNetIncome: v })}
                />
                <MoneyField
                  id="fld-pph24-pkp"
                  label="Total PKP (penghasilan kena pajak)"
                  value={state.pph24.totalPkp}
                  onChange={(v) => onUpdatePph24({ totalPkp: v })}
                />
                <MoneyField
                  id="fld-pph24-terutang"
                  label="PPh terutang sebelum kredit"
                  value={state.pph24.pphTerutangSebelumKredit}
                  onChange={(v) => onUpdatePph24({ pphTerutangSebelumKredit: v })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="t-body font-bold text-slate-900">Penghasilan dan pajak per negara</p>
                    <p className={hintClass}>Isi untuk setiap negara tempat penghasilan Anda sudah dikenai pajak.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdatePph24({ countries: [...state.pph24.countries, { id: `neg-${Date.now()}`, negara: '', mataUang: 'USD', kurs: 0, netoFx: 0, pajakFx: 0 }] })}
                    className="btn-soft"
                  >
                    + Tambah negara
                  </button>
                </div>

                {state.pph24.countries.length === 0 && (
                  <p className="t-body rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-5">
                    Belum ada negara. Tekan &quot;Tambah negara&quot; jika Anda punya penghasilan dari luar negeri.
                  </p>
                )}

                {state.pph24.countries.map((c, index) => (
                  <div key={c.id} className={innerCardClass}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="t-card text-slate-900">Negara {index + 1}</p>
                      <button
                        type="button"
                        className="btn-danger btn-sm bg-rose-700 hover:bg-rose-800"
                        onClick={() => onUpdatePph24({ countries: state.pph24.countries.filter((x) => x.id !== c.id) })}
                      >
                        Hapus negara ini
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>Nama negara</span>
                        <input type="text" value={c.negara} onChange={(e) => updateCountry(c.id, { negara: e.target.value })} placeholder="Contoh: Singapura" className="field" />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Mata uang</span>
                        <select value={c.mataUang} onChange={(e) => updateCountry(c.id, { mataUang: e.target.value })} className="field">
                          {PPH24_CURRENCIES.map((cur) => <option key={cur.code} value={cur.code}>{cur.code} - {cur.name}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>Kurs pajak (Rp per 1 satuan mata uang)</span>
                        <input type="number" min="0" step="any" value={c.kurs || ''} onChange={(e) => updateCountry(c.id, { kurs: Number(e.target.value) })} placeholder="Kurs pajak" className="field" />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Penghasilan neto dari negara ini (dalam mata uang asing)</span>
                        <input type="number" min="0" step="any" value={c.netoFx || ''} onChange={(e) => updateCountry(c.id, { netoFx: Number(e.target.value) })} placeholder="0" className="field" />
                      </label>
                      <label className="block sm:col-span-2">
                        <span className={labelClass}>Pajak yang sudah dibayar di negara ini (dalam mata uang asing)</span>
                        <input type="number" min="0" step="any" value={c.pajakFx || ''} onChange={(e) => updateCountry(c.id, { pajakFx: Number(e.target.value) })} placeholder="0" className="field" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card space-y-5 p-5 sm:p-6">
                <p className="t-card text-slate-900">Hasil perhitungan PPh 24</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <p className="t-note font-bold text-slate-700">Total penghasilan neto</p>
                    <p className="t-body mt-1 break-words font-extrabold text-slate-900">{formatRupiah(b.totalNeto)}</p>
                  </div>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <p className="t-note font-bold text-slate-700">Total PKP</p>
                    <p className="t-body mt-1 break-words font-extrabold text-slate-900">{formatRupiah(b.totalPkp)}</p>
                  </div>
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                    <p className="t-note font-bold text-slate-700">PPh terutang sebelum kredit</p>
                    <p className="t-body mt-1 break-words font-extrabold text-slate-900">{formatRupiah(b.pphTerutang)}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="t-note font-bold text-slate-700">Kredit PPh 24 yang boleh dipakai</p>
                    <p className="t-body mt-1 break-words font-extrabold text-emerald-900">{formatRupiah(b.totalKredit)}</p>
                  </div>
                </div>

                {b.rows.length > 0 && (
                  <div className="space-y-3">
                    {b.rows.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-slate-200 p-4">
                        <p className="t-body font-bold text-slate-900">{r.negara || 'Negara'} ({r.mataUang})</p>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                          <dt className="t-note text-slate-700">Neto (Rp)</dt>
                          <dd className="t-body text-right font-semibold text-slate-900">{formatRupiah(r.netoIdr)}</dd>
                          <dt className="t-note text-slate-700">Pajak dibayar (Rp)</dt>
                          <dd className="t-body text-right font-semibold text-slate-900">{formatRupiah(r.pajakIdr)}</dd>
                          <dt className="t-note text-slate-700">Batas kredit (Rp)</dt>
                          <dd className="t-body text-right font-semibold text-slate-900">{formatRupiah(r.batas)}</dd>
                          <dt className="t-body font-bold text-slate-900">Kredit yang boleh dipakai (Rp)</dt>
                          <dd className="t-body text-right font-extrabold text-slate-900">{formatRupiah(r.kredit)}</dd>
                        </dl>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                  <p className="t-card text-slate-900">Sisa PPh setelah kredit</p>
                  <p className="t-section text-slate-900">{formatRupiah(b.sisa)}</p>
                </div>
                {b.warnings.map((w) => (
                  <Note key={w} tone="amber" role="status">{w}</Note>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 5. PPh 25 */}
        {state.selectedReportingType === 'PPH_25' && (
          <div className="space-y-5">
            <Note tone="sky">
              <p className="font-bold">Rumus angsuran PPh 25 per bulan</p>
              <p>
                (PPh terutang SPT tahun lalu dikurangi kredit pajak tahun lalu) dibagi 12. Hasilnya disetor setiap bulan, paling lambat tanggal 15 bulan berikutnya.
              </p>
            </Note>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <MoneyField
                id="fld-multitaxform-20"
                label="Total PPh terutang SPT tahun lalu"
                value={state.pph25.priorYearTaxDue}
                onChange={(v) => onUpdatePph25({ priorYearTaxDue: v })}
              />
              <MoneyField
                id="fld-multitaxform-21"
                label="Total kredit pajak tahun lalu (PPh 21, 22, 23, dan 26 yang dipotong)"
                value={state.pph25.priorYearTaxCredits}
                onChange={(v) => onUpdatePph25({ priorYearTaxCredits: v })}
              />
              <div className="sm:col-span-2">
                <MoneyField
                  id="fld-multitaxform-22"
                  label={`Angsuran PPh 25 yang sudah disetor ${state.reportingPeriod === 'ANNUAL' ? 'setahun' : 'bulan ini'}`}
                  value={state.pph25.taxAlreadyPaid}
                  onChange={(v) => onUpdatePph25({ taxAlreadyPaid: v })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. PPh 26 */}
        {state.selectedReportingType === 'PPH_26' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <MoneyField
                id="fld-multitaxform-23"
                label="Jumlah penghasilan bruto dari pihak luar negeri"
                value={state.pph26.grossAmount}
                onChange={(v) => onUpdatePph26({ grossAmount: v })}
              />
              <DecimalField
                id="fld-multitaxform-24"
                label="Tarif tax treaty atau P3B (jika ada)"
                value={state.pph26.taxTreatyRate}
                onChange={(v) => onUpdatePph26({ taxTreatyRate: v })}
                suffix="%"
                placeholder="Contoh: 10"
                hint="Kosongkan jika tidak ada perjanjian P3B."
              />
            </div>

            <ToggleCard
              checked={state.pph26.hasDGTForm}
              onChange={(v) => onUpdatePph26({ hasDGTForm: v })}
              title="Sudah punya Form DGT atau SKD (surat keterangan domisili)"
              hint="Wajib jika ingin memakai tarif keringanan tax treaty (P3B)."
            />
            <MoneyField
              id="fld-multitaxform-25"
              label={`PPh 26 yang sudah dibayar atau disetor ${state.reportingPeriod === 'ANNUAL' ? 'setahun' : 'pada masa ini'}`}
              value={state.pph26.taxAlreadyPaid}
              onChange={(v) => onUpdatePph26({ taxAlreadyPaid: v })}
            />
          </div>
        )}

        {/* 10. PPh 15 */}
        {state.selectedReportingType === 'PPH_15' && (
          <div className="space-y-5">
            <Note tone="amber">
              Tarif tidak diisi otomatis. Masukkan DPP dan tarif sesuai jenis usaha dan peraturan yang berlaku.
            </Note>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fld-multitaxform-26" className={labelClass}>Kategori usaha</label>
                <select id="fld-multitaxform-26"
                  value={state.pph15.category}
                  onChange={(e) => onUpdatePph15({ category: e.target.value as ComprehensiveTaxState['pph15']['category'] })}
                  className="field"
                >
                  {PPH15_CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <MoneyField
                id="fld-pph15-gross"
                label="Penghasilan bruto"
                value={state.pph15.grossAmount}
                onChange={(v) => onUpdatePph15({ grossAmount: v })}
              />
              <MoneyField
                id="fld-pph15-dpp"
                label="Dasar pengenaan pajak (DPP)"
                value={state.pph15.dpp}
                onChange={(v) => onUpdatePph15({ dpp: v })}
              />
              <DecimalField
                id="fld-pph15-rate"
                label="Tarif sesuai peraturan"
                value={state.pph15.ratePercent}
                onChange={(v) => onUpdatePph15({ ratePercent: v })}
                suffix="%"
                placeholder="Contoh: 1,2"
              />
              <MoneyField
                id="fld-pph15-paid"
                label="PPh yang sudah dibayar atau dipotong"
                value={state.pph15.taxAlreadyPaid}
                onChange={(v) => onUpdatePph15({ taxAlreadyPaid: v })}
              />
            </div>

            <Collapsible title="Isian tambahan (opsional)" hint="Nomor bukti potong, tanggal, dan dasar hukum.">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label htmlFor="fld-multitaxform-27" className={labelClass}>Referensi hukum</label>
                  <input id="fld-multitaxform-27"
                    type="text"
                    value={state.pph15.legalReference}
                    onChange={(e) => onUpdatePph15({ legalReference: e.target.value })}
                    className="field"
                    placeholder="Contoh: PP atau PMK yang dipakai"
                  />
                </div>
                <div>
                  <label htmlFor="fld-multitaxform-28" className={labelClass}>Nomor bukti potong atau NTPN</label>
                  <input id="fld-multitaxform-28"
                    type="text"
                    value={state.pph15.buktiNomor}
                    onChange={(e) => onUpdatePph15({ buktiNomor: e.target.value })}
                    className="field"
                    placeholder="Isi dari bukti potong atau bukti setor"
                  />
                </div>
                <div>
                  <label htmlFor="fld-multitaxform-29" className={labelClass}>Tanggal bukti potong atau setor</label>
                  <input id="fld-multitaxform-29"
                    type="date"
                    value={state.pph15.buktiTanggal}
                    onChange={(e) => onUpdatePph15({ buktiTanggal: e.target.value })}
                    className="field"
                  />
                </div>
              </div>
            </Collapsible>
          </div>
        )}

        {/* 12. UMKM */}
        {state.selectedReportingType === 'UMKM' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="t-body font-bold text-slate-900">Pilih kategori wajib pajak UMKM Anda</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {UMKM_CATEGORIES.map((opt) => (
                  <ChoiceButton
                    key={opt.v}
                    active={state.umkm.kategori === opt.v}
                    onClick={() => onUpdateUmkm({ kategori: opt.v as ComprehensiveTaxState['umkm']['kategori'] })}
                    title={opt.l}
                    hint={opt.d}
                  />
                ))}
              </div>
            </div>

            <Note tone="sky">
              {state.umkm.kategori === 'OP' && <p><span className="font-bold">Tarif:</span> bebas pajak sampai omzet Rp 500 juta setahun, lalu 0,5% atas kelebihannya.</p>}
              {state.umkm.kategori === 'PT_PERORANGAN' && <p><span className="font-bold">Tarif:</span> 0,5% dari seluruh omzet, sampai omzet Rp 4,8 miliar setahun.</p>}
              {state.umkm.kategori === 'KOPERASI' && (
                <div className="space-y-3">
                  <p><span className="font-bold">Tarif:</span> 0,5% dari seluruh omzet, paling lama 4 tahun sejak terdaftar.</p>
                  <div>
                    <label htmlFor="fld-multitaxform-31" className={labelClass}>Tahun mulai terdaftar</label>
                    <input id="fld-multitaxform-31"
                      type="number"
                      value={state.umkm.tahunTerdaftar || ''}
                      onChange={(e) => onUpdateUmkm({ tahunTerdaftar: Number(e.target.value) })}
                      className="field"
                    />
                  </div>
                </div>
              )}
              {state.umkm.kategori === 'BADAN_LAIN' && <p><span className="font-bold">Tarif:</span> tidak memakai PPh Final 0,5%. Dihitung dengan tarif umum PPh Badan (22%) dari laba, di SPT Badan.</p>}
            </Note>

            <Collapsible title="Lihat semua kategori dan aturannya" hint="Tabel lengkap. Cek ulang ke peraturan terbaru sebelum dipakai untuk lapor.">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse bg-white">
                  <thead className="bg-violet-50">
                    <tr>
                      <th className="t-label border border-slate-200 p-4 text-left">Kategori wajib pajak UMKM</th>
                      <th className="t-label border border-slate-200 p-4 text-left">Tarif dan batas</th>
                      <th className="t-label border border-slate-200 p-4 text-left">Jangka waktu berlaku</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="t-body border border-slate-200 p-4"><span className="font-bold">Wajib pajak orang pribadi</span><span className="t-note block">Omzet sampai Rp 500 juta per tahun</span></td>
                      <td className="t-body border border-slate-200 p-4">Bebas pajak (0%)</td>
                      <td className="t-body border border-slate-200 p-4"><span className="font-bold">Selamanya</span> (permanen)</td>
                    </tr>
                    <tr>
                      <td className="t-body border border-slate-200 p-4"><span className="font-bold">Orang pribadi dan PT perorangan</span><span className="t-note block">Omzet sampai Rp 4,8 miliar per tahun</span></td>
                      <td className="t-body border border-slate-200 p-4">PPh Final 0,5%, mengikuti ketentuan yang berlaku</td>
                      <td className="t-body border border-slate-200 p-4"><span className="font-bold">Selamanya</span> (permanen)</td>
                    </tr>
                    <tr>
                      <td className="t-body border border-slate-200 p-4"><span className="font-bold">Koperasi</span><span className="t-note block">Omzet sampai Rp 4,8 miliar per tahun</span></td>
                      <td className="t-body border border-slate-200 p-4">PPh Final 0,5%, mengikuti ketentuan yang berlaku</td>
                      <td className="t-body border border-slate-200 p-4">Paling lama <span className="font-bold">4 tahun</span> sejak terdaftar</td>
                    </tr>
                    <tr>
                      <td className="t-body border border-slate-200 p-4"><span className="font-bold">Badan usaha lain</span><span className="t-note block">CV, firma, dan lainnya, termasuk BUMDes</span></td>
                      <td className="t-body border border-slate-200 p-4">Tidak lagi berhak PPh Final UMKM, dan tidak mendapat bebas Rp 500 juta</td>
                      <td className="t-body border border-slate-200 p-4">Wajib tarif umum PPh Badan 22%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Collapsible>

            <Note tone="amber">
              Isi omzet (peredaran bruto) dan biaya per bulan. Total dan PPh Final dihitung otomatis. Batas bebas dan dasar pengenaan perlu dicek ke PP 55/2022.
            </Note>

            <div className="space-y-3">
              <p className="t-body font-bold text-slate-900">Omzet dan biaya per bulan</p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {MONTH_NAMES.map((name, index) => {
                  const omzet = state.umkm.omzetBulanan[index] || 0;
                  const biaya = state.umkm.biayaBulanan[index] || 0;
                  return (
                    <div key={name} className="card space-y-4 p-5">
                      <p className="t-card text-slate-900">{name}</p>
                      <div>
                        <label htmlFor={`fld-umkm-omzet-${index}`} className={labelClass}>Omzet (penjualan)</label>
                        <RupiahInput
                          id={`fld-umkm-omzet-${index}`}
                          value={omzet}
                          onChange={(v) => {
                            const next = [...state.umkm.omzetBulanan];
                            next[index] = v;
                            onUpdateUmkm({ omzetBulanan: next });
                          }}
                        />
                      </div>
                      <div>
                        <label htmlFor={`fld-umkm-biaya-${index}`} className={labelClass}>Biaya</label>
                        <RupiahInput
                          id={`fld-umkm-biaya-${index}`}
                          value={biaya}
                          onChange={(v) => {
                            const next = [...state.umkm.biayaBulanan];
                            next[index] = v;
                            onUpdateUmkm({ biayaBulanan: next });
                          }}
                        />
                      </div>
                      <p className="t-body text-slate-800">
                        Laba kotor: <span className="font-bold text-slate-900">{formatRupiah(omzet - biaya)}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card grid grid-cols-1 gap-4 border-2 border-violet-200 bg-violet-50 p-5 sm:grid-cols-3">
              <div>
                <p className="t-label text-slate-700">Total omzet setahun</p>
                <p className="t-card mt-1 break-words text-slate-900">{formatRupiah(state.umkm.omzetBulanan.reduce((s, v) => s + (v || 0), 0))}</p>
              </div>
              <div>
                <p className="t-label text-slate-700">Total biaya setahun</p>
                <p className="t-card mt-1 break-words text-slate-900">{formatRupiah(state.umkm.biayaBulanan.reduce((s, v) => s + (v || 0), 0))}</p>
              </div>
              <div>
                <p className="t-label text-slate-700">Laba kotor setahun</p>
                <p className="t-card mt-1 break-words text-slate-900">
                  {formatRupiah(
                    state.umkm.omzetBulanan.reduce((s, v) => s + (v || 0), 0) -
                      state.umkm.biayaBulanan.reduce((s, v) => s + (v || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 11. PPh Final 4(2) */}
        {state.selectedReportingType === 'PPH_4_2' && (
          <div className="space-y-5">
            <Note tone="amber">
              <p>Tarif tidak diisi otomatis. Masukkan DPP dan tarif sesuai objek transaksi dan peraturan yang berlaku.</p>
              <button
                type="button"
                onClick={() => onUpdatePph42({ objectCategory: 'SEWA_TANAH_BANGUNAN', ratePercent: 10 })}
                className="btn-soft btn-sm"
              >
                Isi otomatis untuk sewa tanah atau bangunan (tarif 10%)
              </button>
            </Note>

            <div className="space-y-3">
              <p className="t-body font-bold text-slate-900">Pilih objek pajak final</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PPH42_OBJECTS.map((opt) => (
                  <ChoiceButton
                    key={opt.v}
                    active={state.pph42.objectCategory === opt.v}
                    onClick={() => onUpdatePph42({ objectCategory: opt.v as ComprehensiveTaxState['pph42']['objectCategory'] })}
                    title={opt.l}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <MoneyField
                id="fld-pph42-gross"
                label="Penghasilan bruto"
                value={state.pph42.grossAmount}
                onChange={(v) => onUpdatePph42({ grossAmount: v })}
              />
              <MoneyField
                id="fld-pph42-dpp"
                label="Dasar pengenaan pajak (DPP)"
                value={state.pph42.dpp}
                onChange={(v) => onUpdatePph42({ dpp: v })}
              />
              <DecimalField
                id="fld-pph42-rate"
                label="Tarif sesuai peraturan"
                value={state.pph42.ratePercent}
                onChange={(v) => onUpdatePph42({ ratePercent: v })}
                suffix="%"
                placeholder="Contoh: 0,5"
              />
              <MoneyField
                id="fld-pph42-paid"
                label="PPh yang sudah dipotong atau dibayar"
                value={state.pph42.taxAlreadyPaid}
                onChange={(v) => onUpdatePph42({ taxAlreadyPaid: v })}
              />
            </div>

            <Collapsible title="Data pendukung (opsional)" hint="Nomor bukti potong, tanggal, dan dasar hukum.">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label htmlFor="fld-multitaxform-33" className={labelClass}>Referensi hukum</label>
                  <input id="fld-multitaxform-33"
                    type="text"
                    value={state.pph42.legalReference}
                    onChange={(e) => onUpdatePph42({ legalReference: e.target.value })}
                    className="field"
                    placeholder="Contoh: PP 55/2022 atau PMK yang dipakai"
                  />
                </div>
                <div>
                  <label htmlFor="fld-multitaxform-34" className={labelClass}>Nomor bukti potong atau NTPN</label>
                  <input id="fld-multitaxform-34"
                    type="text"
                    value={state.pph42.buktiNomor}
                    onChange={(e) => onUpdatePph42({ buktiNomor: e.target.value })}
                    className="field"
                    placeholder="Isi dari bukti potong atau bukti setor"
                  />
                </div>
                <div>
                  <label htmlFor="fld-multitaxform-35" className={labelClass}>Tanggal bukti potong atau setor</label>
                  <input id="fld-multitaxform-35"
                    type="date"
                    value={state.pph42.buktiTanggal}
                    onChange={(e) => onUpdatePph42({ buktiTanggal: e.target.value })}
                    className="field"
                  />
                </div>
              </div>
            </Collapsible>
          </div>
        )}

        {/* 7. PPh 28 / 28A */}
        {state.selectedReportingType === 'PPH_28' && (
          <div className="space-y-5">
            <MoneyField
              id="fld-multitaxform-36"
              label="Total PPh terutang tahun pajak berjalan"
              value={state.pph28.totalTaxDue}
              onChange={(v) => onUpdatePph28({ totalTaxDue: v })}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <MoneyField
                id="fld-multitaxform-37"
                label="Kredit PPh 21"
                value={state.pph28.creditPPh21}
                onChange={(v) => onUpdatePph28({ creditPPh21: v })}
              />
              <MoneyField
                id="fld-multitaxform-38"
                label="Kredit PPh 22"
                value={state.pph28.creditPPh22}
                onChange={(v) => onUpdatePph28({ creditPPh22: v })}
              />
              <MoneyField
                id="fld-multitaxform-39"
                label="Kredit PPh 23"
                value={state.pph28.creditPPh23}
                onChange={(v) => onUpdatePph28({ creditPPh23: v })}
              />
              <MoneyField
                id="fld-multitaxform-40"
                label="Kredit PPh 24 (luar negeri)"
                value={state.pph28.creditPPh24}
                onChange={(v) => onUpdatePph28({ creditPPh24: v })}
              />
              <div className="sm:col-span-2">
                <MoneyField
                  id="fld-multitaxform-41"
                  label="Kredit PPh 25 (angsuran yang sudah Anda setor sendiri)"
                  value={state.pph28.creditPPh25Paid}
                  onChange={(v) => onUpdatePph28({ creditPPh25Paid: v })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 8. PPh 29 */}
        {state.selectedReportingType === 'PPH_29' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <MoneyField
              id="fld-multitaxform-42"
              label="Total penghasilan neto setahun"
              value={state.pph29.annualNetIncome}
              onChange={(v) => onUpdatePph29({ annualNetIncome: v })}
            />
            <div className="sm:col-span-2">
              <div className={innerCardClass}>
                <div>
                  <p className="t-body font-bold text-slate-900">Status keluarga Anda (PTKP)</p>
                  <p className={hintClass}>Pilih sesuai status Anda per 1 Januari.</p>
                </div>
                <PtkpPicker
                  value={state.pph29.ptkpStatus}
                  onChange={(status) => onUpdatePph29({ ptkpStatus: status })}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <MoneyField
                id="fld-multitaxform-44"
                label="Total seluruh pajak yang sudah dipotong atau disetor"
                value={state.pph29.totalTaxCredits}
                onChange={(v) => onUpdatePph29({ totalTaxCredits: v })}
                hint="Semua pajak yang sudah dipotong atau disetor sepanjang tahun, termasuk angsuran PPh 25."
              />
            </div>
          </div>
        )}

        {/* 9. PPN */}
        {state.selectedReportingType === 'PPN' && (
          <div className="space-y-5">
            {!(state.profile.isPkp ?? false) && (
              <Note tone="amber" role="status">
                Status Anda saat ini Belum PKP. Non-PKP tidak memungut PPN dan tidak bisa membuat faktur pajak keluaran. Hasil di bawah hanya gambaran jika status berubah menjadi PKP.
              </Note>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <MoneyField
                id="fld-multitaxform-45"
                label="Penjualan barang atau jasa kena PPN (DPP)"
                value={state.ppn.outputTaxTaxableSales}
                onChange={(v) => onUpdatePpn({ outputTaxTaxableSales: v })}
                hint="PPN keluaran dihitung otomatis: 11% dari angka ini."
              />
              <MoneyField
                id="fld-multitaxform-46"
                label="PPN dari pembelian yang bisa dikreditkan (faktur pajak masukan)"
                value={state.ppn.inputTaxCreditable}
                onChange={(v) => onUpdatePpn({ inputTaxCreditable: v })}
              />
              <MoneyField
                id="fld-multitaxform-47"
                label="Kelebihan PPN bulan sebelumnya (kompensasi)"
                value={state.ppn.priorMonthCompensation}
                onChange={(v) => onUpdatePpn({ priorMonthCompensation: v })}
              />
              <MoneyField
                id="fld-multitaxform-48"
                label="Penjualan ekspor (tarif PPN 0%)"
                value={state.ppn.exportSales}
                onChange={(v) => onUpdatePpn({ exportSales: v })}
              />
            </div>

            <Collapsible title="PPnBM (opsional, hanya untuk barang mewah)" hint="Isi hanya jika menyerahkan barang yang tergolong mewah. Tarifnya mengikuti klasifikasi barang.">
              <p className="t-body">
                Cocokkan tarif dengan faktur pajak atau ketentuan yang berlaku.
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <MoneyField
                  id="fld-multitaxform-49"
                  label="DPP barang yang dikenai PPnBM"
                  value={state.ppn.ppnbmTaxableSales}
                  onChange={(v) => onUpdatePpn({ ppnbmTaxableSales: v })}
                />
                <DecimalField
                  id="fld-multitaxform-50"
                  label="Tarif PPnBM sesuai klasifikasi barang"
                  value={state.ppn.ppnbmRate}
                  onChange={(v) => onUpdatePpn({ ppnbmRate: v })}
                  suffix="%"
                  placeholder="Masukkan tarif pada faktur atau ketentuan"
                />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-violet-50">
                    <tr>
                      <th className="t-label p-4">Komponen</th>
                      <th className="t-label p-4">Dasar perhitungan</th>
                      <th className="t-label p-4">Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200">
                      <td className="t-body p-4 font-semibold">PPnBM</td>
                      <td className="t-body p-4">{formatRupiah(state.ppn.ppnbmTaxableSales)} x {displayedPpnbmRate}%</td>
                      <td className="t-body p-4 font-bold">{formatRupiah(Math.round(state.ppn.ppnbmTaxableSales * displayedPpnbmRate / 100))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Collapsible>
          </div>
        )}
      </section>

      </div>

      {/* HASIL: satu hal utama dulu, rincian di bawahnya. Di layar besar tampil di kolom kanan dan tetap terlihat. */}
      <aside className="min-w-0 space-y-6">
      <div className="print-area space-y-6">
        <section className={`module-enter rounded-3xl border-2 p-6 sm:p-8 ${heroTone}`}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="float-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
              <HeroIcon className="h-8 w-8" />
            </span>
            <p className="t-label inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-current">
              <Sparkles className="h-5 w-5" />
              <span className="break-words">Hasil {calculation.taxTypeName}</span>
            </p>
          </div>
          {state.selectedReportingType === 'PPH_24' && (
            <p className="t-body mt-4 font-semibold">Ini sisa PPh setelah kredit PPh 24.</p>
          )}
          <h2 className="t-section mt-3 break-words text-current">
            {isNihil && 'Tidak ada pajak yang harus dibayar'}
            {isKurang && <>Anda kurang bayar <AnimatedRupiah value={balanceAbs} /></>}
            {isLebih && <>Anda lebih bayar <AnimatedRupiah value={balanceAbs} /></>}
          </h2>
          <p className="t-body mt-4 text-current">{heroSentence}</p>
        </section>

        {/* Empat angka kunci */}
        <div className="grid grid-cols-1 gap-4">
          <div className="card min-w-0 p-5">
            <p className="t-label text-slate-700">Dasar pengenaan pajak</p>
            <p className="t-card mt-2 break-words text-slate-900">{formatRupiah(calculation.taxBase)}</p>
          </div>
          <div className="card min-w-0 p-5">
            <p className="t-label text-slate-700">Tarif yang berlaku</p>
            <p className="t-card mt-2 break-words text-slate-900">{calculation.applicableRateText}</p>
          </div>
          <div className="card min-w-0 p-5">
            <p className="t-label text-slate-700">Pajak terhitung</p>
            <p className="t-card mt-2 break-words text-slate-900">{formatRupiah(calculation.calculatedTax)}</p>
          </div>
          <div className="card min-w-0 p-5">
            <p className="t-label text-slate-700">Sudah dipotong atau dibayar</p>
            <p className="t-card mt-2 break-words text-emerald-900">{formatRupiah(calculation.creditsOrPrepaid)}</p>
          </div>
        </div>

        </div>
      </aside>

      {/* Rincian hasil: lebar penuh di bawah isian, supaya tidak ada kolom kosong */}
      <div className="print-area space-y-6 lg:col-span-2">
        {/* Penjelasan: menghubungkan angka yang diisi dengan hasil akhirnya */}
        <ResultExplainer
          title="Dari angka yang Anda isi ke hasil"
          hint="Penjelasan singkat, langkah demi langkah"
          lines={[
            `Dasar pengenaan pajak dari angka yang Anda isi adalah ${formatRupiah(calculation.taxBase)}.`,
            `Tarif yang berlaku: ${calculation.applicableRateText}.`,
            `Pajak terutang dari dasar itu: ${formatRupiah(calculation.calculatedTax)}.`,
            calculation.creditsOrPrepaid > 0
              ? `Pajak yang sudah dipotong atau dibayar ${formatRupiah(calculation.creditsOrPrepaid)} dikurangkan dari pajak terutang.`
              : 'Belum ada pajak yang sudah dipotong atau dibayar, jadi seluruh pajak terutang harus dibayar.',
            calculation.taxBase === 0
              ? 'Dasar pengenaannya nol. Biasanya penghasilan masih di bawah batas bebas pajak (PTKP), atau biaya yang boleh dikurangkan sudah menghabiskan penghasilan.'
              : '',
          ].filter(Boolean)}
          status={calculation.status}
          statusText={
            isNihil
              ? 'Hasil: nihil, tidak ada pajak yang harus dibayar.'
              : isKurang
              ? `Hasil: kurang bayar ${formatRupiah(balanceAbs)}.`
              : `Hasil: lebih bayar ${formatRupiah(balanceAbs)}, bisa dikembalikan atau dipakai tahun depan.`
          }
        />

        {/* Rincian langkah perhitungan */}
        {calculation.steps && calculation.steps.length > 0 && (
          <Collapsible title={`Tabel rincian ${calculation.taxTypeName}`} hint="Angka rupiah di setiap langkah perhitungan.">
            <ol className="list-decimal space-y-5 pl-6">
              {calculation.steps.map((step, stepIndex) => (
                <li key={stepIndex}>
                  <p className="t-body font-bold text-slate-900">{step.label}</p>
                  <ul className="mt-2 list-none space-y-2 border-l-2 border-violet-200 pl-4">
                    {step.lines.map((line, lineIndex) => (
                      <li key={lineIndex} className="t-body text-slate-700">{line}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Collapsible>
        )}

        {/* Batas waktu dan denda, plus tombol salin dan cetak */}
        <div className="card space-y-5 border-amber-200 bg-amber-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <p className="t-card text-amber-950">Batas waktu dan denda ({calculation.taxTypeName})</p>
              <p className="t-note mt-1 text-amber-900">Ini referensi. Cek lagi di Coretax atau DJP sebelum mengirim.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-white p-4">
              <p className="t-label uppercase tracking-wide text-slate-700">Batas bayar atau setor</p>
              <p className="t-card text-slate-900">{calculation.paymentDeadline}</p>
              <p className="t-note flex items-start gap-2 font-bold text-rose-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Telat bayar: {calculation.latePaymentInterestRule}</span>
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-amber-200 bg-white p-4">
              <p className="t-label uppercase tracking-wide text-slate-700">Batas lapor SPT</p>
              <p className="t-card text-slate-900">{calculation.reportingDeadline}</p>
              <p className="t-note flex items-start gap-2 font-bold text-rose-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Denda telat lapor: {calculation.lateFilingFeeText}</span>
              </p>
            </div>
          </div>

          {calculation.notes.length > 0 && (
            <ul className="t-body list-disc space-y-2 pl-6 text-amber-950">
              {calculation.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          )}

          <div className="print:hidden flex flex-col gap-4 border-t border-amber-200 pt-5 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => printArea()}
              disabled={!readyToPrepareReport}
              className="btn-primary flex-1 bg-violet-700 hover:bg-violet-800"
            >
              <Printer className="h-5 w-5" />
              <span>Cetak ringkasan</span>
            </button>

                        <button
              type="button"
              onClick={handleSaveToDokumen}
              className="btn-secondary flex-1"
            >
              <Save className="h-5 w-5" />
              <span>Simpan ke Dokumen</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              disabled={!readyToPrepareReport}
              className={`${copied ? 'btn-success bg-emerald-700 hover:bg-emerald-800' : 'btn-secondary'} flex-1`}
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              <span>{copied ? 'Tersalin!' : 'Salin draf angka'}</span>
            </button>
          </div>

          {!readyToPrepareReport && (
            <p className="t-note font-bold text-rose-800 print:hidden">
              Untuk menyalin atau mencetak, isi NIK (16 digit) dan nama di bagian Data diri. NPWP boleh kosong.
            </p>
          )}
          {copyError && <p role="alert" className="t-note font-bold text-rose-800">{copyError}</p>}
        </div>
      </div>
      </div>

      {/* Cara melaporkan: dibuka jika perlu */}
      <section className="card space-y-5">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
            <Info className="h-6 w-6" />
          </span>
          <div>
            <h3 className="t-card text-slate-900">Cara melaporkan pajak setelah menghitung</h3>
            <p className="t-body mt-2 text-slate-800">
              ATLAX hanya menghitung dan menyiapkan draf. Aplikasi ini tidak terhubung ke DJP dan tidak mengirim SPT atau pembayaran.
            </p>
          </div>
        </div>
        <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 p-5 transition-colors hover:bg-violet-50">
            <span className="t-body font-bold text-slate-900">Lihat langkah-langkahnya</span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800 transition-transform duration-300 group-open:rotate-180">
              <ChevronDown className="h-5 w-5" />
            </span>
          </summary>
          <ol className="t-body list-decimal space-y-3 px-5 pb-5 pl-10 text-slate-800">
            <li>Lengkapi identitas, pilih jenis pajak serta masa atau tahun pajak, lalu cocokkan hasil dengan bukti potong, faktur, dan bukti setoran.</li>
            <li>Salin draf atau pilih <strong>Cetak ringkasan</strong> untuk menyimpan ringkasan. Draf ini bukan formulir SPT resmi.</li>
            <li>
              Masuk ke akun <strong>Coretax DJP</strong> melalui{' '}
              <a href="https://coretaxdjp.pajak.go.id/" target="_blank" rel="noreferrer" className="font-bold text-violet-800 underline">
                coretaxdjp.pajak.go.id
              </a>
              , lalu pilih layanan dan SPT Masa atau SPT Tahunan yang sesuai.
            </li>
            <li>Salin angka ke formulir resmi, unggah dokumen yang diminta, lunasi jika ada kurang bayar, lalu kirim SPT.</li>
            <li>Simpan Bukti Penerimaan Elektronik (BPE) serta NTPN atau bukti pembayaran untuk arsip.</li>
          </ol>
          <p className="t-note px-5 pb-5">
            Jenis SPT, masa, tenggat, dan sanksi bisa berubah menurut jenis pajak dan status Anda. Cek semuanya di Coretax atau DJP sebelum mengirim. Rekap tahunan PPh 22, 23, 26, dan PPN bukan pengganti SPT Masa.
          </p>
        </details>
      </section>

    </div>
  );
};
