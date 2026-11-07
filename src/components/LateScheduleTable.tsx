import React, { useState } from 'react';
import { AlertTriangle, CalendarClock, Search, Wallet } from 'lucide-react';
import { ALL_TAX_SCHEDULES } from '../data/taxSchedules';

export const LateScheduleTable: React.FC = () => {
  const [query, setQuery] = useState('');
  const rows = ALL_TAX_SCHEDULES.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.taxName.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
  });

  return (
    <section className="card module-enter space-y-5">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl  text-amber-900"
        >
          <CalendarClock className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="t-section">Jadwal keterlambatan dan denda</h3>
          <p className="mt-1 t-note">
            Daftar batas bayar dan lapor tiap jenis pajak, serta denda kalau terlambat. Cek lagi tanggal dan nominalnya sebelum dipakai.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="fld-latescheduletable-cari" className="block t-label">
          Cari jenis pajak
        </label>
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-700" />
          <input
            id="fld-latescheduletable-cari"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: PPh 21 atau PPN"
            className="field w-full pl-12"
          />
        </div>
      </div>

      {/* Tampilan kartu untuk layar kecil */}
      <div className="space-y-4 md:hidden">
        {rows.length === 0 && (
          <p className="rounded-2xl bg-amber-50 p-5 text-center t-body">Tidak ada jenis pajak yang cocok. Coba kata lain.</p>
        )}
        {rows.map((item) => (
          <article key={item.id} className="card space-y-4">
            <div>
              <p className="t-card">{item.taxName}</p>
              <p className="mt-1 t-note">Kode: {item.code}</p>
            </div>
            <dl className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <dt className="flex items-center gap-2 t-label text-amber-900">
                  <Wallet className="h-5 w-5 shrink-0" /> Bayar paling lambat
                </dt>
                <dd className="mt-1 t-body font-extrabold text-slate-900">{item.paymentDeadline}</dd>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <dt className="flex items-center gap-2 t-label text-amber-900">
                  <CalendarClock className="h-5 w-5 shrink-0" /> Lapor paling lambat
                </dt>
                <dd className="mt-1 t-body font-extrabold text-slate-900">{item.reportingDeadline}</dd>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <dt className="flex items-center gap-2 t-label text-rose-800">
                  <AlertTriangle className="h-5 w-5 shrink-0" /> Kalau terlambat
                </dt>
                <dd className="mt-2 space-y-1 t-body">
                  <p><span className="font-bold text-rose-800">Lapor:</span> {item.lateFilingFeeText}</p>
                  <p><span className="font-bold text-rose-800">Bayar:</span> {item.latePaymentInterestRule}</p>
                </dd>
              </div>
            </dl>
            <details className="rounded-2xl bg-slate-50 p-4 t-note">
              <summary className="cursor-pointer py-1 t-label">Lihat dasar hukum</summary>
              <p className="mt-2 t-body leading-relaxed">{item.penaltyLegalBasis}</p>
            </details>
          </article>
        ))}
      </div>

      {/* Tabel untuk layar lebar */}
      <div className="hidden overflow-x-auto rounded-2xl border border-amber-200 md:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-amber-100">
            <tr>
              <th scope="col" className="p-4 t-label text-amber-950">Jenis pajak</th>
              <th scope="col" className="p-4 t-label text-amber-950">Bayar paling lambat</th>
              <th scope="col" className="p-4 t-label text-amber-950">Lapor paling lambat</th>
              <th scope="col" className="p-4 t-label text-amber-950">Kalau terlambat</th>
              <th scope="col" className="p-4 t-label text-amber-950">Dasar hukum</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-amber-100 align-top transition-colors hover:bg-amber-50">
                <td className="p-4">
                  <span className="block t-body font-bold text-slate-900">{item.taxName}</span>
                  <span className="t-note">Kode: {item.code}</span>
                </td>
                <td className="p-4 t-body font-bold text-slate-900">{item.paymentDeadline}</td>
                <td className="p-4 t-body font-bold text-slate-900">{item.reportingDeadline}</td>
                <td className="p-4 t-body">
                  <p><span className="font-bold text-rose-800">Lapor:</span> {item.lateFilingFeeText}</p>
                  <p className="mt-1"><span className="font-bold text-rose-800">Bayar:</span> {item.latePaymentInterestRule}</p>
                </td>
                <td className="p-4">
                  <details>
                    <summary className="cursor-pointer t-label">Lihat</summary>
                    <p className="mt-2 t-body leading-relaxed">{item.penaltyLegalBasis}</p>
                  </details>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center t-body">Tidak ada jenis pajak yang cocok. Coba kata lain.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
