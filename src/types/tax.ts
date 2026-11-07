export type PTKPStatus = 
  | 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' 
  | 'K/0'  | 'K/1'  | 'K/2'  | 'K/3'
  | 'K/I/0'| 'K/I/1'| 'K/I/2'| 'K/I/3';

export type TaxReportingType = 
  | 'PPH_21' 
  | 'PPH_22' 
  | 'PPH_23' 
  | 'PPH_24' 
  | 'PPH_25' 
  | 'PPH_26' 
  | 'PPH_28' 
  | 'PPH_29'
  | 'PPH_15'
  | 'PPH_4_2'
  | 'UMKM'
  | 'PPN';

export type TaxCategory = 'karyawan' | 'umkm' | 'freelance';

export interface UserTaxProfile {
  fullName: string;
  nik: string;
  npwp: string;
  email: string;
  phone: string;
  ptkpStatus: PTKPStatus;
  taxYear: number;
  userType?: 'OP' | 'BADAN';
  isPkp?: boolean; // Pengusaha Kena Pajak (wajib memungut PPN dan membuat faktur pajak)
}

// Data Model Wizard SPT Tahunan
export interface KaryawanIncome {
  grossSalaryMonthly: number;
  grossSalaryAnnual: number;
  bonusThr: number;
  pensionContributionMonthly: number;
  withholdingTaxPaid: number;
}

export interface UMKMIncome {
  annualTurnover: number;
  businessSector: string;
}

export interface FreelanceIncome {
  annualRevenue: number;
  nppnRate: number;
  profession: string;
  withholdingTaxPaid: number;
}

export interface TaxFormData {
  profile: UserTaxProfile;
  category: TaxCategory;
  karyawan: KaryawanIncome;
  umkm: UMKMIncome;
  freelance: FreelanceIncome;
  step: number;
  lastUpdated: string;
}

export interface TaxCalculationResult {
  category: TaxCategory;
  grossIncome: number;
  deductions: number;
  netIncome: number;
  ptkpAmount: number;
  taxableIncome: number;
  taxBracketBreakdown: {
    bracket: string;
    rate: number;
    amount: number;
    tax: number;
  }[];
  totalTaxDue: number;
  taxPrepaid: number;
  balanceDue: number;
  status: 'NIHIL' | 'KURANG_BAYAR' | 'LEBIH_BAYAR';
  notes: string[];
}

// 1. Data Model PPh 21 (Gaji & Karyawan) dan pilihan Freelancer (pekerja bebas, NPPN)
export interface PPh21Data {
  mode: 'KARYAWAN' | 'FREELANCER';
  noNpwp: boolean; // penerima tidak punya NPWP
  nikGiven: boolean; // penerima memberi NIK (tambahan 20% tidak berlaku)
  grossSalaryMonthly: number;
  bonusThr: number;
  pensionContributionMonthly: number;
  withholdingTaxPaid: number;
  withholdingTaxJanToNov: number;
  freelanceRevenueAnnual: number;
  freelanceNppnPercent: number;
  freelancePrepaid: number;
}

// 12. Data Model UMKM (rekap omzet dan biaya bulanan, PPh Final 0,5%)
export type UMKMKategori = 'OP' | 'PT_PERORANGAN' | 'KOPERASI' | 'BADAN_LAIN';

export interface UMKMRekapData {
  kategori: UMKMKategori;
  tahunTerdaftar: number; // tahun mulai terdaftar (dipakai untuk batas 4 tahun koperasi)
  omzetBulanan: number[];
  biayaBulanan: number[];
}

// 2. Data Model PPh 22 (Impor & Pengadaan)
export interface PPh22Data {
  transactionType: 'PEMERINTAH' | 'IMPOR_API' | 'IMPOR_NON_API' | 'INDUSTRI_SEMEN' | 'INDUSTRI_KERTAS' | 'INDUSTRI_OTOMOTIF' | 'BARANG_MEWAH';
  transactionValue: number;
  hasNpwp: boolean;
  taxAlreadyPaid: number;
}

// 3. Data Model PPh 23 (Jasa, Sewa, Dividen, Bunga, Royalti)
export interface PPh23Data {
  incomeType: 'JASA' | 'SEWA_NON_TANAH' | 'DIVIDEN' | 'BUNGA' | 'ROYALTI' | 'HADIAH_PENGHARGAAN';
  grossAmount: number;
  hasNpwp: boolean;
  taxAlreadyPaid: number;
}

// 4. Data Model PPh 24 (Kredit Pajak Luar Negeri)
// Data per negara sumber penghasilan luar negeri (PPh 24, batas kredit per negara)
export interface PPh24Country {
  id: string;
  negara: string;
  mataUang: string; // kode mata uang asing, misalnya USD
  kurs: number; // kurs pajak resmi: 1 unit mata uang asing = sekian Rupiah (diisi manual)
  netoFx: number; // penghasilan neto luar negeri dalam mata uang asing
  pajakFx: number; // pajak yang dibayar di luar negeri dalam mata uang asing
}

