import { TaxFormData } from '../types/tax';

const STORAGE_KEY = 'atlax_tax_draft_v1';

export const initialTaxData: TaxFormData = {
  profile: {
    fullName: '',
    nik: '',
    npwp: '',
    email: '',
    phone: '',
    ptkpStatus: 'TK/0',
    taxYear: new Date().getFullYear() - 1,
    userType: 'OP',
  },
  category: 'karyawan',
  karyawan: {
    grossSalaryMonthly: 0,
    grossSalaryAnnual: 0,
    bonusThr: 0,
    pensionContributionMonthly: 0,
    withholdingTaxPaid: 0,
  },
  umkm: {
    annualTurnover: 0,
    businessSector: 'Kuliner & F&B',
  },
  freelance: {
    annualRevenue: 0,
    nppnRate: 50,
    profession: 'Software Engineer / Konsultan',
    withholdingTaxPaid: 0,
  },
  step: 1,
  lastUpdated: new Date().toISOString(),
};

/**
 * Menyimpan draf ke LocalStorage (Autosave & Data Saving)
 */
export function saveDraft(data: TaxFormData): void {
  try {
    const updated = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Gagal menyimpan draf:', error);
  }
}

/**
 * Memuat draf tersimpan (System Recovery)
 */
export function loadDraft(): { hasDraft: boolean; data: TaxFormData } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { hasDraft: true, data: { ...initialTaxData, ...parsed } };
    }
  } catch (error) {
    console.error('Gagal memuat draf:', error);
  }
  return { hasDraft: false, data: initialTaxData };
}

/**
 * Menghapus draf untuk memulai dari awal
 */
export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Gagal menghapus draf:', error);
  }
}
