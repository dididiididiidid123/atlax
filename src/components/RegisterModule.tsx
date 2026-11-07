import { notify } from '../utils/toast';
import { EmptyState } from './EmptyState';
import { printArea } from '../utils/printArea';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleAlert, CircleCheck, Download, Info, Pencil, Printer, Save } from 'lucide-react';
import { formatRupiah } from '../utils/taxCalculator';
import { appendAudit } from '../utils/auditTrail';
import { downloadExcel } from '../utils/excelXml';
import { formatIdNumber, parseIdNumber } from './RupiahInput';

// Pemindahbukuan (Pbk), daftar tagihan pajak, dan restitusi: pengajuan, nominal, tanggal, dokumen, dan status.
export type RegKind = 'PBK' | 'TAGIHAN' | 'RESTITUSI';

interface RegRecord {
  id: string;
  nomor: string;
  kind: RegKind;
  tanggal: string;
  nominal: number;
  status: string;
  field1: string;
  field2: string;
  field3: string;
  keterangan: string;
  dokumenNama: string;
  dokumenData?: string;
  riwayat: { waktu: string; aktivitas: string }[];
}

const STORAGE_KEY = 'atlax_register_v1';

const KIND_INFO: Record<RegKind, { label: string; apa: string; f1: string; f2: string; f3: string; statuses: string[]; prefix: string }> = {
  PBK: {
    label: 'Pemindahbukuan (Pbk)',
    apa: 'Pemindahbukuan (Pbk) dipakai jika setoran pajak masuk ke kode atau rekening yang salah. Permohonannya diajukan ke KPP.',
    f1: 'Rekening asal',
    f2: 'Rekening tujuan',
    f3: 'Jenis pajak',
    statuses: ['Diajukan', 'Diproses', 'Selesai', 'Dibatalkan'],
    prefix: 'PBK',
  },
  TAGIHAN: {
    label: 'Daftar tagihan pajak',
    apa: 'Catat surat tagihan dari KPP (kantor pajak) beserta status penyelesaiannya.',
    f1: 'Nomor surat tagihan dari KPP',
    f2: 'Jenis pajak',
    f3: 'Masa pajak',
    statuses: ['Belum Diselesaikan', 'Dalam Proses', 'Selesai'],
    prefix: 'TGH',
  },
  RESTITUSI: {
    label: 'Restitusi pajak',
    apa: 'Restitusi adalah pengembalian kelebihan bayar pajak dari negara ke Anda. Nomor permohonan diberikan oleh DJP.',
    f1: 'Jenis pajak',
    f2: 'Masa / tahun pajak',
    f3: 'Nomor permohonan (dari DJP)',
    statuses: ['Diajukan', 'Diproses', 'Disetujui', 'Ditolak', 'Selesai'],
    prefix: 'RST',
  },
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const inputClass = 'field';
const thLeft = 't-label p-3 text-left align-bottom';
const thRight = 't-label p-3 text-right align-bottom';
const tdClass = 't-note p-3 align-top text-slate-900';
const tdRight = 't-note p-3 text-right align-top text-slate-900';

const load = (): RegRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RegRecord[]) : [];
  } catch {
    return [];
  }
};

const emptyForm = (kind: RegKind) => ({
  tanggal: todayIso(),
  nominal: 0,
  status: KIND_INFO[kind].statuses[0],
  field1: '',
  field2: '',
  field3: '',
  keterangan: '',
  dokumenNama: '',
  dokumenData: '',
});

