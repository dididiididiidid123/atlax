// Logika pembukuan ATLAX: daftar akun, jurnal double-entry, buku besar, neraca saldo, dan laporan dasar.
// Data disimpan di localStorage. Fitur lain di aplikasi tidak diubah.

export type AccountGroup = 'ASET' | 'LIABILITAS' | 'EKUITAS' | 'PENDAPATAN' | 'BEBAN';
export type NormalSide = 'D' | 'K';
export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'REVERSAL';

export interface Account {
  code: string;
  name: string;
  group: AccountGroup;
  category: string;
  normalBalance: NormalSide;
  description: string;
  active: boolean;
  isTaxPayable?: boolean;
}

export interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  number: string;
  date: string; // YYYY-MM-DD
  reference: string;
  description: string;
  lines: JournalLine[];
  status: JournalStatus;
  attachmentName: string;
  sourceKey?: string;
  reversalOf?: string;
  createdAt: string;
  jenis?: 'UMUM' | 'PENYESUAIAN';
  attachmentData?: string; // lampiran kecil (base64), maksimal sekitar 300 KB
}

export interface AccountingStore {
  accounts: Account[];
  journals: JournalEntry[];
}

export const GROUP_LABEL: Record<AccountGroup, string> = {
  ASET: 'Aset',
  LIABILITAS: 'Liabilitas',
  EKUITAS: 'Ekuitas',
  PENDAPATAN: 'Pendapatan',
  BEBAN: 'Beban',
};

export const STORAGE_KEY = 'atlax_accounting_v1';

const acc = (
  code: string,
  name: string,
  group: AccountGroup,
  category: string,
  description: string,
  isTaxPayable = false
): Account => ({
  code,
  name,
  group,
  category,
  normalBalance: group === 'ASET' || group === 'BEBAN' ? 'D' : 'K',
  description,
  active: true,
  isTaxPayable,
});

