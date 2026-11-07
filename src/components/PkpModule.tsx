import { REGULASI } from '../config/regulasi';
import { notify } from '../utils/toast';
import { EmptyState } from './EmptyState';
import { printArea } from '../utils/printArea';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleAlert, CircleCheck, Info, Printer } from 'lucide-react';
import { formatRupiah } from '../utils/taxCalculator';
import { appendAudit } from '../utils/auditTrail';
import { AccountingStore, JournalEntry, JournalLine, STORAGE_KEY as ACCOUNTING_KEY, emptyStore, nextJournalNumber } from '../utils/accounting';
import { formatIdNumber, parseIdNumber } from './RupiahInput';

// Pembukuan khusus PKP dan non-PKP: PKP memungut PPN dan bisa mengkreditkan PPN masukan,
// non-PKP tidak memungut PPN, dan PPN pembelian menjadi bagian biaya.
const STORAGE = 'atlax_pkp_v1';

type Jenis = 'PENJUALAN' | 'PEMBELIAN';

interface PkpTx {
  id: string;
  tanggal: string;
  jenis: Jenis;
  pihak: string;
  keterangan: string;
  dpp: number;
  adaFaktur: boolean;
  journalNumber?: string;
}

const load = (): PkpTx[] => {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? (JSON.parse(raw) as PkpTx[]) : [];
  } catch {
    return [];
  }
};

const inputClass = 'field';
const todayIso = () => new Date().toISOString().slice(0, 10);
const thLeft = 't-label p-3 text-left align-bottom';
const thRight = 't-label p-3 text-right align-bottom';
const tdClass = 't-note border-t border-slate-100 p-3 align-top text-slate-900';
const tdRight = 't-note border-t border-slate-100 p-3 text-right align-top text-slate-900';

// Hitungan per transaksi
export const hitungTransaksi = (t: Pick<PkpTx, 'jenis' | 'dpp' | 'adaFaktur'>, isPkp: boolean) => {
  const ppn = Math.round((t.dpp * REGULASI.tarifPpnPersen) / 100);
  if (isPkp) {
    return {
      ppnKeluaran: t.jenis === 'PENJUALAN' ? ppn : 0,
      ppnMasukan: t.jenis === 'PEMBELIAN' && t.adaFaktur ? ppn : 0,
      // PPN pembelian tanpa faktur pajak tidak bisa dikreditkan, jadi menjadi biaya
      ppnBiaya: t.jenis === 'PEMBELIAN' && !t.adaFaktur ? ppn : 0,
      totalTransaksi: t.jenis === 'PENJUALAN' ? t.dpp + ppn : t.dpp,
      biaya: t.jenis === 'PEMBELIAN' ? t.dpp + (t.adaFaktur ? 0 : ppn) : 0,
    };
  }
  // Non-PKP: tidak memungut PPN. PPN pembelian ikut menjadi biaya.
  return {
    ppnKeluaran: 0,
    ppnMasukan: 0,
    ppnBiaya: 0,
    totalTransaksi: t.dpp,
    biaya: t.jenis === 'PEMBELIAN' ? t.dpp + ppn : 0,
  };
};

// Baris jurnal untuk satu transaksi
const buildLines = (t: PkpTx, isPkp: boolean): JournalLine[] => {
  const h = hitungTransaksi(t, isPkp);
  if (t.jenis === 'PENJUALAN') {
    if (isPkp) {
      return [
        { accountCode: '1201', debit: h.totalTransaksi, credit: 0 },
        { accountCode: '4101', debit: 0, credit: t.dpp },
        { accountCode: '2201', debit: 0, credit: h.ppnKeluaran },
      ];
    }
    return [
      { accountCode: '1201', debit: t.dpp, credit: 0 },
      { accountCode: '4101', debit: 0, credit: t.dpp },
    ];
  }
  // Pembelian
  const totalBeli = isPkp ? t.dpp + h.ppnMasukan : h.biaya;
  const beban = isPkp ? t.dpp + h.ppnBiaya : h.biaya;
  const lines: JournalLine[] = [{ accountCode: '5101', debit: beban, credit: 0 }];
  if (isPkp && h.ppnMasukan > 0) lines.push({ accountCode: '1401', debit: h.ppnMasukan, credit: 0 });
  lines.push({ accountCode: '2101', debit: 0, credit: totalBeli });
  return lines;
};

