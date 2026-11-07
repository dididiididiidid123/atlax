import { notify } from '../utils/toast';
import { EmptyState } from './EmptyState';
import { printArea } from '../utils/printArea';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleAlert, CircleCheck, FileText, Hourglass, Info, ReceiptText, ScrollText, Wallet } from 'lucide-react';
import { ComprehensiveTaxState, UniversalTaxResult } from '../types/tax';
import { formatRupiah } from '../utils/taxCalculator';
import {
  AccountingStore,
  JournalEntry,
  STORAGE_KEY as ACCOUNTING_KEY,
  emptyStore as emptyAccountingStore,
  nextJournalNumber,
} from '../utils/accounting';
import { appendAudit } from '../utils/auditTrail';
import { downloadExcel } from '../utils/excelXml';
import { RegisterModule } from './RegisterModule';
import { formatIdNumber, parseIdNumber } from './RupiahInput';
import {
  BILLING_JENIS,
  BUKTI_LABEL,
  Billing,
  BillingStatus,
  BuktiJenis,
  BuktiPotong,
  DocStatus,
  Faktur,
  FakturJenis,
  RiwayatItem,
  STATUS_LABEL,
  TAX_ADMIN_STORAGE_KEY,
  TaxAdminStore,
  calcBukti,
  calcFaktur,
  emptyTaxAdminStore,
  isValidNik,
  isValidNpwp,
  isValidNpwpOrNik,
  isValidRate,
  nextNumber,
  nowIso,
  sortByDate,
} from '../utils/taxAdmin';

type Tab = 'BUKTI' | 'FAKTUR' | 'BILLING' | 'LAINNYA';
type PrintTarget = { kind: Tab; id: string } | null;

interface TaxAdminModuleProps {
  multiState: ComprehensiveTaxState;
  multiCalc: UniversalTaxResult;
  onApplyPpn: (values: { outputDpp: number; inputPpn: number; ppnbmDpp: number; ppnbmRate: number }) => void;
}

// Nama menu dibuat sehari-hari. Kalimat di bawah menjelaskan apa yang dilakukan di menu yang sedang dibuka.
const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'BUKTI', label: 'Bukti potong', hint: 'Catat pajak yang dipotong dari pembayaran, misalnya gaji atau jasa.' },
  { id: 'FAKTUR', label: 'Faktur pajak', hint: 'Catat faktur pajak untuk penjualan dan pembelian yang kena PPN.' },
  { id: 'BILLING', label: 'Bayar pajak (e-Billing)', hint: 'Buat billing (kode pembayaran pajak), lalu tandai setelah Anda membayar.' },
  { id: 'LAINNYA', label: 'Lainnya', hint: 'Catat pemindahbukuan, tagihan pajak, atau restitusi (uang pajak yang dikembalikan).' },
];

const inputClass = 'field';
const cardClass = 'card';
const btnPrimary = 'btn-primary';
const btnGhost = 'btn-secondary';
const btnSoft = 'btn-soft';
const thLeft = 't-label p-3 text-left align-bottom';
const thRight = 't-label p-3 text-right align-bottom';
const tdClass = 't-note p-3 align-top text-slate-900';
const tdRight = 't-note p-3 text-right align-top text-slate-900';

const todayIso = () => new Date().toISOString().slice(0, 10);

const loadStore = (): TaxAdminStore => {
  try {
    const raw = localStorage.getItem(TAX_ADMIN_STORAGE_KEY);
    if (!raw) return emptyTaxAdminStore();
    const parsed = JSON.parse(raw) as TaxAdminStore;
    return parsed.bukti && parsed.faktur && parsed.billing ? parsed : emptyTaxAdminStore();
  } catch {
    return emptyTaxAdminStore();
  }
};


// Semua ekspor menghasilkan file Excel (.xls)
const downloadCsv = (name: string, rows: (string | number)[][]) => {
  downloadExcel(name.replace(/\.csv$/, ''), [{ name: 'Data', rows }]);
};

const StatusPill: React.FC<{ status: DocStatus | BillingStatus }> = ({ status }) => {
  const map: Record<string, string> = {
    AKTIF: 'chip-ok',
    DIBATALKAN: 'chip-neutral',
    DIGANTI: 'chip-neutral',
    BELUM_DIBAYAR: 'chip-warn',
    MENUNGGU_KONFIRMASI: 'chip-info',
    LUNAS: 'chip-ok',
  };
  const label: Record<string, string> = {
    AKTIF: 'Aktif',
    DIBATALKAN: 'Dibatalkan',
    DIGANTI: 'Diganti',
    ...STATUS_LABEL,
  };
  return <span className={map[status]}>{label[status]}</span>;
};

// Dokumen cetak: satu dokumen per halaman, rapi dalam tabel, dan selalu ditandai internal
const PrintDocument: React.FC<{ title: string; rows: [string, string][]; footer?: string }> = ({ title, rows, footer }) => (
  <div className="hidden print:block print-area">
    <p className="text-xs font-bold tracking-wide text-slate-600">ATLAX, Make Tax Reporting Simpler</p>
    <h1 className="t-card mb-1 text-black">{title}</h1>
    <p className="text-xs text-slate-700 mb-3">Dokumen internal ATLAX. Bukan dokumen resmi DJP.</p>
    <table className="w-full border-collapse text-xs text-black">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="border border-slate-500 p-2 font-bold w-1/3 bg-slate-100">{label}</td>
            <td className="border border-slate-500 p-2">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {footer && <p className="text-xs text-slate-600 mt-3">{footer}</p>}
  </div>
);