export interface PPh24Data {
  domesticNetIncome: number; // penghasilan neto dalam negeri (Rp)
  totalPkp: number; // total penghasilan kena pajak dunia (Rp)
  pphTerutangSebelumKredit: number; // PPh terutang Indonesia sebelum kredit (Rp)
  countries: PPh24Country[];
}

// 5. Data Model PPh 25 (Angsuran Pajak Bulanan)
export interface PPh25Data {
  priorYearTaxDue: number;
  priorYearTaxCredits: number;
  unabsorbedLoss: number;
  taxAlreadyPaid: number;
}

// 6. Data Model PPh 26 (Wajib Pajak Luar Negeri / Non-Resident)
export interface PPh26Data {
  incomeType: 'DIVIDEN' | 'BUNGA' | 'ROYALTI' | 'JASA' | 'PENJUALAN_HARTA';
  grossAmount: number;
  taxTreatyRate: number;
  hasDGTForm: boolean;
  taxAlreadyPaid: number;
}

// 7. Data Model PPh 28 / 28A (Kredit Pajak & Restitusi Lebih Bayar)
export interface PPh28Data {
  totalTaxDue: number;
  creditPPh21: number;
  creditPPh22: number;
  creditPPh23: number;
  creditPPh24: number;
  creditPPh25Paid: number;
}

// 8. Data Model PPh 29 (Pelunasan Kurang Bayar Tahunan)
export interface PPh29Data {
  annualGrossIncome: number;
  annualNetIncome: number;
  ptkpStatus: PTKPStatus;
  totalTaxCredits: number;
}

// 9. Data Model PPN & PPnBM (Pajak Pertambahan Nilai 11%)
export interface PPNData {
  outputTaxTaxableSales: number;
  exportSales: number;
  nonTaxableSales: number;
  inputTaxCreditable: number;
  priorMonthCompensation: number;
  ppnbmTaxableSales: number;
  ppnbmRate: number;
}

// 10. Data Model PPh Pasal 15 (Kategori usaha tertentu, mis. pelayaran & penerbangan)
// Tarif, DPP, dan tenggat diisi pengguna; tidak ditetapkan otomatis.
export interface PPh15Data {
  category: 'PELAYARAN_DN' | 'PELAYARAN_LN' | 'PENERBANGAN_DN' | 'PENERBANGAN_LN' | 'LAINNYA';
  grossAmount: number;
  dpp: number;
  ratePercent: number;
  taxAlreadyPaid: number;
  legalReference: string;
  buktiNomor: string;
  buktiTanggal: string;
}

// 11. Data Model PPh Final Pasal 4 ayat (2)
// Tarif, DPP, dan tenggat diisi pengguna; tidak ditetapkan otomatis.
export interface PPh42Data {
  objectCategory: 'SEWA_TANAH_BANGUNAN' | 'KONSTRUKSI' | 'UMKM' | 'LAINNYA';
  grossAmount: number;
  dpp: number;
  ratePercent: number;
  taxAlreadyPaid: number;
  legalReference: string;
  buktiNomor: string;
  buktiTanggal: string;
}

// State Aplikasi Komprehensif
export interface ComprehensiveTaxState {
  profile: UserTaxProfile;
  selectedReportingType: TaxReportingType;
  reportingPeriod: 'MONTHLY' | 'ANNUAL';
  selectedMonth: number;
  pph15: PPh15Data;
  pph21: PPh21Data;
  pph22: PPh22Data;
  pph23: PPh23Data;
  pph24: PPh24Data;
  pph25: PPh25Data;
  pph26: PPh26Data;
  pph28: PPh28Data;
  pph29: PPh29Data;
  pph42: PPh42Data;
  umkm: UMKMRekapData;
  ppn: PPNData;
  lastUpdated: string;
}

// Hasil Perhitungan Universal
export interface UniversalTaxResult {
  taxType: TaxReportingType;
  taxTypeName: string;
  taxBase: number;
  applicableRateText: string;
  calculatedTax: number;
  creditsOrPrepaid: number;
  finalBalanceDue: number;
  status: 'NIHIL' | 'KURANG_BAYAR' | 'LEBIH_BAYAR';
  paymentDeadline: string;
  reportingDeadline: string;
  lateFilingFeeText: string;
  latePaymentInterestRule: string;
  notes: string[];
  // Rincian langkah perhitungan, ditampilkan agar hasil bisa ditelusuri langkah demi langkah
  steps?: { label: string; lines: string[] }[];
}
