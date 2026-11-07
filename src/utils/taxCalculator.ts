import { PTKPStatus, TaxFormData, TaxCalculationResult } from '../types/tax';

// Tabel Lengkap Nilai PTKP (Penghasilan Tidak Kena Pajak) Sesuai UU HPP & PMK 101/PMK.010/2016
export const PTKP_RATES: Record<PTKPStatus, { 
  code: PTKPStatus; 
  categoryGroup: 'TK' | 'K' | 'KI'; 
  label: string; 
  amount: number; 
  description: string;
  familyDetail: string;
}> = {
  // 1. Golongan Tidak Kawin (TK)
  'TK/0': { 
    code: 'TK/0', 
    categoryGroup: 'TK', 
    label: 'TK/0', 
    amount: 54_000_000, 
    description: 'Tidak Kawin / Lajang, tanpa tanggungan',
    familyDetail: 'Wajib Pajak sendiri (Rp 54.000.000)'
  },
  'TK/1': { 
    code: 'TK/1', 
    categoryGroup: 'TK', 
    label: 'TK/1', 
    amount: 58_500_000, 
    description: 'Tidak Kawin, 1 tanggungan keluarga',
    familyDetail: 'WP sendiri + 1 tanggungan (Rp 54 jt + Rp 4,5 jt)'
  },
  'TK/2': { 
    code: 'TK/2', 
    categoryGroup: 'TK', 
    label: 'TK/2', 
    amount: 63_000_000, 
    description: 'Tidak Kawin, 2 tanggungan keluarga',
    familyDetail: 'WP sendiri + 2 tanggungan (Rp 54 jt + Rp 9 jt)'
  },
  'TK/3': { 
    code: 'TK/3', 
    categoryGroup: 'TK', 
    label: 'TK/3', 
    amount: 67_500_000, 
    description: 'Tidak Kawin, 3 tanggungan keluarga (Maksimal)',
    familyDetail: 'WP sendiri + 3 tanggungan (Rp 54 jt + Rp 13,5 jt)'
  },

  // 2. Golongan Kawin - Penghasilan Suami Saja (K)
  'K/0': { 
    code: 'K/0', 
    categoryGroup: 'K', 
    label: 'K/0', 
    amount: 58_500_000, 
    description: 'Kawin, tanpa tanggungan anak/keluarga',
    familyDetail: 'WP sendiri + Status Kawin (Rp 54 jt + Rp 4,5 jt)'
  },
  'K/1': { 
    code: 'K/1', 
    categoryGroup: 'K', 
    label: 'K/1', 
    amount: 63_000_000, 
    description: 'Kawin, memiliki 1 tanggungan anak/keluarga',
    familyDetail: 'WP sendiri + Kawin + 1 anak (Rp 54 jt + Rp 4,5 jt + Rp 4,5 jt)'
  },
  'K/2': { 
    code: 'K/2', 
    categoryGroup: 'K', 
    label: 'K/2', 
    amount: 67_500_000, 
    description: 'Kawin, memiliki 2 tanggungan anak/keluarga',
    familyDetail: 'WP sendiri + Kawin + 2 anak (Rp 54 jt + Rp 4,5 jt + Rp 9 jt)'
  },
  'K/3': { 
    code: 'K/3', 
    categoryGroup: 'K', 
    label: 'K/3', 
    amount: 72_000_000, 
    description: 'Kawin, memiliki 3 tanggungan anak/keluarga (Maksimal)',
    familyDetail: 'WP sendiri + Kawin + 3 anak (Rp 54 jt + Rp 4,5 jt + Rp 13,5 jt)'
  },

  // 3. Golongan Kawin - Penghasilan Suami & Istri Digabung (K/I)
  'K/I/0': { 
    code: 'K/I/0', 
    categoryGroup: 'KI', 
    label: 'K/I/0', 
    amount: 112_500_000, 
    description: 'Kawin, Penghasilan Suami & Istri Digabung, tanpa tanggungan',
    familyDetail: 'WP Suami + WP Istri + Kawin (Rp 54 jt + Rp 54 jt + Rp 4,5 jt)'
  },
  'K/I/1': { 
    code: 'K/I/1', 
    categoryGroup: 'KI', 
    label: 'K/I/1', 
    amount: 117_000_000, 
    description: 'Kawin, Penghasilan Suami & Istri Digabung + 1 anak',
    familyDetail: 'WP Suami + Istri + Kawin + 1 anak (Rp 108 jt + Rp 4,5 jt + Rp 4,5 jt)'
  },
  'K/I/2': { 
    code: 'K/I/2', 
    categoryGroup: 'KI', 
    label: 'K/I/2', 
    amount: 121_500_000, 
    description: 'Kawin, Penghasilan Suami & Istri Digabung + 2 anak',
    familyDetail: 'WP Suami + Istri + Kawin + 2 anak (Rp 108 jt + Rp 4,5 jt + Rp 9 jt)'
  },
  'K/I/3': { 
    code: 'K/I/3', 
    categoryGroup: 'KI', 
    label: 'K/I/3', 
    amount: 126_000_000, 
    description: 'Kawin, Penghasilan Suami & Istri Digabung + 3 anak (Maksimal)',
    familyDetail: 'WP Suami + Istri + Kawin + 3 anak (Rp 108 jt + Rp 4,5 jt + Rp 13,5 jt)'
  },
};

