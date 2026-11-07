import { notify } from '../utils/toast';
import { EmptyState } from './EmptyState';
import { printArea } from '../utils/printArea';
import React, { useEffect, useMemo, useState } from 'react';
import { appendAudit, loadAudit } from '../utils/auditTrail';
import {
  ADJUSTING_LABEL,
  AdjustingKind,
  POSISI_LABEL,
  TAX_DRAFT_LABEL,
  TaxDraftType,
  TaxPosisi,
  buildAdjustingDraft,
  buildTaxDraftGeneral,
  mergeDefaultAccounts,
} from '../utils/accounting';
import { cashFlow, calkParagraphs, depreciation, equityStatement, subsidiaryLedger } from '../utils/reports';
import { downloadExcel } from '../utils/excelXml';
import { AnimatedRupiah } from './AnimatedRupiah';
import { formatIdNumber, parseIdNumber } from './RupiahInput';
import { ComprehensiveTaxState, UniversalTaxResult } from '../types/tax';
import { formatRupiah } from '../utils/taxCalculator';
import {
  Account,
  AccountGroup,
  AccountingStore,
  GROUP_LABEL,
  JournalEntry,
  JournalLine,
  STORAGE_KEY,
  balanceOf,
  buildTaxDraft,
  canPost,
  emptyStore,
  entryTotals,
  nextJournalNumber,
  reverseEntry,
  trialBalance,
} from '../utils/accounting';

type SubTab = 'DASHBOARD' | 'AKUN' | 'JURNAL' | 'PENYESUAIAN' | 'BUKU_BESAR' | 'PEMBANTU' | 'PAJAK' | 'NERACA_SALDO' | 'LAPORAN' | 'AUDIT';

interface AccountingModuleProps {
  multiState: ComprehensiveTaxState;
  multiCalc: UniversalTaxResult;
}

type MainTabId = 'BERANDA' | 'CATAT' | 'AKUN' | 'LAPORAN' | 'LAINNYA';

// Menu utama dibuat maksimal lima. Menu yang punya lebih dari satu tampilan menampilkan baris menu kedua.
const MAIN_TABS: { id: MainTabId; label: string; views: SubTab[] }[] = [
  { id: 'BERANDA', label: 'Beranda', views: ['DASHBOARD'] },
  { id: 'CATAT', label: 'Catat transaksi', views: ['JURNAL'] },
  { id: 'AKUN', label: 'Daftar akun', views: ['AKUN'] },
  { id: 'LAPORAN', label: 'Laporan', views: ['LAPORAN', 'BUKU_BESAR', 'NERACA_SALDO', 'PAJAK'] },
  { id: 'LAINNYA', label: 'Lainnya', views: ['PENYESUAIAN', 'PEMBANTU', 'AUDIT'] },
];

const VIEW_LABEL: Record<SubTab, string> = {
  DASHBOARD: 'Beranda',
  JURNAL: 'Catatan transaksi',
  AKUN: 'Daftar akun',
  LAPORAN: 'Laporan keuangan',
  BUKU_BESAR: 'Rekap per akun',
  NERACA_SALDO: 'Cek saldo',
  PAJAK: 'Catatan pajak',
  PENYESUAIAN: 'Koreksi akhir periode',
  PEMBANTU: 'Rincian per pihak',
  AUDIT: 'Riwayat perubahan',
};

// Satu kalimat "Apa ini?" untuk setiap tampilan.
const VIEW_HINT: Record<SubTab, string> = {
  DASHBOARD: 'Gambaran singkat: untung atau rugi, harta, dan utang usaha Anda.',
  JURNAL: 'Tempat mencatat setiap uang masuk dan uang keluar usaha, satu transaksi per jurnal.',
  AKUN: 'Daftar nama akun yang dipakai untuk mencatat transaksi.',
  LAPORAN: 'Laporan keuangan: neraca, laba rugi, dan arus kas untuk melihat kondisi usaha.',
  BUKU_BESAR: 'Rekap semua transaksi per akun, lengkap dengan saldo setelah tiap transaksi (buku besar).',
  NERACA_SALDO: 'Mengecek apakah total debit dan total kredit sudah sama. Jika sama, pencatatan biasanya sudah benar.',
  PAJAK: 'Rekap transaksi yang berkaitan dengan pajak (buku besar pajak), termasuk pajak yang belum disetor.',
  PENYESUAIAN: 'Koreksi di akhir periode, misalnya penyusutan aset atau perbaikan jurnal yang keliru.',
  PEMBANTU: 'Rincian piutang, utang, atau barang untuk tiap pihak (buku pembantu).',
  AUDIT: 'Catatan setiap perubahan di pembukuan: siapa mengubah apa dan kapan. Catatan ini tidak bisa diubah atau dihapus.',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const loadStore = (): AccountingStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as AccountingStore;
    return parsed.accounts && parsed.journals ? { ...parsed, accounts: mergeDefaultAccounts(parsed.accounts) } : emptyStore();
  } catch {
    return emptyStore();
  }
};

const toCsv = (rows: (string | number)[][]) =>
  rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');

// Semua tombol ekspor di modul ini menghasilkan file Excel (.xls) yang bisa dibuka Excel
const downloadCsv = (name: string, rows: (string | number)[][]) => {
  downloadExcel(name.replace(/\.csv$/, ''), [{ name: 'Data', rows }]);
};
void toCsv;

// ---------- Ikon sederhana (garis, tanpa emoji) ----------
const ICON_PATH = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  checkCircle: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12.5l2.5 2.5L16 9.5',
  warn: 'M12 3.5L21.5 20h-19z M12 10v4.5 M12 17.2v.1',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v5.5 M12 7.6v.1',
  up: 'M12 19V5 M5.5 11.5L12 5l6.5 6.5',
  down: 'M12 5v14 M5.5 12.5L12 19l6.5-6.5',
  flat: 'M5 12h14',
  chevron: 'M6 9l6 6 6-6',
  book: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5V4.5z M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3',
};
type IconName = keyof typeof ICON_PATH;

const Icon: React.FC<{ name: IconName; className?: string }> = ({ name, className = 'h-5 w-5' }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 ${className}`}
  >
    <path d={ICON_PATH[name]} />
  </svg>
);

// ---------- Kelas tampilan (dari sistem desain ATLAX) ----------
const inputClass = 'field';
const cardClass = 'card';
const labelClass = 'mb-2 block t-label';
const hintClass = 't-note';
const innerBoxClass = 'rounded-2xl border border-slate-200 bg-slate-50 p-5';
const tableWrapClass = 'mt-4 overflow-x-auto rounded-2xl border border-slate-200';
const tableClass = 'w-full min-w-[36rem] border-collapse t-body text-slate-900';
const thClass = 'border-b-2 border-slate-200 bg-slate-50 p-3 text-left t-label';
const thRightClass = `${thClass} text-right`;
const tdClass = 'border-b border-slate-200 p-3 text-slate-900';
const tdRightClass = `${tdClass} text-right`;
const rowClass = 'transition-colors duration-200 hover:bg-amber-50/60';
const totalRowClass = 'bg-amber-50 font-extrabold text-slate-900';
const btnPrimary = 'btn-primary';
const btnSecondary = 'btn-secondary';
const btnSoft = 'btn-soft';
const btnSuccess = 'btn-success';
const btnDanger = 'btn-danger';

// Kartu pilihan: card-lift dengan keadaan terpilih (ring, latar tinted, dan tanda centang)
const choiceBase = 'card-lift relative block w-full p-5 pr-14 text-left';
const choiceActive = 'border-2 border-amber-700 bg-amber-50 ring-4 ring-amber-100';
const choiceIdle = 'hover:border-amber-300';
const ChoiceMark: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    aria-hidden="true"
    className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 ${
      active ? 'border-amber-700 bg-amber-700 text-white' : 'border-slate-300 bg-white text-transparent'
    }`}
  >
    <Icon name="check" className="h-5 w-5" />
  </span>
);

// Warna angka: hijau untuk untung, merah untuk rugi
const toneText = (n: number) => (n > 0 ? 'text-emerald-800' : n < 0 ? 'text-rose-800' : 'text-slate-900');

// Penjelasan singkat tiap jenis pajak, ditampilkan sebagai kartu pilihan.
const TAX_DRAFT_HINT: Record<TaxDraftType, string> = {
  PPH_21: 'Gaji dan penghasilan karyawan',
  PPH_22: 'Impor dan pengadaan barang',
  PPH_23: 'Jasa, sewa, dividen, bunga, royalti',
  PPH_25: 'Angsuran pajak bulanan',
  PPH_26: 'Pembayaran ke pihak luar negeri',
  PPH_4_2: 'Sewa, konstruksi, dan objek final',
  PPN: 'Pajak pertambahan nilai 11%',
  PPNBM: 'Pajak atas barang mewah',
};

// Penjelasan singkat tiap posisi pajak, ditampilkan sebagai kartu pilihan.
const POSISI_HINT: Record<TaxPosisi, { kode: string; contoh: string }> = {
  BEBAN: { kode: 'Beban', contoh: 'Pajak dicatat sebagai biaya usaha.' },
  DIPOTONG_KAMI: { kode: 'Pemotong', contoh: 'Kita memotong pajak saat membayar vendor atau karyawan.' },
  DIPOTONG_PIHAK_LAIN: { kode: 'Dipotong', contoh: 'Pihak lain memotong pajak saat membayar kita.' },
  DIPUNGUT: { kode: 'Pemungut', contoh: 'Kita memungut pajak dari pembeli, misalnya PPN.' },
  SETOR_SENDIRI: { kode: 'Setor', contoh: 'Kita menyetor pajak atas kewajiban sendiri.' },
};

const StatusBadge: React.FC<{ status: JournalEntry['status'] }> = ({ status }) => {
  const map: Record<JournalEntry['status'], string> = {
    DRAFT: 'chip-warn',
    POSTED: 'chip-ok',
    REVERSED: 'chip-neutral',
    REVERSAL: 'chip-info',
  };
  const label: Record<JournalEntry['status'], string> = {
    DRAFT: 'Draf (belum diposting)',
    POSTED: 'Diposting',
    REVERSED: 'Dibalik',
    REVERSAL: 'Pembalik',
  };
  return (
    <span className={map[status]}>
      <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-current" />
      {label[status]}
    </span>
  );
};

// Judul khusus cetak (tampil hanya saat Cetak / PDF)
const PrintTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="hidden print:block mb-4 pb-2 border-b-2 border-slate-800">
    <p className="text-xs font-bold tracking-wide text-slate-600">ATLAX, Make Tax Reporting Simpler</p>
    <h1 className="t-section text-black">{title}</h1>
    <p className="t-note">{subtitle}</p>
  </div>
);