export const DEFAULT_ACCOUNTS: Account[] = [
  acc('1101', 'Kas dan Bank', 'ASET', 'Kas & Setara Kas', 'Saldo kas tunai dan rekening bank'),
  acc('1201', 'Piutang Usaha', 'ASET', 'Piutang', 'Tagihan kepada pelanggan'),
  acc('1301', 'Persediaan', 'ASET', 'Persediaan', 'Barang dagang atau bahan yang belum terjual'),
  acc('1401', 'PPN Masukan', 'ASET', 'Pajak Dibayar di Muka', 'PPN yang dapat dikreditkan dari pembelian'),
  acc('1402', 'PPh Dibayar di Muka', 'ASET', 'Pajak Dibayar di Muka', 'PPh yang sudah dipotong pihak lain atau disetor sendiri'),
  acc('2101', 'Utang Usaha', 'LIABILITAS', 'Utang Usaha', 'Kewajiban kepada pemasok'),
  acc('2201', 'PPN Keluaran', 'LIABILITAS', 'Pajak', 'PPN yang dipungut dari penjualan'),
  acc('2202', 'Utang PPh 21', 'LIABILITAS', 'Utang Pajak', 'PPh 21 yang dipotong dan belum disetor', true),
  acc('2203', 'Utang PPh 22', 'LIABILITAS', 'Utang Pajak', 'PPh 22 yang dipungut dan belum disetor', true),
  acc('2204', 'Utang PPh 23', 'LIABILITAS', 'Utang Pajak', 'PPh 23 yang dipotong dan belum disetor', true),
  acc('2205', 'Utang PPh 25', 'LIABILITAS', 'Utang Pajak', 'Angsuran PPh 25 yang belum disetor', true),
  acc('2206', 'Utang PPh 26', 'LIABILITAS', 'Utang Pajak', 'PPh 26 yang dipotong dan belum disetor', true),
  acc('2207', 'Utang PPh Final', 'LIABILITAS', 'Utang Pajak', 'PPh final yang belum disetor', true),
  acc('2208', 'Utang PPN', 'LIABILITAS', 'Utang Pajak', 'Kekurangan PPN masa yang belum disetor', true),
  acc('2209', 'Utang PPnBM', 'LIABILITAS', 'Utang Pajak', 'PPnBM yang belum disetor', true),
  acc('3101', 'Modal', 'EKUITAS', 'Modal', 'Modal pemilik'),
  acc('4101', 'Pendapatan', 'PENDAPATAN', 'Pendapatan Usaha', 'Pendapatan dari kegiatan usaha'),
  acc('5101', 'Beban Operasional', 'BEBAN', 'Beban Operasional', 'Beban operasional umum'),
  acc('5102', 'Beban Gaji', 'BEBAN', 'Beban Operasional', 'Gaji dan tunjangan karyawan'),
  acc('5103', 'Beban Sewa', 'BEBAN', 'Beban Operasional', 'Beban sewa tempat usaha'),
  acc('5104', 'Beban Jasa', 'BEBAN', 'Beban Operasional', 'Beban jasa profesional'),
  acc('5105', 'Beban Penyusutan', 'BEBAN', 'Beban Operasional', 'Penyusutan aset tetap'),
  acc('5106', 'Beban Pajak', 'BEBAN', 'Beban Pajak', 'Pajak yang menjadi beban perusahaan'),
  acc('1202', 'Cadangan Piutang Tak Tertagih', 'ASET', 'Piutang', 'Penyisihan piutang tak tertagih (kontra piutang)'),
  acc('1403', 'Piutang Pajak', 'ASET', 'Pajak Dibayar di Muka', 'Lebih bayar atau restitusi yang masih ditagih'),
  acc('1404', 'Beban Dibayar di Muka', 'ASET', 'Aset Lancar Lain', 'Pembayaran di muka untuk beban periode berikutnya'),
  acc('1501', 'Aset Tetap', 'ASET', 'Aset Tetap', 'Harga perolehan aset tetap'),
  acc('1502', 'Akumulasi Penyusutan', 'ASET', 'Aset Tetap', 'Akumulasi penyusutan aset tetap (kontra aset)'),
  acc('1601', 'Aset Tak Berwujud', 'ASET', 'Aset Tak Berwujud', 'Harga perolehan aset tak berwujud'),
  acc('1602', 'Akumulasi Amortisasi', 'ASET', 'Aset Tak Berwujud', 'Akumulasi amortisasi (kontra aset)'),
  acc('2301', 'Pendapatan Diterima di Muka', 'LIABILITAS', 'Liabilitas Jangka Pendek', 'Pendapatan yang belum menjadi hak'),
  acc('2302', 'Utang Beban yang Masih Harus Dibayar', 'LIABILITAS', 'Liabilitas Jangka Pendek', 'Beban yang sudah terjadi tetapi belum dibayar'),
  acc('3102', 'Prive', 'EKUITAS', 'Modal', 'Pengambilan pribadi pemilik (kontra ekuitas)'),
  acc('5107', 'Beban Amortisasi', 'BEBAN', 'Beban Operasional', 'Amortisasi aset tak berwujud'),
  acc('5108', 'Beban Piutang Tak Tertagih', 'BEBAN', 'Beban Operasional', 'Penyisihan piutang tak tertagih'),
];

// Akun kontra punya saldo normal berlawanan dengan kelompoknya
const CONTRA_CODES: Record<string, NormalSide> = { '1202': 'K', '1502': 'K', '1602': 'K', '3102': 'D' };
DEFAULT_ACCOUNTS.forEach((a) => {
  if (CONTRA_CODES[a.code]) a.normalBalance = CONTRA_CODES[a.code];
});

// Menambahkan akun bawaan yang belum ada di data lama (tanpa mengubah akun yang sudah ada)
export const mergeDefaultAccounts = (existing: Account[]) => {
  const codes = new Set(existing.map((a) => a.code));
  return [...existing, ...DEFAULT_ACCOUNTS.filter((a) => !codes.has(a.code))];
};

