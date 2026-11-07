// Laporan keuangan turunan: perubahan ekuitas, arus kas (metode langsung), penyusutan komersial dan fiskal,
// buku pembantu, dan kerangka catatan atas laporan keuangan (CALK).
import { Account, JournalEntry, balanceOf, entryTotals } from './accounting';
import { formatRupiah } from './taxCalculator';

const posted = (journals: JournalEntry[]) => journals.filter((j) => j.status !== 'DRAFT');

// ---------- Perubahan ekuitas ----------
export const equityStatement = (accounts: Account[], journals: JournalEntry[], year: number) => {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const modal = accounts.find((a) => a.code === '3101');
  const prive = accounts.find((a) => a.code === '3102');
  const inYear = posted(journals).filter((j) => j.date >= start && j.date < end);

  const modalAwal = modal ? balanceOf(modal, journals, start) : 0;
  let setoran = 0;
  let pengambilan = 0;
  let pendapatan = 0;
  let beban = 0;
  inYear.forEach((j) => j.lines.forEach((l) => {
    if (modal && l.accountCode === modal.code) setoran += (l.credit || 0) - (l.debit || 0);
    if (prive && l.accountCode === prive.code) pengambilan += (l.debit || 0) - (l.credit || 0);
    const acc = accounts.find((a) => a.code === l.accountCode);
    if (acc?.group === 'PENDAPATAN') pendapatan += (l.credit || 0) - (l.debit || 0);
    if (acc?.group === 'BEBAN') beban += (l.debit || 0) - (l.credit || 0);
  }));
  const labaTahunBerjalan = pendapatan - beban;
  const saldoAkhir = modalAwal + setoran + labaTahunBerjalan - pengambilan;
  return { modalAwal, setoran, labaTahunBerjalan, pengambilan, saldoAkhir };
};

// ---------- Arus kas metode langsung ----------
// Setiap jurnal yang menyentuh kas (1101) diklasifikasikan menurut akun lawannya.
export const cashFlow = (accounts: Account[], journals: JournalEntry[], year: number) => {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const kas = accounts.find((a) => a.code === '1101');
  const result = { operasi: { masuk: 0, keluar: 0 }, investasi: { masuk: 0, keluar: 0 }, pendanaan: { masuk: 0, keluar: 0 } };
  if (!kas) return { ...result, kasAwal: 0, kasAkhir: 0, rows: [] as { tanggal: string; nomor: string; kategori: string; keterangan: string; masuk: number; keluar: number }[] };

  const rows: { tanggal: string; nomor: string; kategori: string; keterangan: string; masuk: number; keluar: number }[] = [];
  posted(journals).filter((j) => j.date >= start && j.date < end).forEach((j) => {
    const kasLines = j.lines.filter((l) => l.accountCode === kas.code);
    if (kasLines.length === 0) return;
    const counter = j.lines.filter((l) => l.accountCode !== kas.code);
    const codes = counter.map((l) => l.accountCode);
    const kategori: 'operasi' | 'investasi' | 'pendanaan' =
      codes.length > 0 && codes.every((c) => c.startsWith('15') || c.startsWith('16')) ? 'investasi'
      : codes.length > 0 && codes.every((c) => c.startsWith('3')) ? 'pendanaan'
      : 'operasi';
    const masuk = kasLines.reduce((s, l) => s + (l.debit || 0), 0);
    const keluar = kasLines.reduce((s, l) => s + (l.credit || 0), 0);
    result[kategori].masuk += masuk;
    result[kategori].keluar += keluar;
    rows.push({ tanggal: j.date, nomor: j.number, kategori, keterangan: j.description, masuk, keluar });
  });
  return { ...result, kasAwal: balanceOf(kas, journals, start), kasAkhir: balanceOf(kas, journals, end), rows };
};

// ---------- Penyusutan: komersial (garis lurus, sesuai masa manfaat usaha) dan fiskal ----------
export interface AssetInput {
  nama: string;
  hargaPerolehan: number;
  nilaiSisa: number;
  masaManfaatTahunKomersial: number;
  masaManfaatTahunFiskal: number;
}

