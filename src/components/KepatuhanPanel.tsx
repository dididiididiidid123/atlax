import { REGULASI } from '../config/regulasi';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck, Check, Clock, ClipboardList, Info, Wallet } from 'lucide-react';
import { appendAudit } from '../utils/auditTrail';
import { formatRupiah } from '../utils/taxCalculator';
import { formatIdNumber, parseIdNumber } from './RupiahInput';

// Kepatuhan per masa pajak: kapan dilaporkan atau disetor, nominal, dan dibandingkan dengan tenggat.
// Tenggat dari aturan umum. Denda dan bunga di sini adalah estimasi, cek ke ketentuan yang berlaku.
type Jenis = 'SETOR_PPH' | 'SPT_MASA_PPH' | 'SETOR_PPN' | 'SPT_MASA_PPN';
type Status = 'BELUM' | 'SUDAH';

interface KewajibanRecord {
  status: Status;
  tanggal: string; // tanggal realisasi (YYYY-MM-DD)
  nomorBpe: string;
  nominal: number;
}

const STORAGE_KEY = 'atlax_kepatuhan_v1';
const DENDA_LAPOR: Partial<Record<Jenis, number>> = { SPT_MASA_PPH: 100_000, SPT_MASA_PPN: 500_000 };

export const JENIS_LABEL: Record<Jenis, string> = {
  SETOR_PPH: 'Setor PPh (21, 23, 26)',
  SPT_MASA_PPH: 'Lapor SPT Masa PPh',
  SETOR_PPN: 'Setor PPN',
  SPT_MASA_PPN: 'Lapor SPT Masa PPN',
};

