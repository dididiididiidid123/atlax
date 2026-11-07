import { Save } from 'lucide-react';
import { saveDoc } from '../utils/dokumenStore';
import { notify } from '../utils/toast';
import React, { useState } from 'react';
import { TaxFormData, TaxCalculationResult } from '../types/tax';
import { formatRupiah } from '../utils/taxCalculator';
import { AlertTriangle, ArrowLeft, Check, Clock, Copy, Printer } from 'lucide-react';
import { printArea } from '../utils/printArea';

interface StepSummaryProps {
  data: TaxFormData;
  calculation: TaxCalculationResult;
  onBack: () => void;
  onReset: () => void;
}

const STATUS_LABEL: Record<TaxCalculationResult['status'], string> = {
  NIHIL: 'Nihil (tidak ada yang dibayar)',
  KURANG_BAYAR: 'Kurang bayar',
  LEBIH_BAYAR: 'Lebih bayar',
};

const labelClass = 't-label block text-slate-600';

export const StepSummary: React.FC<StepSummaryProps> = ({
  data,
  calculation,
  onBack,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  // NPWP opsional; yang wajib untuk menyalin atau mencetak adalah NIK dan nama.
  const isIdentityComplete = /^\d{16}$/.test(data.profile.nik)
    && Boolean(data.profile.fullName.trim());

  const finalTone =
    calculation.status === 'KURANG_BAYAR'
      ? 'text-rose-800'
      : calculation.status === 'LEBIH_BAYAR'
      ? 'text-emerald-800'
      : 'text-sky-900';

  const handleSaveToDokumen = () => {
    const status = calculation.status === 'NIHIL' ? 'Nihil' : calculation.status === 'KURANG_BAYAR' ? 'Kurang bayar' : 'Lebih bayar';
    saveDoc({
      kind: 'SPT',
      title: 'SPT Tahunan · Tahun pajak ' + data.profile.taxYear,
      amount: Math.abs(calculation.balanceDue),
      status,
      rows: [
        { label: 'Nama', value: data.profile.fullName || 'Wajib pajak' },
        { label: 'Penghasilan bruto', value: formatRupiah(calculation.grossIncome) },
        { label: 'Penghasilan kena pajak', value: formatRupiah(calculation.taxableIncome) },
        { label: 'PPh terutang', value: formatRupiah(calculation.totalTaxDue) },
        { label: 'Sudah dipotong', value: formatRupiah(calculation.taxPrepaid) },
      ],
    });
    notify('ok', 'Disimpan ke Dokumen sebagai SPT Tahunan.');
  };
  const handleCopy = () => {
    if (!isIdentityComplete) return;
    const summaryText = `
=== RINGKASAN DRAF SPT ATLAX ===
Nama: ${data.profile.fullName || 'Wajib Pajak'}
NIK: ${data.profile.nik || '-'}
NPWP: ${data.profile.npwp || '-'}
Status PTKP: ${data.profile.ptkpStatus}
Tahun Pajak: ${data.profile.taxYear}
Kategori: ${data.category.toUpperCase()}

Penghasilan Bruto: ${formatRupiah(calculation.grossIncome)}
Pengurang & PTKP: ${formatRupiah(calculation.deductions + calculation.ptkpAmount)}
Penghasilan Kena Pajak (PKP): ${formatRupiah(calculation.taxableIncome)}
PPh Terutang: ${formatRupiah(calculation.totalTaxDue)}
Pajak Sudah Dipotong: ${formatRupiah(calculation.taxPrepaid)}
Status Pelaporan: ${calculation.status} (${formatRupiah(calculation.balanceDue)})
Batas Akhir Pelaporan SPT: 31 Maret ${data.profile.taxYear + 1}
================================
Dihitung otomatis melalui ATLAX - Make Tax Reporting Simpler.
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    printArea();
  };

  const nextYear = data.profile.taxYear + 1;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Penjelasan satu baris untuk tahap ini */}
      {/* Penanda selesai: langkah terakhir sudah tercapai */}
      <div className="card module-enter relative overflow-hidden border-emerald-200  print:hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-emerald-300" />
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-md">
            <Check className="h-8 w-8" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <p className="t-kicker text-emerald-800">Langkah terakhir</p>
            <h2 className="t-section mt-1">Hitungan Anda sudah selesai</h2>
          </div>
        </div>
        <p className="t-body mt-4">
          Ini ringkasan angka yang bisa Anda salin ke portal resmi DJP Online atau Coretax. Cetak atau salin, lalu cek ulang sebelum mengirim.
        </p>
      </div>

      {/* Tombol aksi */}
      <div className="card flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <p className="t-card text-slate-900">Simpan atau cetak draf ini</p>
        <div className="flex flex-col gap-4 sm:flex-row">
                    <button
            type="button"
            onClick={handleSaveToDokumen}
            className="btn-secondary w-full sm:w-auto"
          >
            <Save className="h-5 w-5" />
            <span>Simpan ke Dokumen</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!isIdentityComplete}
            className={`${copied ? 'btn-success bg-emerald-700 hover:bg-emerald-800' : 'btn-secondary'} w-full sm:w-auto`}
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            <span>{copied ? 'Sudah tersalin' : 'Salin data'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!isIdentityComplete}
            className="btn-primary w-full bg-sky-700 hover:bg-sky-800 sm:w-auto"
          >
            <Printer className="h-5 w-5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>
      {!isIdentityComplete && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 print:hidden">
          <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-800" />
          <p className="t-body text-amber-950">
            Untuk menyalin atau mencetak, isi dulu NIK dan nama di langkah 1. NPWP boleh kosong.
          </p>
        </div>
      )}

      {/* Batas waktu */}
      <div className="card space-y-5 border-amber-200 bg-amber-50 print:border-amber-400">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
            <Clock className="h-6 w-6" />
          </span>
          <div>
            <p className="t-card text-amber-950">Batas waktu dan denda</p>
            <p className="t-note mt-1 text-amber-900">Ini sesuai UU KUP dan UU HPP. Cek lagi di Coretax atau DJP bila ada perubahan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-amber-200 bg-white p-4">
            <p className={labelClass}>Batas lapor SPT</p>
            <p className="t-card text-slate-900">31 Maret {nextYear}</p>
            <p className="t-note text-slate-800">Jika terlambat lapor, dendanya <strong>Rp 100.000</strong>.</p>
          </div>

          <div className="space-y-2 rounded-2xl border border-amber-200 bg-white p-4">
            <p className={labelClass}>Batas bayar kekurangan</p>
            <p className="t-card text-slate-900">31 Maret {nextYear}</p>
            <p className="t-note text-slate-800">Dibayar sebelum SPT dikirim. Jika terlambat bayar, ada bunga per bulan (paling lama 24 bulan).</p>
          </div>
        </div>
      </div>

      {/* Lembar ringkasan yang bisa dicetak */}
      <div className="card print-area space-y-6 border-2 p-6 sm:p-8 print:border-none print:p-0 print:shadow-none">
        {/* Kepala dokumen */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
          <div>
            <p className="t-page text-sky-800">ATLAX</p>
            <p className="t-body mt-1 font-bold text-slate-900">Lembar ringkasan sebelum lapor SPT</p>
            <p className="t-note mt-1">Berdasarkan UU HPP No. 7 Tahun 2021 dan PP 55/2022</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="chip-info">
              Tahun pajak {data.profile.taxYear}
            </span>
          </div>
        </div>

        {/* Bagian A: identitas */}
        <div className="space-y-4">
          <h4 className="t-card text-slate-900">Bagian A: data diri Anda</h4>
          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
            <div>
              <span className={labelClass}>Nama</span>
              <span className="t-body font-bold text-slate-900">{data.profile.fullName || '(belum diisi)'}</span>
            </div>
            <div>
              <span className={labelClass}>NIK</span>
              <span className="t-body font-bold text-slate-900">{data.profile.nik || '(belum diisi)'}</span>
            </div>
            <div>
              <span className={labelClass}>Status keluarga (batas bebas pajak)</span>
              <span className="t-body font-bold text-slate-900">{data.profile.ptkpStatus} ({formatRupiah(calculation.ptkpAmount)})</span>
            </div>
            <div>
              <span className={labelClass}>Jenis pekerjaan</span>
              <span className="t-body font-bold capitalize text-slate-900">{data.category}</span>
            </div>
          </div>
        </div>

        {/* Bagian B: rekap angka */}
        <div className="space-y-4">
          <h4 className="t-card text-slate-900">Bagian B: ringkasan angka</h4>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="divide-y divide-slate-200">
              <div className="flex justify-between gap-4 p-4">
                <span className="t-body text-slate-800">1. Penghasilan kotor</span>
                <span className="t-body text-right font-bold text-slate-900">{formatRupiah(calculation.grossIncome)}</span>
              </div>
              <div className="flex justify-between gap-4 bg-slate-50 p-4">
                <span className="t-body text-slate-800">2. Pengurang (biaya jabatan, iuran, atau norma)</span>
                <span className="t-body text-right font-bold text-slate-900">{formatRupiah(calculation.deductions)}</span>
              </div>
              <div className="flex justify-between gap-4 p-4">
                <span className="t-body text-slate-800">3. Penghasilan bersih (1 dikurangi 2)</span>
                <span className="t-body text-right font-bold text-slate-900">{formatRupiah(calculation.netIncome)}</span>
              </div>
              <div className="flex justify-between gap-4 bg-slate-50 p-4">
                <span className="t-body text-slate-800">4. Batas bebas pajak (PTKP)</span>
                <span className="t-body text-right font-bold text-slate-900">{formatRupiah(calculation.ptkpAmount)}</span>
              </div>
              <div className="flex justify-between gap-4 p-4">
                <span className="t-body font-bold text-slate-900">5. Yang dikenai pajak (3 dikurangi 4)</span>
                <span className="t-body text-right font-bold text-slate-900">{formatRupiah(calculation.taxableIncome)}</span>
              </div>
              <div className="flex justify-between gap-4 bg-slate-50 p-4">
                <span className="t-body text-slate-800">6. Pajak terutang</span>
                <span className="t-body text-right font-bold text-slate-900">{formatRupiah(calculation.totalTaxDue)}</span>
              </div>
              <div className="flex justify-between gap-4 p-4">
                <span className="t-body text-slate-800">7. Pajak yang sudah dipotong</span>
                <span className="t-body text-right font-bold text-slate-900">{formatRupiah(calculation.taxPrepaid)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-3 border-t-2 border-sky-700 bg-sky-50 p-5">
                <span className="t-card text-slate-900">8. Hasil akhir (6 dikurangi 7)</span>
                <span className={`t-card break-words text-right ${finalTone}`}>
                  {STATUS_LABEL[calculation.status]}: {formatRupiah(Math.abs(calculation.balanceDue))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Langkah selanjutnya */}
        <div className="space-y-4 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <h4 className="t-card text-sky-950">Langkah selanjutnya</h4>
          <ol className="t-body list-decimal space-y-3 pl-6 text-slate-800">
            {calculation.status === 'KURANG_BAYAR' ? (
              <>
                <li>
                  Buka situs <strong>djponline.pajak.go.id</strong> atau portal <strong>Coretax DJP</strong>.
                </li>
                <li>
                  Buat <strong>Kode Billing</strong> (kode untuk membayar pajak). Pilih jenis pajak <strong>PPh Pasal 29 Orang Pribadi</strong> (kode akun 411125, kode jenis setoran 200) dengan nominal <strong>{formatRupiah(calculation.balanceDue)}</strong>.
                </li>
                <li>
                  Bayar lewat ATM, m-Banking (BCA, Mandiri, BRI, BNI), Kantor Pos, atau marketplace, <strong>paling lambat 31 Maret {nextYear}</strong>, agar tidak kena bunga per bulan.
                </li>
                <li>
                  Setelah mendapat <strong>NTPN</strong> (nomor bukti bahwa pajak sudah masuk ke negara), laporkan SPT Tahunan sebelum <strong>31 Maret {nextYear}</strong> untuk menghindari denda Rp 100.000.
                </li>
              </>
            ) : (
              <>
                <li>
                  Buka situs <strong>djponline.pajak.go.id</strong> atau portal <strong>Coretax DJP</strong>.
                </li>
                <li>
                  Pilih menu <strong>Lapor SPT</strong> (Formulir 1770 S atau 1770 SS).
                </li>
                <li>
                  Masukkan angka-angka dari ringkasan di atas. Status formulir Anda akan muncul sebagai <strong>NIHIL</strong>.
                </li>
                <li>
                  Kirim SPT paling lambat <strong>31 Maret {nextYear}</strong>. Meskipun nihil, tetap wajib lapor agar tidak kena denda Rp 100.000. Simpan <strong>BPE</strong> (Bukti Penerimaan Elektronik, bukti bahwa SPT sudah diterima).
                </li>
              </>
            )}
          </ol>
        </div>

        <p className="t-note flex items-start gap-2">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-slate-700" />
          <span>Ini bukan formulir SPT resmi. ATLAX tidak mengirim SPT atau pembayaran ke DJP.</span>
        </p>
      </div>

      {/* Tombol navigasi */}
      <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary w-full sm:w-auto"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="btn-soft w-full sm:w-auto"
        >
          Selesai dan mulai formulir baru
        </button>
      </div>
    </div>
  );
};