export const depreciation = (asset: AssetInput) => {
  const komersialBulanan = asset.masaManfaatTahunKomersial > 0
    ? Math.max(0, asset.hargaPerolehan - asset.nilaiSisa) / (asset.masaManfaatTahunKomersial * 12)
    : 0;
  const fiskalTahunan = asset.masaManfaatTahunFiskal > 0 ? asset.hargaPerolehan / asset.masaManfaatTahunFiskal : 0;
  return {
    komersialBulanan: Math.round(komersialBulanan),
    komersialTahunan: Math.round(komersialBulanan * 12),
    fiskalTahunan: Math.round(fiskalTahunan),
    // Selisih ini dicatat sebagai koreksi fiskal, tidak masuk pembukuan komersial
    selisihKoreksiFiskalTahunan: Math.round(fiskalTahunan) - Math.round(komersialBulanan * 12),
  };
};

// ---------- Buku pembantu: rincian per akun dengan saldo berjalan ----------
export interface SubsidiaryRow {
  tanggal: string;
  nomor: string;
  referensi: string;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo: number;
}

export const subsidiaryLedger = (account: Account, journals: JournalEntry[]) => {
  const rows = posted(journals)
    .flatMap((j) => j.lines.filter((l) => l.accountCode === account.code).map((l) => ({ j, l })))
    .sort((a, b) => (a.j.date === b.j.date ? (a.j.number < b.j.number ? -1 : 1) : a.j.date < b.j.date ? -1 : 1));
  let running = 0;
  const out: SubsidiaryRow[] = rows.map(({ j, l }) => {
    const change = account.normalBalance === 'D' ? (l.debit || 0) - (l.credit || 0) : (l.credit || 0) - (l.debit || 0);
    running += change;
    return { tanggal: j.date, nomor: j.number, referensi: j.reference, keterangan: j.description, debit: l.debit || 0, kredit: l.credit || 0, saldo: running };
  });
  const saldoAkhir = balanceOf(account, journals);
  return { rows: out, saldoAkhir, status: saldoAkhir === 0 ? 'Lunas / nihil' : 'Terbuka' };
};

// ---------- Kerangka CALK: angka diambil dari data, kebijakan ditulis sebagai dasar ----------
export const calkParagraphs = (input: {
  tahun: number;
  totalAset: number;
  totalLiabilitas: number;
  totalEkuitas: number;
  pendapatan: number;
  beban: number;
  utangPajak: number;
}) => [
  {
    judul: '1. Dasar penyusunan',
    isi: `Laporan keuangan tahun ${input.tahun} disusun dengan dasar akrual dari jurnal yang telah diposting di ATLAX. Laporan ini bersifat internal dan belum diaudit.`,
  },
  {
    judul: '2. Ringkasan posisi keuangan',
    isi: `Total aset ${formatRupiah(input.totalAset)}, total liabilitas ${formatRupiah(input.totalLiabilitas)}, dan total ekuitas ${formatRupiah(input.totalEkuitas)}.`,
  },
  {
    judul: '3. Kinerja',
    isi: `Pendapatan ${formatRupiah(input.pendapatan)} dan beban ${formatRupiah(input.beban)}, sehingga laba atau rugi bersih ${formatRupiah(input.pendapatan - input.beban)}.`,
  },
  {
    judul: '4. Perpajakan',
    isi: `Utang pajak per tanggal laporan ${formatRupiah(input.utangPajak)}. Dasar penghitungan mengikuti kalkulator ATLAX dan perlu diverifikasi terhadap peraturan yang berlaku.`,
  },
  {
    judul: '5. Penyusutan',
    isi: 'Penyusutan komersial dihitung garis lurus sesuai masa manfaat usaha. Perbedaan dengan penyusutan fiskal dicatat sebagai koreksi fiskal, bukan di pembukuan komersial.',
  },
];

export const sumCode = (accounts: Account[], journals: JournalEntry[], group: Account['group']) =>
  accounts.filter((a) => a.group === group).reduce((s, a) => s + balanceOf(a, journals), 0);

export const journalTotal = (journal: JournalEntry) => entryTotals(journal.lines).debit;