export const AccountingModule: React.FC<AccountingModuleProps> = ({ multiState, multiCalc }) => {
  const [tab, setTab] = useState<SubTab>('DASHBOARD');
  const [store, setStore] = useState<AccountingStore>(loadStore);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const { accounts, journals } = store;
  const accountByCode = useMemo(() => new Map(accounts.map((a) => [a.code, a])), [accounts]);
  const showMessage = (type: 'ok' | 'error', text: string) => {
    notify(type, text);
    setTimeout(() => setMessage(null), 4000);
  };

  const activeMain = MAIN_TABS.find((m) => m.views.includes(tab)) ?? MAIN_TABS[0];

  // ---------- Dashboard ----------
  const sumGroup = (group: AccountGroup) =>
    accounts.filter((a) => a.group === group).reduce((s, a) => s + balanceOf(a, journals), 0);

  const totalAset = sumGroup('ASET');
  const totalLiabilitas = sumGroup('LIABILITAS');
  const totalPendapatan = sumGroup('PENDAPATAN');
  const totalBeban = sumGroup('BEBAN');
  const labaBersih = totalPendapatan - totalBeban;
  const totalEkuitas = sumGroup('EKUITAS') + labaBersih;
  const utangPajak = accounts.filter((a) => a.isTaxPayable).reduce((s, a) => s + balanceOf(a, journals), 0);
  const pajakDibayar = journals
    .filter((j) => j.status !== 'DRAFT')
    .reduce((sum, j) => sum + j.lines.reduce((s, l) => {
      const acc = accountByCode.get(l.accountCode);
      return s + (acc?.isTaxPayable ? l.debit : 0);
    }, 0), 0);

  const currentYear = new Date().getFullYear();
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const prefix = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    return journals
      .filter((j) => j.status !== 'DRAFT' && j.date.startsWith(prefix))
      .reduce((s, j) => s + entryTotals(j.lines).debit, 0);
  });
  const maxMonthly = Math.max(1, ...monthlyTotals);
  const recent = [...journals].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);

  // ---------- Daftar akun ----------
  const emptyAccount = { code: '', name: '', group: 'ASET' as AccountGroup, category: '', description: '' };
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const saveAccount = () => {
    const code = accountForm.code.trim();
    if (!code || !accountForm.name.trim()) return showMessage('error', 'Kode dan nama akun wajib diisi.');
    if (!editingCode && accountByCode.has(code)) return showMessage('error', `Kode ${code} sudah dipakai.`);
    const normal: Account['normalBalance'] = accountForm.group === 'ASET' || accountForm.group === 'BEBAN' ? 'D' : 'K';
    setStore((prev) => {
      const existing = prev.accounts.find((a) => a.code === (editingCode ?? code));
      const next: Account = {
        code,
        name: accountForm.name.trim(),
        group: accountForm.group,
        category: accountForm.category.trim() || GROUP_LABEL[accountForm.group],
        normalBalance: normal,
        description: accountForm.description.trim(),
        active: existing ? existing.active : true,
        isTaxPayable: existing?.isTaxPayable,
      };
      const list = editingCode
        ? prev.accounts.map((a) => (a.code === editingCode ? next : a))
        : [...prev.accounts, next];
      return { ...prev, accounts: list };
    });
    appendAudit({ modul: 'Akun', aktivitas: editingCode ? 'Akun diubah' : 'Akun ditambahkan', dokumen: code, sebelum: editingCode ?? '-', sesudah: `${code} ${accountForm.name.trim()}`, keterangan: accountForm.group });
    setAccountForm(emptyAccount);
    setEditingCode(null);
    showMessage('ok', editingCode ? 'Akun diperbarui.' : 'Akun ditambahkan.');
  };

  const toggleAccount = (code: string) => {
    const before = accounts.find((a) => a.code === code);
    appendAudit({ modul: 'Akun', aktivitas: 'Status akun diubah', dokumen: code, sebelum: before?.active ? 'Aktif' : 'Nonaktif', sesudah: before?.active ? 'Nonaktif' : 'Aktif', keterangan: before?.name ?? '' });
    setStore((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.code === code ? { ...a, active: !a.active } : a)),
    }));
  };

  // ---------- Jurnal ----------
  const blankLines = (): JournalLine[] => [
    { accountCode: '', debit: 0, credit: 0 },
    { accountCode: '', debit: 0, credit: 0 },
  ];
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [journalDraft, setJournalDraft] = useState({
    date: todayIso(),
    reference: '',
    description: '',
    attachmentName: '',
    lines: blankLines(),
  });
  const [formError, setFormError] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState('');
  const [filterText, setFilterText] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  const draftTotals = entryTotals(journalDraft.lines);
  const draftBalanced = canPost(journalDraft.lines);

  const resetJournalForm = () => {
    setEditingJournal(null);
    setPendingAttachment('');
    setJournalDraft({ date: todayIso(), reference: '', description: '', attachmentName: '', lines: blankLines() });
  };

  const buildEntry = (status: JournalEntry['status']): JournalEntry => {
    const year = Number(journalDraft.date.slice(0, 4));
    const lines = journalDraft.lines.filter((l) => l.accountCode);
    if (editingJournal) {
      return { ...editingJournal, date: journalDraft.date, reference: journalDraft.reference, description: journalDraft.description, attachmentName: journalDraft.attachmentName, lines, status };
    }
    return {
      id: `j-${Date.now()}`,
      number: nextJournalNumber(journals, year),
      date: journalDraft.date,
      reference: journalDraft.reference,
      description: journalDraft.description,
      attachmentName: journalDraft.attachmentName,
      lines,
      status,
      createdAt: new Date().toISOString(),
    };
  };

  const saveJournal = (status: 'DRAFT' | 'POSTED') => {
    setFormError('');
    if (!journalDraft.description.trim()) return setFormError('Keterangan transaksi belum diisi. Isi dulu, lalu tekan Posting.');
    if (status === 'POSTED' && !draftBalanced) return setFormError('Total debit dan kredit harus sama, dan minimal dua baris, sebelum diposting.');
    if (journalDraft.lines.some((l) => l.accountCode && l.debit > 0 && l.credit > 0)) {
      return setFormError('Satu baris hanya boleh berisi debit atau kredit, tidak keduanya.');
    }
    const entry = { ...buildEntry(status), attachmentData: pendingAttachment || undefined };
    appendAudit({
      modul: 'Jurnal',
      aktivitas: status === 'POSTED' ? 'Jurnal diposting' : 'Draf jurnal disimpan',
      dokumen: entry.number,
      sebelum: editingJournal ? `${editingJournal.status} | ${editingJournal.description}` : '-',
      sesudah: `${status} | ${entry.description} | Debit ${formatRupiah(entryTotals(entry.lines).debit)}`,
      keterangan: entry.reference || '-',
    });
    setStore((prev) => {
      const exists = prev.journals.some((j) => j.id === entry.id);
      return { ...prev, journals: exists ? prev.journals.map((j) => (j.id === entry.id ? entry : j)) : [...prev.journals, entry] };
    });
    resetJournalForm();
    showMessage('ok', status === 'POSTED' ? `Jurnal ${entry.number} diposting.` : 'Draf jurnal disimpan.');
  };

  const editDraft = (entry: JournalEntry) => {
    setEditingJournal(entry);
    setJournalDraft({
      date: entry.date,
      reference: entry.reference,
      description: entry.description,
      attachmentName: entry.attachmentName,
      lines: entry.lines.length ? entry.lines : blankLines(),
    });
    setTab('JURNAL');
  };

  const postDraft = (entry: JournalEntry) => {
    if (!canPost(entry.lines)) return showMessage('error', `Jurnal ${entry.number} belum seimbang. Perbaiki dulu.`);
    setStore((prev) => ({ ...prev, journals: prev.journals.map((j) => (j.id === entry.id ? { ...j, status: 'POSTED' } : j)) }));
    // Kalau draf ini sedang dibuka di form, kosongkan form supaya tampilannya bersih lagi
    if (editingJournal?.id === entry.id) resetJournalForm();
    appendAudit({ modul: 'Jurnal', aktivitas: 'Draf diposting', dokumen: entry.number, sebelum: 'DRAFT', sesudah: 'POSTED', keterangan: entry.description });
    showMessage('ok', `Jurnal ${entry.number} diposting.`);
  };

  const deleteDraft = (entry: JournalEntry) => {
    if (entry.status !== 'DRAFT') return;
    if (!window.confirm(`Hapus draf jurnal ${entry.number}?`)) return;
    setStore((prev) => ({ ...prev, journals: prev.journals.filter((j) => j.id !== entry.id) }));
    appendAudit({ modul: 'Jurnal', aktivitas: 'Draf dihapus', dokumen: entry.number, sebelum: entry.description, sesudah: '(dihapus)', keterangan: 'Hanya draf yang bisa dihapus' });
    if (editingJournal?.id === entry.id) resetJournalForm();
  };

  // Jurnal yang sudah diposting tidak diubah langsung. Revisi = jurnal dibalik, lalu isinya dibuka sebagai draf baru.
  const reviseJournal = (entry: JournalEntry) => {
    if (entry.status !== 'POSTED') return;
    if (!window.confirm(`Revisi ${entry.number}? Jurnal asli akan dibalik, lalu isinya dibuka sebagai draf baru untuk diedit.`)) return;
    const today = todayIso();
    setStore((prev) => {
      const { original, reversal } = reverseEntry(entry, prev.journals, today);
      return { ...prev, journals: [...prev.journals.map((j) => (j.id === entry.id ? original : j)), reversal] };
    });
    appendAudit({ modul: 'Jurnal', aktivitas: 'Revisi jurnal', dokumen: entry.number, sebelum: 'POSTED', sesudah: 'REVERSED, draf revisi dibuka', keterangan: entry.description });
    setEditingJournal(null);
    setJournalDraft({
      date: today,
      reference: entry.reference,
      description: `Revisi: ${entry.description}`,
      attachmentName: entry.attachmentName,
      lines: entry.lines.map((l) => ({ ...l })),
    });
    setTab('JURNAL');
    showMessage('ok', `${entry.number} dibalik. Draf revisi siap diedit dan diposting.`);
  };

  // Hapus satu jurnal. Jika jurnal itu bagian dari pasangan pembalikan, pasangannya ikut dihapus agar buku tetap seimbang.
  const deleteJournalGroup = (entry: JournalEntry) => {
    const rootId = entry.reversalOf ?? entry.id;
    const group = journals.filter((j) => j.id === rootId || j.reversalOf === rootId);
    const message = group.length > 1
      ? `Hapus jurnal ${group.map((j) => j.number).join(' dan ')}? Jurnal asli dan jurnal pembaliknya dihapus bersama. Tidak bisa dibatalkan.`
      : `Hapus jurnal ${entry.number}? Tidak bisa dibatalkan.`;
    if (!window.confirm(message)) return;
    const ids = new Set(group.map((j) => j.id));
    setStore((prev) => ({ ...prev, journals: prev.journals.filter((j) => !ids.has(j.id)) }));
    group.forEach((j) => appendAudit({ modul: 'Jurnal', aktivitas: 'Jurnal dihapus dari Ringkasan', dokumen: j.number, sebelum: j.description, sesudah: '(dihapus)', keterangan: `Status sebelum dihapus: ${j.status}` }));
    if (editingJournal && ids.has(editingJournal.id)) resetJournalForm();
    showMessage('ok', `${group.length} jurnal dihapus.`);
  };
  // Hapus jurnal yang sudah diposting (tanpa revisi). Penghapusan tetap dicatat di Audit Trail.
  const deletePosted = (entry: JournalEntry) => {
    if (entry.status !== 'POSTED') return;
    if (!window.confirm(`Hapus jurnal ${entry.number} yang sudah diposting? Tindakan ini tidak bisa dibatalkan. Penghapusan tetap tercatat di Audit Trail.`)) return;
    setStore((prev) => ({ ...prev, journals: prev.journals.filter((j) => j.id !== entry.id) }));
    appendAudit({ modul: 'Jurnal', aktivitas: 'Jurnal diposting dihapus', dokumen: entry.number, sebelum: entry.description, sesudah: '(dihapus)', keterangan: 'Dihapus dari daftar jurnal oleh pengguna' });
    if (editingJournal?.id === entry.id) resetJournalForm();
    showMessage('ok', `Jurnal ${entry.number} dihapus.`);
  };

  const reverseJournal = (entry: JournalEntry) => {
    if (entry.status !== 'POSTED') return;
    if (!window.confirm(`Buat jurnal pembalik untuk ${entry.number}? Jurnal asli akan ditandai dibalik.`)) return;
    const today = todayIso();
    setStore((prev) => {
      const { original, reversal } = reverseEntry(entry, prev.journals, today);
      return {
        ...prev,
        journals: [...prev.journals.map((j) => (j.id === entry.id ? original : j)), reversal],
      };
    });
    appendAudit({ modul: 'Jurnal', aktivitas: 'Jurnal dibalik', dokumen: entry.number, sebelum: 'POSTED', sesudah: 'REVERSED', keterangan: 'Jurnal pembalik dibuat' });
    showMessage('ok', `Jurnal pembalik dibuat untuk ${entry.number}.`);
  };

  const filteredJournals = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return [...journals]
      .filter((j) => !filterPeriod || j.date.startsWith(filterPeriod))
      .filter((j) => !q || j.description.toLowerCase().includes(q) || j.number.toLowerCase().includes(q) || j.reference.toLowerCase().includes(q))
      .sort((a, b) => (a.date === b.date ? (a.number < b.number ? 1 : -1) : a.date < b.date ? 1 : -1));
  }, [journals, filterText, filterPeriod]);

  // Jurnal otomatis dari kalkulator pajak
  const [autoRef, setAutoRef] = useState('');
  const taxPeriod = `${multiState.profile.taxYear}-${String(multiState.selectedMonth).padStart(2, '0')}`;
  const taxPeriodLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(multiState.profile.taxYear, multiState.selectedMonth - 1, 1)
  );
  const createAutoDraft = (type: 'PPH_21' | 'PPN') => {
    if (multiState.reportingPeriod !== 'MONTHLY') {
      return showMessage('error', 'Jurnal otomatis tahap ini hanya untuk masa bulanan.');
    }
    const input = type === 'PPH_21'
      ? {
          type,
          date: todayIso(),
          period: taxPeriod,
          reference: autoRef || 'Hitungan ATLAX',
          grossMonthly: multiState.pph21.grossSalaryMonthly,
          pph21Withheld: multiCalc.calculatedTax,
        }
      : {
          type,
          date: todayIso(),
          period: taxPeriod,
          reference: autoRef || 'Hitungan ATLAX',
          ppnOutput: multiCalc.calculatedTax,
          ppnInput: multiCalc.creditsOrPrepaid,
        };
    const result = buildTaxDraft(input, journals);
    if ('error' in result && result.error) return showMessage('error', result.error);
    if ('entry' in result && result.entry) {
      setStore((prev) => ({ ...prev, journals: [...prev.journals, result.entry as JournalEntry] }));
      setTab('JURNAL');
      showMessage('ok', 'Rancangan jurnal dibuat sebagai draf. Periksa dan edit sebelum diposting.');
    }
  };

  // ---------- Jurnal otomatis semua jenis pajak ----------
  const [taxReq, setTaxReq] = useState({ type: 'PPH_23' as TaxDraftType, posisi: 'DIPOTONG_KAMI' as TaxPosisi, gross: 0, tax: 0, reference: '' });
  const createGeneralDraft = () => {
    const result = buildTaxDraftGeneral({ ...taxReq, date: todayIso(), period: taxPeriod, reference: taxReq.reference || 'Input manual' }, journals);
    const entry = result.entry;
    if (!entry) return showMessage('error', result.error ?? 'Draf jurnal gagal dibuat.');
    setStore((prev) => ({ ...prev, journals: [...prev.journals, entry] }));
    appendAudit({ modul: 'Jurnal', aktivitas: 'Draf jurnal pajak dibuat', dokumen: entry.number, sebelum: '-', sesudah: entry.description, keterangan: POSISI_LABEL[taxReq.posisi] });
    setTab('JURNAL');
    showMessage('ok', 'Draf jurnal pajak dibuat. Periksa lalu posting di daftar jurnal.');
  };

  // ---------- Jurnal penyesuaian dan penyusutan ----------
  const [adjKind, setAdjKind] = useState<AdjustingKind>('PENYUSUTAN');
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjDate, setAdjDate] = useState(todayIso());
  const [adjPeriod, setAdjPeriod] = useState(todayIso().slice(0, 7));
  const [adjNote, setAdjNote] = useState('');
  const [asset, setAsset] = useState({ nama: '', cost: 0, residual: 0, lifeKom: 4, lifeFiskal: 4 });
  const assetCalc = depreciation({
    nama: asset.nama,
    hargaPerolehan: asset.cost,
    nilaiSisa: asset.residual,
    masaManfaatTahunKomersial: asset.lifeKom,
    masaManfaatTahunFiskal: asset.lifeFiskal,
  });
  const createAdjusting = (kind: AdjustingKind, amount: number, note: string) => {
    const result = buildAdjustingDraft(kind, amount, adjPeriod, adjDate, note, journals);
    const entry = result.entry;
    if (!entry) return showMessage('error', result.error ?? 'Penyesuaian gagal dibuat.');
    setStore((prev) => ({ ...prev, journals: [...prev.journals, entry] }));
    appendAudit({ modul: 'Jurnal', aktivitas: 'Jurnal penyesuaian dibuat', dokumen: entry.number, sebelum: '-', sesudah: `${ADJUSTING_LABEL[kind]} ${formatRupiah(amount)}`, keterangan: note || adjPeriod });
    showMessage('ok', 'Draf jurnal penyesuaian dibuat. Periksa lalu posting.');
  };

  // ---------- Buku pembantu ----------
  const PEMBANTU_CODES = ['1201', '2101', '1301', '2202', '2203', '2204', '2205', '2206', '2207', '2208', '2209', '1403', '1402', '1401', '2201'];
  const [pembantuAccount, setPembantuAccount] = useState('1201');

  // ---------- Buku besar ----------
  const [ledgerAccount, setLedgerAccount] = useState('1101');
  const [ledgerYear, setLedgerYear] = useState(currentYear);
  const [ledgerMonth, setLedgerMonth] = useState(0);
  const ledger = useMemo(() => {
    const account = accountByCode.get(ledgerAccount);
    if (!account) return null;
    const start = ledgerMonth
      ? `${ledgerYear}-${String(ledgerMonth).padStart(2, '0')}-01`
      : `${ledgerYear}-01-01`;
    const end = ledgerMonth
      ? ledgerMonth === 12 ? `${ledgerYear + 1}-01-01` : `${ledgerYear}-${String(ledgerMonth + 1).padStart(2, '0')}-01`
      : `${ledgerYear + 1}-01-01`;
    const opening = balanceOf(account, journals, start);
    let running = opening;
    const rows = journals
      .filter((j) => j.status !== 'DRAFT' && j.date >= start && j.date < end)
      .flatMap((j) => j.lines.filter((l) => l.accountCode === account.code).map((l) => ({ j, l })))
      .sort((a, b) => (a.j.date === b.j.date ? (a.j.number < b.j.number ? -1 : 1) : a.j.date < b.j.date ? -1 : 1))
      .map(({ j, l }) => {
        const change = account.normalBalance === 'D' ? (l.debit || 0) - (l.credit || 0) : (l.credit || 0) - (l.debit || 0);
        running += change;
        return { date: j.date, number: j.number, description: j.description, debit: l.debit, credit: l.credit, balance: running };
      });
    return { account, opening, rows, closing: running };
  }, [accountByCode, ledgerAccount, ledgerYear, ledgerMonth, journals]);

  // ---------- Buku besar pajak (dari jurnal yang sudah diposting) ----------
  const TAX_CODES = ['1401', '1402', '2201', '2202', '2203', '2204', '2205', '2206', '2207', '2208', '2209', '5106'];
  const [taxYearFilter, setTaxYearFilter] = useState(currentYear);
  const [taxMonthFilter, setTaxMonthFilter] = useState(0);
  const [taxAccountFilter, setTaxAccountFilter] = useState('');
  const taxLedger = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = taxMonthFilter ? `${taxYearFilter}-${pad(taxMonthFilter)}-01` : `${taxYearFilter}-01-01`;
    const end = taxMonthFilter
      ? taxMonthFilter === 12 ? `${taxYearFilter + 1}-01-01` : `${taxYearFilter}-${pad(taxMonthFilter + 1)}-01`
      : `${taxYearFilter + 1}-01-01`;
    const codes = taxAccountFilter ? [taxAccountFilter] : TAX_CODES;
    const taxAccounts = codes.map((c) => accountByCode.get(c)).filter((a): a is Account => !!a);
    const inPeriod = journals.filter((j) => j.status !== 'DRAFT' && j.date >= start && j.date < end);
    const summary = taxAccounts.map((account) => {
      const opening = balanceOf(account, journals, start);
      let debit = 0;
      let credit = 0;
      inPeriod.forEach((j) => j.lines.forEach((l) => {
        if (l.accountCode !== account.code) return;
        debit += l.debit || 0;
        credit += l.credit || 0;
      }));
      const closing = opening + (account.normalBalance === 'D' ? debit - credit : credit - debit);
      return { account, opening, debit, credit, closing };
    });
    const details = inPeriod
      .flatMap((j) => j.lines.filter((l) => codes.includes(l.accountCode)).map((l) => ({ j, l })))
      .sort((a, b) => (a.j.date === b.j.date ? (a.j.number < b.j.number ? -1 : 1) : a.j.date < b.j.date ? -1 : 1));
    return { summary, details };
  }, [accountByCode, journals, taxYearFilter, taxMonthFilter, taxAccountFilter]);

  // ---------- Neraca saldo ----------
  const tb = useMemo(() => trialBalance(accounts, journals), [accounts, journals]);

  // ---------- Laporan ----------
  const balances = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a) => map.set(a.code, balanceOf(a, journals)));
    return map;
  }, [accounts, journals]);
  const neracaSeimbang = Math.abs(totalAset - (totalLiabilitas + totalEkuitas)) < 1;

  return (
    <section className="space-y-5 print-area">
      <div className={`${cardClass} relative overflow-hidden`}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-200 to-orange-200" />
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200  text-amber-900 shadow-sm">
            <Icon name="book" className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <span className="t-kicker text-amber-800">Pembukuan & Akuntansi</span>
            <h2 className="mt-1 t-page">Catatan dan laporan usaha Anda</h2>
          </div>
        </div>
        <p className="mt-4 t-body">Data tersimpan di perangkat ini. Jurnal yang sudah diposting tidak diubah langsung. Gunakan Revisi atau Pembalikan.</p>
        <details className="mt-4 print:hidden">
          <summary className="cursor-pointer t-body font-bold text-amber-900 underline underline-offset-4">Lihat penjelasan istilah</summary>
          <ul className="mt-3 list-disc space-y-2 rounded-2xl bg-amber-50 p-5 pl-10 t-body">
            <li><strong>Jurnal</strong>: catatan satu transaksi, misalnya penjualan atau bayar listrik.</li>
            <li><strong>Debit dan kredit</strong>: dua sisi pencatatan. Total debit harus sama dengan total kredit.</li>
            <li><strong>Posting</strong>: jurnal disahkan dan masuk ke laporan. Jurnal yang sudah diposting tidak bisa diubah langsung.</li>
            <li><strong>Revisi</strong>: jurnal lama dibalik, lalu isinya dibuka sebagai draf baru untuk diedit.</li>
            <li><strong>Pembalikan</strong>: membuat jurnal kebalikan untuk membatalkan jurnal yang sudah diposting.</li>
            <li><strong>Buku besar</strong>: kumpulan transaksi per akun. <strong>Neraca saldo</strong>: pengecekan total debit dan kredit.</li>
          </ul>
        </details>
        <p className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 t-body print:hidden">
          <Icon name="info" className="mt-0.5 h-6 w-6 text-amber-800" />
          <span><strong>Apa ini?</strong> {VIEW_HINT[tab]}</span>
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5 print:hidden">
          {MAIN_TABS.map((m) => {
            const active = m.id === activeMain.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTab(m.views[0])}
                className={`min-h-[3rem] rounded-2xl border-2 px-3 py-3 t-body font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                  active
                    ? 'border-amber-800 bg-amber-700 text-white shadow-md'
                    : 'border-slate-300 bg-white text-slate-900 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        {activeMain.views.length > 1 && (
          <div role="group" aria-label={`Tampilan dalam menu ${activeMain.label}`} className="mt-3 flex flex-wrap gap-2 print:hidden">
            {activeMain.views.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={tab === v}
                onClick={() => setTab(v)}
                className={`inline-flex min-h-[3rem] items-center gap-2 rounded-full border-2 px-4 py-2 t-body font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                  tab === v
                    ? 'border-amber-700 bg-amber-100 text-amber-950 shadow-sm'
                    : 'border-slate-300 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {tab === v && <Icon name="check" className="h-5 w-5" />}
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-end print:hidden">
          <button type="button" onClick={() => printArea()} className={btnSecondary}>Cetak / PDF</button>
        </div>
      </div>

      {message && (
        <div role="status" className={`flex items-start gap-3 rounded-2xl border-2 px-5 py-4 t-body font-bold ${message.type === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
          <Icon name={message.type === 'ok' ? 'checkCircle' : 'warn'} className="mt-0.5 h-6 w-6" />
          <span>{message.type === 'ok' ? 'Berhasil: ' : 'Belum bisa: '}{message.text}</span>
        </div>
      )}

      {/* BERANDA */}
      {tab === 'DASHBOARD' && (
        <div className="module-enter space-y-5">
          <div className="card border-2 border-amber-300 ">
            <p className="t-card">Untung atau rugi bersih</p>
            <p className={`mt-2 t-result ${toneText(labaBersih)}`}><AnimatedRupiah value={labaBersih} /></p>
            <div className="mt-3">
              <span className={labaBersih > 0 ? 'chip-ok' : labaBersih < 0 ? 'chip-bad' : 'chip-neutral'}>
                <Icon name={labaBersih > 0 ? 'up' : labaBersih < 0 ? 'down' : 'flat'} />
                {labaBersih > 0 ? 'Sejauh ini usaha Anda untung.' : labaBersih < 0 ? 'Sejauh ini usaha Anda rugi.' : 'Sejauh ini belum ada untung atau rugi.'}
              </span>
            </div>
            <p className={`mt-2 ${hintClass}`}>Pendapatan dikurangi biaya. Tanda minus (-) berarti rugi.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Total aset (harta usaha)', hint: 'Kas, bank, persediaan, dan peralatan.', value: totalAset, tone: 'border-t-emerald-300' },
              { label: 'Total utang (liabilitas)', hint: 'Kewajiban yang masih harus dibayar, termasuk utang pajak.', value: totalLiabilitas, tone: 'border-t-sky-300' },
              { label: 'Utang pajak', hint: 'Pajak yang sudah dipotong atau dipungut, tetapi belum disetor.', value: utangPajak, tone: 'border-t-amber-300' },
            ].map((item) => (
              <div key={item.label} className={`card border-t-4 ${item.tone}`}>
                <p className="t-label">{item.label}</p>
                <p className="mt-2 t-section"><AnimatedRupiah value={item.value} /></p>
                <p className={`mt-2 ${hintClass}`}>{item.hint}</p>
              </div>
            ))}
          </div>

          <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="t-card">Transaksi terbaru</h3>
                <p className={hintClass}>10 jurnal terakhir, dari yang paling baru.</p>
              </div>
              <button type="button" className={btnPrimary} onClick={() => setTab('JURNAL')}>Catat transaksi baru</button>
            </div>
            {recent.length === 0 ? (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50"><EmptyState text="Belum ada transaksi. Tekan tombol Catat transaksi baru untuk mulai." /></div>
            ) : (
              <ul className="mt-4 space-y-3">
                {recent.map((j) => (
                  <li key={j.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-200 hover:border-amber-300">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="t-body font-bold text-slate-900">{j.description}</p>
                      <p className="t-card">{formatRupiah(entryTotals(j.lines).debit)}</p>
                    </div>
                    <p className={hintClass}>{j.date} · Nomor {j.number}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <StatusBadge status={j.status} />
                      <button type="button" className={btnDanger} onClick={() => deleteJournalGroup(j)}>Hapus</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <details className={`${cardClass} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 t-card">
              Lihat angka lainnya
              <Icon name="chevron" className="h-6 w-6 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: 'Modal (ekuitas)', hint: 'Kekayaan bersih pemilik: aset dikurangi utang.', value: totalEkuitas },
                { label: 'Pendapatan', hint: 'Uang yang masuk dari penjualan atau jasa.', value: totalPendapatan },
                { label: 'Biaya (beban)', hint: 'Uang yang keluar untuk menjalankan usaha.', value: totalBeban },
                { label: 'Pajak sudah dibayar', hint: 'Pajak yang sudah disetor ke kas negara.', value: pajakDibayar },
              ].map((item) => (
                <div key={item.label} className={innerBoxClass}>
                  <dt className="t-label">{item.label}</dt>
                  <dd className="mt-1 t-card"><AnimatedRupiah value={item.value} /></dd>
                  <dd className={`mt-1 ${hintClass}`}>{item.hint}</dd>
                </div>
              ))}
            </dl>
          </details>

          <details className={`${cardClass} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 t-card">
              Lihat grafik transaksi per bulan ({currentYear})
              <Icon name="chevron" className="h-6 w-6 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className={`mt-3 ${hintClass}`}>Total debit jurnal yang sudah diposting, per bulan.</p>
            <div className="mt-5 flex h-48 items-end gap-2 rounded-2xl bg-amber-50 p-4">
              {monthlyTotals.map((value, index) => (
                <div key={index} className="flex h-full flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-amber-200 to-amber-300 transition-all duration-700 ease-out hover:from-amber-300 hover:to-amber-400 hover:shadow-md"
                      style={{ height: `${Math.round((value / maxMonthly) * 100)}%`, minHeight: value > 0 ? 4 : 0 }}
                      title={formatRupiah(value)}
                    />
                  </div>
                  <span className="t-note">{index + 1}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* DAFTAR AKUN */}
      {tab === 'AKUN' && (
        <div className="module-enter space-y-5">
          <div className={cardClass}>
            <h3 className="t-card">{editingCode ? `Edit akun ${editingCode}` : 'Tambah akun baru'}</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fld-accountingmodule-1" className={labelClass}>Kode akun (nomor akun)</label>
                <input id="fld-accountingmodule-1" className={inputClass} value={accountForm.code} disabled={!!editingCode} onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-2" className={labelClass}>Nama akun</label>
                <input id="fld-accountingmodule-2" className={inputClass} value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-3" className={labelClass}>Kelompok akun (jenis)</label>
                <select id="fld-accountingmodule-3" className={inputClass} value={accountForm.group} onChange={(e) => setAccountForm({ ...accountForm, group: e.target.value as AccountGroup })}>
                  {(Object.keys(GROUP_LABEL) as AccountGroup[]).map((g) => (
                    <option key={g} value={g}>{GROUP_LABEL[g]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-4" className={labelClass}>Kategori (boleh kosong)</label>
                <input id="fld-accountingmodule-4" className={inputClass} value={accountForm.category} onChange={(e) => setAccountForm({ ...accountForm, category: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fld-accountingmodule-5" className={labelClass}>Deskripsi (boleh kosong)</label>
                <input id="fld-accountingmodule-5" className={inputClass} value={accountForm.description} onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })} />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={saveAccount} className={btnPrimary}>
                {editingCode ? 'Simpan perubahan' : 'Tambah akun'}
              </button>
              {editingCode && (
                <button type="button" onClick={() => { setEditingCode(null); setAccountForm(emptyAccount); }} className={btnSecondary}>
                  Batal
                </button>
              )}
            </div>
            <details className="mt-5">
              <summary className="cursor-pointer t-body font-bold text-amber-900 underline underline-offset-4">Lihat arti kelompok akun</summary>
              <ul className="mt-3 list-disc space-y-2 rounded-2xl bg-amber-50 p-5 pl-10 t-body">
                <li><strong>Aset</strong>: harta usaha, misalnya kas, bank, persediaan, dan peralatan.</li>
                <li><strong>Liabilitas</strong>: utang atau kewajiban yang harus dibayar.</li>
                <li><strong>Ekuitas</strong>: modal pemilik.</li>
                <li><strong>Pendapatan</strong>: uang masuk dari penjualan atau jasa.</li>
                <li><strong>Beban</strong>: uang keluar untuk menjalankan usaha.</li>
              </ul>
            </details>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((a) => (
              <div key={a.code} className={`card ${a.active ? '' : 'border-dashed border-slate-400 bg-slate-50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className={`t-card ${a.active ? '' : 'text-slate-500'}`}>{a.code} - {a.name}</p>
                  <span className={a.active ? 'chip-ok' : 'chip-neutral'}>Status: {a.active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <p className={`mt-2 ${hintClass}`}>{GROUP_LABEL[a.group]} · {a.category}</p>
                <p className={hintClass}>Saldo normal (arah yang biasa bertambah): {a.normalBalance === 'D' ? 'Debit' : 'Kredit'}</p>
                {a.description && <p className={hintClass}>{a.description}</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className={btnSoft} onClick={() => { setEditingCode(a.code); setAccountForm({ code: a.code, name: a.name, group: a.group, category: a.category, description: a.description }); }}>Edit</button>
                  <button type="button" className={btnSecondary} onClick={() => toggleAccount(a.code)}>{a.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATAT TRANSAKSI (JURNAL UMUM) */}
      {tab === 'JURNAL' && (
        <div className="module-enter space-y-5">
          <div className={cardClass}>
            <h3 className="t-card">{editingJournal ? `Edit draf ${editingJournal.number}` : 'Catat transaksi baru'}</h3>
            <p className="mt-2 t-body">Isi setiap uang masuk atau keluar sebagai satu baris. Total debit harus sama dengan total kredit. Jika belum sama, jurnal tidak bisa diposting.</p>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fld-accountingmodule-10" className={labelClass}>Tanggal transaksi</label>
                <input id="fld-accountingmodule-10" type="date" className={inputClass} value={journalDraft.date} onChange={(e) => setJournalDraft({ ...journalDraft, date: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-11" className={labelClass}>Nomor bukti (boleh kosong)</label>
                <input id="fld-accountingmodule-11" className={inputClass} value={journalDraft.reference} onChange={(e) => setJournalDraft({ ...journalDraft, reference: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fld-accountingmodule-12" className={labelClass}>Keterangan transaksi (wajib diisi)</label>
                <input id="fld-accountingmodule-12" className={inputClass} value={journalDraft.description} onChange={(e) => setJournalDraft({ ...journalDraft, description: e.target.value })} placeholder="Contoh: Penjualan tunai ke pelanggan" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fld-accountingmodule-13" className={labelClass}>Lampiran bukti (nama file)</label>
                <input id="fld-accountingmodule-13" className={inputClass} value={journalDraft.attachmentName} onChange={(e) => setJournalDraft({ ...journalDraft, attachmentName: e.target.value })} placeholder="Nama file lampiran" />
                <label htmlFor="fld-accountingmodule-lampiran-file" className="mt-4 block t-label">Pilih file lampiran (foto atau PDF, maks. 300 KB)</label>
                <input
                  id="fld-accountingmodule-lampiran-file"
                  type="file"
                  accept="image/*,application/pdf"
                  className="mt-2 block w-full rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 t-body transition-colors duration-200 hover:border-amber-300 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-700 file:px-4 file:py-2 file:font-bold file:text-white"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 300 * 1024) return showMessage('error', 'Lampiran terlalu besar. Maksimal 300 KB agar tetap tersimpan di perangkat.');
                    const reader = new FileReader();
                    reader.onload = () => {
                      setPendingAttachment(String(reader.result));
                      setJournalDraft((prev) => ({ ...prev, attachmentName: file.name }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <p className="t-body font-extrabold text-sky-900">Arti debit dan kredit</p>
              <p className="mt-1 t-body">
                <strong>Debit (bertambah di sisi kiri)</strong> dan <strong>kredit (bertambah di sisi kanan)</strong>. Setiap baris hanya boleh berisi debit atau kredit, tidak keduanya.
              </p>
            </div>

            <h4 className="mt-6 t-card">Baris transaksi</h4>
            <div className="mt-3 space-y-4">
              {journalDraft.lines.map((line, index) => (
                <div key={index} className="rounded-2xl border-2 border-slate-200 bg-white p-4 transition-colors duration-200 hover:border-amber-300">
                  <div className="flex items-center justify-between gap-2">
                    <p className="t-body font-extrabold text-slate-900">Baris {index + 1}</p>
                    <button type="button" className={btnDanger} onClick={() => setJournalDraft({ ...journalDraft, lines: journalDraft.lines.filter((_, i) => i !== index) })}>Hapus baris</button>
                  </div>
                  <div className="mt-3">
                    <label htmlFor={`fld-accountingmodule-line-${index}-akun`} className={labelClass}>Akun (nomor dan nama)</label>
                    <select
                      id={`fld-accountingmodule-line-${index}-akun`}
                      className={inputClass}
                      value={line.accountCode}
                      onChange={(e) => {
                        const next = [...journalDraft.lines];
                        next[index] = { ...line, accountCode: e.target.value };
                        setJournalDraft({ ...journalDraft, lines: next });
                      }}
                    >
                      <option value="">Pilih akun</option>
                      {accounts.filter((a) => a.active || a.code === line.accountCode).map((a) => (
                        <option key={a.code} value={a.code}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                    <p className={`mt-1 ${hintClass}`}>Nama akun: {accountByCode.get(line.accountCode)?.name ?? '-'}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`fld-accountingmodule-line-${index}-debit`} className={labelClass}>Debit (Rp)</label>
                      <input
                        id={`fld-accountingmodule-line-${index}-debit`}
                        type="text"
                        inputMode="numeric"
                        className={`${inputClass} text-right`}
                        value={formatIdNumber(line.debit || '')}
                        onChange={(e) => {
                          const next = [...journalDraft.lines];
                          next[index] = { ...line, debit: parseIdNumber(e.target.value) };
                          setJournalDraft({ ...journalDraft, lines: next });
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor={`fld-accountingmodule-line-${index}-kredit`} className={labelClass}>Kredit (Rp)</label>
                      <input
                        id={`fld-accountingmodule-line-${index}-kredit`}
                        type="text"
                        inputMode="numeric"
                        className={`${inputClass} text-right`}
                        value={formatIdNumber(line.credit || '')}
                        onChange={(e) => {
                          const next = [...journalDraft.lines];
                          next[index] = { ...line, credit: parseIdNumber(e.target.value) };
                          setJournalDraft({ ...journalDraft, lines: next });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`module-enter mt-6 rounded-3xl border-2 p-5 ${draftBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="t-label">Total debit</p>
                  <p className="t-section">{formatRupiah(draftTotals.debit)}</p>
                </div>
                <div>
                  <p className="t-label">Total kredit</p>
                  <p className="t-section">{formatRupiah(draftTotals.credit)}</p>
                </div>
              </div>
              <p className={`mt-4 flex items-start gap-2 t-card ${draftBalanced ? 'text-emerald-900' : 'text-rose-900'}`}>
                <Icon name={draftBalanced ? 'checkCircle' : 'warn'} className="mt-1 h-6 w-6" />
                <span>{draftBalanced ? 'Seimbang, siap diposting.' : `Belum seimbang. Selisih ${formatRupiah(Math.abs(draftTotals.debit - draftTotals.credit))}.`}</span>
              </p>
              <p className={`mt-2 ${hintClass}`}>Total debit harus sama dengan total kredit.</p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" className={btnSecondary} onClick={() => setJournalDraft({ ...journalDraft, lines: [...journalDraft.lines, { accountCode: '', debit: 0, credit: 0 }] })}>Tambah baris</button>
              <button type="button" className={btnSoft} onClick={() => saveJournal('DRAFT')}>Simpan draf</button>
              <button type="button" disabled={!draftBalanced} className={btnPrimary} onClick={() => saveJournal('POSTED')}>Posting jurnal</button>
              {editingJournal && <button type="button" className={btnSecondary} onClick={resetJournalForm}>Batal edit</button>}
            </div>
            <p className={`mt-3 ${hintClass}`}>Simpan draf: disimpan tanpa diposting dan bisa diedit nanti. Posting: jurnal disahkan dan masuk ke laporan.</p>
            {formError && (
              <p role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-3 t-body font-bold text-rose-900">
                <Icon name="warn" className="mt-0.5 h-6 w-6" />
                <span>{formError}</span>
              </p>
            )}
          </div>

          <details className={`${cardClass} group`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 t-card">
              Isian tambahan (opsional): buat draf dari kalkulator pajak
              <Icon name="chevron" className="h-6 w-6 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="mt-5 space-y-6">
              <div>
                <h4 className="t-body font-extrabold text-slate-900">Draf otomatis dari kalkulator</h4>
                <p className={`mt-1 ${hintClass}`}>Draf dibuat dengan nomor baru dan belum diposting. Satu masa pajak hanya bisa punya satu jurnal aktif, agar tidak dobel.</p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="fld-accountingmodule-6" className={labelClass}>Nomor bukti (boleh kosong)</label>
                    <input id="fld-accountingmodule-6" className={inputClass} value={autoRef} onChange={(e) => setAutoRef(e.target.value)} placeholder="Boleh dikosongkan" />
                  </div>
                  <div className="grid grid-cols-1 items-end gap-3 sm:col-span-2 sm:grid-cols-2">
                    <button type="button" className={btnSoft} onClick={() => createAutoDraft('PPH_21')}>Draf jurnal PPh 21 (pajak karyawan)</button>
                    <button type="button" className={btnSoft} onClick={() => createAutoDraft('PPN')}>Draf jurnal PPN (pajak pertambahan nilai)</button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h4 className="t-body font-extrabold text-slate-900">Draf jurnal pajak jenis lain</h4>
                <p className={`mt-1 ${hintClass}`}>Pilih jenis pajak, lalu posisi kita terhadap pajak itu.</p>

                <p className="mt-5 t-label">1. Jenis pajak</p>
                <div role="radiogroup" aria-label="Jenis pajak" className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(Object.keys(TAX_DRAFT_LABEL) as TaxDraftType[]).map((t) => {
                    const active = taxReq.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTaxReq({ ...taxReq, type: t })}
                        className={`${choiceBase} ${active ? choiceActive : choiceIdle}`}
                      >
                        <span className="block t-body font-extrabold text-slate-900">{TAX_DRAFT_LABEL[t]}</span>
                        <span className={`mt-1 block ${hintClass}`}>{TAX_DRAFT_HINT[t]}</span>
                        <ChoiceMark active={active} />
                      </button>
                    );
                  })}
                </div>

                <p className="mt-6 t-label">2. Posisi kita terhadap pajak ini</p>
                <div role="radiogroup" aria-label="Posisi kita terhadap pajak" className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {(Object.keys(POSISI_LABEL) as TaxPosisi[]).map((p) => {
                    const active = taxReq.posisi === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTaxReq({ ...taxReq, posisi: p })}
                        className={`${choiceBase} ${active ? choiceActive : choiceIdle}`}
                      >
                        <span className={`block t-note font-bold uppercase tracking-wider ${active ? 'text-amber-800' : 'text-slate-600'}`}>{POSISI_HINT[p].kode}</span>
                        <span className="mt-1 block t-body font-extrabold text-slate-900">{POSISI_LABEL[p]}</span>
                        <span className={`mt-1 block ${hintClass}`}>{POSISI_HINT[p].contoh}</span>
                        <ChoiceMark active={active} />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="fld-accountingmodule-7" className={labelClass}>Penghasilan kotor (bruto / DPP), Rp</label>
                    <input id="fld-accountingmodule-7" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(taxReq.gross || '')} onChange={(e) => setTaxReq({ ...taxReq, gross: parseIdNumber(e.target.value) })} />
                  </div>
                  <div>
                    <label htmlFor="fld-accountingmodule-8" className={labelClass}>Pajak (Rp)</label>
                    <input id="fld-accountingmodule-8" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(taxReq.tax || '')} onChange={(e) => setTaxReq({ ...taxReq, tax: parseIdNumber(e.target.value) })} />
                  </div>
                  <div>
                    <label htmlFor="fld-accountingmodule-9" className={labelClass}>Nomor bukti</label>
                    <input id="fld-accountingmodule-9" className={inputClass} value={taxReq.reference} onChange={(e) => setTaxReq({ ...taxReq, reference: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button type="button" className={btnSoft} onClick={createGeneralDraft}>Buat draf jurnal pajak</button>
                  <span className={hintClass}>Masa pajak {taxPeriodLabel}. Satu jenis, posisi, dan masa hanya bisa punya satu jurnal aktif.</span>
                </div>
              </div>
            </div>
          </details>

          <div className={cardClass}>
            <h3 className="t-card">Daftar jurnal</h3>
            <p className={`mt-1 ${hintClass}`}>Jurnal yang sudah diposting tidak diubah langsung. Revisi: jurnal lama dibalik, lalu dibuka sebagai draf baru. Pembalikan: dibuat jurnal kebalikan.</p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 print:hidden">
              <div className="sm:col-span-2">
                <label htmlFor="fld-accountingmodule-filter-teks" className={labelClass}>Cari keterangan atau nomor</label>
                <input id="fld-accountingmodule-filter-teks" className={inputClass} value={filterText} onChange={(e) => setFilterText(e.target.value)} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-filter-bulan" className={labelClass}>Pilih bulan (boleh kosong)</label>
                <input id="fld-accountingmodule-filter-bulan" type="month" className={inputClass} value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 print:hidden">
              <button type="button" className={btnSoft} onClick={() => downloadCsv('jurnal-umum-atlax.csv', [
                ['Nomor', 'Tanggal', 'Nomor bukti', 'Keterangan', 'Kode akun', 'Nama akun', 'Debit', 'Kredit', 'Status', 'Lampiran'],
                ...filteredJournals.flatMap((j) => j.lines.map((l) => [j.number, j.date, j.reference, j.description, l.accountCode, accountByCode.get(l.accountCode)?.name ?? '', l.debit, l.credit, j.status, j.attachmentName])),
              ])}>Ekspor Excel</button>
              <button type="button" className={btnSecondary} onClick={() => printArea()}>Cetak / PDF</button>
            </div>

            <div className="print-area mt-5">
              <PrintTitle title="Jurnal Umum" subtitle={`Periode: ${filterPeriod || 'seluruh periode'} | Dicetak: ${todayIso()}`} />
              <div className="space-y-4 print:hidden">
                {filteredJournals.map((j) => {
                  const totals = entryTotals(j.lines);
                  return (
                    <div key={j.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-amber-300 hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="t-card break-words">{j.description}</p>
                          <p className={hintClass}>Nomor {j.number} · {j.date}</p>
                        </div>
                        <StatusBadge status={j.status} />
                      </div>
                      {j.reference && <p className="mt-3 t-body">Bukti: {j.reference}</p>}
                      {j.attachmentName && (
                        <p className="mt-1 t-body">
                          Lampiran: {j.attachmentData ? <a className="font-bold text-amber-900 underline underline-offset-4" href={j.attachmentData} download={j.attachmentName}>{j.attachmentName}</a> : j.attachmentName}
                        </p>
                      )}
                      <ul className="mt-3 space-y-1 rounded-2xl bg-slate-50 p-4 t-body text-slate-900">
                        {j.lines.map((l, i) => (
                          <li key={i}>{l.accountCode} {accountByCode.get(l.accountCode)?.name ?? ''}: Debit {formatRupiah(l.debit)} / Kredit {formatRupiah(l.credit)}</li>
                        ))}
                      </ul>
                      <p className="mt-3 t-body font-bold text-slate-900">Total debit {formatRupiah(totals.debit)} · Total kredit {formatRupiah(totals.credit)}</p>
                      <div className="mt-4 flex flex-wrap gap-3 print:hidden">
                        {j.status === 'DRAFT' && (
                          <>
                            <button type="button" className={btnSoft} onClick={() => editDraft(j)}>Edit</button>
                            <button type="button" className={btnSuccess} onClick={() => postDraft(j)}>Posting</button>
                            <button type="button" className={btnDanger} onClick={() => deleteDraft(j)}>Hapus</button>
                          </>
                        )}
                        {j.status === 'POSTED' && (
                          <>
                            <button type="button" className={btnSecondary} onClick={() => reviseJournal(j)}>Revisi</button>
                            <button type="button" className={btnSecondary} onClick={() => reverseJournal(j)}>Pembalikan</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredJournals.length === 0 && (
                  <p className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center t-body">Belum ada jurnal untuk filter ini.</p>
                )}
              </div>
              {/* Tabel cetak: satu baris per akun di setiap jurnal */}
              <table className="hidden print:table w-full border-collapse text-sm text-black">
                <thead>
                  <tr className="bg-slate-200">
                    <th className="border border-slate-600 p-1.5 text-left">Nomor</th>
                    <th className="border border-slate-600 p-1.5 text-left">Tanggal</th>
                    <th className="border border-slate-600 p-1.5 text-left">No. bukti</th>
                    <th className="border border-slate-600 p-1.5 text-left">Keterangan</th>
                    <th className="border border-slate-600 p-1.5 text-left">Kode</th>
                    <th className="border border-slate-600 p-1.5 text-left">Nama akun</th>
                    <th className="border border-slate-600 p-1.5 text-right">Debit</th>
                    <th className="border border-slate-600 p-1.5 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJournals.flatMap((j) =>
                    j.lines.map((l, i) => (
                      <tr key={`${j.id}-${i}`}>
                        <td className="border border-slate-400 p-1.5">{i === 0 ? j.number : ''}</td>
                        <td className="border border-slate-400 p-1.5">{i === 0 ? j.date : ''}</td>
                        <td className="border border-slate-400 p-1.5">{i === 0 ? j.reference : ''}</td>
                        <td className="border border-slate-400 p-1.5">{i === 0 ? j.description : ''}</td>
                        <td className="border border-slate-400 p-1.5">{l.accountCode}</td>
                        <td className="border border-slate-400 p-1.5">{accountByCode.get(l.accountCode)?.name ?? ''}</td>
                        <td className="border border-slate-400 p-1.5 text-right">{l.debit ? formatRupiah(l.debit) : ''}</td>
                        <td className="border border-slate-400 p-1.5 text-right">{l.credit ? formatRupiah(l.credit) : ''}</td>
                      </tr>
                    ))
                  )}
                  <tr className="font-bold bg-slate-100">
                    <td className="border border-slate-600 p-1.5" colSpan={6}>Total</td>
                    <td className="border border-slate-600 p-1.5 text-right">{formatRupiah(filteredJournals.reduce((s, j) => s + entryTotals(j.lines).debit, 0))}</td>
                    <td className="border border-slate-600 p-1.5 text-right">{formatRupiah(filteredJournals.reduce((s, j) => s + entryTotals(j.lines).credit, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BUKU BESAR (REKAP PER AKUN) */}
      {tab === 'BUKU_BESAR' && (
        <div className={`${cardClass} print-area module-enter`}>
          <PrintTitle title="Buku Besar" subtitle={`${accountByCode.get(ledgerAccount)?.code ?? ''} ${accountByCode.get(ledgerAccount)?.name ?? ''} | Tahun ${ledgerYear}${ledgerMonth ? ` bulan ${ledgerMonth}` : ''}`} />
          <h3 className="t-card print:hidden">Rekap transaksi per akun (buku besar)</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 print:hidden">
            <div>
              <label htmlFor="fld-accountingmodule-14" className={labelClass}>Pilih akun</label>
              <select id="fld-accountingmodule-14" className={inputClass} value={ledgerAccount} onChange={(e) => setLedgerAccount(e.target.value)}>
                {accounts.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="fld-accountingmodule-15" className={labelClass}>Tahun</label>
              <input id="fld-accountingmodule-15" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(ledgerYear)} onChange={(e) => setLedgerYear(parseIdNumber(e.target.value))} />
            </div>
            <div>
              <label htmlFor="fld-accountingmodule-16" className={labelClass}>Bulan (atau seluruh tahun)</label>
              <select id="fld-accountingmodule-16" className={inputClass} value={ledgerMonth} onChange={(e) => setLedgerMonth(Number(e.target.value))}>
                <option value={0}>Seluruh tahun</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </div>
          </div>
          {ledger && (
            <div className="mt-6">
              <p className="mb-3 t-body font-bold text-slate-900">{ledger.account.code} - {ledger.account.name} (saldo normal {ledger.account.normalBalance === 'D' ? 'debit' : 'kredit'})</p>
              <div className={tableWrapClass}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Tanggal</th>
                      <th className={thClass}>Nomor jurnal</th>
                      <th className={thClass}>Keterangan</th>
                      <th className={thRightClass}>Debit</th>
                      <th className={thRightClass}>Kredit</th>
                      <th className={thRightClass}>Saldo berjalan (sisa setelah tiap transaksi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={totalRowClass}>
                      <td className={tdClass} colSpan={5}>Saldo awal</td>
                      <td className={tdRightClass}>{formatRupiah(ledger.opening)}</td>
                    </tr>
                    {ledger.rows.map((row, i) => (
                      <tr key={i} className={rowClass}>
                        <td className={tdClass}>{row.date}</td>
                        <td className={tdClass}>{row.number}</td>
                        <td className={tdClass}>{row.description}</td>
                        <td className={tdRightClass}>{formatRupiah(row.debit)}</td>
                        <td className={tdRightClass}>{formatRupiah(row.credit)}</td>
                        <td className={tdRightClass}>{formatRupiah(row.balance)}</td>
                      </tr>
                    ))}
                    <tr className={totalRowClass}>
                      <td className={tdClass} colSpan={5}>Saldo akhir</td>
                      <td className={tdRightClass}>{formatRupiah(ledger.closing)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CEK SALDO (NERACA SALDO) */}
      {tab === 'NERACA_SALDO' && (
        <div className={`${cardClass} print-area module-enter`}>
          <PrintTitle title="Neraca Saldo" subtitle={`Seluruh jurnal yang diposting | Dicetak: ${todayIso()}`} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <h3 className="t-card">Cek saldo (neraca saldo)</h3>
            <button type="button" className={btnSoft} onClick={() => downloadCsv('neraca-saldo-atlax.csv', [
              ['Kode akun', 'Nama akun', 'Debit', 'Kredit'],
              ...tb.rows.map((r) => [r.code, r.name, r.debit, r.credit]),
              ['', 'Total', tb.totalDebit, tb.totalCredit],
            ])}>Ekspor Excel</button>
          </div>
          <div className={`module-enter mt-4 flex items-start gap-3 rounded-2xl border-2 px-5 py-4 t-body font-bold ${tb.balanced ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
            <Icon name={tb.balanced ? 'checkCircle' : 'warn'} className="mt-0.5 h-6 w-6" />
            <span>{tb.balanced ? 'Seimbang: total debit sama dengan total kredit.' : `Belum seimbang: ada selisih ${formatRupiah(Math.abs(tb.totalDebit - tb.totalCredit))} antara debit dan kredit. Periksa jurnal.`}</span>
          </div>
          <div className={tableWrapClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Kode akun</th>
                  <th className={thClass}>Nama akun</th>
                  <th className={thRightClass}>Saldo debit</th>
                  <th className={thRightClass}>Saldo kredit</th>
                </tr>
              </thead>
              <tbody>
                {tb.rows.map((r) => (
                  <tr key={r.code} className={rowClass}>
                    <td className={tdClass}>{r.code}</td>
                    <td className={tdClass}>{r.name}</td>
                    <td className={tdRightClass}>{formatRupiah(r.debit)}</td>
                    <td className={tdRightClass}>{formatRupiah(r.credit)}</td>
                  </tr>
                ))}
                {tb.rows.length === 0 && <tr><td colSpan={4} className={`${tdClass} text-center`}>Belum ada saldo. Posting jurnal dulu.</td></tr>}
                <tr className={totalRowClass}>
                  <td className={tdClass} colSpan={2}>Total</td>
                  <td className={tdRightClass}>{formatRupiah(tb.totalDebit)}</td>
                  <td className={tdRightClass}>{formatRupiah(tb.totalCredit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LAPORAN KEUANGAN */}
      {tab === 'LAPORAN' && (
        <div className="module-enter space-y-5">
          <div className="flex justify-end print:hidden">
            <button type="button" className={btnSecondary} onClick={() => printArea()}>Cetak / PDF</button>
          </div>
          <div className="print-area space-y-5">
            <PrintTitle title="Laporan Keuangan" subtitle={`Posisi per ${todayIso()} | Dari seluruh jurnal yang diposting`} />
            <div className="card border-2 border-amber-300 ">
              <p className="t-card">Untung atau rugi bersih</p>
              <p className={`mt-2 t-result ${toneText(labaBersih)}`}>{formatRupiah(labaBersih)}</p>
              <p className="mt-3 t-body">
                {labaBersih > 0 ? 'Usaha Anda untung dari seluruh jurnal yang diposting.' : labaBersih < 0 ? 'Usaha Anda rugi dari seluruh jurnal yang diposting.' : 'Belum ada untung atau rugi dari jurnal yang diposting.'}
              </p>
            </div>

            <div className={cardClass}>
              <h3 className="t-card">Neraca (laporan posisi keuangan): harta, utang, dan modal</h3>
              <p className={`mt-1 ${hintClass}`}>Per tanggal laporan, dari seluruh jurnal yang diposting.</p>
              {(['ASET', 'LIABILITAS', 'EKUITAS'] as AccountGroup[]).map((group) => (
                <div key={group} className="mt-5">
                  <p className="mb-2 t-label uppercase text-amber-900">{GROUP_LABEL[group]}</p>
                  <div className={tableWrapClass}>
                    <table className={tableClass}>
                      <tbody>
                        {accounts.filter((a) => a.group === group).map((a) => (
                          <tr key={a.code} className={rowClass}>
                            <td className={tdClass}>{a.code} {a.name}</td>
                            <td className={tdRightClass}>{formatRupiah(balances.get(a.code) || 0)}</td>
                          </tr>
                        ))}
                        {group === 'EKUITAS' && (
                          <tr className={rowClass}>
                            <td className={`${tdClass} italic`}>Laba / rugi tahun berjalan</td>
                            <td className={tdRightClass}>{formatRupiah(labaBersih)}</td>
                          </tr>
                        )}
                        <tr className={totalRowClass}>
                          <td className={tdClass}>Total {GROUP_LABEL[group]}</td>
                          <td className={tdRightClass}>
                            {formatRupiah(group === 'EKUITAS' ? totalEkuitas : group === 'ASET' ? totalAset : totalLiabilitas)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <p className={`mt-5 flex items-start gap-2 t-body font-bold ${neracaSeimbang ? 'text-emerald-800' : 'text-rose-800'}`}>
                <Icon name={neracaSeimbang ? 'checkCircle' : 'warn'} className="mt-0.5 h-5 w-5" />
                <span>{neracaSeimbang ? 'Aset = liabilitas + ekuitas (harta sama dengan utang ditambah modal).' : 'Aset tidak sama dengan liabilitas + ekuitas. Periksa jurnal.'}</span>
              </p>
            </div>

            <div className={cardClass}>
              <h3 className="t-card">Laba rugi: untung atau rugi usaha</h3>
              <div className={tableWrapClass}>
                <table className={tableClass}>
                  <tbody>
                    {accounts.filter((a) => a.group === 'PENDAPATAN').map((a) => (
                      <tr key={a.code} className={rowClass}><td className={tdClass}>{a.name}</td><td className={tdRightClass}>{formatRupiah(balances.get(a.code) || 0)}</td></tr>
                    ))}
                    <tr className="font-bold bg-slate-50"><td className={tdClass}>Total pendapatan</td><td className={tdRightClass}>{formatRupiah(totalPendapatan)}</td></tr>
                    {accounts.filter((a) => a.group === 'BEBAN').map((a) => (
                      <tr key={a.code} className={rowClass}><td className={tdClass}>{a.name}</td><td className={tdRightClass}>({formatRupiah(balances.get(a.code) || 0)})</td></tr>
                    ))}
                    <tr className="font-bold bg-slate-50"><td className={tdClass}>Total beban</td><td className={tdRightClass}>({formatRupiah(totalBeban)})</td></tr>
                    <tr className={totalRowClass}><td className={tdClass}>Laba / rugi bersih</td><td className={`${tdRightClass} ${toneText(labaBersih)}`}>{formatRupiah(labaBersih)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {(() => {
              const eq = equityStatement(accounts, journals, currentYear);
              const cf = cashFlow(accounts, journals, currentYear);
              const calk = calkParagraphs({
                tahun: currentYear,
                totalAset,
                totalLiabilitas,
                totalEkuitas,
                pendapatan: totalPendapatan,
                beban: totalBeban,
                utangPajak,
              });
              return (
                <>
                  <div className={cardClass}>
                    <h3 className="t-card">Perubahan modal {currentYear} (laporan perubahan ekuitas)</h3>
                    <div className={tableWrapClass}>
                      <table className={tableClass}>
                        <tbody>
                          <tr className={rowClass}><td className={tdClass}>Modal awal</td><td className={tdRightClass}>{formatRupiah(eq.modalAwal)}</td></tr>
                          <tr className={rowClass}><td className={tdClass}>Setoran modal tambahan</td><td className={tdRightClass}>{formatRupiah(eq.setoran)}</td></tr>
                          <tr className={rowClass}><td className={tdClass}>Laba atau rugi tahun berjalan</td><td className={tdRightClass}>{formatRupiah(eq.labaTahunBerjalan)}</td></tr>
                          <tr className={rowClass}><td className={tdClass}>Prive (pengambilan pemilik)</td><td className={tdRightClass}>({formatRupiah(eq.pengambilan)})</td></tr>
                          <tr className={totalRowClass}><td className={tdClass}>Saldo ekuitas akhir</td><td className={tdRightClass}>{formatRupiah(eq.saldoAkhir)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h3 className="t-card">Arus kas {currentYear}: uang masuk dan keluar (metode langsung)</h3>
                    <p className={`mt-1 ${hintClass}`}>Diambil dari jurnal yang menyentuh kas. Kategori ditentukan dari akun lawannya.</p>
                    <div className={tableWrapClass}>
                      <table className={tableClass}>
                        <thead>
                          <tr>
                            <th className={thClass}>Kelompok</th>
                            <th className={thRightClass}>Kas masuk</th>
                            <th className={thRightClass}>Kas keluar</th>
                            <th className={thRightClass}>Arus bersih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(['operasi', 'investasi', 'pendanaan'] as const).map((k) => (
                            <tr key={k} className={rowClass}>
                              <td className={`${tdClass} capitalize`}>Aktivitas {k}</td>
                              <td className={tdRightClass}>{formatRupiah(cf[k].masuk)}</td>
                              <td className={tdRightClass}>{formatRupiah(cf[k].keluar)}</td>
                              <td className={`${tdRightClass} font-bold`}>{formatRupiah(cf[k].masuk - cf[k].keluar)}</td>
                            </tr>
                          ))}
                          <tr className={totalRowClass}><td className={tdClass}>Kenaikan atau penurunan kas</td><td className={tdClass} colSpan={2} /><td className={tdRightClass}>{formatRupiah(cf.operasi.masuk - cf.operasi.keluar + cf.investasi.masuk - cf.investasi.keluar + cf.pendanaan.masuk - cf.pendanaan.keluar)}</td></tr>
                          <tr className={rowClass}><td className={tdClass}>Saldo kas awal</td><td className={tdClass} colSpan={2} /><td className={tdRightClass}>{formatRupiah(cf.kasAwal)}</td></tr>
                          <tr className={rowClass}><td className={tdClass}>Saldo kas akhir</td><td className={tdClass} colSpan={2} /><td className={`${tdRightClass} font-bold`}>{formatRupiah(cf.kasAkhir)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h3 className="t-card">Catatan atas laporan keuangan (CALK)</h3>
                    <div className="mt-4 space-y-4">
                      {calk.map((p) => (
                        <div key={p.judul} className={innerBoxClass}>
                          <p className="t-body font-bold text-slate-900">{p.judul}</p>
                          <p className="mt-1 t-body">{p.isi}</p>
                        </div>
                      ))}
                    </div>
                    <label htmlFor="fld-accountingmodule-17" className="mt-5 mb-2 block t-label print:hidden">Catatan tambahan (ditulis sendiri)</label>
                    <textarea id="fld-accountingmodule-17" className="field h-auto min-h-[5rem] py-2.5 print:hidden" rows={3} placeholder="Tambahkan kebijakan akuntansi atau catatan lain" />
                  </div>
                </>
              );
            })()}

            <div className="card border-amber-200 bg-amber-50">
              <p className="mb-2 t-body font-extrabold text-slate-900">Catatan penting</p>
              <ul className="list-disc list-inside space-y-1 t-body">
                <li>Neraca saldo setelah penyesuaian sama dengan Neraca Saldo, karena jurnal penyesuaian sudah ikut diposting.</li>
                <li>Angka arus kas dan CALK dihitung dari jurnal. Periksa dulu sebelum dipakai untuk pelaporan.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* KOREKSI AKHIR PERIODE (PENYESUAIAN dan PENYUSUTAN) */}
      {tab === 'PENYESUAIAN' && (
        <div className="module-enter space-y-5">
          <div className={cardClass}>
            <h3 className="t-card">Penyusutan aset tetap (hitung otomatis)</h3>
            <p className={`mt-1 ${hintClass}`}>Penyusutan adalah pengurangan nilai aset karena dipakai, dihitung sedikit demi sedikit tiap bulan atau tahun.</p>
            <details className="mt-4 rounded-2xl bg-amber-50 p-4">
              <summary className="cursor-pointer t-body font-bold text-amber-900 underline underline-offset-4">Lihat penjelasan penyusutan komersial dan fiskal</summary>
              <p className="mt-3 t-body">
                Penyusutan komersial masuk pembukuan. Selisihnya dengan penyusutan fiskal dicatat sebagai koreksi fiskal, bukan di pembukuan. Masa pakai fiskal diisi sesuai ketentuan pajak yang berlaku.
              </p>
            </details>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="fld-accountingmodule-18" className={labelClass}>Nama aset</label>
                <input id="fld-accountingmodule-18" className={inputClass} value={asset.nama} onChange={(e) => setAsset({ ...asset, nama: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-19" className={labelClass}>Harga beli / perolehan (Rp)</label>
                <input id="fld-accountingmodule-19" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(asset.cost || '')} onChange={(e) => setAsset({ ...asset, cost: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-20" className={labelClass}>Nilai sisa, perkiraan harga jual akhir (Rp)</label>
                <input id="fld-accountingmodule-20" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(asset.residual || '')} onChange={(e) => setAsset({ ...asset, residual: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-21" className={labelClass}>Masa pakai komersial, untuk pembukuan (tahun)</label>
                <input id="fld-accountingmodule-21" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(asset.lifeKom)} onChange={(e) => setAsset({ ...asset, lifeKom: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-22" className={labelClass}>Masa pakai fiskal, menurut pajak (tahun)</label>
                <input id="fld-accountingmodule-22" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(asset.lifeFiskal)} onChange={(e) => setAsset({ ...asset, lifeFiskal: parseIdNumber(e.target.value) })} />
              </div>
            </div>

            <div className="module-enter mt-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5">
              <p className="t-body font-bold text-slate-900">Penyusutan komersial per bulan</p>
              <p className="mt-1 t-result">{formatRupiah(assetCalc.komersialBulanan)}</p>
              <p className={`mt-2 ${hintClass}`}>Angka ini dipakai untuk membuat draf jurnal penyusutan bulan ini.</p>
            </div>

            <div className={tableWrapClass}>
              <table className={tableClass}>
                <tbody>
                  <tr className={rowClass}><td className={tdClass}>Penyusutan komersial per tahun</td><td className={`${tdRightClass} font-bold`}>{formatRupiah(assetCalc.komersialTahunan)}</td></tr>
                  <tr className={rowClass}><td className={tdClass}>Penyusutan fiskal per tahun</td><td className={`${tdRightClass} font-bold`}>{formatRupiah(assetCalc.fiskalTahunan)}</td></tr>
                  <tr className={rowClass}><td className={tdClass}>Selisih koreksi fiskal per tahun (bukan jurnal)</td><td className={`${tdRightClass} font-bold`}>{formatRupiah(assetCalc.selisihKoreksiFiskalTahunan)}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 items-end gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="fld-accountingmodule-23" className={labelClass}>Tanggal jurnal</label>
                <input id="fld-accountingmodule-23" type="date" className={inputClass} value={adjDate} onChange={(e) => setAdjDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-24" className={labelClass}>Periode (bulan dan tahun)</label>
                <input id="fld-accountingmodule-24" type="month" className={inputClass} value={adjPeriod} onChange={(e) => setAdjPeriod(e.target.value)} />
              </div>
              <button type="button" className={btnPrimary} onClick={() => createAdjusting('PENYUSUTAN', assetCalc.komersialBulanan, asset.nama || 'aset')}>
                Buat draf penyusutan bulan ini
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="t-card">Koreksi atau penyesuaian lainnya</h3>
            <p className={`mt-1 ${hintClass}`}>Pilih jenis koreksi, isi nominal, lalu buat draf.</p>
            <details className="mt-4 rounded-2xl bg-amber-50 p-4">
              <summary className="cursor-pointer t-body font-bold text-amber-900 underline underline-offset-4">Lihat cara melakukan koreksi jurnal</summary>
              <p className="mt-3 t-body">
                Buat jurnal pembalik untuk jurnal yang salah di menu Catat transaksi, lalu buat jurnal yang benar.
              </p>
            </details>
            <div className="mt-5 grid grid-cols-1 items-end gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="fld-accountingmodule-25" className={labelClass}>Jenis penyesuaian</label>
                <select id="fld-accountingmodule-25" className={inputClass} value={adjKind} onChange={(e) => setAdjKind(e.target.value as AdjustingKind)}>
                  {(Object.keys(ADJUSTING_LABEL) as AdjustingKind[]).filter((k) => k !== 'PENYUSUTAN').map((k) => <option key={k} value={k}>{ADJUSTING_LABEL[k]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-26" className={labelClass}>Nominal (Rp)</label>
                <input id="fld-accountingmodule-26" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(adjAmount || '')} onChange={(e) => setAdjAmount(parseIdNumber(e.target.value))} />
              </div>
              <div>
                <label htmlFor="fld-accountingmodule-27" className={labelClass}>Catatan pembeda (boleh kosong)</label>
                <input id="fld-accountingmodule-27" className={inputClass} value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="Misalnya nama sewa atau pelanggan" />
              </div>
              <button type="button" className={btnSoft} onClick={() => createAdjusting(adjKind, adjAmount, adjNote)}>Buat draf penyesuaian</button>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="t-card">Daftar jurnal penyesuaian</h3>
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Nomor</th>
                    <th className={thClass}>Tanggal</th>
                    <th className={thClass}>Keterangan</th>
                    <th className={thRightClass}>Nilai</th>
                    <th className={thClass}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.filter((j) => j.jenis === 'PENYESUAIAN').sort((a, b) => (a.date < b.date ? 1 : -1)).map((j) => (
                    <tr key={j.id} className={rowClass}>
                      <td className={`${tdClass} font-bold`}>{j.number}</td><td className={tdClass}>{j.date}</td><td className={tdClass}>{j.description}</td>
                      <td className={tdRightClass}>{formatRupiah(entryTotals(j.lines).debit)}</td>
                      <td className={tdClass}><StatusBadge status={j.status} /></td>
                    </tr>
                  ))}
                  {journals.filter((j) => j.jenis === 'PENYESUAIAN').length === 0 && <tr><td colSpan={5} className={`${tdClass} text-center`}>Belum ada jurnal penyesuaian.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className={`mt-3 ${hintClass}`}>Posting draf penyesuaian di menu Catat transaksi, pada bagian Daftar jurnal (tombol Posting).</p>
          </div>
        </div>
      )}

      {/* RINCIAN PER PIHAK (BUKU PEMBANTU) */}
      {tab === 'PEMBANTU' && (() => {
        const account = accountByCode.get(pembantuAccount);
        const sub = account ? subsidiaryLedger(account, journals) : null;
        return (
          <div className={`${cardClass} module-enter`}>
            <h3 className="t-card">Rincian per pihak (buku pembantu)</h3>
            <p className={`mt-1 ${hintClass}`}>Pilih akun piutang, utang, atau barang. Pihak terkait diambil dari nomor bukti dan keterangan jurnal.</p>
            <div className="mt-5 grid grid-cols-1 items-end gap-5 sm:grid-cols-2 print:hidden">
              <div>
                <label htmlFor="fld-accountingmodule-28" className={labelClass}>Pilih akun</label>
                <select id="fld-accountingmodule-28" className={inputClass} value={pembantuAccount} onChange={(e) => setPembantuAccount(e.target.value)}>
                  {PEMBANTU_CODES.map((c) => <option key={c} value={c}>{c} - {accountByCode.get(c)?.name}</option>)}
                </select>
              </div>
              <div>
                <button type="button" className={btnSoft} onClick={() => account && sub && downloadCsv(`buku-pembantu-${account.code}.csv`, [
                  ['Tanggal', 'Nomor', 'Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo'],
                  ...sub.rows.map((r) => [r.tanggal, r.nomor, r.referensi, r.keterangan, r.debit, r.kredit, r.saldo]),
                ])}>Ekspor Excel</button>
              </div>
            </div>
            {account && sub && (
              <>
                <p className="mt-6 t-body font-bold text-slate-900">
                  {account.code} {account.name} | Saldo akhir {formatRupiah(sub.saldoAkhir)} | Status: {sub.status}
                </p>
                <div className={tableWrapClass}>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={thClass}>Tanggal</th><th className={thClass}>Nomor jurnal</th>
                        <th className={thClass}>Referensi (pihak / bukti)</th><th className={thClass}>Keterangan</th>
                        <th className={thRightClass}>Debit</th><th className={thRightClass}>Kredit</th><th className={thRightClass}>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sub.rows.map((r, i) => (
                        <tr key={i} className={rowClass}>
                          <td className={tdClass}>{r.tanggal}</td><td className={tdClass}>{r.nomor}</td>
                          <td className={tdClass}>{r.referensi}</td><td className={tdClass}>{r.keterangan}</td>
                          <td className={tdRightClass}>{formatRupiah(r.debit)}</td><td className={tdRightClass}>{formatRupiah(r.kredit)}</td>
                          <td className={tdRightClass}>{formatRupiah(r.saldo)}</td>
                        </tr>
                      ))}
                      {sub.rows.length === 0 && <tr><td colSpan={7} className={`${tdClass} text-center`}>Belum ada transaksi pada akun ini.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* CATATAN PAJAK (BUKU BESAR PAJAK) */}
      {tab === 'PAJAK' && (
        <div className={`${cardClass} print-area module-enter`}>
          <PrintTitle title="Buku Besar Pajak" subtitle={`Tahun ${taxYearFilter}${taxMonthFilter ? ` bulan ${taxMonthFilter}` : ''} | Dicetak: ${todayIso()}`} />
          <h3 className="t-card print:hidden">Catatan pajak (buku besar pajak)</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 print:hidden">
            <div>
              <label htmlFor="fld-accountingmodule-29" className={labelClass}>Jenis pajak</label>
              <select id="fld-accountingmodule-29" className={inputClass} value={taxAccountFilter} onChange={(e) => setTaxAccountFilter(e.target.value)}>
                <option value="">Semua pajak</option>
                {TAX_CODES.map((c) => <option key={c} value={c}>{c} - {accountByCode.get(c)?.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="fld-accountingmodule-30" className={labelClass}>Tahun</label>
              <input id="fld-accountingmodule-30" type="number" className={inputClass} value={taxYearFilter} onChange={(e) => setTaxYearFilter(Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="fld-accountingmodule-31" className={labelClass}>Bulan (atau seluruh tahun)</label>
              <select id="fld-accountingmodule-31" className={inputClass} value={taxMonthFilter} onChange={(e) => setTaxMonthFilter(Number(e.target.value))}>
                <option value={0}>Seluruh tahun</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </div>
          </div>

          <h4 className="mt-6 t-card">Saldo dan mutasi per jenis pajak</h4>
          <div className={tableWrapClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Jenis pajak</th>
                  <th className={thRightClass}>Saldo awal</th>
                  <th className={thRightClass}>Mutasi debit</th>
                  <th className={thRightClass}>Mutasi kredit</th>
                  <th className={thRightClass}>Saldo akhir</th>
                  <th className={thClass}>Keterangan posisi</th>
                </tr>
              </thead>
              <tbody>
                {taxLedger.summary.map((s) => {
                  const isLiability = s.account.normalBalance === 'K';
                  const posisi = isLiability
                    ? s.closing > 0 ? 'Kurang bayar (utang pajak)' : s.closing < 0 ? 'Lebih bayar' : 'Nihil'
                    : s.closing > 0 ? 'Kredit pajak tersedia' : s.closing < 0 ? 'Perlu dicek' : 'Nihil';
                  const posisiChip = isLiability
                    ? s.closing > 0 ? 'chip-warn' : s.closing < 0 ? 'chip-ok' : 'chip-neutral'
                    : s.closing > 0 ? 'chip-ok' : s.closing < 0 ? 'chip-bad' : 'chip-neutral';
                  return (
                    <tr key={s.account.code} className={rowClass}>
                      <td className={tdClass}>{s.account.code} {s.account.name}</td>
                      <td className={tdRightClass}>{formatRupiah(s.opening)}</td>
                      <td className={tdRightClass}>{formatRupiah(s.debit)}</td>
                      <td className={tdRightClass}>{formatRupiah(s.credit)}</td>
                      <td className={`${tdRightClass} font-bold`}>{formatRupiah(s.closing)}</td>
                      <td className={tdClass}><span className={posisiChip}>{posisi}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 className="mt-6 t-card">Rincian transaksi pajak</h4>
          <div className={tableWrapClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Tanggal</th>
                  <th className={thClass}>Nomor jurnal</th>
                  <th className={thClass}>Referensi</th>
                  <th className={thClass}>Jenis pajak</th>
                  <th className={thClass}>Masa</th>
                  <th className={thClass}>Keterangan</th>
                  <th className={thRightClass}>Debit</th>
                  <th className={thRightClass}>Kredit</th>
                </tr>
              </thead>
              <tbody>
                {taxLedger.details.map(({ j, l }, i) => (
                  <tr key={`${j.id}-${i}`} className={rowClass}>
                    <td className={tdClass}>{j.date}</td>
                    <td className={tdClass}>{j.number}</td>
                    <td className={tdClass}>{j.reference || '-'}</td>
                    <td className={tdClass}>{l.accountCode} {accountByCode.get(l.accountCode)?.name}</td>
                    <td className={tdClass}>{Number(j.date.slice(5, 7))}/{j.date.slice(0, 4)}</td>
                    <td className={tdClass}>{j.description}</td>
                    <td className={tdRightClass}>{l.debit ? formatRupiah(l.debit) : ''}</td>
                    <td className={tdRightClass}>{l.credit ? formatRupiah(l.credit) : ''}</td>
                  </tr>
                ))}
                {taxLedger.details.length === 0 && <tr><td colSpan={8} className={`${tdClass} text-center`}>Belum ada transaksi pajak pada periode ini.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className={`mt-4 ${hintClass}`}>Buku ini diambil dari jurnal yang sudah diposting. Bukti potong, faktur, dan billing masuk ke sini setelah dijurnal, sehingga tidak tercatat dua kali.</p>
        </div>
      )}

      {/* RIWAYAT PERUBAHAN (AUDIT TRAIL, hanya dibaca) */}
      {tab === 'AUDIT' && (
        <div className={`${cardClass} module-enter`}>
          <h3 className="t-card">Riwayat perubahan (audit trail)</h3>
          <p className={`mt-1 ${hintClass}`}>Riwayat aktivitas hanya bisa ditambah. Tidak ada fungsi ubah atau hapus di tampilan ini.</p>
          <div className={tableWrapClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Waktu</th>
                  <th className={thClass}>Pengguna</th>
                  <th className={thClass}>Modul</th>
                  <th className={thClass}>Aktivitas</th>
                  <th className={thClass}>Dokumen</th>
                  <th className={thClass}>Sebelum</th>
                  <th className={thClass}>Sesudah</th>
                  <th className={thClass}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {[...loadAudit()].sort((a, b) => (a.waktu < b.waktu ? 1 : -1)).map((a) => (
                  <tr key={a.id} className={rowClass}>
                    <td className={`${tdClass} whitespace-nowrap`}>{a.waktu.slice(0, 16).replace('T', ' ')}</td>
                    <td className={tdClass}>{a.pengguna}</td>
                    <td className={tdClass}>{a.modul}</td>
                    <td className={tdClass}>{a.aktivitas}</td>
                    <td className={tdClass}>{a.dokumen}</td>
                    <td className={tdClass}>{a.sebelum}</td>
                    <td className={tdClass}>{a.sesudah}</td>
                    <td className={tdClass}>{a.keterangan}</td>
                  </tr>
                ))}
                {loadAudit().length === 0 && <tr><td colSpan={8} className={`${tdClass} text-center`}>Belum ada aktivitas tercatat.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