export const RegisterModule: React.FC = () => {
  const [kind, setKind] = useState<RegKind>('PBK');
  const [records, setRecords] = useState<RegRecord[]>(load);
  const [form, setForm] = useState(emptyForm('PBK'));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const info = KIND_INFO[kind];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const show = (type: 'ok' | 'error', text: string) => {
    notify(type, text);
    setTimeout(() => setMessage(null), 4000);
  };

  const list = useMemo(
    () => records.filter((r) => r.kind === kind).sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)),
    [records, kind]
  );

  const changeKind = (k: RegKind) => {
    setKind(k);
    setForm(emptyForm(k));
    setEditingId(null);
  };

  const save = () => {
    if (!form.field1.trim()) return show('error', `${info.f1} wajib diisi.`);
    if (!form.field2.trim()) return show('error', `${info.f2} wajib diisi.`);
    if (form.nominal <= 0) return show('error', 'Nominal harus lebih dari nol.');
    if (!form.tanggal) return show('error', 'Tanggal wajib diisi.');

    if (editingId) {
      const before = records.find((r) => r.id === editingId);
      setRecords((prev) => prev.map((r) => (r.id === editingId
        ? {
            ...r,
            tanggal: form.tanggal,
            nominal: form.nominal,
            status: form.status,
            field1: form.field1.trim(),
            field2: form.field2.trim(),
            field3: form.field3.trim(),
            keterangan: form.keterangan.trim(),
            dokumenNama: form.dokumenNama || r.dokumenNama,
            dokumenData: form.dokumenData || r.dokumenData,
            riwayat: [...r.riwayat, { waktu: new Date().toISOString(), aktivitas: `Diubah. Nominal ${formatRupiah(before?.nominal ?? 0)} menjadi ${formatRupiah(form.nominal)}, status ${form.status}` }],
          }
        : r)));
      appendAudit({ modul: 'Administrasi Lainnya', aktivitas: `${info.label} diubah`, dokumen: before?.nomor ?? editingId, sebelum: `${formatRupiah(before?.nominal ?? 0)} | ${before?.status ?? '-'}`, sesudah: `${formatRupiah(form.nominal)} | ${form.status}`, keterangan: info.label });
      show('ok', 'Data diperbarui.');
    } else {
      const year = Number(form.tanggal.slice(0, 4));
      const count = records.filter((r) => r.kind === kind && r.tanggal.startsWith(String(year))).length;
      const nomor = `${info.prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
      const record: RegRecord = {
        id: `rg-${Date.now()}`,
        nomor,
        kind,
        tanggal: form.tanggal,
        nominal: form.nominal,
        status: form.status,
        field1: form.field1.trim(),
        field2: form.field2.trim(),
        field3: form.field3.trim(),
        keterangan: form.keterangan.trim(),
        dokumenNama: form.dokumenNama,
        dokumenData: form.dokumenData || undefined,
        riwayat: [{ waktu: new Date().toISOString(), aktivitas: 'Dibuat' }],
      };
      setRecords((prev) => [...prev, record]);
      appendAudit({ modul: 'Administrasi Lainnya', aktivitas: `${info.label} dibuat`, dokumen: nomor, sebelum: '-', sesudah: `${formatRupiah(form.nominal)} | ${form.status}`, keterangan: info.label });
      show('ok', `${info.label} ${nomor} disimpan.`);
    }
    setEditingId(null);
    setForm(emptyForm(kind));
  };

  const edit = (r: RegRecord) => {
    setEditingId(r.id);
    setForm({
      tanggal: r.tanggal,
      nominal: r.nominal,
      status: r.status,
      field1: r.field1,
      field2: r.field2,
      field3: r.field3,
      keterangan: r.keterangan,
      dokumenNama: r.dokumenNama,
      dokumenData: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeStatus = (r: RegRecord, status: string) => {
    if (status === r.status) return;
    setRecords((prev) => prev.map((x) => (x.id === r.id
      ? { ...x, status, riwayat: [...x.riwayat, { waktu: new Date().toISOString(), aktivitas: `Status ${x.status} menjadi ${status}` }] }
      : x)));
    appendAudit({ modul: 'Administrasi Lainnya', aktivitas: 'Status diubah', dokumen: r.nomor, sebelum: r.status, sesudah: status, keterangan: info.label });
  };

  const exportExcel = () => {
    downloadExcel(`${info.prefix.toLowerCase()}-atlax`, [{
      name: info.label.slice(0, 30),
      rows: [
        ['Nomor', 'Tanggal', info.f1, info.f2, info.f3, 'Nominal', 'Status', 'Dokumen', 'Keterangan'],
        ...list.map((r) => [r.nomor, r.tanggal, r.field1, r.field2, r.field3, r.nominal, r.status, r.dokumenNama, r.keterangan]),
      ],
    }]);
  };

  return (
    <div className="space-y-5">
      <div className="card space-y-6">
        <div className="print:hidden">
          <p className="t-label mb-3">Pilih jenis catatan:</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(Object.keys(KIND_INFO) as RegKind[]).map((k) => {
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeKind(k)}
                  className={`card-lift flex min-h-[4.5rem] items-center gap-3 p-4 text-left ${active ? 'border-rose-700 bg-rose-50 ring-4 ring-rose-200' : 'hover:border-rose-300'}`}
                >
                  <span className="t-body flex-1 font-bold text-slate-900">{KIND_INFO[k].label}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active ? 'bg-rose-700 text-white' : 'border-2 border-slate-300 bg-white'}`}
                  >
                    {active && <Check className="h-5 w-5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <Info className="mt-0.5 h-6 w-6 shrink-0 text-rose-800" aria-hidden="true" />
          <p className="t-body text-rose-900"><span className="font-bold">Apa ini?</span> {info.apa}</p>
        </div>
        {message && (
          <div role="status" className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${message.type === 'ok' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            {message.type === 'ok'
              ? <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-800" aria-hidden="true" />
              : <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-rose-800" aria-hidden="true" />}
            <p className={`t-body font-bold ${message.type === 'ok' ? 'text-emerald-900' : 'text-rose-900'}`}>{message.text}</p>
          </div>
        )}
        <h3 className="t-card">{editingId ? 'Ubah data' : `Tambah ${info.label}`}</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="fld-registermodule-1" className="t-label mb-2 block">Tanggal</label>
            <input id="fld-registermodule-1" type="date" className={inputClass} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </div>
          <div>
            <label htmlFor="fld-registermodule-2" className="t-label mb-2 block">Nominal (Rp)</label>
            <input id="fld-registermodule-2" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(form.nominal || '')} onChange={(e) => setForm({ ...form, nominal: parseIdNumber(e.target.value) })} />
          </div>
          <div>
            <label htmlFor="fld-registermodule-3" className="t-label mb-2 block">Status</label>
            <select id="fld-registermodule-3" className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {info.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fld-registermodule-4" className="t-label mb-2 block">{info.f1}</label>
            <input id="fld-registermodule-4" className={inputClass} value={form.field1} onChange={(e) => setForm({ ...form, field1: e.target.value })} />
          </div>
          <div>
            <label htmlFor="fld-registermodule-5" className="t-label mb-2 block">{info.f2}</label>
            <input id="fld-registermodule-5" className={inputClass} value={form.field2} onChange={(e) => setForm({ ...form, field2: e.target.value })} />
          </div>
          <div>
            <label htmlFor="fld-registermodule-6" className="t-label mb-2 block">{info.f3}</label>
            <input id="fld-registermodule-6" className={inputClass} value={form.field3} onChange={(e) => setForm({ ...form, field3: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fld-registermodule-7" className="t-label mb-2 block">Keterangan</label>
            <input id="fld-registermodule-7" className={inputClass} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
          </div>
          <div>
            <label className="t-label mb-2 block">Dokumen pendukung (maks. 300 KB)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="t-note block w-full rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-3 file:mr-3 file:rounded-xl file:border-0 file:bg-rose-700 file:px-4 file:py-2 file:font-bold file:text-white"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 300 * 1024) return show('error', 'Dokumen terlalu besar. Maksimal 300 KB.');
                const reader = new FileReader();
                reader.onload = () => setForm((prev) => ({ ...prev, dokumenNama: file.name, dokumenData: String(reader.result) }));
                reader.readAsDataURL(file);
              }}
            />
            {form.dokumenNama && <p className="t-note mt-2">Dipilih: {form.dokumenNama}</p>}
          </div>
        </div>
        <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
          <button type="button" className="btn-primary" onClick={save}>
            <Save className="h-5 w-5" aria-hidden="true" />
            {editingId ? 'Simpan perubahan' : 'Simpan'}
          </button>
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(emptyForm(kind)); }}>Batal</button>}
        </div>
      </div>

      <div className="card overflow-x-auto print-area">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h3 className="t-card">Daftar {info.label}</h3>
          <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
            <button type="button" className="btn-soft" onClick={exportExcel}>
              <Download className="h-5 w-5" aria-hidden="true" />
              Ekspor Excel
            </button>
            <button type="button" className="btn-secondary" onClick={() => printArea()}>
              <Printer className="h-5 w-5" aria-hidden="true" />
              Cetak / PDF
            </button>
          </div>
        </div>
        <p className="t-note mb-3 sm:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-rose-50">
            <tr>
              <th className={thLeft}>Nomor</th><th className={thLeft}>Tanggal</th>
              <th className={thLeft}>{info.f1}</th><th className={thLeft}>{info.f2}</th>
              <th className={thRight}>Nominal</th><th className={thLeft}>Status</th>
              <th className={thLeft}>Dokumen</th><th className={`${thLeft} print:hidden`}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top transition-colors hover:bg-rose-50/60">
                <td className={`${tdClass} font-bold`}>{r.nomor}</td>
                <td className={tdClass}>{r.tanggal}</td>
                <td className={tdClass}>{r.field1}</td>
                <td className={tdClass}>{r.field2}{r.field3 && <span className="block t-note">{info.f3}: {r.field3}</span>}</td>
                <td className={tdRight}>{formatRupiah(r.nominal)}</td>
                <td className={tdClass}>
                  <select className="field print:hidden" value={r.status} onChange={(e) => changeStatus(r, e.target.value)}>
                    {info.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="hidden print:inline">{r.status}</span>
                </td>
                <td className={tdClass}>
                  {r.dokumenData ? <a className="font-bold text-rose-800 underline" href={r.dokumenData} download={r.dokumenNama}>{r.dokumenNama}</a> : (r.dokumenNama || '-')}
                </td>
                <td className={`${tdClass} print:hidden`}>
                  <div className="flex flex-col items-start gap-2">
                    <button type="button" className="btn-soft btn-sm" onClick={() => edit(r)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Ubah
                    </button>
                    <details className="t-note">
                      <summary className="cursor-pointer font-bold text-slate-800 underline">Riwayat</summary>
                      {r.riwayat.map((h, i) => <div key={i}>{h.waktu.slice(0, 16).replace('T', ' ')}: {h.aktivitas}</div>)}
                    </details>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8}><EmptyState text="Belum ada data di daftar ini." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