// Lapisan Tarif PPh Orang Pribadi (Pasal 17 UU Harmonisasi Peraturan Perpajakan / UU HPP No. 7 Tahun 2021)
export const TAX_BRACKETS = [
  { limit: 60_000_000, rate: 0.05, label: 'Lapisan 1 (s.d. Rp 60 Juta)' },
  { limit: 250_000_000, rate: 0.15, label: 'Lapisan 2 (> Rp 60 Juta - Rp 250 Juta)' },
  { limit: 500_000_000, rate: 0.25, label: 'Lapisan 3 (> Rp 250 Juta - Rp 500 Juta)' },
  { limit: 5_000_000_000, rate: 0.30, label: 'Lapisan 4 (> Rp 500 Juta - Rp 5 Miliar)' },
  { limit: Infinity, rate: 0.35, label: 'Lapisan 5 (> Rp 5 Miliar)' },
];

/**
 * Menghitung PPh Orang Pribadi berdasarkan UU HPP
 */
export function calculateProgressiveTax(pkp: number) {
  if (pkp <= 0) return { totalTax: 0, breakdown: [] };

  let remaining = pkp;
  let previousLimit = 0;
  let totalTax = 0;
  const breakdown = [];

  for (const bracket of TAX_BRACKETS) {
    const bracketSpan = bracket.limit - previousLimit;
    const taxableInBracket = Math.min(remaining, bracketSpan);

    if (taxableInBracket > 0) {
      const taxForBracket = Math.round(taxableInBracket * bracket.rate);
      totalTax += taxForBracket;
      breakdown.push({
        bracket: bracket.label,
        rate: bracket.rate,
        amount: taxableInBracket,
        tax: taxForBracket,
      });
      remaining -= taxableInBracket;
    }

    if (remaining <= 0) break;
    previousLimit = bracket.limit;
  }

  return { totalTax, breakdown };
}

/**
 * Menghitung Pajak Lengkap ATLAX
 */