export const PkpModule: React.FC<{ isPkp: boolean; onSetPkp: (value: boolean) => void }> = ({ isPkp, onSetPkp }) => {
  const [txs, setTxs] = useState<PkpTx[]>(load);
  const [form, setForm] = useState({ tanggal: todayIso(), jenis: 'PENJUALAN' as Jenis, pihak: '', keterangan: '', dpp: 0, adaFaktur: true });
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(txs));
  }, [txs]);

  const show = (type: 'ok' | 'error', text: string) => {
    notify(type, text);
    setTimeout(() => setMessage(null), 4000);
  };

  const totals = useMemo(() => {
    return txs.reduce(
      (acc, t) => {
        const h = hitungTransaksi(t, isPkp);
        acc.ppnKeluaran += h.ppnKeluaran;
        acc.ppnMasukan += h.ppnMasukan;
        acc.ppnBiaya += h.ppnBiaya;
        acc.penjualan += t.jenis === 'PENJUALAN' ? t.dpp : 0;
        acc.pembelianBiaya += h.biaya;
        return acc;
      },
      { ppnKeluaran: 0, ppnMasukan: 0, ppnBiaya: 0, penjualan: 0, pembelianBiaya: 0 }
    );
  }, [txs, isPkp]);

  const addTransaction = () => {
    if (form.dpp <= 0) return show('error', 'Nilai transaksi harus lebih dari nol.');
    if (!form.keterangan.trim()) return show('error', 'Keterangan transaksi wajib diisi.');
    const tx: PkpTx = { id: `pk-${Date.now()}`, tanggal: form.tanggal, jenis: form.jenis, pihak: form.pihak.trim(), keterangan: form.keterangan.trim(), dpp: form.dpp, adaFaktur: isPkp ? form.adaFaktur : false };
    setTxs((prev) => [...prev, tx]);
    appendAudit({ modul: 'Jurnal', aktivitas: 'Transaksi PKP/non-PKP dicatat', dokumen: tx.id, sebelum: '-', sesudah: `${tx.jenis} ${formatRupiah(tx.dpp)}`, keterangan: tx.keterangan });
    setForm({ ...form, pihak: '', keterangan: '', dpp: 0 });
    show('ok', 'Transaksi dicatat.');
  };

  const createDraft = (t: PkpTx) => {
    const raw = localStorage.getItem(ACCOUNTING_KEY);
    const accounting: AccountingStore = raw ? JSON.parse(raw) : emptyStore();
    const sourceKey = `PKPTX:${t.id}`;
    if (accounting.journals.some((j) => j.sourceKey === sourceKey && j.status !== 'REVERSED' && j.status !== 'REVERSAL')) {
      return show('error', 'Draf jurnal untuk transaksi ini sudah ada.');
    }
    const lines = buildLines(t, isPkp);
    const entry: JournalEntry = {
      id: `pkpj-${t.id}-${Date.now()}`,
      number: nextJournalNumber(accounting.journals, Number(t.tanggal.slice(0, 4))),
      date: t.tanggal,
      reference: t.pihak || '-',
      description: `${t.jenis === 'PENJUALAN' ? 'Penjualan' : 'Pembelian'} ${isPkp ? 'PKP' : 'non-PKP'}: ${t.keterangan}`,
      lines,
      status: 'DRAFT',
      attachmentName: '',
      sourceKey,
      jenis: 'UMUM',
      createdAt: new Date().toISOString(),
    };
    accounting.journals = [...accounting.journals, entry];
    localStorage.setItem(ACCOUNTING_KEY, JSON.stringify(accounting));
    setTxs((prev) => prev.map((x) => (x.id === t.id ? { ...x, journalNumber: entry.number } : x)));
    appendAudit({ modul: 'Jurnal', aktivitas: 'Draf jurnal dari transaksi PKP/non-PKP', dokumen: entry.number, sebelum: '-', sesudah: 'DRAFT', keterangan: t.keterangan });
    show('ok', `Draf jurnal ${entry.number} dibuat di Pembukuan. Periksa lalu posting di tab Catatan transaksi (Pembukuan).`);
  };

  const removeTransaction = (t: PkpTx) => {
    if (t.journalNumber) return show('error', `Transaksi ini sudah punya jurnal ${t.journalNumber}. Batalkan jurnalnya di Pembukuan dulu.`);
    if (!window.confirm('Hapus transaksi ini?')) return;
    setTxs((prev) => prev.filter((x) => x.id !== t.id));
  };

  const statusOptions = [{ v: false, l: 'Belum PKP (non-PKP)' }, { v: true, l: 'Sudah PKP (memungut PPN)' }];
  const statCards = isPkp
    ? [
        { label: 'PPN keluaran', value: formatRupiah(totals.ppnKeluaran), tone: 'text-indigo-900', note: 'PPN yang Anda pungut dari penjualan.' },
        { label: 'PPN masukan (dikreditkan)', value: formatRupiah(totals.ppnMasukan), tone: 'text-indigo-900', note: 'PPN dari pembelian yang punya faktur pajak.' },
        { label: 'PPN yang masih harus dibayar', value: formatRupiah(Math.max(0, totals.ppnKeluaran - totals.ppnMasukan)), tone: 'text-rose-800', note: 'Keluaran dikurangi masukan, jika hasilnya positif.' },
        { label: 'PPN lebih bayar (dikompensasi)', value: formatRupiah(Math.max(0, totals.ppnMasukan - totals.ppnKeluaran)), tone: 'text-emerald-800', note: 'Kelebihan masukan bisa dipakai di masa berikutnya.' },
      ]
    : [
        { label: 'Total penjualan', value: formatRupiah(totals.penjualan), tone: 'text-indigo-900', note: 'Omzet dari semua penjualan yang dicatat.' },
        { label: 'Biaya pembelian (termasuk PPN)', value: formatRupiah(totals.pembelianBiaya), tone: 'text-indigo-900', note: 'Non-PKP tidak bisa mengkreditkan PPN, jadi PPN ikut menjadi biaya.' },
        { label: 'Laba kotor', value: formatRupiah(totals.penjualan - totals.pembelianBiaya), tone: 'text-indigo-900', note: 'Penjualan dikurangi biaya pembelian. Biaya lain belum termasuk.' },
        { label: 'PPN dipungut', value: formatRupiah(0), tone: 'text-indigo-900', note: 'Non-PKP tidak memungut PPN dari pembeli.' },
      ];

  return (
    <section className="module-enter space-y-5 print-area">
      <div className="space-y-5 rounded-3xl border border-indigo-200  p-6 shadow-soft">
        <span className="t-kicker inline-flex w-fit rounded-full bg-white px-3 py-1 text-indigo-800">Pembukuan PKP & non-PKP</span>
        <h2 className="t-page">Status usaha: {isPkp ? 'Sudah PKP' : 'Belum PKP (non-PKP)'}</h2>
        <p className="t-body">Apa ini? PKP (Pengusaha Kena Pajak) adalah usaha yang wajib memungut PPN dari pembeli. Usaha non-PKP belum memungut PPN.</p>
        <button type="button" onClick={() => printArea()} className="btn-secondary print:hidden">
          <Printer className="h-5 w-5" aria-hidden="true" />
          Cetak / PDF
        </button>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {statusOptions.map((o) => {
            const active = isPkp === o.v;
            return (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => onSetPkp(o.v)}
                aria-pressed={active}
                className={`card-lift flex min-h-[4.5rem] items-center gap-3 p-4 text-left ${active ? 'border-indigo-700 bg-indigo-50 ring-4 ring-indigo-200' : 'hover:border-indigo-300'}`}
              >
                <span className="t-body flex-1 font-bold text-slate-900">{o.l}</span>
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-indigo-700 text-white' : 'border-2 border-slate-300 bg-white'}`}
                >
                  {active && <Check className="h-5 w-5" />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="t-note text-slate-800">Ubah status hanya jika status PKP usaha Anda memang berubah.</p>
        <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-slate-50/80 p-4">
          <Info className="mt-0.5 h-6 w-6 shrink-0 text-indigo-800" aria-hidden="true" />
          <p className="t-body text-indigo-950">
            {isPkp
              ? `PKP memungut PPN ${REGULASI.tarifPpnPersen}% atas penjualan dan bisa mengkreditkan PPN masukan dari faktur pajak. Selisihnya PPN kurang atau lebih bayar.`
              : 'Non-PKP tidak memungut PPN dan tidak membuat faktur pajak. PPN yang dibayar saat membeli menjadi bagian biaya.'}
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { t: '1. Catat transaksi', d: 'Isi tiap penjualan atau pembelian di bawah.' },
            { t: '2. Lihat PPN', d: 'Angka PPN dihitung otomatis dari nilai transaksi.' },
            { t: '3. Buat draf jurnal', d: 'Periksa di Pembukuan, lalu posting di sana.' },
          ].map((s) => (
            <li key={s.t} className="rounded-2xl border border-indigo-100 bg-slate-50/80 p-4">
              <p className="t-label text-indigo-900">{s.t}</p>
              <p className="t-note mt-1">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>


      {message && (
        <div role="status" className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${message.type === 'ok' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          {message.type === 'ok'
            ? <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-800" aria-hidden="true" />
            : <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-rose-800" aria-hidden="true" />}
          <p className={`t-body font-bold ${message.type === 'ok' ? 'text-emerald-900' : 'text-rose-900'}`}>{message.text}</p>
        </div>
      )}

      <div className="card space-y-5">
        <h3 className="t-card">Catat transaksi</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="fld-pkpmodule-1" className="t-label mb-2 block">Tanggal</label>
            <input id="fld-pkpmodule-1" type="date" className={inputClass} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </div>
          <div>
            <label htmlFor="fld-pkpmodule-2" className="t-label mb-2 block">Jenis</label>
            <select id="fld-pkpmodule-2" className={inputClass} value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value as Jenis })}>
              <option value="PENJUALAN">Penjualan</option>
              <option value="PEMBELIAN">Pembelian</option>
            </select>
          </div>
          <div>
            <label htmlFor="fld-pkpmodule-3" className="t-label mb-2 block">Nilai transaksi sebelum PPN (Rp)</label>
            <input id="fld-pkpmodule-3" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(form.dpp || '')} onChange={(e) => setForm({ ...form, dpp: parseIdNumber(e.target.value) })} />
          </div>
          <div>
            <label htmlFor="fld-pkpmodule-4" className="t-label mb-2 block">Pihak (pembeli atau pemasok)</label>
            <input id="fld-pkpmodule-4" className={inputClass} value={form.pihak} onChange={(e) => setForm({ ...form, pihak: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fld-pkpmodule-5" className="t-label mb-2 block">Keterangan</label>
            <input id="fld-pkpmodule-5" className={inputClass} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
          </div>
          {isPkp && form.jenis === 'PEMBELIAN' && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:col-span-3">
              <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-indigo-700" checked={form.adaFaktur} onChange={(e) => setForm({ ...form, adaFaktur: e.target.checked })} />
              <span className="t-body font-bold text-indigo-950">
                Ada faktur pajak masukan (PPN bisa dikreditkan)
                <span className="block t-note font-normal text-slate-700">Centang hanya jika punya faktur pajak dari penjual. Tanpa faktur, PPN tidak bisa dikreditkan.</span>
              </span>
            </label>
          )}
        </div>
        <p className="t-note">
          {isPkp
            ? `PPN ${REGULASI.tarifPpnPersen}% dihitung otomatis dari nilai transaksi. Penjualan menjadi PPN keluaran; pembelian dengan faktur menjadi PPN masukan.`
            : 'Non-PKP tidak memungut PPN. Transaksi tetap dicatat untuk melihat omzet dan biaya.'}
        </p>
        <div>
          <button type="button" onClick={addTransaction} className="btn-primary">Tambah transaksi</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.label} className="card">
            <p className="t-label">{item.label}</p>
            <p className={`t-section mt-3 break-words ${item.tone}`}>{item.value}</p>
            <p className="t-note mt-2">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <h3 className="t-card">Daftar transaksi</h3>
        <p className="t-note mb-4 mt-2">Draf jurnal dibuat untuk diperiksa dulu. Transaksi yang sudah punya jurnal tidak bisa dihapus sebelum jurnalnya dibatalkan.</p>
        <p className="t-note mb-3 sm:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-indigo-50">
            <tr>
              <th className={thLeft}>Tanggal</th>
              <th className={thLeft}>Jenis</th>
              <th className={thLeft}>Pihak</th>
              <th className={thLeft}>Keterangan</th>
              <th className={thRight}>DPP</th>
              <th className={thRight}>{isPkp ? 'PPN' : 'PPN (biaya)'}</th>
              <th className={thLeft}>Jurnal</th>
              <th className={thLeft}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[...txs].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).map((t) => {
              const h = hitungTransaksi(t, isPkp);
              const ppnTampil = isPkp ? h.ppnKeluaran + h.ppnMasukan + h.ppnBiaya : (t.jenis === 'PEMBELIAN' ? Math.round((t.dpp * REGULASI.tarifPpnPersen) / 100) : 0);
              return (
                <tr key={t.id} className="align-top transition-colors hover:bg-indigo-50/60">
                  <td className={tdClass}>{t.tanggal}</td>
                  <td className={tdClass}>
                    {t.jenis === 'PENJUALAN' ? 'Penjualan' : 'Pembelian'}
                    {isPkp && t.jenis === 'PEMBELIAN' && !t.adaFaktur && <span className="mt-1 block t-note font-bold text-amber-900">Tanpa faktur</span>}
                  </td>
                  <td className={tdClass}>{t.pihak || '-'}</td>
                  <td className={tdClass}>{t.keterangan}</td>
                  <td className={tdRight}>{formatRupiah(t.dpp)}</td>
                  <td className={tdRight}>{formatRupiah(ppnTampil)}</td>
                  <td className={tdClass}>
                    {t.journalNumber ? <span className="chip-info">{t.journalNumber}</span> : '-'}
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-col items-start gap-2">
                      {!t.journalNumber && <button type="button" className="btn-soft btn-sm" onClick={() => createDraft(t)}>Buat draf jurnal</button>}
                      <button type="button" className="btn-danger btn-sm" onClick={() => removeTransaction(t)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {txs.length === 0 && <tr><td colSpan={8}><EmptyState text="Belum ada transaksi. Isi formulir di atas lalu tekan Tambah transaksi." /></td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};
