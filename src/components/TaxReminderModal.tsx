import { REGULASI } from '../config/regulasi';
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Bell, Calculator, Search, Wallet, FileText, Download, ShieldCheck, CalendarClock, Info, AlertTriangle, Check } from 'lucide-react';
import { ALL_TAX_SCHEDULES } from '../data/taxSchedules';
import { formatRupiah } from '../utils/taxCalculator';
import { downloadTaxReminderIcs } from '../utils/reminderIcs';
import { AnimatedRupiah } from './AnimatedRupiah';

interface TaxReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'matrix' | 'simulator' | 'subscribe';

const CATEGORY_CHIPS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'PPH_OP', label: 'PPh orang pribadi' },
  { id: 'PPH_BADAN', label: 'PPh badan' },
  { id: 'PPH_21', label: 'PPh 21' },
  { id: 'PPH_23', label: 'PPh 23' },
  { id: 'PPH_4_2', label: 'Pajak UMKM (final)' },
  { id: 'PPN', label: 'PPN' },
];

// Tarif bunga per bulan mengikuti KMK tiap bulan. Nilai ini tarif KMK 9/2025 (Desember 2025), cek KMK bulan berjalan.

// Jendela jadwal dan denda: daftar tenggat, simulator denda, dan pengingat kalender.
export const TaxReminderModal: React.FC<TaxReminderModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('matrix');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Isian simulator denda
  const [simSelectedTaxId, setSimSelectedTaxId] = useState<string>('pph-op-tahunan');
  const [unpaidTax, setUnpaidTax] = useState<number>(3_000_000);
  const [monthsLate, setMonthsLate] = useState<number>(2);
  const [isFilingLate, setIsFilingLate] = useState<boolean>(true);

  const filteredSchedules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ALL_TAX_SCHEDULES.filter((item) => {
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch =
        query === '' ||
        item.taxName.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const currentSimTax = ALL_TAX_SCHEDULES.find((t) => t.id === simSelectedTaxId) || ALL_TAX_SCHEDULES[0];
  const lateFilingFee = isFilingLate ? currentSimTax.lateFilingFee : 0;
  const latePaymentInterest = Math.round(unpaidTax * REGULASI.bungaPerBulan * Math.min(monthsLate, REGULASI.maksBulanBunga));
  const totalPenalty = lateFilingFee + latePaymentInterest;

  // Pengecekan buka-tutup dilakukan setelah semua hook, supaya urutan hook tetap sama
  if (!isOpen) return null;

  const SIM_CHOICES = [
    {
      value: true,
      label: 'Ya, terlambat',
      icon: AlertTriangle,
      on: 'border-rose-400 bg-rose-50 text-rose-950 ring-4 ring-rose-200',
      iconOn: 'bg-rose-700 text-white',
      badge: 'bg-rose-700 text-white',
    },
    {
      value: false,
      label: 'Tidak',
      icon: Check,
      on: 'border-emerald-400 bg-emerald-50 text-emerald-950 ring-4 ring-emerald-200',
      iconOn: 'bg-emerald-700 text-white',
      badge: 'bg-emerald-700 text-white',
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm animate-fadeIn sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

        {/* Judul */}
        <div className="flex items-start justify-between gap-4  p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-800 shadow-sm">
              <CalendarClock className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h3 className="t-section">Jadwal dan denda pajak</h3>
              <p className="mt-1 t-note text-slate-800">Kapan harus bayar dan lapor, dan berapa denda kalau terlambat.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary btn-sm shrink-0 gap-2">
            <X className="h-5 w-5" />
            Tutup
          </button>
        </div>

        {/* Pilihan bagian */}
        <div className="border-b border-amber-100 bg-amber-50/60 p-4 sm:px-6">
          <div role="tablist" aria-label="Bagian jadwal dan denda" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([
              { id: 'matrix', label: 'Daftar jadwal', hint: `${ALL_TAX_SCHEDULES.length} jenis pajak`, icon: Calendar },
              { id: 'simulator', label: 'Hitung denda', hint: 'Coba sendiri', icon: Calculator },
              { id: 'subscribe', label: 'Pengingat', hint: 'Simpan ke kalender', icon: Bell },
            ] as const).map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`card-lift relative flex items-center gap-3 p-4 text-left ${
                    active ? 'border-amber-400 bg-amber-50 ring-4 ring-amber-200' : 'hover:border-amber-300'
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      active ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 pr-7">
                    <span className="block t-body font-extrabold text-slate-900">{tab.label}</span>
                    <span className="block t-note">{tab.hint}</span>
                  </span>
                  {active && (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Isi */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">

          {/* DAFTAR JADWAL */}
          {activeTab === 'matrix' && (
            <div className="module-enter space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fld-reminder-cari" className="block t-label">Cari jenis pajak</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-700" />
                    <input
                      id="fld-reminder-cari"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Contoh: PPh 21 atau PPN"
                      className="field w-full pl-12"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_CHIPS.map((chip) => {
                    const active = selectedCategory === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedCategory(chip.id)}
                        className={`t-label inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 transition-all duration-200 hover:-translate-y-0.5 ${
                          active
                            ? 'border-amber-700 bg-amber-700 text-white shadow-md'
                            : 'border-amber-200 bg-white text-slate-800 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        {active && <Check className="h-4 w-4" />}
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredSchedules.length === 0 && (
                <p className="rounded-2xl bg-amber-50 p-5 text-center t-body">Tidak ada jenis pajak yang cocok. Coba kata lain.</p>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredSchedules.map((item) => (
                  <article key={item.id} className="card flex flex-col gap-4">
                    <div>
                      <p className="t-card">{item.taxName}</p>
                      <p className="mt-1 t-note">Kode {item.code} · Untuk: {item.subject}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="flex items-center gap-2 t-label text-amber-900">
                          <Wallet className="h-5 w-5 shrink-0" /> Bayar paling lambat
                        </p>
                        <p className="mt-1 t-body font-extrabold leading-snug text-slate-900">{item.paymentDeadline}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="flex items-center gap-2 t-label text-amber-900">
                          <FileText className="h-5 w-5 shrink-0" /> Lapor paling lambat
                        </p>
                        <p className="mt-1 t-body font-extrabold leading-snug text-slate-900">{item.reportingDeadline}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 t-body">
                      <p className="flex items-center gap-2 t-label text-rose-800">
                        <AlertTriangle className="h-5 w-5 shrink-0" /> Kalau terlambat
                      </p>
                      <p className="mt-2"><span className="font-semibold text-rose-900">Lapor:</span> {item.lateFilingFeeText}</p>
                      <p className="mt-1"><span className="font-semibold text-rose-900">Bayar:</span> {item.latePaymentInterestRule}</p>
                    </div>

                    <p className="t-note">{item.notes}</p>

                    <details className="t-note">
                      <summary className="cursor-pointer py-1 t-label">Lihat dasar hukum</summary>
                      <div className="mt-2 space-y-2 rounded-2xl bg-slate-50 p-4 t-body leading-relaxed">
                        <p><span className="font-semibold">Bayar:</span> {item.paymentLegalBasis}</p>
                        <p><span className="font-semibold">Lapor:</span> {item.reportingLegalBasis}</p>
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* HITUNG DENDA */}
          {activeTab === 'simulator' && (
            <div className="module-enter grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="space-y-5 lg:col-span-3">
                <div className="card space-y-3">
                  <p className="t-kicker text-amber-800">Langkah 1</p>
                  <label htmlFor="fld-reminder-tax" className="block t-card">Pilih jenis pajak</label>
                  <select id="fld-reminder-tax" value={simSelectedTaxId} onChange={(e) => setSimSelectedTaxId(e.target.value)} className="field w-full">
                    {ALL_TAX_SCHEDULES.map((tax) => (
                      <option key={tax.id} value={tax.id}>{tax.code} — {tax.taxName}</option>
                    ))}
                  </select>
                </div>

                <div className="card space-y-3">
                  <p className="t-kicker text-amber-800">Langkah 2</p>
                  <p className="t-card">Apakah laporannya sudah terlambat?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {SIM_CHOICES.map((opt) => {
                      const active = isFilingLate === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setIsFilingLate(opt.value)}
                          className={`card-lift relative flex flex-col items-start gap-3 p-4 text-left t-body font-extrabold ${
                            active ? opt.on : 'text-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? opt.iconOn : 'bg-slate-100 text-slate-700'}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          {opt.label}
                          {active && (
                            <span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full ${opt.badge}`}>
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="card space-y-3">
                  <p className="t-kicker text-amber-800">Langkah 3</p>
                  <label htmlFor="fld-reminder-unpaid" className="block t-card">Berapa pajak yang belum dibayar?</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 t-body font-bold text-slate-700">Rp</span>
                    <input
                      id="fld-reminder-unpaid"
                      type="text"
                      inputMode="numeric"
                      value={unpaidTax.toLocaleString('id-ID')}
                      onChange={(e) => setUnpaidTax(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className="field w-full pl-14"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="card space-y-3">
                  <p className="t-kicker text-amber-800">Langkah 4</p>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="fld-reminder-months" className="t-card">Sudah berapa bulan terlambat bayar?</label>
                    <span className="shrink-0 rounded-full bg-amber-700 px-3 py-1 t-label text-white">{monthsLate} bulan</span>
                  </div>
                  <input
                    id="fld-reminder-months"
                    type="range"
                    min={1}
                    max={24}
                    value={monthsLate}
                    onChange={(e) => setMonthsLate(Number(e.target.value))}
                    className="mt-2 w-full accent-amber-700"
                  />
                  <div className="flex justify-between t-note">
                    <span>1 bulan</span>
                    <span>12 bulan</span>
                    <span>24 bulan (maks)</span>
                  </div>
                </div>
              </div>

              {/* Hasil */}
              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-3xl  p-6 text-slate-900 shadow-soft">
                  <p className="t-label">Perkiraan denda yang harus dibayar</p>
                  <p className="mt-2 break-words t-result leading-tight"><AnimatedRupiah value={totalPenalty} /></p>
                  <p className="mt-3 t-body">
                    {totalPenalty === 0
                      ? 'Tidak ada denda. Laporan tidak terlambat dan tidak ada pajak yang telat dibayar.'
                      : 'Totalnya dari denda terlambat lapor dan bunga terlambat bayar, dijelaskan di bawah.'}
                  </p>
                </div>

                <div className="card space-y-4">
                  <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="min-w-0">
                      <p className="t-label text-rose-900">Denda terlambat lapor</p>
                      <p className="mt-1 t-note text-slate-700">Jumlahnya tetap. Berlaku kalau SPT terlambat dilaporkan.</p>
                    </div>
                    <span className="shrink-0 t-body font-extrabold text-rose-900"><AnimatedRupiah value={lateFilingFee} /></span>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="min-w-0">
                      <p className="t-label text-amber-900">Bunga terlambat bayar</p>
                      <p className="mt-1 t-note text-slate-700">
                        Dihitung dari {formatRupiah(unpaidTax)} × {monthsLate} bulan × 0,93% per bulan. Paling lama 24 bulan.
                      </p>
                    </div>
                    <span className="shrink-0 t-body font-extrabold text-amber-900"><AnimatedRupiah value={latePaymentInterest} /></span>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 t-body">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-800" />
                  <div className="space-y-2">
                    <p>Ini hanya perkiraan. Tagihan resmi biasanya datang dari kantor pajak sebagai Surat Tagihan Pajak (STP).</p>
                    <details className="t-note">
                      <summary className="cursor-pointer py-1 t-label">Lihat dasar hukum {currentSimTax.taxName}</summary>
                      <p className="mt-1 t-body leading-relaxed">{currentSimTax.penaltyLegalBasis}</p>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PENGINGAT KALENDER */}
          {activeTab === 'subscribe' && (
            <div className="module-enter grid grid-cols-1 gap-5 md:grid-cols-5">
              <div className="card space-y-4 text-center md:col-span-3">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl  text-amber-900">
                  <Bell className="h-7 w-7" />
                </span>
                <h4 className="t-card">Simpan tanggal lapor di kalender</h4>
                <p className="mx-auto max-w-md t-body">
                  Unduh satu file kalender. Isinya tanggal lapor SPT orang pribadi (31 Maret) dan SPT badan (30 April). Kalender akan mengingatkan 14 hari dan 3 hari sebelumnya.
                </p>
                <button type="button" onClick={downloadTaxReminderIcs} className="btn-primary mt-2 w-full sm:w-auto">
                  <Download className="h-5 w-5" />
                  Unduh file kalender (.ics)
                </button>
              </div>
              <ul className="space-y-3 md:col-span-2">
                {[
                  { icon: ShieldCheck, title: 'Data tidak dikirim', text: 'File dibuat di perangkat Anda.', tile: 'bg-emerald-100 text-emerald-900' },
                  { icon: CalendarClock, title: 'Bisa dibuka di HP', text: 'Kalender Google, Apple, dan Outlook bisa membacanya.', tile: 'bg-sky-100 text-sky-900' },
                  { icon: Calendar, title: 'Sesuai batas lapor tahunan', text: 'Tanggalnya mengikuti batas lapor tahunan dari DJP.', tile: 'bg-amber-100 text-amber-900' },
                ].map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li key={benefit.title} className="card flex items-start gap-4 p-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${benefit.tile}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block t-body font-bold text-slate-900">{benefit.title}</span>
                        <span className="mt-0.5 block t-note">{benefit.text}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