export function calculateTax(data: TaxFormData): TaxCalculationResult {
  const ptkpInfo = PTKP_RATES[data.profile.ptkpStatus] || PTKP_RATES['TK/0'];
  const ptkpAmount = ptkpInfo.amount;
  const notes: string[] = [];

  if (data.category === 'karyawan') {
    // 1. Karyawan
    const annualSalary = data.karyawan.grossSalaryAnnual > 0 
      ? data.karyawan.grossSalaryAnnual 
      : data.karyawan.grossSalaryMonthly * 12;
    const grossIncome = annualSalary + (data.karyawan.bonusThr || 0);

    // Biaya Jabatan 5% dari Bruto, maksimal Rp 500.000/bulan (Rp 6.000.000/tahun)
    const rawBiayaJabatan = grossIncome * 0.05;
    const maxBiayaJabatan = 6_000_000;
    const biayaJabatan = Math.min(rawBiayaJabatan, maxBiayaJabatan);
    const annualPension = (data.karyawan.pensionContributionMonthly || 0) * 12;
    const deductions = Math.round(biayaJabatan + annualPension);

    const netIncome = Math.max(0, grossIncome - deductions);
    // Pembulatan PKP ke ribuan penuh ke bawah sesuai UU KUP
    const rawPKP = Math.max(0, netIncome - ptkpAmount);
    const taxableIncome = Math.floor(rawPKP / 1000) * 1000;

    const { totalTax, breakdown } = calculateProgressiveTax(taxableIncome);
    const taxPrepaid = data.karyawan.withholdingTaxPaid || 0;
    const balanceDue = totalTax - taxPrepaid;

    let status: 'NIHIL' | 'KURANG_BAYAR' | 'LEBIH_BAYAR' = 'NIHIL';
    if (balanceDue > 0) status = 'KURANG_BAYAR';
    else if (balanceDue < 0) status = 'LEBIH_BAYAR';

    if (grossIncome <= ptkpAmount) {
      notes.push('Penghasilan Anda di bawah PTKP (Penghasilan Tidak Kena Pajak), sehingga nihil kewajiban pajak.');
    }
    if (taxPrepaid > 0) {
      notes.push(`Sudah diperhitungkan pemotongan pajak dari kantor (Bukti Potong 1721 A1/A2) sebesar Rp ${taxPrepaid.toLocaleString('id-ID')}.`);
    }

    return {
      category: 'karyawan',
      grossIncome,
      deductions,
      netIncome,
      ptkpAmount,
      taxableIncome,
      taxBracketBreakdown: breakdown,
      totalTaxDue: totalTax,
      taxPrepaid,
      balanceDue,
      status,
      notes,
    };
  } else if (data.category === 'umkm') {
    // 2. UMKM (PP 55 Tahun 2022)
    // Fasilitas omzet s.d. Rp 500 Juta per tahun BEBAS PAJAK untuk Wajib Pajak Orang Pribadi
    const grossIncome = data.umkm.annualTurnover || 0;
    const thresholdExemption = 500_000_000;
    const taxableTurnover = Math.max(0, grossIncome - thresholdExemption);
    const totalTax = Math.round(taxableTurnover * 0.005); // Tarif 0,5% PPh Final

    const breakdown = [
      {
        bracket: 'Fasilitas Bebas Pajak PP 55/2022',
        rate: 0,
        amount: Math.min(grossIncome, thresholdExemption),
        tax: 0,
      },
    ];

    if (taxableTurnover > 0) {
      breakdown.push({
        bracket: 'Omzet kena tarif PPh Final 0,5%',
        rate: 0.005,
        amount: taxableTurnover,
        tax: totalTax,
      });
    }

    if (grossIncome <= thresholdExemption) {
      notes.push('Berdasarkan PP 55 Tahun 2022, pelaku UMKM Orang Pribadi dengan omzet hingga Rp 500 juta/tahun bebas dari kewajiban PPh Final!');
    } else {
      notes.push(`Omzet di atas Rp 500 Juta (sebesar Rp ${taxableTurnover.toLocaleString('id-ID')}) dikenakan tarif final 0,5%.`);
    }

    return {
      category: 'umkm',
      grossIncome,
      deductions: 0,
      netIncome: grossIncome,
      ptkpAmount: 0,
      taxableIncome: taxableTurnover,
      taxBracketBreakdown: breakdown,
      totalTaxDue: totalTax,
      taxPrepaid: 0,
      balanceDue: totalTax,
      status: totalTax === 0 ? 'NIHIL' : 'KURANG_BAYAR',
      notes,
    };
  } else {
    // 3. Pekerja Bebas (Freelance / NPPN)
    const grossIncome = data.freelance.annualRevenue || 0;
    const nppnRate = (data.freelance.nppnRate || 50) / 100;
    const netIncome = Math.round(grossIncome * nppnRate);
    const rawPKP = Math.max(0, netIncome - ptkpAmount);
    const taxableIncome = Math.floor(rawPKP / 1000) * 1000;

    const { totalTax, breakdown } = calculateProgressiveTax(taxableIncome);
    const taxPrepaid = data.freelance.withholdingTaxPaid || 0;
    const balanceDue = totalTax - taxPrepaid;

    let status: 'NIHIL' | 'KURANG_BAYAR' | 'LEBIH_BAYAR' = 'NIHIL';
    if (balanceDue > 0) status = 'KURANG_BAYAR';
    else if (balanceDue < 0) status = 'LEBIH_BAYAR';

    notes.push(`Penghasilan neto dihitung menggunakan norma NPPN sebesar ${(nppnRate * 100)}% dari omzet bruto.`);

    return {
      category: 'freelance',
      grossIncome,
      deductions: grossIncome - netIncome, // Biaya norma yang dianggap beban
      netIncome,
      ptkpAmount,
      taxableIncome,
      taxBracketBreakdown: breakdown,
      totalTaxDue: totalTax,
      taxPrepaid,
      balanceDue,
      status,
      notes,
    };
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
