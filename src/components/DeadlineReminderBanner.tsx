import React, { useMemo, useState } from 'react';
import { BellRing, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';
import { getUpcomingDeadlines, REMINDER_WINDOW_DAYS } from '../utils/deadlineReminder';

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);

// Pengingat tenggat. Awalnya tampil kecil (satu baris). Bisa dibuka untuk melihat semua tenggat,
// dan bisa diciutkan lagi. Pengingat tidak pernah dihapus, jadi selalu bisa dibuka kembali.
export const DeadlineReminderBanner: React.FC = () => {
  const [open, setOpen] = useState(false);
  const upcoming = useMemo(
    () => getUpcomingDeadlines().filter((item) => item.daysLeft >= 0 && item.daysLeft <= REMINDER_WINDOW_DAYS),
    []
  );

  if (upcoming.length === 0) return null;

  const nearest = upcoming[0];
  const nearestText = nearest.daysLeft === 0 ? 'hari ini' : `${nearest.daysLeft} hari lagi`;

  // Tampilan kecil: satu baris, hanya tenggat terdekat dan jumlahnya
  if (!open) {
    return (
      <section role="status" className="mx-auto w-full max-w-[1600px] px-4">
        <div className="module-enter flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <BellRing className="h-5 w-5" />
            </span>
            <p className="t-body min-w-0 text-amber-950">
              <span className="font-bold">{upcoming.length} batas waktu dekat.</span>{' '}
              <span className="t-note text-amber-900">Terdekat: {nearest.label}, {nearestText}.</span>
            </p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="btn-soft btn-sm bg-white">
            <ChevronDown className="h-5 w-5" />
            <span>Lihat semua</span>
          </button>
        </div>
      </section>
    );
  }

  // Tampilan terbuka: semua tenggat dalam periode pengingat
  return (
    <section role="status" className="mx-auto w-full max-w-[1600px] px-4">
      <div className="module-enter card border-amber-200 bg-amber-50/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <p className="t-card">Batas waktu yang sudah dekat</p>
              <p className="t-note">Dalam {REMINDER_WINDOW_DAYS} hari ke depan</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="btn-soft btn-sm bg-white">
            <ChevronUp className="h-5 w-5" />
            <span>Ciutkan</span>
          </button>
        </div>

        <ul className="mt-4 divide-y divide-amber-100">
          {upcoming.map((item) => {
            const month = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(item.date);
            const urgent = item.daysLeft <= 3;
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-4 py-3">
                <div className="flex w-16 shrink-0 flex-col items-center rounded-xl border border-amber-200 bg-white py-1.5 shadow-sm">
                  <span className="t-body font-black leading-none text-slate-900">{item.date.getDate()}</span>
                  <span className="t-note mt-0.5 font-bold uppercase text-amber-900">{month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="t-body font-bold text-slate-900">{item.label}</p>
                  <p className="t-note">
                    {formatDate(item.date)}. {item.note}
                  </p>
                </div>
                <span className={`chip shrink-0 ${urgent ? 'bg-amber-200 text-amber-950' : 'bg-amber-100 text-amber-900'}`}>
                  <Clock className="h-4 w-4" />
                  {item.daysLeft === 0 ? 'Hari ini' : `${item.daysLeft} hari lagi`}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 t-note">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-800" />
          <span>Pengingat ini hanya muncul saat aplikasi dibuka. Untuk pengingat di kalender, tekan tombol Jadwal bayar di bagian atas, lalu pilih Pengingat.</span>
        </p>
      </div>
    </section>
  );
};