export const emptyStore = (): AccountingStore => ({ accounts: DEFAULT_ACCOUNTS, journals: [] });

export const entryTotals = (lines: JournalLine[]) =>
  lines.reduce(
    (sum, line) => ({ debit: sum.debit + (line.debit || 0), credit: sum.credit + (line.credit || 0) }),
    { debit: 0, credit: 0 }
  );

// Syarat posting: minimal dua baris, total debit sama dengan total kredit, dan tidak nol.
export const canPost = (lines: JournalLine[]) => {
  const { debit, credit } = entryTotals(lines);
  const validLines = lines.filter((l) => l.accountCode && (l.debit > 0 || l.credit > 0));
  return validLines.length >= 2 && debit > 0 && debit === credit;
};

// Jurnal yang sudah diposting (termasuk yang dibalik dan jurnal pembalik) ikut saldo.
const postedEntries = (journals: JournalEntry[]) => journals.filter((j) => j.status !== 'DRAFT');

export const balanceOf = (account: Account, journals: JournalEntry[], before?: string) => {
  let debit = 0;
  let credit = 0;
  postedEntries(journals).forEach((entry) => {
    if (before && entry.date >= before) return;
    entry.lines.forEach((line) => {
      if (line.accountCode !== account.code) return;
      debit += line.debit || 0;
      credit += line.credit || 0;
    });
  });
  // Saldo bertanda: positif berarti sesuai saldo normal
  return account.normalBalance === 'D' ? debit - credit : credit - debit;
};

export const trialBalance = (accounts: Account[], journals: JournalEntry[]) => {
  const rows = accounts.map((account) => {
    let debit = 0;
    let credit = 0;
    postedEntries(journals).forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.accountCode !== account.code) return;
        debit += line.debit || 0;
        credit += line.credit || 0;
      });
    });
    const net = debit - credit;
    return {
      code: account.code,
      name: account.name,
      debit: net > 0 ? net : 0,
      credit: net < 0 ? -net : 0,
    };
  });
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  return { rows: rows.filter((r) => r.debit !== 0 || r.credit !== 0), totalDebit, totalCredit, balanced: totalDebit === totalCredit };
};

export const nextJournalNumber = (journals: JournalEntry[], year: number) => {
  const count = journals.filter((j) => j.number.startsWith(`JU-${year}-`)).length;
  return `JU-${year}-${String(count + 1).padStart(4, '0')}`;
};

export const reverseEntry = (entry: JournalEntry, journals: JournalEntry[], today: string) => {
  const year = Number(today.slice(0, 4));
  const reversal: JournalEntry = {
    id: `rev-${entry.id}-${Date.now()}`,
    number: nextJournalNumber(journals, year),
    date: today,
    reference: entry.reference,
    description: `Pembalikan: ${entry.description}`,
    lines: entry.lines.map((l) => ({ accountCode: l.accountCode, debit: l.credit, credit: l.debit })),
    status: 'REVERSAL',
    attachmentName: '',
    reversalOf: entry.id,
    createdAt: new Date().toISOString(),
  };
  const original: JournalEntry = { ...entry, status: 'REVERSED' };
  return { original, reversal };
};

// Rancangan jurnal otomatis untuk kalkulator pajak yang sudah didukung (tahap 1).
// Jenis lain belum didukung dan harus dibuat manual.
export interface TaxDraftInput {
  type: 'PPH_21' | 'PPN';
  date: string;
  period: string; // contoh: "2026-11" untuk masa bulanan
  reference: string;
  // PPh 21 (karyawan, pemotong): gaji bruto bulan ini dan PPh 21 yang dipotong
  grossMonthly?: number;
  pph21Withheld?: number;
  // PPN: PPN keluaran, PPN masukan (kredit), dan PPN yang sudah dibayar/kompensasi
  ppnOutput?: number;
  ppnInput?: number;
}

