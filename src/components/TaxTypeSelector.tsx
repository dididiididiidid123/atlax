import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { TaxReportingType } from '../types/tax';

interface TaxTypeSelectorProps {
  selectedType: TaxReportingType;
  onSelectType: (type: TaxReportingType) => void;
}

interface TaxTypeOptionDef {
  id: TaxReportingType;
  title: string;
  badge: string;
  desc: string;
}

const TAX_TYPE_OPTIONS: TaxTypeOptionDef[] = [
  { id: 'PPH_21', title: 'PPh 21', badge: 'Gaji karyawan', desc: 'Pajak dari gaji, upah, atau honor' },
  { id: 'PPH_22', title: 'PPh 22', badge: 'Impor dan pembelian', desc: 'Pajak saat impor atau pembelian tertentu' },
  { id: 'PPH_23', title: 'PPh 23', badge: 'Jasa dan dividen', desc: 'Pajak dari jasa, sewa, dividen, bunga, atau royalti' },
  { id: 'PPH_24', title: 'PPh 24', badge: 'Pajak luar negeri', desc: 'Pajak yang sudah dibayar di luar negeri' },
  { id: 'PPH_25', title: 'PPh 25', badge: 'Angsuran bulanan', desc: 'Cicilan pajak yang dibayar tiap bulan' },
  { id: 'PPH_26', title: 'PPh 26', badge: 'Penghasilan dari luar negeri', desc: 'Penghasilan dari pihak di luar negeri' },
  { id: 'PPH_28', title: 'PPh 28 / 28A', badge: 'Kredit dan kelebihan bayar', desc: 'Pajak yang lebih bayar dan minta dikembalikan' },
  { id: 'PPH_29', title: 'PPh 29', badge: 'Kurang bayar SPT', desc: 'Pelunasan pajak sebelum lapor SPT Tahunan' },
  { id: 'PPH_15', title: 'PPh 15', badge: 'Usaha tertentu', desc: 'Pelayaran, penerbangan, dan usaha tertentu lainnya' },
  { id: 'PPH_4_2', title: 'PPh Final 4(2)', badge: 'Pajak final', desc: 'Sewa, jasa konstruksi, dan objek pajak final lainnya' },
  { id: 'UMKM', title: 'UMKM', badge: 'Rekap omzet', desc: 'Omzet dan biaya per bulan untuk usaha kecil' },
  { id: 'PPN', title: 'PPN 11%', badge: 'Pajak pertambahan nilai', desc: 'Pajak atas penjualan dan pembelian (untuk PKP)' },
];

// Satu tombol besar untuk memilih jenis pajak. Daftar lengkapnya baru muncul setelah tombol ditekan.
export const TaxTypeSelector: React.FC<TaxTypeSelectorProps> = ({ selectedType, onSelectType }) => {
  const [open, setOpen] = useState(false);
  const current = TAX_TYPE_OPTIONS.find((opt) => opt.id === selectedType) ?? TAX_TYPE_OPTIONS[0];

  return (
    <div className="space-y-5">
      <div>
        <p className="t-body font-bold text-slate-900">Jenis pajak apa yang mau dihitung?</p>
        <p className="t-note mt-2">
          Apa ini? Setiap jenis pajak punya cara hitung sendiri. Jika ragu, pilih yang sesuai dengan sumber penghasilan atau transaksi Anda.
        </p>
      </div>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group flex min-h-[80px] w-full cursor-pointer items-center justify-between gap-4 rounded-3xl border-2 border-violet-200 bg-violet-50 p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] sm:p-6"
      >
        <span className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-800">
            <Layers className="h-7 w-7" />
          </span>
          <span className="min-w-0">
            <span className="t-note block font-bold text-violet-800">Sekarang dipilih</span>
            <span className="t-card block break-words text-violet-950">
              {current.title} <span className="t-note font-semibold text-violet-800">({current.badge})</span>
            </span>
          </span>
        </span>
        <span className="t-label flex shrink-0 items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 font-bold text-white">
          {open ? 'Tutup' : 'Ganti'}
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TAX_TYPE_OPTIONS.map((opt, index) => {
            const isSelected = selectedType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  onSelectType(opt.id);
                  setOpen(false);
                }}
                style={{ animationDelay: `${index * 45}ms` }}
                className={`card-lift landing-card flex min-h-[80px] cursor-pointer flex-col items-start gap-1.5 rounded-2xl p-5 text-left active:scale-[0.98] ${
                  isSelected
                    ? 'border-2 border-violet-700 bg-violet-50 ring-4 ring-violet-100'
                    : 'border-2 border-slate-200 bg-white hover:border-violet-300'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="t-card text-slate-900">{opt.title}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                </span>
                <span className="t-label text-violet-800">{opt.badge}</span>
                <span className="t-note">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
