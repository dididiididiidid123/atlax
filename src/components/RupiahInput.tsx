import React from 'react';

// Helper untuk input uang biasa: tampil dengan titik ribuan, disimpan sebagai angka.
export const formatIdNumber = (value: number | string | undefined | null) => {
  const n = typeof value === 'string' ? Number(value.replace(/\D/g, '')) : Number(value ?? 0);
  return n ? n.toLocaleString('id-ID') : '';
};

export const parseIdNumber = (text: string) => {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

// Input angka dengan format Rupiah langsung saat diketik, misalnya 1.000.000.000.
// Nilai yang disimpan tetap angka biasa, formatnya hanya untuk tampilan.
const formatDigits = (value: number) => (value ? value.toLocaleString('id-ID') : '');

export const RupiahInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  id?: string;
}> = ({ value, onChange, placeholder = '0', className = '', prefix = 'Rp', id }) => (
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 pointer-events-none">{prefix}</span>
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={formatDigits(value)}
      placeholder={placeholder}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        onChange(digits ? Number(digits) : 0);
      }}
      className={`field pl-10 ${className}`}
    />
  </div>
);