export const buildTaxDraft = (input: TaxDraftInput, journals: JournalEntry[]) => {
  const sourceKey = `${input.type}:${input.period}`;
  const alreadyExists = journals.some((j) => j.sourceKey === sourceKey && j.status !== 'REVERSED' && j.status !== 'REVERSAL');
  if (alreadyExists) {
    return { error: `Jurnal untuk ${input.type} masa ${input.period} sudah ada. Batalkan dengan pembalikan dulu bila ingin membuat ulang.` };
  }

  const year = Number(input.date.slice(0, 4));
  const base = {
    id: `draft-${sourceKey}-${Date.now()}`,
    number: nextJournalNumber(journals, year),
    date: input.date,
    reference: input.reference,
    status: 'DRAFT' as JournalStatus,
    attachmentName: '',
    sourceKey,
    createdAt: new Date().toISOString(),
  };

  if (input.type === 'PPH_21') {
    const gross = Math.max(0, input.grossMonthly || 0);
    const tax = Math.max(0, input.pph21Withheld || 0);
    const net = Math.max(0, gross - tax);
    return {
      entry: {
        ...base,
        description: `PPh 21 karyawan masa ${input.period}: gaji dipotong PPh 21 (pemberi kerja)`,
        lines: [
          { accountCode: '5102', debit: gross, credit: 0 },
          { accountCode: '2202', debit: 0, credit: tax },
          { accountCode: '1101', debit: 0, credit: net },
        ],
      } as JournalEntry,
    };
  }

  // PPN: pindahkan PPN keluaran dan masukan ke Utang PPN
  const output = Math.max(0, input.ppnOutput || 0);
  const inputTax = Math.max(0, input.ppnInput || 0);
  const payable = output - inputTax;
  if (payable < 0) {
    return { error: 'PPN masukan lebih besar dari PPN keluaran. Kelebihan bayar dicatat manual sebagai piutang pajak.' };
  }
  return {
    entry: {
      ...base,
      description: `Penutupan PPN masa ${input.period}: PPN keluaran dan masukan ke utang PPN`,
      lines: [
        { accountCode: '2201', debit: output, credit: 0 },
        { accountCode: '1401', debit: 0, credit: inputTax },
        { accountCode: '2208', debit: 0, credit: payable },
      ],
    } as JournalEntry,
  };
};

// ---------- Jurnal otomatis semua jenis pajak (tahap lanjut) ----------
// Posisi menentukan akun yang dipakai:
// BEBAN: pajak menjadi beban perusahaan. DIPOTONG_KAMI: kita pemotong (utang pajak).
// DIPOTONG_PIHAK_LAIN: kita dipotong pihak lain (kredit pajak). DIPUNGUT: kita dipungut (kredit pajak).
// SETOR_SENDIRI: kita menyetor sendiri (kredit pajak atau beban, sesuai jenisnya).
export type TaxDraftType = 'PPH_21' | 'PPH_22' | 'PPH_23' | 'PPH_25' | 'PPH_26' | 'PPH_4_2' | 'PPN' | 'PPNBM';
export type TaxPosisi = 'BEBAN' | 'DIPOTONG_KAMI' | 'DIPOTONG_PIHAK_LAIN' | 'DIPUNGUT' | 'SETOR_SENDIRI';

export const POSISI_LABEL: Record<TaxPosisi, string> = {
  BEBAN: 'Beban perusahaan',
  DIPOTONG_KAMI: 'Pemotong',
  DIPOTONG_PIHAK_LAIN: 'Dipotong pihak lain',
  DIPUNGUT: 'Pemungut',
  SETOR_SENDIRI: 'Setor sendiri',
};

export const TAX_DRAFT_LABEL: Record<TaxDraftType, string> = {
  PPH_21: 'PPh 21',
  PPH_22: 'PPh 22',
  PPH_23: 'PPh 23',
  PPH_25: 'PPh 25',
  PPH_26: 'PPh 26',
  PPH_4_2: 'PPh Final 4(2)',
  PPN: 'PPN',
  PPNBM: 'PPnBM',
};