export const TaxAdminModule: React.FC<TaxAdminModuleProps> = ({ multiState, multiCalc, onApplyPpn }) => {
  const [tab, setTab] = useState<Tab>('BUKTI');
  const [store, setStore] = useState<TaxAdminStore>(loadStore);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [printTarget, setPrintTarget] = useState<PrintTarget>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(TAX_ADMIN_STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const showMessage = (type: 'ok' | 'error', text: string) => {
    notify(type, text);
    setTimeout(() => setMessage(null), 4000);
  };

  const startPrint = (kind: Tab, id: string) => {
    setPrintTarget({ kind, id });
    setTimeout(() => {
      printArea();
    }, 50);
  };

  // ---------------- e-BUPOT ----------------
  const emptyBukti = () => ({
    tanggal: todayIso(),
    jenis: 'PPH_21' as BuktiJenis,
    pemotongNama: '',
    pemotongNpwp: '',
    penerimaNama: '',
    penerimaId: '',
    objek: '',
    masa: '1',
    tahun: multiState.profile.taxYear,
    bruto: 0,
    dppOverride: 0,
    tarif: 0,
  });
  const [bForm, setBForm] = useState(emptyBukti);
  const [bEditingId, setBEditingId] = useState<string | null>(null);
  const bPreview = calcBukti(bForm.bruto, bForm.tarif, bForm.dppOverride);

  const saveBukti = () => {
    setFormError('');
    if (!bForm.pemotongNama.trim()) return setFormError('Nama pemotong wajib diisi.');
    if (!isValidNpwp(bForm.pemotongNpwp)) return setFormError('NPWP pemotong harus 15 atau 16 digit.');
    if (!bForm.penerimaNama.trim()) return setFormError('Nama penerima penghasilan wajib diisi.');
    if (!isValidNpwpOrNik(bForm.penerimaId)) return setFormError('NPWP atau NIK penerima harus 15, 16, atau 16 digit.');
    if (!bForm.objek.trim()) return setFormError('Jenis objek pajak wajib diisi.');
    if (!bForm.masa) return setFormError('Masa pajak wajib diisi.');
    if (bForm.bruto <= 0) return setFormError('Jumlah bruto harus lebih dari nol.');
    if (!isValidRate(bForm.tarif)) return setFormError('Tarif harus antara 0 dan 100 persen.');

    const { dpp, pajak } = calcBukti(bForm.bruto, bForm.tarif, bForm.dppOverride);
    const data = {
      tanggal: bForm.tanggal,
      jenis: bForm.jenis,
      pemotongNama: bForm.pemotongNama.trim(),
      pemotongNpwp: bForm.pemotongNpwp.replace(/\D/g, ''),
      penerimaNama: bForm.penerimaNama.trim(),
      penerimaId: bForm.penerimaId.replace(/\D/g, ''),
      objek: bForm.objek.trim(),
      masa: bForm.masa,
      tahun: bForm.tahun,
      bruto: bForm.bruto,
      dpp,
      tarif: bForm.tarif,
      pajakDipotong: pajak,
    };

    if (bEditingId) {
      setStore((prev) => ({
        ...prev,
        bukti: prev.bukti.map((b) => {
          if (b.id !== bEditingId) return b;
          const note: RiwayatItem = {
            waktu: nowIso(),
            aktivitas: `Diubah. Sebelum: pajak ${formatRupiah(b.pajakDipotong)} (tarif ${b.tarif}%). Sesudah: pajak ${formatRupiah(pajak)} (tarif ${data.tarif}%).`,
          };
          return { ...b, ...data, riwayat: [...b.riwayat, note] };
        }),
      }));
      appendAudit({ modul: 'Bukti Potong', aktivitas: 'Bukti potong diubah', dokumen: bEditingId, sebelum: `Pajak ${formatRupiah(bForm.bruto)} (lihat riwayat dokumen)`, sesudah: `Pajak ${formatRupiah(pajak)} tarif ${data.tarif}%`, keterangan: data.penerimaNama });
      showMessage('ok', 'Bukti potong diperbarui.');
    } else {
      const count = store.bukti.filter((b) => b.tahun === bForm.tahun).length;
      const record: BuktiPotong = {
        id: `bp-${Date.now()}`,
        nomorInternal: nextNumber('BP', bForm.tahun, count),
        ...data,
        status: 'AKTIF',
        riwayat: [{ waktu: nowIso(), aktivitas: 'Dibuat' }],
      };
      setStore((prev) => ({ ...prev, bukti: [...prev.bukti, record] }));
      appendAudit({ modul: 'Bukti Potong', aktivitas: 'Bukti potong dibuat', dokumen: record.nomorInternal, sebelum: '-', sesudah: `Pajak ${formatRupiah(record.pajakDipotong)} tarif ${record.tarif}%`, keterangan: record.penerimaNama });
      showMessage('ok', `Bukti potong ${record.nomorInternal} disimpan.`);
    }
    setBEditingId(null);
    setBForm(emptyBukti());
  };

  const editBukti = (b: BuktiPotong) => {
    setBEditingId(b.id);
    setBForm({
      tanggal: b.tanggal,
      jenis: b.jenis,
      pemotongNama: b.pemotongNama,
      pemotongNpwp: b.pemotongNpwp,
      penerimaNama: b.penerimaNama,
      penerimaId: b.penerimaId,
      objek: b.objek,
      masa: b.masa,
      tahun: b.tahun,
      bruto: b.bruto,
      dppOverride: b.dpp !== b.bruto ? b.dpp : 0,
      tarif: b.tarif,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelBukti = (b: BuktiPotong) => {
    if (b.status !== 'AKTIF') return;
    const alasan = window.prompt(`Alasan pembatalan ${b.nomorInternal}:`);
    if (!alasan || !alasan.trim()) return;
    setStore((prev) => ({
      ...prev,
      bukti: prev.bukti.map((x) =>
        x.id === b.id ? { ...x, status: 'DIBATALKAN', riwayat: [...x.riwayat, { waktu: nowIso(), aktivitas: `Dibatalkan. Alasan: ${alasan.trim()}` }] } : x
      ),
    }));
    appendAudit({ modul: 'Bukti Potong', aktivitas: 'Bukti potong dibatalkan', dokumen: b.nomorInternal, sebelum: 'AKTIF', sesudah: 'DIBATALKAN', keterangan: 'Alasan tercatat di riwayat dokumen' });
    showMessage('ok', `${b.nomorInternal} dibatalkan. Riwayat tetap tersimpan.`);
  };

  // ---------------- FAKTUR PAJAK ----------------
  const emptyFaktur = () => ({
    tanggal: todayIso(),
    jenis: 'KELUARAN' as FakturJenis,
    nomorFaktur: '',
    penjualNama: '',
    penjualNpwp: '',
    pembeliNama: '',
    pembeliId: '',
    namaBarang: '',
    jumlah: 1,
    hargaSatuan: 0,
    tarifPpn: 11,
    tarifPpnbm: 0,
  });
  const [fForm, setFForm] = useState(emptyFaktur);
  const [fEditingId, setFEditingId] = useState<string | null>(null);
  const [fGantiDari, setFGantiDari] = useState<string | null>(null);
  const fPreview = calcFaktur(fForm.jumlah, fForm.hargaSatuan, fForm.tarifPpn, fForm.tarifPpnbm);

  const saveFaktur = () => {
    setFormError('');
    if (fForm.jenis === 'KELUARAN' && !(multiState.profile.isPkp ?? false)) {
      return setFormError('Status masih Belum PKP. Hanya PKP yang boleh membuat faktur pajak keluaran. Ubah status PKP di kalkulator dulu.');
    }
    if (!fForm.nomorFaktur.trim()) return setFormError('Nomor faktur wajib diisi dari nomor seri DJP.');
    if (!/^[0-9.\-\s]+$/.test(fForm.nomorFaktur.trim())) return setFormError('Nomor faktur hanya boleh berisi angka, titik, dan tanda hubung.');
    if (!fForm.penjualNama.trim()) return setFormError('Nama penjual wajib diisi.');
    if (!isValidNpwp(fForm.penjualNpwp)) return setFormError('NPWP penjual harus 15 atau 16 digit.');
    if (!fForm.pembeliNama.trim()) return setFormError('Nama pembeli wajib diisi.');
    if (!isValidNpwpOrNik(fForm.pembeliId)) return setFormError('NPWP atau NIK pembeli harus 15 atau 16 digit.');
    if (!fForm.namaBarang.trim()) return setFormError('Nama barang atau jasa wajib diisi.');
    if (fForm.jumlah <= 0) return setFormError('Jumlah harus lebih dari nol.');
    if (fForm.hargaSatuan < 0) return setFormError('Harga satuan tidak boleh negatif.');
    if (!isValidRate(fForm.tarifPpn) || !isValidRate(fForm.tarifPpnbm)) return setFormError('Tarif PPN dan PPnBM harus antara 0 dan 100 persen.');

    const { dpp, ppn, ppnbm, total } = calcFaktur(fForm.jumlah, fForm.hargaSatuan, fForm.tarifPpn, fForm.tarifPpnbm);
    const data = {
      nomorFaktur: fForm.nomorFaktur.trim(),
      tanggal: fForm.tanggal,
      jenis: fForm.jenis,
      penjualNama: fForm.penjualNama.trim(),
      penjualNpwp: fForm.penjualNpwp.replace(/\D/g, ''),
      pembeliNama: fForm.pembeliNama.trim(),
      pembeliId: fForm.pembeliId.replace(/\D/g, ''),
      namaBarang: fForm.namaBarang.trim(),
      jumlah: fForm.jumlah,
      hargaSatuan: fForm.hargaSatuan,
      dpp,
      tarifPpn: fForm.tarifPpn,
      ppn,
      tarifPpnbm: fForm.tarifPpnbm,
      ppnbm,
      total,
    };

    if (fEditingId) {
      setStore((prev) => ({
        ...prev,
        faktur: prev.faktur.map((f) =>
          f.id === fEditingId
            ? { ...f, ...data, riwayat: [...f.riwayat, { waktu: nowIso(), aktivitas: `Diubah. Total sebelum ${formatRupiah(f.total)}, sesudah ${formatRupiah(total)}.` }] }
            : f
        ),
      }));
      appendAudit({ modul: 'Faktur Pajak', aktivitas: 'Faktur diubah', dokumen: fEditingId, sebelum: '-', sesudah: `Total ${formatRupiah(total)}`, keterangan: data.namaBarang });
      showMessage('ok', 'Faktur pajak diperbarui.');
    } else {
      const year = Number(fForm.tanggal.slice(0, 4));
      const count = store.faktur.filter((f) => f.tanggal.startsWith(String(year))).length;
      const id = `fp-${Date.now()}`;
      const record: Faktur = {
        id,
        nomorInternal: nextNumber('FP', year, count),
        ...data,
        status: 'AKTIF',
        gantiDariId: fGantiDari ?? undefined,
        riwayat: [{ waktu: nowIso(), aktivitas: fGantiDari ? 'Dibuat sebagai penggantian faktur lain' : 'Dibuat' }],
      };
      setStore((prev) => ({
        ...prev,
        faktur: [
          ...prev.faktur.map((f) =>
            f.id === fGantiDari ? { ...f, status: 'DIGANTI' as DocStatus, riwayat: [...f.riwayat, { waktu: nowIso(), aktivitas: `Diganti oleh ${record.nomorInternal}` }] } : f
          ),
          record,
        ],
      }));
      appendAudit({ modul: 'Faktur Pajak', aktivitas: fGantiDari ? 'Faktur diganti' : 'Faktur dibuat', dokumen: record.nomorInternal, sebelum: fGantiDari ? `Faktur lama ${fGantiDari}` : '-', sesudah: `Total ${formatRupiah(total)}`, keterangan: record.namaBarang });
      showMessage('ok', `Faktur ${record.nomorInternal} disimpan.`);
    }
    setFEditingId(null);
    setFGantiDari(null);
    setFForm(emptyFaktur());
  };

  const editFaktur = (f: Faktur) => {
    setFEditingId(f.id);
    setFGantiDari(null);
    setFForm({
      tanggal: f.tanggal,
      jenis: f.jenis,
      nomorFaktur: f.nomorFaktur,
      penjualNama: f.penjualNama,
      penjualNpwp: f.penjualNpwp,
      pembeliNama: f.pembeliNama,
      pembeliId: f.pembeliId,
      namaBarang: f.namaBarang,
      jumlah: f.jumlah,
      hargaSatuan: f.hargaSatuan,
      tarifPpn: f.tarifPpn,
      tarifPpnbm: f.tarifPpnbm,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const gantiFaktur = (f: Faktur) => {
    if (f.status !== 'AKTIF') return;
    setFEditingId(null);
    setFGantiDari(f.id);
    setFForm({ ...f, nomorFaktur: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelFaktur = (f: Faktur) => {
    if (f.status !== 'AKTIF') return;
    const alasan = window.prompt(`Alasan pembatalan faktur ${f.nomorInternal}:`);
    if (!alasan || !alasan.trim()) return;
    setStore((prev) => ({
      ...prev,
      faktur: prev.faktur.map((x) =>
        x.id === f.id ? { ...x, status: 'DIBATALKAN', riwayat: [...x.riwayat, { waktu: nowIso(), aktivitas: `Dibatalkan. Alasan: ${alasan.trim()}` }] } : x
      ),
    }));
    appendAudit({ modul: 'Faktur Pajak', aktivitas: 'Faktur dibatalkan', dokumen: f.nomorInternal, sebelum: 'AKTIF', sesudah: 'DIBATALKAN', keterangan: 'Alasan tercatat di riwayat dokumen' });
    showMessage('ok', `${f.nomorInternal} dibatalkan.`);
  };

  // ---------------- e-BILLING ----------------
  const emptyBilling = () => ({
    jenisPajak: BILLING_JENIS[0].label,
    kap: '',
    kjs: '',
    masa: String(multiState.selectedMonth),
    tahun: multiState.profile.taxYear,
    nominal: 0,
    jatuhTempo: '',
    kodeBillingResmi: '',
  });
  const [billForm, setBillForm] = useState(emptyBilling);
  const [billEditingId, setBillEditingId] = useState<string | null>(null);

  const billingFromCalculator = () => {
    const jenisMap: Record<string, string> = {
      PPH_21: 'PPh Pasal 21',
      PPH_22: 'PPh Pasal 22',
      PPH_23: 'PPh Pasal 23',
      PPH_25: 'PPh Pasal 25',
      PPH_26: 'PPh Pasal 26',
      PPH_4_2: 'PPh Final Pasal 4(2)',
      PPN: 'PPN',
    };
    const jenis = jenisMap[multiState.selectedReportingType];
    if (!jenis) return showMessage('error', 'Jenis pajak dari kalkulator ini belum punya pilihan billing. Pilih manual.');
    setBillForm({
      ...billForm,
      jenisPajak: jenis,
      masa: multiState.reportingPeriod === 'MONTHLY' ? String(multiState.selectedMonth) : 'Tahunan',
      tahun: multiState.profile.taxYear,
      nominal: Math.max(0, Math.round(multiCalc.finalBalanceDue)),
    });
    showMessage('ok', 'Data diisi dari kalkulator. Periksa sebelum disimpan.');
  };

  const saveBilling = () => {
    setFormError('');
    const jenis = BILLING_JENIS.find((j) => j.label === billForm.jenisPajak);
    if (!jenis) return setFormError('Pilih jenis pajak.');
    if (!billForm.kap.trim()) return setFormError('Kode Akun Pajak (KAP) wajib diisi sesuai ketentuan yang berlaku.');
    if (!billForm.kjs.trim()) return setFormError('Kode Jenis Setoran (KJS) wajib diisi sesuai ketentuan yang berlaku.');
    if (!billForm.masa) return setFormError('Masa pajak wajib diisi.');
    if (billForm.nominal <= 0) return setFormError('Nominal pembayaran harus lebih dari nol.');
    if (!billForm.jatuhTempo) return setFormError('Tanggal jatuh tempo wajib diisi.');

    if (billEditingId) {
      setStore((prev) => ({
        ...prev,
        billing: prev.billing.map((b) =>
          b.id === billEditingId
            ? {
                ...b,
                jenisPajak: jenis.label,
                utangKode: jenis.utangKode,
                kap: billForm.kap.trim(),
                kjs: billForm.kjs.trim(),
                masa: billForm.masa,
                tahun: billForm.tahun,
                nominal: billForm.nominal,
                jatuhTempo: billForm.jatuhTempo,
                kodeBillingResmi: billForm.kodeBillingResmi.trim(),
                riwayat: [...b.riwayat, { waktu: nowIso(), aktivitas: `Diubah. Nominal ${formatRupiah(b.nominal)} menjadi ${formatRupiah(billForm.nominal)}.` }],
              }
            : b
        ),
      }));
      showMessage('ok', 'Data billing diperbarui.');
    } else {
      const count = store.billing.filter((b) => b.tahun === billForm.tahun).length;
      const record: Billing = {
        id: `bl-${Date.now()}`,
        nomorReferensi: nextNumber('REF', billForm.tahun, count),
        jenisPajak: jenis.label,
        utangKode: jenis.utangKode,
        kap: billForm.kap.trim(),
        kjs: billForm.kjs.trim(),
        masa: billForm.masa,
        tahun: billForm.tahun,
        nominal: billForm.nominal,
        tanggalBuat: todayIso(),
        jatuhTempo: billForm.jatuhTempo,
        kodeBillingResmi: billForm.kodeBillingResmi.trim(),
        status: 'BELUM_DIBAYAR',
        buktiNama: '',
        jurnalDibuat: false,
        riwayat: [{ waktu: nowIso(), aktivitas: 'Billing dibuat (Belum Dibayar)' }],
      };
      setStore((prev) => ({ ...prev, billing: [...prev.billing, record] }));
      appendAudit({ modul: 'Billing', aktivitas: 'Billing dibuat', dokumen: record.nomorReferensi, sebelum: '-', sesudah: `${record.jenisPajak} ${formatRupiah(record.nominal)} (Belum Dibayar)`, keterangan: `Jatuh tempo ${record.jatuhTempo}` });
      showMessage('ok', `Billing ${record.nomorReferensi} dibuat.`);
    }
    setBillEditingId(null);
    setBillForm(emptyBilling());
  };

  const nextBillingStep = (b: Billing) => {
    if (b.status === 'BELUM_DIBAYAR') {
      setStore((prev) => ({
        ...prev,
        billing: prev.billing.map((x) =>
          x.id === b.id ? { ...x, status: 'MENUNGGU_KONFIRMASI', riwayat: [...x.riwayat, { waktu: nowIso(), aktivitas: 'Pembayaran dikirim, menunggu konfirmasi' }] } : x
        ),
      }));
      appendAudit({ modul: 'Billing', aktivitas: 'Status diubah', dokumen: b.nomorReferensi, sebelum: 'Belum Dibayar', sesudah: 'Menunggu Konfirmasi', keterangan: b.jenisPajak });
      return showMessage('ok', `${b.nomorReferensi} menunggu konfirmasi.`);
    }
    if (b.status === 'MENUNGGU_KONFIRMASI') {
      const bukti = window.prompt('Nama file bukti pembayaran (wajib untuk status Lunas):', '');
      if (!bukti || !bukti.trim()) return;
      confirmLunas(b, bukti.trim());
    }
  };

  // Konfirmasi lunas: status berubah, dan rancangan jurnal pembayaran dibuat sebagai draf (tidak diposting otomatis)
  const confirmLunas = (b: Billing, buktiNama: string) => {
    const accountingRaw = localStorage.getItem(ACCOUNTING_KEY);
    const accounting: AccountingStore = accountingRaw ? JSON.parse(accountingRaw) : emptyAccountingStore();
    const sourceKey = `BILLING:${b.id}`;
    const alreadyJournaled = accounting.journals.some((j) => j.sourceKey === sourceKey && j.status !== 'REVERSED' && j.status !== 'REVERSAL');
    if (!alreadyJournaled) {
      const draft: JournalEntry = {
        id: `pay-${b.id}-${Date.now()}`,
        number: nextJournalNumber(accounting.journals, Number(todayIso().slice(0, 4))),
        date: todayIso(),
        reference: b.nomorReferensi,
        description: `Pembayaran ${b.jenisPajak} masa ${b.masa} ${b.tahun}`,
        lines: [
          { accountCode: b.utangKode, debit: b.nominal, credit: 0 },
          { accountCode: '1101', debit: 0, credit: b.nominal },
        ],
        status: 'DRAFT',
        attachmentName: buktiNama,
        sourceKey,
        createdAt: nowIso(),
      };
      accounting.journals = [...accounting.journals, draft];
      localStorage.setItem(ACCOUNTING_KEY, JSON.stringify(accounting));
    }
    setStore((prev) => ({
      ...prev,
      billing: prev.billing.map((x) =>
        x.id === b.id
          ? {
              ...x,
              status: 'LUNAS',
              buktiNama,
              jurnalDibuat: true,
              riwayat: [...x.riwayat, { waktu: nowIso(), aktivitas: `Lunas. Bukti: ${buktiNama}. Draf jurnal pembayaran dibuat di Pembukuan.` }],
            }
          : x
      ),
    }));
    appendAudit({ modul: 'Billing', aktivitas: 'Status diubah ke Lunas', dokumen: b.nomorReferensi, sebelum: 'Menunggu Konfirmasi', sesudah: 'Lunas', keterangan: `Bukti: ${buktiNama}${alreadyJournaled ? '' : ' | draf jurnal dibuat'}` });
    showMessage('ok', alreadyJournaled ? 'Status Lunas. Jurnal pembayaran sudah ada, tidak dibuat ulang.' : 'Status Lunas. Draf jurnal pembayaran sudah dibuat di Pembukuan (Catatan transaksi) untuk diperiksa dan diposting.');
  };

  const editBilling = (b: Billing) => {
    if (b.status === 'LUNAS') return showMessage('error', 'Billing yang sudah lunas tidak bisa diubah.');
    setBillEditingId(b.id);
    setBillForm({
      jenisPajak: b.jenisPajak,
      kap: b.kap,
      kjs: b.kjs,
      masa: b.masa,
      tahun: b.tahun,
      nominal: b.nominal,
      jatuhTempo: b.jatuhTempo,
      kodeBillingResmi: b.kodeBillingResmi,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------- Daftar dan filter ----------------
  const [filterYear, setFilterYear] = useState(multiState.profile.taxYear);
  const bukti = useMemo(() => sortByDate(store.bukti.filter((b) => b.tahun === filterYear)), [store.bukti, filterYear]);
  const faktur = useMemo(() => sortByDate(store.faktur.filter((f) => Number(f.tanggal.slice(0, 4)) === filterYear)), [store.faktur, filterYear]);
  const billing = useMemo(() => sortByDate(store.billing.filter((b) => b.tahun === filterYear)), [store.billing, filterYear]);

  const exportCsv = () => {
    if (tab === 'BUKTI') {
      downloadCsv('e-bupot-atlax.csv', [
        ['Nomor internal', 'Tanggal', 'Jenis', 'Pemotong', 'NPWP pemotong', 'Penerima', 'NPWP/NIK penerima', 'Objek', 'Masa', 'Tahun', 'Bruto', 'DPP', 'Tarif %', 'Pajak dipotong', 'Status'],
        ...bukti.map((b) => [b.nomorInternal, b.tanggal, BUKTI_LABEL[b.jenis], b.pemotongNama, b.pemotongNpwp, b.penerimaNama, b.penerimaId, b.objek, b.masa, b.tahun, b.bruto, b.dpp, b.tarif, b.pajakDipotong, b.status]),
      ]);
    } else if (tab === 'FAKTUR') {
      downloadCsv('faktur-pajak-atlax.csv', [
        ['Nomor internal', 'Nomor faktur', 'Tanggal', 'Jenis', 'Penjual', 'NPWP penjual', 'Pembeli', 'NPWP/NIK pembeli', 'Barang/jasa', 'Jumlah', 'Harga', 'DPP', 'PPN', 'PPnBM', 'Total', 'Status'],
        ...faktur.map((f) => [f.nomorInternal, f.nomorFaktur, f.tanggal, f.jenis, f.penjualNama, f.penjualNpwp, f.pembeliNama, f.pembeliId, f.namaBarang, f.jumlah, f.hargaSatuan, f.dpp, f.ppn, f.ppnbm, f.total, f.status]),
      ]);
    } else {
      downloadCsv('e-billing-atlax.csv', [
        ['Nomor referensi', 'Jenis pajak', 'KAP', 'KJS', 'Masa', 'Tahun', 'Nominal', 'Tanggal buat', 'Jatuh tempo', 'Kode billing resmi', 'Status', 'Bukti'],
        ...billing.map((b) => [b.nomorReferensi, b.jenisPajak, b.kap, b.kjs, b.masa, b.tahun, b.nominal, b.tanggalBuat, b.jatuhTempo, b.kodeBillingResmi, STATUS_LABEL[b.status], b.buktiNama]),
      ]);
    }
  };

  // ---------------- Dokumen cetak ----------------
  const printDoc = (() => {
    if (!printTarget) return null;
    if (printTarget.kind === 'BUKTI') {
      const b = store.bukti.find((x) => x.id === printTarget.id);
      if (!b) return null;
      return (
        <PrintDocument
          title={`Bukti Pemotongan ${BUKTI_LABEL[b.jenis]}`}
          rows={[
            ['Nomor internal', b.nomorInternal],
            ['Status', b.status === 'AKTIF' ? 'Aktif' : 'Dibatalkan'],
            ['Tanggal pemotongan', b.tanggal],
            ['Masa pajak / tahun', `${b.masa} / ${b.tahun}`],
            ['Pemotong', `${b.pemotongNama} (NPWP ${b.pemotongNpwp})`],
            ['Penerima penghasilan', `${b.penerimaNama} (NPWP/NIK ${b.penerimaId})`],
            ['Jenis objek pajak', b.objek],
            ['Jumlah bruto', formatRupiah(b.bruto)],
            ['DPP', formatRupiah(b.dpp)],
            ['Tarif', `${b.tarif}%`],
            ['Pajak dipotong', formatRupiah(b.pajakDipotong)],
          ]}
          footer={`Riwayat: ${b.riwayat.map((r) => `${r.waktu.slice(0, 10)} ${r.aktivitas}`).join(' | ')}`}
        />
      );
    }
    if (printTarget.kind === 'FAKTUR') {
      const f = store.faktur.find((x) => x.id === printTarget.id);
      if (!f) return null;
      return (
        <PrintDocument
          title={`Faktur Pajak ${f.jenis === 'KELUARAN' ? 'Keluaran' : 'Masukan'} (Internal)`}
          rows={[
            ['Nomor internal', f.nomorInternal],
            ['Nomor faktur (dari DJP)', f.nomorFaktur],
            ['Status', f.status === 'AKTIF' ? 'Aktif' : f.status === 'DIBATALKAN' ? 'Dibatalkan' : 'Diganti'],
            ['Tanggal', f.tanggal],
            ['Penjual', `${f.penjualNama} (NPWP ${f.penjualNpwp})`],
            ['Pembeli', `${f.pembeliNama} (NPWP/NIK ${f.pembeliId})`],
            ['Nama barang / jasa', f.namaBarang],
            ['Jumlah x harga satuan', `${f.jumlah} x ${formatRupiah(f.hargaSatuan)}`],
            ['DPP', formatRupiah(f.dpp)],
            ['PPN', `${formatRupiah(f.ppn)} (${f.tarifPpn}%)`],
            ['PPnBM', `${formatRupiah(f.ppnbm)} (${f.tarifPpnbm}%)`],
            ['Total transaksi', formatRupiah(f.total)],
          ]}
        />
      );
    }
    const b = store.billing.find((x) => x.id === printTarget.id);
    if (!b) return null;
    return (
      <PrintDocument
        title="Billing dan Pembayaran Pajak (Internal)"
        rows={[
          ['Nomor referensi internal', b.nomorReferensi],
          ['Kode billing resmi', b.kodeBillingResmi || 'Belum ada (diisi dari bank atau DJP)'],
          ['Jenis pajak', b.jenisPajak],
          ['KAP / KJS', `${b.kap} / ${b.kjs}`],
          ['Masa / tahun', `${b.masa} / ${b.tahun}`],
          ['Nominal', formatRupiah(b.nominal)],
          ['Tanggal billing dibuat', b.tanggalBuat],
          ['Jatuh tempo', b.jatuhTempo],
          ['Status pembayaran', STATUS_LABEL[b.status]],
          ['Bukti pembayaran', b.buktiNama || '-'],
        ]}
      />
    );
  })();

  const rowActionsBukti = (b: BuktiPotong) => (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" className="btn-soft btn-sm" onClick={() => editBukti(b)}>Edit</button>
      <button type="button" className="btn-secondary btn-sm" onClick={() => startPrint('BUKTI', b.id)}>Cetak PDF</button>
      {b.status === 'AKTIF' && <button type="button" className="btn-danger btn-sm" onClick={() => cancelBukti(b)}>Batalkan</button>}
      <button type="button" className="btn-secondary btn-sm" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>Riwayat</button>
    </div>
  );

  const summaryItems = [
    { label: 'Bukti potong aktif', hint: 'Bukti yang belum dibatalkan pada tahun ini.', value: store.bukti.filter((b) => b.status === 'AKTIF' && b.tahun === filterYear).length, tone: 'text-rose-800', iconBox: 'bg-rose-100 text-rose-800', Icon: ScrollText },
    { label: 'Faktur aktif', hint: 'Faktur yang belum dibatalkan atau diganti.', value: store.faktur.filter((f) => f.status === 'AKTIF' && f.tanggal.startsWith(String(filterYear))).length, tone: 'text-emerald-800', iconBox: 'bg-emerald-100 text-emerald-800', Icon: FileText },
    { label: 'Billing belum lunas', hint: 'Masih menunggu dibayar atau menunggu konfirmasi.', value: store.billing.filter((b) => b.status !== 'LUNAS' && b.tahun === filterYear).length, tone: 'text-amber-900', iconBox: 'bg-amber-100 text-amber-900', Icon: Hourglass },
    { label: 'Pajak dipotong (aktif)', hint: 'Total pajak dari bukti potong yang aktif.', value: formatRupiah(store.bukti.filter((b) => b.status === 'AKTIF' && b.tahun === filterYear).reduce((s, b) => s + b.pajakDipotong, 0)), tone: 'text-slate-900', iconBox: 'bg-slate-100 text-slate-800', Icon: Wallet },
  ];

  return (
    <section className="space-y-5">
      <div className="module-enter rounded-3xl border border-rose-200  p-6 shadow-soft">
        <span className="t-kicker inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-rose-800">
          <ReceiptText className="h-5 w-5" aria-hidden="true" />
          Administrasi Pajak
        </span>
        <h2 className="t-page mt-4">Catatan dokumen pajak Anda</h2>
        <p className="t-body mt-3">
          Catatan ini hanya tersimpan di perangkat Anda. Nomor resmi seperti nomor faktur, kode billing, dan NTPN diberikan oleh DJP atau bank.
        </p>
      </div>

      <div className="card space-y-6 print:hidden">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={`card-lift flex min-h-[5rem] items-center gap-3 p-4 text-left ${active ? 'border-rose-700 bg-rose-50 ring-4 ring-rose-200' : 'hover:border-rose-300'}`}
              >
                <span className="t-body flex-1 font-bold text-slate-900">{t.label}</span>
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
        <div>
          <label htmlFor="fld-taxadminmodule-1" className="t-label mb-2 block">Tahun yang dilihat</label>
          <input id="fld-taxadminmodule-1" type="text" inputMode="numeric" className="field w-full sm:w-40" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value) || 0)} />
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <Info className="mt-0.5 h-6 w-6 shrink-0 text-rose-800" aria-hidden="true" />
          <p className="t-body text-rose-900">{TABS.find((x) => x.id === tab)?.hint}</p>
        </div>
      </div>

      {message && (
        <div role="status" className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-3 ${message.type === 'ok' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          {message.type === 'ok'
            ? <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-800" aria-hidden="true" />
            : <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-rose-800" aria-hidden="true" />}
          <p className={`t-body font-bold ${message.type === 'ok' ? 'text-emerald-900' : 'text-rose-900'}`}>{message.text}</p>
        </div>
      )}


      {/* RINGKASAN CEPAT */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        {summaryItems.map((item) => (
          <div key={item.label} className="card">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.iconBox}`}>
                <item.Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="t-label">{item.label}</p>
            </div>
            <p className={`t-section mt-4 break-words ${item.tone}`}>{item.value}</p>
            <p className="t-note mt-2">{item.hint}</p>
          </div>
        ))}
      </div>

      {/* e-BUPOT */}
      {tab === 'BUKTI' && (
        <div className="module-enter space-y-5 print:hidden">
          <div className={cardClass}>
            <h3 className="t-card">{bEditingId ? 'Ubah bukti potong' : 'Bukti potong baru'}</h3>
            <p className="t-body mt-2">Apa ini? Bukti potong adalah catatan pajak yang dipotong dari suatu pembayaran, misalnya gaji atau jasa.</p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="fld-taxadminmodule-2" className="t-label mb-2 block">Tanggal pemotongan</label>
                <input id="fld-taxadminmodule-2" type="date" className={inputClass} value={bForm.tanggal} onChange={(e) => setBForm({ ...bForm, tanggal: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-3" className="t-label mb-2 block">Jenis bukti potong</label>
                <select id="fld-taxadminmodule-3" className={inputClass} value={bForm.jenis} onChange={(e) => setBForm({ ...bForm, jenis: e.target.value as BuktiJenis })}>
                  {(Object.keys(BUKTI_LABEL) as BuktiJenis[]).map((k) => <option key={k} value={k}>{BUKTI_LABEL[k]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-4" className="t-label mb-2 block">Jenis penghasilan (objek pajak)</label>
                <input id="fld-taxadminmodule-4" className={inputClass} value={bForm.objek} onChange={(e) => setBForm({ ...bForm, objek: e.target.value })} placeholder="Contoh: gaji, jasa, sewa" />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-5" className="t-label mb-2 block">Nama pihak yang memotong pajak</label>
                <input id="fld-taxadminmodule-5" className={inputClass} value={bForm.pemotongNama} onChange={(e) => setBForm({ ...bForm, pemotongNama: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-6" className="t-label mb-2 block">NPWP pemotong (15 atau 16 angka)</label>
                <input id="fld-taxadminmodule-6" className={inputClass} value={bForm.pemotongNpwp} onChange={(e) => setBForm({ ...bForm, pemotongNpwp: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-7" className="t-label mb-2 block">Nama penerima penghasilan</label>
                <input id="fld-taxadminmodule-7" className={inputClass} value={bForm.penerimaNama} onChange={(e) => setBForm({ ...bForm, penerimaNama: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-8" className="t-label mb-2 block">NPWP atau NIK penerima</label>
                <input id="fld-taxadminmodule-8" className={inputClass} value={bForm.penerimaId} onChange={(e) => setBForm({ ...bForm, penerimaId: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fld-taxadminmodule-9" className="t-label mb-2 block">Masa pajak</label>
                  <input id="fld-taxadminmodule-9" className={inputClass} value={bForm.masa} onChange={(e) => setBForm({ ...bForm, masa: e.target.value })} placeholder="1-12 atau Tahunan" />
                </div>
                <div>
                  <label htmlFor="fld-taxadminmodule-10" className="t-label mb-2 block">Tahun pajak</label>
                  <input id="fld-taxadminmodule-10" type="number" className={inputClass} value={bForm.tahun} onChange={(e) => setBForm({ ...bForm, tahun: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-11" className="t-label mb-2 block">Jumlah bruto (Rp, total sebelum dipotong)</label>
                <input id="fld-taxadminmodule-11" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(bForm.bruto || '')} onChange={(e) => setBForm({ ...bForm, bruto: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-12" className="t-label mb-2 block">DPP (dasar pengenaan pajak, Rp). Kosongkan jika sama dengan bruto</label>
                <input id="fld-taxadminmodule-12" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(bForm.dppOverride || '')} onChange={(e) => setBForm({ ...bForm, dppOverride: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-13" className="t-label mb-2 block">Tarif (%)</label>
                <input id="fld-taxadminmodule-13" type="number" min="0" max="100" step="0.01" className={inputClass} value={bForm.tarif || ''} onChange={(e) => setBForm({ ...bForm, tarif: Number(e.target.value) })} />
              </div>
            </div>
            <div className="mt-6 space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="t-body font-bold text-rose-900">Pajak yang dipotong:</p>
              <p className="t-result break-words text-rose-800">{formatRupiah(bPreview.pajak)}</p>
              <p className="t-body text-slate-900">Cara hitungnya: DPP {formatRupiah(bPreview.dpp)} × tarif {bForm.tarif || 0}% = {formatRupiah(bPreview.pajak)}.</p>
              <details className="t-body text-slate-800">
                <summary className="cursor-pointer py-1 font-bold text-rose-800 underline">Lihat penjelasan</summary>
                <p className="mt-2">DPP sama dengan jumlah bruto, kecuali Anda mengisi DPP sendiri. Isi tarif sesuai ketentuan untuk jenis objek pajak Anda.</p>
              </details>
            </div>
            {formError && <p role="alert" className="mt-4 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 t-body font-bold text-rose-900">{formError}</p>}
            <div className="mt-6 flex flex-col flex-wrap gap-3 sm:flex-row">
              <button type="button" className={btnPrimary} onClick={saveBukti}>{bEditingId ? 'Simpan perubahan' : 'Simpan bukti potong'}</button>
              {bEditingId && <button type="button" className={btnGhost} onClick={() => { setBEditingId(null); setBForm(emptyBukti()); }}>Batal edit</button>}
              {multiState.selectedReportingType === 'PPH_21' && (
                <button type="button" className={btnSoft} onClick={() => setBForm({ ...bForm, bruto: multiState.pph21.grossSalaryMonthly, objek: bForm.objek || 'Gaji karyawan', jenis: 'PPH_21' })}>
                  Isi bruto dari kalkulator PPh 21
                </button>
              )}
            </div>
          </div>

          <div className={`${cardClass} overflow-x-auto`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="t-card">Daftar bukti potong {filterYear}</h3>
              <button type="button" className={btnSoft} onClick={exportCsv}>Ekspor Excel</button>
            </div>
            <p className="t-note mb-3 sm:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-rose-50">
                <tr>
                  <th className={thLeft}>Nomor</th><th className={thLeft}>Tanggal</th><th className={thLeft}>Jenis</th>
                  <th className={thLeft}>Penerima</th><th className={thRight}>Bruto</th><th className={thRight}>DPP</th>
                  <th className={thRight}>Tarif</th><th className={thRight}>Pajak dipotong</th><th className={thLeft}>Status</th><th className={thLeft}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {bukti.map((b) => (
                  <React.Fragment key={b.id}>
                    <tr className="border-t border-slate-100 transition-colors hover:bg-rose-50/60">
                      <td className={`${tdClass} font-bold`}>{b.nomorInternal}</td><td className={tdClass}>{b.tanggal}</td><td className={tdClass}>{BUKTI_LABEL[b.jenis]}</td>
                      <td className={tdClass}>{b.penerimaNama}<span className="block t-note">{b.penerimaId}</span></td>
                      <td className={tdRight}>{formatRupiah(b.bruto)}</td><td className={tdRight}>{formatRupiah(b.dpp)}</td>
                      <td className={tdRight}>{b.tarif}%</td><td className={tdRight}>{formatRupiah(b.pajakDipotong)}</td>
                      <td className={tdClass}><StatusPill status={b.status} /></td>
                      <td className={tdClass}>{rowActionsBukti(b)}</td>
                    </tr>
                    {expanded === b.id && (
                      <tr className="bg-slate-50"><td colSpan={10} className="p-3 t-note">
                        {b.riwayat.map((r, i) => <div key={i}>{r.waktu.slice(0, 16).replace('T', ' ')}: {r.aktivitas}</div>)}
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
                {bukti.length === 0 && <tr><td colSpan={10}><EmptyState text="Belum ada bukti potong untuk tahun ini. Isi formulir di atas untuk membuat yang pertama." /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAKTUR PAJAK */}
      {tab === 'FAKTUR' && (
        <div className="module-enter space-y-5 print:hidden">
          <div className={cardClass}>
            <h3 className="t-card">
              {fEditingId ? 'Ubah faktur pajak' : fGantiDari ? 'Penggantian faktur pajak' : 'Faktur pajak baru'}
            </h3>
            <p className="t-body mt-2">Apa ini? Faktur pajak adalah bukti PPN. Faktur keluaran untuk penjualan, faktur masukan untuk pembelian.</p>
            {fGantiDari && <p className="mt-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 t-body font-bold text-amber-900">Faktur ini menggantikan faktur sebelumnya. Faktur lama akan ditandai Diganti.</p>}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="fld-taxadminmodule-14" className="t-label mb-2 block">Tanggal faktur</label>
                <input id="fld-taxadminmodule-14" type="date" className={inputClass} value={fForm.tanggal} onChange={(e) => setFForm({ ...fForm, tanggal: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-15" className="t-label mb-2 block">Jenis</label>
                <select id="fld-taxadminmodule-15" className={inputClass} value={fForm.jenis} onChange={(e) => setFForm({ ...fForm, jenis: e.target.value as FakturJenis })}>
                  <option value="KELUARAN">Keluaran (penjualan)</option>
                  <option value="MASUKAN">Masukan (pembelian)</option>
                </select>
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-16" className="t-label mb-2 block">Nomor faktur (dari DJP)</label>
                <input id="fld-taxadminmodule-16" className={inputClass} value={fForm.nomorFaktur} onChange={(e) => setFForm({ ...fForm, nomorFaktur: e.target.value })} placeholder="Isi dari nomor seri resmi" />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-17" className="t-label mb-2 block">Nama penjual</label>
                <input id="fld-taxadminmodule-17" className={inputClass} value={fForm.penjualNama} onChange={(e) => setFForm({ ...fForm, penjualNama: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-18" className="t-label mb-2 block">NPWP penjual</label>
                <input id="fld-taxadminmodule-18" className={inputClass} value={fForm.penjualNpwp} onChange={(e) => setFForm({ ...fForm, penjualNpwp: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-19" className="t-label mb-2 block">Nama pembeli</label>
                <input id="fld-taxadminmodule-19" className={inputClass} value={fForm.pembeliNama} onChange={(e) => setFForm({ ...fForm, pembeliNama: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-20" className="t-label mb-2 block">NPWP / NIK pembeli</label>
                <input id="fld-taxadminmodule-20" className={inputClass} value={fForm.pembeliId} onChange={(e) => setFForm({ ...fForm, pembeliId: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-21" className="t-label mb-2 block">Nama barang atau jasa</label>
                <input id="fld-taxadminmodule-21" className={inputClass} value={fForm.namaBarang} onChange={(e) => setFForm({ ...fForm, namaBarang: e.target.value })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-22" className="t-label mb-2 block">Jumlah</label>
                <input id="fld-taxadminmodule-22" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(fForm.jumlah || '')} onChange={(e) => setFForm({ ...fForm, jumlah: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-23" className="t-label mb-2 block">Harga satuan (Rp)</label>
                <input id="fld-taxadminmodule-23" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(fForm.hargaSatuan || '')} onChange={(e) => setFForm({ ...fForm, hargaSatuan: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-24" className="t-label mb-2 block">Tarif PPN (%)</label>
                <input id="fld-taxadminmodule-24" type="number" min="0" max="100" step="0.01" className={inputClass} value={fForm.tarifPpn} onChange={(e) => setFForm({ ...fForm, tarifPpn: Number(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-25" className="t-label mb-2 block">Tarif PPnBM (%, jika berlaku)</label>
                <input id="fld-taxadminmodule-25" type="number" min="0" max="100" step="0.01" className={inputClass} value={fForm.tarifPpnbm} onChange={(e) => setFForm({ ...fForm, tarifPpnbm: Number(e.target.value) })} />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><p className="t-label">DPP (dasar pengenaan pajak)</p><p className="t-card mt-1 break-words">{formatRupiah(fPreview.dpp)}</p></div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><p className="t-label">PPN</p><p className="t-card mt-1 break-words">{formatRupiah(fPreview.ppn)}</p></div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><p className="t-label">PPnBM (pajak barang mewah)</p><p className="t-card mt-1 break-words">{formatRupiah(fPreview.ppnbm)}</p></div>
              <div className="rounded-2xl border border-rose-200 bg-rose-100 p-4 sm:col-span-2 lg:col-span-1"><p className="t-label">Total transaksi</p><p className="t-section mt-1 break-words text-rose-800">{formatRupiah(fPreview.total)}</p></div>
            </div>
            <details className="mt-4 t-body text-slate-800">
              <summary className="cursor-pointer py-1 font-bold text-rose-800 underline">Lihat penjelasan</summary>
              <p className="mt-2">DPP = jumlah × harga satuan. PPN = DPP × {fForm.tarifPpn}%. Total = DPP + PPN + PPnBM. Jenis Keluaran hanya untuk PKP.</p>
            </details>
            {formError && <p role="alert" className="mt-4 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 t-body font-bold text-rose-900">{formError}</p>}
            <div className="mt-6 flex flex-col flex-wrap gap-3 sm:flex-row">
              <button type="button" className={btnPrimary} onClick={saveFaktur}>{fEditingId ? 'Simpan perubahan' : fGantiDari ? 'Simpan penggantian' : 'Simpan faktur'}</button>
              {(fEditingId || fGantiDari) && <button type="button" className={btnGhost} onClick={() => { setFEditingId(null); setFGantiDari(null); setFForm(emptyFaktur()); }}>Batal</button>}
            </div>
          </div>

          <div className={`${cardClass} overflow-x-auto`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="t-card">Riwayat faktur pajak {filterYear}</h3>
              <button type="button" className={btnSoft} onClick={exportCsv}>Ekspor Excel</button>
            </div>
            <p className="t-note mb-3 sm:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-rose-50">
                <tr>
                  <th className={thLeft}>Nomor internal</th><th className={thLeft}>Nomor faktur</th><th className={thLeft}>Tanggal</th>
                  <th className={thLeft}>Jenis</th><th className={thLeft}>Pembeli</th><th className={thRight}>DPP</th>
                  <th className={thRight}>PPN</th><th className={thRight}>PPnBM</th><th className={thRight}>Total</th><th className={thLeft}>Status</th><th className={thLeft}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {faktur.map((f) => (
                  <React.Fragment key={f.id}>
                    <tr className="border-t border-slate-100 transition-colors hover:bg-rose-50/60">
                      <td className={`${tdClass} font-bold`}>{f.nomorInternal}</td><td className={tdClass}>{f.nomorFaktur}</td><td className={tdClass}>{f.tanggal}</td>
                      <td className={tdClass}>{f.jenis === 'KELUARAN' ? 'Keluaran' : 'Masukan'}</td>
                      <td className={tdClass}>{f.pembeliNama}</td><td className={tdRight}>{formatRupiah(f.dpp)}</td>
                      <td className={tdRight}>{formatRupiah(f.ppn)}</td><td className={tdRight}>{formatRupiah(f.ppnbm)}</td>
                      <td className={tdRight}>{formatRupiah(f.total)}</td><td className={tdClass}><StatusPill status={f.status} /></td>
                      <td className={`${tdClass} print:hidden`}>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn-soft btn-sm" onClick={() => editFaktur(f)}>Edit</button>
                          {f.status === 'AKTIF' && <button type="button" className="btn-soft btn-sm" onClick={() => gantiFaktur(f)}>Ganti</button>}
                          <button type="button" className="btn-secondary btn-sm" onClick={() => startPrint('FAKTUR', f.id)}>Cetak PDF</button>
                          {f.status === 'AKTIF' && <button type="button" className="btn-danger btn-sm" onClick={() => cancelFaktur(f)}>Batalkan</button>}
                          <button type="button" className="btn-secondary btn-sm" onClick={() => setExpanded(expanded === f.id ? null : f.id)}>Riwayat</button>
                        </div>
                      </td>
                    </tr>
                    {expanded === f.id && (
                      <tr className="bg-slate-50"><td colSpan={11} className="p-3 t-note">
                        {f.riwayat.map((r, i) => <div key={i}>{r.waktu.slice(0, 16).replace('T', ' ')}: {r.aktivitas}</div>)}
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
                {faktur.length === 0 && <tr><td colSpan={11}><EmptyState text="Belum ada faktur pajak untuk tahun ini. Isi formulir di atas untuk mencatat faktur pertama." /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTEGRASI FAKTUR KE PPN */}
      {tab === 'FAKTUR' && (() => {
        const prefix = `${filterYear}-${String(multiState.selectedMonth).padStart(2, '0')}`;
        const aktif = store.faktur.filter((f) => f.status === 'AKTIF' && f.tanggal.startsWith(prefix));
        const outputDpp = aktif.filter((f) => f.jenis === 'KELUARAN').reduce((s, f) => s + f.dpp, 0);
        const inputPpn = aktif.filter((f) => f.jenis === 'MASUKAN').reduce((s, f) => s + f.ppn, 0);
        const ppnbmDpp = aktif.filter((f) => f.jenis === 'KELUARAN').reduce((s, f) => s + (f.ppnbm > 0 ? f.dpp : 0), 0);
        const ppnbmRate = aktif.find((f) => f.jenis === 'KELUARAN' && f.ppnbm > 0)?.tarifPpnbm ?? 0;
        return (
          <div className={`${cardClass} print:hidden`}>
            <h3 className="t-card">Pakai faktur di kalkulator PPN</h3>
            <p className="t-note mb-4 mt-2">
              Masa {prefix}: DPP penyerahan keluaran {formatRupiah(outputDpp)}, PPN masukan {formatRupiah(inputPpn)}, DPP PPnBM {formatRupiah(ppnbmDpp)}. Hanya faktur yang aktif.
            </p>
            <button
              type="button"
              className={btnSoft}
              onClick={() => {
                onApplyPpn({ outputDpp, inputPpn, ppnbmDpp, ppnbmRate });
                showMessage('ok', 'Angka faktur masuk ke kalkulator PPN. Buka modul PPN untuk melihat hasilnya.');
              }}
            >
              Kirim ke kalkulator PPN
            </button>
          </div>
        );
      })()}

      {/* REKAP BUKTI POTONG UNTUK SPT */}
      {tab === 'BUKTI' && (
        <div className={`${cardClass} module-enter print:hidden`}>
          <h3 className="t-card">Rekap bukti potong untuk SPT {filterYear}</h3>
          <p className="t-note mb-4 mt-2">Apa ini? Ringkasan bukti potong yang masih aktif. Pajak yang dipotong bisa dipakai sebagai kredit pajak (pengurang pajak) di SPT Tahunan.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse">
              <thead className="bg-rose-50">
                <tr><th className={thLeft}>Jenis</th><th className={thRight}>Jumlah bukti</th><th className={thRight}>Bruto</th><th className={thRight}>Pajak dipotong</th></tr>
              </thead>
              <tbody>
                {(Object.keys(BUKTI_LABEL) as BuktiJenis[]).map((j) => {
                  const rows = bukti.filter((b) => b.jenis === j && b.status === 'AKTIF');
                  return (
                    <tr key={j} className="border-t border-slate-100">
                      <td className={tdClass}>{BUKTI_LABEL[j]}</td>
                      <td className={tdRight}>{rows.length}</td>
                      <td className={tdRight}>{formatRupiah(rows.reduce((s, b) => s + b.bruto, 0))}</td>
                      <td className={`${tdRight} font-bold`}>{formatRupiah(rows.reduce((s, b) => s + b.pajakDipotong, 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LAINNYA: PEMINDAHBUKUAN, TAGIHAN, RESTITUSI */}
      {tab === 'LAINNYA' && <div className="module-enter"><RegisterModule /></div>}

      {/* E-BILLING */}
      {tab === 'BILLING' && (
        <div className="module-enter space-y-5 print:hidden">
          <div className={cardClass}>
            <h3 className="t-card">{billEditingId ? 'Ubah billing' : 'Billing pembayaran baru'}</h3>
            <p className="t-body mt-2">Apa ini? Billing adalah kode pembayaran pajak (e-Billing). KAP (kode jenis pajak) dan KJS (kode jenis setoran) diisi sesuai ketentuan yang berlaku.</p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="fld-taxadminmodule-26" className="t-label mb-2 block">Jenis pajak</label>
                <select id="fld-taxadminmodule-26" className={inputClass} value={billForm.jenisPajak} onChange={(e) => setBillForm({ ...billForm, jenisPajak: e.target.value })}>
                  {BILLING_JENIS.map((j) => <option key={j.label} value={j.label}>{j.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-27" className="t-label mb-2 block">Kode Akun Pajak (KAP)</label>
                <input id="fld-taxadminmodule-27" className={inputClass} value={billForm.kap} onChange={(e) => setBillForm({ ...billForm, kap: e.target.value })} placeholder="Isi sesuai ketentuan yang berlaku" />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-28" className="t-label mb-2 block">Kode Jenis Setoran (KJS)</label>
                <input id="fld-taxadminmodule-28" className={inputClass} value={billForm.kjs} onChange={(e) => setBillForm({ ...billForm, kjs: e.target.value })} placeholder="Isi sesuai ketentuan yang berlaku" />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-29" className="t-label mb-2 block">Masa pajak</label>
                <input id="fld-taxadminmodule-29" className={inputClass} value={billForm.masa} onChange={(e) => setBillForm({ ...billForm, masa: e.target.value })} placeholder="1-12 atau Tahunan" />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-30" className="t-label mb-2 block">Tahun pajak</label>
                <input id="fld-taxadminmodule-30" type="number" className={inputClass} value={billForm.tahun} onChange={(e) => setBillForm({ ...billForm, tahun: Number(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-31" className="t-label mb-2 block">Nominal pembayaran (Rp)</label>
                <input id="fld-taxadminmodule-31" type="text" inputMode="numeric" className={inputClass} value={formatIdNumber(billForm.nominal || '')} onChange={(e) => setBillForm({ ...billForm, nominal: parseIdNumber(e.target.value) })} />
              </div>
              <div>
                <label htmlFor="fld-taxadminmodule-32" className="t-label mb-2 block">Tanggal jatuh tempo</label>
                <input id="fld-taxadminmodule-32" type="date" className={inputClass} value={billForm.jatuhTempo} onChange={(e) => setBillForm({ ...billForm, jatuhTempo: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="fld-taxadminmodule-33" className="t-label mb-2 block">Kode billing resmi (diisi dari bank atau DJP, opsional)</label>
                <input id="fld-taxadminmodule-33" className={inputClass} value={billForm.kodeBillingResmi} onChange={(e) => setBillForm({ ...billForm, kodeBillingResmi: e.target.value })} />
              </div>
            </div>
            {formError && <p role="alert" className="mt-4 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 t-body font-bold text-rose-900">{formError}</p>}
            <div className="mt-6 flex flex-col flex-wrap gap-3 sm:flex-row">
              <button type="button" className={btnPrimary} onClick={saveBilling}>{billEditingId ? 'Simpan perubahan' : 'Buat billing'}</button>
              <button type="button" className={btnSoft} onClick={billingFromCalculator}>Isi dari kalkulator</button>
              {billEditingId && <button type="button" className={btnGhost} onClick={() => { setBillEditingId(null); setBillForm(emptyBilling()); }}>Batal edit</button>}
            </div>
          </div>

          <div className={`${cardClass} overflow-x-auto`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="t-card">Daftar billing {filterYear}</h3>
              <button type="button" className={btnSoft} onClick={exportCsv}>Ekspor Excel</button>
            </div>
            <ol className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { t: '1. Belum dibayar', d: 'Billing baru dibuat. Bayar lewat bank atau DJP Online.' },
                { t: '2. Menunggu konfirmasi', d: 'Tandai setelah pembayaran dikirim.' },
                { t: '3. Lunas', d: 'Isi nama file bukti. Draf jurnal pembayaran dibuat otomatis.' },
              ].map((s) => (
                <li key={s.t} className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <p className="t-label text-rose-900">{s.t}</p>
                  <p className="t-note mt-1">{s.d}</p>
                </li>
              ))}
            </ol>
            <p className="t-note mb-3 sm:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-rose-50">
                <tr>
                  <th className={thLeft}>Referensi</th><th className={thLeft}>Jenis</th><th className={thLeft}>Masa</th>
                  <th className={thRight}>Nominal</th><th className={thLeft}>Jatuh tempo</th><th className={thLeft}>Status</th><th className={thLeft}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b) => (
                  <React.Fragment key={b.id}>
                    <tr className="border-t border-slate-100 transition-colors hover:bg-rose-50/60">
                      <td className={`${tdClass} font-bold`}>{b.nomorReferensi}{b.kodeBillingResmi && <span className="block t-note">Kode billing: {b.kodeBillingResmi}</span>}</td>
                      <td className={tdClass}>{b.jenisPajak}<span className="block t-note">KAP {b.kap} / KJS {b.kjs}</span></td>
                      <td className={tdClass}>{b.masa} / {b.tahun}</td>
                      <td className={tdRight}>{formatRupiah(b.nominal)}</td>
                      <td className={tdClass}>{b.jatuhTempo}</td>
                      <td className={tdClass}><StatusPill status={b.status} />{b.buktiNama && <span className="block t-note">Bukti: {b.buktiNama}</span>}</td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-2">
                          {b.status !== 'LUNAS' && <button type="button" className="btn-soft btn-sm" onClick={() => editBilling(b)}>Edit</button>}
                          {b.status !== 'LUNAS' && <button type="button" className="btn-success btn-sm" onClick={() => nextBillingStep(b)}>{b.status === 'BELUM_DIBAYAR' ? 'Kirim konfirmasi' : 'Konfirmasi lunas'}</button>}
                          <button type="button" className="btn-secondary btn-sm" onClick={() => startPrint('BILLING', b.id)}>Cetak PDF</button>
                          <button type="button" className="btn-secondary btn-sm" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>Riwayat</button>
                        </div>
                      </td>
                    </tr>
                    {expanded === b.id && (
                      <tr className="bg-slate-50"><td colSpan={7} className="p-3 t-note">
                        {b.riwayat.map((r, i) => <div key={i}>{r.waktu.slice(0, 16).replace('T', ' ')}: {r.aktivitas}</div>)}
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
                {billing.length === 0 && <tr><td colSpan={7}><EmptyState text="Belum ada billing untuk tahun ini. Buat billing baru di atas, atau isi dari kalkulator." /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {printDoc}
    </section>
  );
};
