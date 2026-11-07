import { printArea } from '../utils/printArea';
import React, { useState } from 'react';
import { TaxFormData, TaxCalculationResult } from '../types/tax';
import { formatRupiah } from '../utils/taxCalculator';
import { ArrowLeft, Copy, Check, Printer, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface StepResultProps {
  data: TaxFormData;
  calculation: TaxCalculationResult;
  onBack: () => void;
  onReset: () => void;
}

export const StepResult: React.FC<StepResultProps> = ({
  data,
  calculation,
  onBack,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const handleCopy = () => {
    const summaryText = `
RINGKASAN PAJAK ATLAX
Nama: ${data.profile.fullName || 'Wajib Pajak'}
NIK: ${data.profile.nik || '-'}
Status PTKP: ${data.profile.ptkpStatus}
Tahun Pajak: ${data.profile.taxYear}

Penghasilan Bruto: ${formatRupiah(calculation.grossIncome)}
Batas Bebas Pajak (PTKP): ${formatRupiah(calculation.ptkpAmount)}
Penghasilan Kena Pajak: ${formatRupiah(calculation.taxableIncome)}
PPh Terutang: ${formatRupiah(calculation.totalTaxDue)}
Pajak Sudah Dipotong: ${formatRupiah(calculation.taxPrepaid)}
Status Akhir: ${calculation.status} (${formatRupiah(calculation.balanceDue)})
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      
      {/* Kartu Status Utama (Besar & Jelas) */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border shadow-sm text-center ${
          calculation.status === 'NIHIL'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : calculation.status === 'KURANG_BAYAR'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}
      >
        <span className="text-3xl block mb-2">
          {calculation.status === 'NIHIL' ? '🎉' : calculation.status === 'KURANG_BAYAR' ? '⚠️' : 'ℹ️'}
        </span>

        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Status Pelaporan Pajak Anda
        </span>

        <h2 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
          {calculation.status === 'NIHIL' && 'SPT NIHIL (Rp 0)'}
          {calculation.status === 'KURANG_BAYAR' && `KURANG BAYAR: ${formatRupiah(calculation.balanceDue)}`}
          {calculation.status === 'LEBIH_BAYAR' && `LEBIH BAYAR: ${formatRupiah(Math.abs(calculation.balanceDue))}`}
        </h2>

        <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          {calculation.status === 'NIHIL' &&
            'Semua kewajiban pajak Anda sudah beres. Anda tidak perlu membayar pajak lagi, cukup melaporkan SPT tahunan.'}
          {calculation.status === 'KURANG_BAYAR' &&
            `Terdapat kekurangan setor sebesar ${formatRupiah(calculation.balanceDue)}. Buat Kode Billing di DJP Online sebelum 31 Maret.`}
          {calculation.status === 'LEBIH_BAYAR' &&
            'Pajak yang dipotong melebihi perhitungan seharusnya. Anda berhak mengajukan pengembalian (restitusi).'}
        </p>
      </div>

      {/* Ringkasan 3 Angka Utama */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Ringkasan Angka Pelaporan
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600">Total Penghasilan Setahun</span>
            <span className="font-bold text-slate-900">{formatRupiah(calculation.grossIncome)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600">Batas Bebas Pajak (PTKP {data.profile.ptkpStatus})</span>
            <span className="font-bold text-emerald-600">-{formatRupiah(calculation.ptkpAmount)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600">Penghasilan Kena Pajak (PKP)</span>
            <span className="font-bold text-slate-900">{formatRupiah(calculation.taxableIncome)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-600">Pajak yang Sudah Dipotong Kantor</span>
            <span className="font-bold text-slate-900">{formatRupiah(calculation.taxPrepaid)}</span>
          </div>
        </div>

        {/* Accordion Rincian Rumus (Hanya jika ingin melihat detail) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="text-xs text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1"
          >
            {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showFormulaDetails ? 'Sembunyikan Rincian Rumus' : 'Lihat Rincian Rumus & Tarif'}</span>
          </button>

          {showFormulaDetails && (
            <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1.5 border border-slate-100">
              <p>• Biaya Jabatan (5% dari Bruto maks 6jt): {formatRupiah(calculation.deductions)}</p>
              {calculation.taxBracketBreakdown.map((item, idx) => (
                <p key={idx}>
                  • {item.bracket}: {(item.rate * 100)}% × {formatRupiah(item.amount)} = {formatRupiah(item.tax)}
                </p>
              ))}
              <p className="pt-1 text-slate-400">Merujuk pada UU HPP No. 7 Tahun 2021 & PP 55/2022.</p>
            </div>
          )}
        </div>
      </div>

      {/* Panduan 3 Langkah Pelaporan Resmi */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Cara Melaporkan ke DJP Online:
        </h3>
        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-3 leading-relaxed">
          <li>
            Buka situs resmi <strong>djponline.pajak.go.id</strong> dan login dengan NIK/NPWP Anda.
          </li>
          <li>
            Pilih menu <strong>Lapor SPT</strong> & masukkan angka penghasilan di atas.
          </li>
          <li>
            Status formulir Anda akan otomatis muncul sebagai <strong>{calculation.status}</strong>. Kirim SPT dan simpan bukti lapornya!
          </li>
        </ol>

        {/* Tombol Aksi Praktis */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Angka'}</span>
          </button>

          <button
            onClick={() => printArea()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Navigasi Selesai / Mulai Ulang */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ubah Angka</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Mulai Pengisian Baru</span>
        </button>
      </div>

    </div>
  );
};