// Mengembalikan baris jurnal untuk kombinasi jenis dan posisi pajak
export const taxTemplate = (type: TaxDraftType, posisi: TaxPosisi, gross: number, tax: number): { lines: JournalLine[]; label: string } | null => {
  const net = Math.max(0, gross - tax);
  const dr = (code: string, amount: number): JournalLine => ({ accountCode: code, debit: amount, credit: 0 });
  const cr = (code: string, amount: number): JournalLine => ({ accountCode: code, debit: 0, credit: amount });
  const utangByType: Partial<Record<TaxDraftType, string>> = { PPH_21: '2202', PPH_22: '2203', PPH_23: '2204', PPH_25: '2205', PPH_26: '2206', PPH_4_2: '2207' };
  const bebanByType: Partial<Record<TaxDraftType, string>> = { PPH_21: '5102', PPH_23: '5104', PPH_26: '5104', PPH_4_2: '5103', PPH_22: '5106' };

  if (type === 'PPH_21' && posisi === 'DIPOTONG_KAMI') {
    return { label: 'Gaji dipotong PPh 21', lines: [dr('5102', gross), cr('2202', tax), cr('1101', net)] };
  }
  if ((type === 'PPH_23' || type === 'PPH_26' || type === 'PPH_4_2') && posisi === 'DIPOTONG_KAMI') {
    return { label: `Pembayaran jasa/sewa dipotong ${TAX_DRAFT_LABEL[type]}`, lines: [dr(bebanByType[type] ?? '5101', gross), cr(utangByType[type] ?? '2207', tax), cr('1101', net)] };
  }
  if ((type === 'PPH_23') && posisi === 'DIPOTONG_PIHAK_LAIN') {
    return { label: 'Pendapatan jasa dipotong PPh 23 pihak lain', lines: [dr('1101', net), dr('1402', tax), cr('4101', gross)] };
  }
  if (type === 'PPH_22' && posisi === 'DIPUNGUT') {
    return { label: 'PPh 22 dipungut (kredit pajak)', lines: [dr('1402', tax), cr('1101', tax)] };
  }
  if (type === 'PPH_22' && posisi === 'BEBAN') {
    return { label: 'PPh 22 sebagai beban', lines: [dr('5106', tax), cr('1101', tax)] };
  }
  if (type === 'PPH_25' && posisi === 'SETOR_SENDIRI') {
    return { label: 'Angsuran PPh 25 disetor sendiri', lines: [dr('1402', tax), cr('1101', tax)] };
  }
  if (type === 'PPH_4_2' && posisi === 'SETOR_SENDIRI') {
    return { label: 'PPh Final 4(2) disetor sendiri sebagai beban', lines: [dr('5106', tax), cr('1101', tax)] };
  }
  if (type === 'PPNBM' && posisi === 'DIPUNGUT') {
    return { label: 'PPnBM dipungut dari penjualan', lines: [dr('1201', tax), cr('2209', tax)] };
  }
  return null;
};

export interface TaxDraftRequest {
  type: TaxDraftType;
  posisi: TaxPosisi;
  date: string;
  period: string;
  reference: string;
  gross: number;
  tax: number;
}