// m = bulan masa pajak (1 sampai 12). Setor dan lapor PPh jatuh pada bulan berikutnya.
export const deadlineFor = (jenis: Jenis, year: number, month: number) => {
  if (jenis === 'SETOR_PPH') return new Date(year, month, 10);
  if (jenis === 'SPT_MASA_PPH') return new Date(year, month, 20);
  // PPN: akhir bulan berikutnya setelah masa pajak
  return new Date(year, month + 1, 0);
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const fmt = (d: Date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
const DAY_MS = 86_400_000;
const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Hitung keterlambatan dan estimasi denda atau bunga
export const lateness = (jenis: Jenis, deadline: Date, realisasi: Date | null, nominal: number) => {
  if (!realisasi) return { telatHari: 0, bulanTelat: 0, denda: 0, bunga: 0 };
  const telatHari = Math.max(0, Math.round((realisasi.getTime() - deadline.getTime()) / DAY_MS));
  if (telatHari === 0) return { telatHari: 0, bulanTelat: 0, denda: 0, bunga: 0 };
  const bulanTelat = Math.min(REGULASI.maksBulanBunga, Math.ceil(telatHari / 30));
  const denda = DENDA_LAPOR[jenis] ?? 0;
  const bunga = jenis === 'SETOR_PPH' || jenis === 'SETOR_PPN' ? Math.round(nominal * REGULASI.bungaPerBulan * bulanTelat) : 0;
  return { telatHari, bulanTelat, denda, bunga };
};

export const KepatuhanPanel: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<Record<string, KewajibanRecord>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const keyOf = (jenis: Jenis, month: number) => `${year}-${String(month).padStart(2, '0')}-${jenis}`;
  const jenisList: Jenis[] = ['SETOR_PPH', 'SPT_MASA_PPH', 'SETOR_PPN', 'SPT_MASA_PPN'];

  const rows = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 12 }, (_, i) => i + 1).flatMap((month) =>
      jenisList.map((jenis) => {
        const deadline = deadlineFor(jenis, year, month);
        const record: KewajibanRecord = records[keyOf(jenis, month)] ?? { status: 'BELUM', tanggal: '', nomorBpe: '', nominal: 0 };
        const realisasi = record.status === 'SUDAH' && record.tanggal ? parseDate(record.tanggal) : null;
        const hasil = lateness(jenis, deadline, realisasi, record.nominal);
        const overdue = record.status === 'BELUM' && today > deadline;
        return { month, jenis, deadline, record, realisasi, hasil, overdue };
      })
    );
  }, [records, year]);

  const total = rows.length;
  const sudah = rows.filter((r) => r.record.status === 'SUDAH').length;
  const telat = rows.filter((r) => r.record.status === 'SUDAH' && r.hasil.telatHari > 0).length;
  const terlambatBelum = rows.filter((r) => r.overdue).length;
  const belum = total - sudah - terlambatBelum;
  const totalEstimasi = rows.reduce((s, r) => s + r.hasil.denda + r.hasil.bunga, 0);

  const updateRecord = (jenis: Jenis, month: number, patch: Partial<KewajibanRecord>) => {
    const key = keyOf(jenis, month);
    setRecords((prev) => {
      const current = prev[key] ?? { status: 'BELUM' as Status, tanggal: '', nomorBpe: '', nominal: 0 };
      return { ...prev, [key]: { ...current, ...patch } };
    });
  };

  const setStatus = (jenis: Jenis, month: number, status: Status) => {
    if (status === 'SUDAH') {
      const nomorBpe = window.prompt(`Nomor BPE untuk ${JENIS_LABEL[jenis]} ${MONTHS[month - 1]} ${year} (boleh dikosongkan):`, '') ?? '';
      updateRecord(jenis, month, { status, tanggal: new Date().toISOString().slice(0, 10), nomorBpe: nomorBpe.trim() });
    } else {
      updateRecord(jenis, month, { status, tanggal: '', nomorBpe: '' });
    }
    appendAudit({
      modul: 'Administrasi Lainnya',
      aktivitas: `Status kepatuhan ${status === 'SUDAH' ? 'ditandai sudah' : 'dikembalikan ke belum'}`,
      dokumen: `${JENIS_LABEL[jenis]} ${MONTHS[month - 1]} ${year}`,
      sebelum: '-',
      sesudah: status,
      keterangan: 'Dicatat dari dashboard kepatuhan',
    });
  };

  type Baris = (typeof rows)[number];

  const statusClass = (r: Baris) =>
    r.record.status === 'SUDAH'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : r.overdue
        ? 'border-rose-300 bg-rose-50 text-rose-900'
        : 'border-slate-300 bg-white text-slate-800';

  const hasilTeks = (r: Baris) => {
    if (r.record.status === 'SUDAH' && r.realisasi) {
      return r.hasil.telatHari > 0
        ? <span className="font-bold text-rose-800">Telat {r.hasil.telatHari} hari</span>
        : <span className="font-bold text-emerald-800">Tepat waktu</span>;
    }
    if (r.overdue) return <span className="font-bold text-rose-800">Lewat batas waktu</span>;
    return <span className="text-slate-700">Belum dipenuhi</span>;
  };

  const dendaTeks = (r: Baris) => {
    if (r.hasil.denda + r.hasil.bunga === 0) return '-';
    return (
      <>
        {r.hasil.denda > 0 && <span className="block">Denda {formatRupiah(r.hasil.denda)}</span>}
        {r.hasil.bunga > 0 && <span className="block">Bunga {formatRupiah(r.hasil.bunga)} ({r.hasil.bulanTelat} bulan)</span>}
      </>
    );
  };

  const ringkasan = [
    { label: 'Semua kewajiban', value: String(total), icon: ClipboardList, box: 'border-slate-200 bg-white', tone: 'text-slate-900' },
    { label: 'Sudah dipenuhi', value: String(sudah), icon: Check, box: 'border-emerald-200 bg-emerald-50', tone: 'text-emerald-900' },
    { label: 'Sudah, tapi telat', value: String(telat), icon: Clock, box: 'border-amber-200 bg-amber-50', tone: 'text-amber-900' },
    { label: 'Belum, lewat batas waktu', value: String(terlambatBelum), icon: AlertTriangle, box: 'border-rose-200 bg-rose-50', tone: 'text-rose-900' },
    { label: 'Perkiraan denda dan bunga', value: formatRupiah(totalEstimasi), icon: Wallet, box: 'border-orange-200 bg-orange-50', tone: 'text-orange-900' },
  ];

  return (
    <section className="card module-enter space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex min-w-0 max-w-[1600px] items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl  text-amber-900"
          >
            <CalendarCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="t-section">Cek kewajiban pajak {year}</h3>
            <p className="mt-1 t-note">
              Catat kapan Anda sudah membayar atau lapor. Aplikasi akan menghitung perkiraan denda kalau terlambat.
            </p>
            <p className="mt-3 t-label">Cara pakai:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 t-body">
              <li>Pilih <span className="font-bold">Sudah</span> setelah Anda membayar atau lapor. Tanggal hari ini diisi otomatis.</li>
              <li>Kalau tanggalnya berbeda, ubah tanggal bayar atau lapornya.</li>
              <li>Tulisan <span className="font-bold text-rose-800">Terlambat</span> berarti batas waktunya sudah lewat dan belum dicatat sebagai sudah.</li>
            </ol>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <label htmlFor="fld-kepatuhanpanel-1" className="t-label">Tahun</label>
          <input id="fld-kepatuhanpanel-1" type="number" className="field w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ringkasan.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-2xl border p-4 ${item.box}`}>
              <p className="flex items-center gap-2 t-label">
                <Icon className={`h-5 w-5 shrink-0 ${item.tone}`} /> {item.label}
              </p>
              <p className={`mt-2 break-words t-card ${item.tone}`}>{item.value}</p>
            </div>
          );
        })}
      </div>
      <p className="t-body">Belum dipenuhi dan belum lewat batas waktu: <span className="font-bold">{belum}</span>.</p>

      {/* Tampilan kartu untuk layar kecil */}
      <div className="space-y-4 md:hidden">
        {rows.map((r) => {
          const isSetor = r.jenis === 'SETOR_PPH' || r.jenis === 'SETOR_PPN';
          const sudahDicatat = r.record.status === 'SUDAH';
          return (
            <article
              key={`${r.month}-${r.jenis}`}
              className={`card space-y-4 ${r.overdue ? 'border-rose-300 bg-rose-50' : ''}`}
            >
              <div>
                <p className="t-card">{MONTHS[r.month - 1]}</p>
                <p className="t-body font-bold">{JENIS_LABEL[r.jenis]}</p>
                <p className="mt-1 t-note">Batas waktu: {fmt(r.deadline)}</p>
              </div>

              <label className="block space-y-2">
                <span className="block t-label">Status</span>
                <select
                  className={`field w-full font-bold ${statusClass(r)}`}
                  value={r.record.status}
                  onChange={(e) => setStatus(r.jenis, r.month, e.target.value as Status)}
                >
                  <option value="BELUM">{r.overdue ? 'Terlambat' : 'Belum'}</option>
                  <option value="SUDAH">Sudah</option>
                </select>
              </label>

              <div className="rounded-2xl bg-slate-50 p-4 t-body">{hasilTeks(r)}</div>

              <label className="block space-y-2">
                <span className="block t-label">Tanggal bayar atau lapor</span>
                <input
                  type="date"
                  className="field w-full disabled:bg-slate-100"
                  disabled={!sudahDicatat}
                  value={r.record.tanggal}
                  onChange={(e) => updateRecord(r.jenis, r.month, { tanggal: e.target.value })}
                />
                {!sudahDicatat && <span className="block t-note">Pilih Sudah dulu untuk mengisi tanggal.</span>}
              </label>

              <label className="block space-y-2">
                <span className="block t-label">Jumlah (Rp)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="field w-full text-right"
                  value={formatIdNumber(r.record.nominal || '')}
                  onChange={(e) => updateRecord(r.jenis, r.month, { nominal: parseIdNumber(e.target.value) })}
                  placeholder={isSetor ? 'Jumlah yang disetor' : 'Boleh dikosongkan'}
                />
              </label>

              <dl className="space-y-3 t-body">
                <div className="flex justify-between gap-3">
                  <dt className="t-label">Perkiraan denda atau bunga</dt>
                  <dd className="text-right font-bold text-slate-900">{dendaTeks(r)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="t-label">Nomor BPE</dt>
                  <dd className="break-all text-right text-slate-900">{r.record.nomorBpe || '-'}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      {/* Tabel untuk layar lebar */}
      <div className="hidden overflow-x-auto rounded-2xl border border-amber-200 md:block">
        <table className="w-full border-collapse">
          <thead className="bg-amber-100">
            <tr>
              <th className="whitespace-nowrap p-4 text-left t-label text-amber-950">Bulan</th>
              <th className="whitespace-nowrap p-4 text-left t-label text-amber-950">Kewajiban</th>
              <th className="whitespace-nowrap p-4 text-left t-label text-amber-950">Batas waktu</th>
              <th className="whitespace-nowrap p-4 text-left t-label text-amber-950">Status</th>
              <th className="whitespace-nowrap p-4 text-left t-label text-amber-950">Tanggal bayar atau lapor</th>
              <th className="whitespace-nowrap p-4 text-right t-label text-amber-950">Jumlah (Rp)</th>
              <th className="whitespace-nowrap p-4 text-left t-label text-amber-950">Hasil</th>
              <th className="whitespace-nowrap p-4 text-right t-label text-amber-950">Perkiraan denda atau bunga</th>
              <th className="whitespace-nowrap p-4 text-left t-label text-amber-950">Nomor BPE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSetor = r.jenis === 'SETOR_PPH' || r.jenis === 'SETOR_PPN';
              return (
                <tr
                  key={`${r.month}-${r.jenis}`}
                  className={`border-t border-amber-100 align-top transition-colors hover:bg-amber-50 ${r.overdue ? 'bg-rose-50' : ''}`}
                >
                  <td className="whitespace-nowrap p-4 t-body">{MONTHS[r.month - 1]}</td>
                  <td className="p-4 t-body">{JENIS_LABEL[r.jenis]}</td>
                  <td className="whitespace-nowrap p-4 t-body">{fmt(r.deadline)}</td>
                  <td className="p-4">
                    <select
                      aria-label={`Status ${JENIS_LABEL[r.jenis]} ${MONTHS[r.month - 1]}`}
                      className={`field font-bold ${statusClass(r)}`}
                      value={r.record.status}
                      onChange={(e) => setStatus(r.jenis, r.month, e.target.value as Status)}
                    >
                      <option value="BELUM">{r.overdue ? 'Terlambat' : 'Belum'}</option>
                      <option value="SUDAH">Sudah</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <input
                      type="date"
                      aria-label={`Tanggal bayar atau lapor ${JENIS_LABEL[r.jenis]} ${MONTHS[r.month - 1]}`}
                      className="field disabled:bg-slate-100"
                      disabled={r.record.status !== 'SUDAH'}
                      value={r.record.tanggal}
                      onChange={(e) => updateRecord(r.jenis, r.month, { tanggal: e.target.value })}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Jumlah ${JENIS_LABEL[r.jenis]} ${MONTHS[r.month - 1]} dalam rupiah`}
                      className="field w-36 text-right"
                      value={formatIdNumber(r.record.nominal || '')}
                      onChange={(e) => updateRecord(r.jenis, r.month, { nominal: parseIdNumber(e.target.value) })}
                      placeholder={isSetor ? 'Jumlah yang disetor' : 'Boleh dikosongkan'}
                    />
                  </td>
                  <td className="p-4 t-body">{hasilTeks(r)}</td>
                  <td className="p-4 text-right t-body">{dendaTeks(r)}</td>
                  <td className="p-4 t-body">{r.record.nomorBpe || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="rounded-2xl border border-amber-200 bg-amber-50 p-4 t-note">
        <summary className="cursor-pointer py-1 t-label">
          <Info className="mr-2 inline h-5 w-5 align-text-bottom text-amber-800" />
          Lihat cara hitung perkiraan, dan arti BPE
        </summary>
        <div className="mt-3 space-y-2 t-body leading-relaxed">
          <p>
            Denda lapor mengikuti angka per masa: SPT Masa PPh Rp 100.000, SPT Masa PPN Rp 500.000.
            Bunga setor memakai tarif 0,93% per bulan dikali jumlah setor, paling lama 24 bulan.
            Ini perkiraan, bukan angka resmi DJP.
          </p>
          <p>BPE (bukti penerimaan elektronik) adalah bukti dari DJP bahwa laporan atau setoran Anda sudah diterima. Nomornya diisi saat Anda memilih Sudah.</p>
        </div>
      </details>
    </section>
  );
};