export const buildTaxDraftGeneral = (req: TaxDraftRequest, journals: JournalEntry[]) => {
  if (req.gross < 0 || req.tax < 0) return { error: 'Nominal tidak boleh negatif.' };
  if (req.tax > req.gross && req.gross > 0) return { error: 'Pajak tidak boleh lebih besar dari bruto.' };
  const template = taxTemplate(req.type, req.posisi, req.gross, req.tax);
  if (!template) return { error: `Kombinasi ${TAX_DRAFT_LABEL[req.type]} dengan posisi "${POSISI_LABEL[req.posisi]}" belum didukung. Buat jurnal manual.` };
  const sourceKey = `${req.type}:${req.posisi}:${req.period}`;
  const exists = journals.some((j) => j.sourceKey === sourceKey && j.status !== 'REVERSED' && j.status !== 'REVERSAL');
  if (exists) return { error: `Jurnal ${TAX_DRAFT_LABEL[req.type]} (${POSISI_LABEL[req.posisi]}) masa ${req.period} sudah ada. Batalkan dengan pembalikan dulu bila ingin membuat ulang.` };
  const year = Number(req.date.slice(0, 4));
  const entry: JournalEntry = {
    id: `tx-${sourceKey}-${Date.now()}`,
    number: nextJournalNumber(journals, year),
    date: req.date,
    reference: req.reference,
    description: `${template.label} masa ${req.period}`,
    lines: template.lines,
    status: 'DRAFT',
    attachmentName: '',
    sourceKey,
    jenis: 'UMUM',
    createdAt: new Date().toISOString(),
  };
  return { entry };
};

// ---------- Jurnal penyesuaian akhir periode ----------
export type AdjustingKind = 'PENYUSUTAN' | 'AMORTISASI' | 'BEBAN_DIBAYAR_DI_MUKA' | 'PENDAPATAN_DITERIMA_DI_MUKA' | 'BEBAN_MASIH_HARUS_DIBAYAR' | 'PIUTANG_TAK_TERTAGIH';

export const ADJUSTING_LABEL: Record<AdjustingKind, string> = {
  PENYUSUTAN: 'Penyusutan aset tetap (komersial)',
  AMORTISASI: 'Amortisasi aset tak berwujud',
  BEBAN_DIBAYAR_DI_MUKA: 'Beban dibayar di muka (bagian yang jadi beban)',
  PENDAPATAN_DITERIMA_DI_MUKA: 'Pendapatan diterima di muka (bagian yang jadi pendapatan)',
  BEBAN_MASIH_HARUS_DIBAYAR: 'Beban yang masih harus dibayar',
  PIUTANG_TAK_TERTAGIH: 'Penyisihan piutang tak tertagih',
};

const ADJ_LINES: Record<AdjustingKind, [string, string]> = {
  PENYUSUTAN: ['5105', '1502'],
  AMORTISASI: ['5107', '1602'],
  BEBAN_DIBAYAR_DI_MUKA: ['5101', '1404'],
  PENDAPATAN_DITERIMA_DI_MUKA: ['2301', '4101'],
  BEBAN_MASIH_HARUS_DIBAYAR: ['5101', '2302'],
  PIUTANG_TAK_TERTAGIH: ['5108', '1202'],
};

export const buildAdjustingDraft = (kind: AdjustingKind, amount: number, period: string, date: string, note: string, journals: JournalEntry[]) => {
  if (amount <= 0) return { error: 'Nominal penyesuaian harus lebih dari nol.' };
  const sourceKey = `ADJ:${kind}:${note || 'umum'}:${period}`;
  const exists = journals.some((j) => j.sourceKey === sourceKey && j.status !== 'REVERSED' && j.status !== 'REVERSAL');
  if (exists) return { error: `Penyesuaian ${ADJUSTING_LABEL[kind]} untuk ${note || 'periode ini'} (${period}) sudah ada.` };
  const [debitCode, creditCode] = ADJ_LINES[kind];
  const year = Number(date.slice(0, 4));
  const entry: JournalEntry = {
    id: `adj-${sourceKey}-${Date.now()}`,
    number: nextJournalNumber(journals, year),
    date,
    reference: note || '-',
    description: `${ADJUSTING_LABEL[kind]}${note ? ` (${note})` : ''} periode ${period}`,
    lines: [
      { accountCode: debitCode, debit: amount, credit: 0 },
      { accountCode: creditCode, debit: 0, credit: amount },
    ],
    status: 'DRAFT',
    attachmentName: '',
    sourceKey,
    jenis: 'PENYESUAIAN',
    createdAt: new Date().toISOString(),
  };
  return { entry };
};
