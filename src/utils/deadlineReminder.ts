// Jadwal jatuh tempo berikutnya dan pengingat mendekati batas waktu.
// Tanggal dihitung dari aturan umum. Setiap tanggal tetap perlu diverifikasi terhadap pengumuman DJP.

export interface UpcomingDeadline {
  id: string;
  label: string;
  date: Date;
  daysLeft: number;
  note: string;
}

export const REMINDER_WINDOW_DAYS = 14;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// month dimulai dari 0 (Januari)
const nextAnnual = (month: number, day: number, from: Date) => {
  const today = startOfDay(from);
  let date = new Date(from.getFullYear(), month, day);
  if (date < today) date = new Date(from.getFullYear() + 1, month, day);
  return date;
};

const nextMonthly = (day: number, from: Date) => {
  const today = startOfDay(from);
  let date = new Date(from.getFullYear(), from.getMonth(), day);
  if (date < today) date = new Date(from.getFullYear(), from.getMonth() + 1, day);
  return date;
};

// Akhir bulan berikutnya setelah masa pajak. Untuk pengingat, ambil akhir bulan ini jika belum lewat.
const nextEndOfMonth = (from: Date) => {
  const today = startOfDay(from);
  let date = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  if (date < today) date = new Date(from.getFullYear(), from.getMonth() + 2, 0);
  return date;
};

export const getUpcomingDeadlines = (now: Date = new Date()): UpcomingDeadline[] => {
  const today = startOfDay(now);
  const items = [
    {
      id: 'spt-op',
      label: 'Batas lapor SPT Tahunan Orang Pribadi',
      date: nextAnnual(2, 31, now),
      note: 'Jatuh pada 31 Maret. Jika hari libur, cek pengumuman resmi DJP.',
    },
    {
      id: 'spt-badan',
      label: 'Batas lapor SPT Tahunan Badan',
      date: nextAnnual(3, 30, now),
      note: 'Jatuh pada 30 April. Jika hari libur, cek pengumuman resmi DJP.',
    },
    {
      id: 'setor-10',
      label: 'Setor PPh 21, 23, dan 26 yang dipotong (masa bulanan)',
      date: nextMonthly(10, now),
      note: 'Aturan umum: tanggal 10 bulan berikutnya. PPh 22 bendahara punya tenggat sendiri.',
    },
    {
      id: 'setor-15',
      label: 'Setor PPh 25 dan PPh yang disetor sendiri (masa bulanan)',
      date: nextMonthly(15, now),
      note: 'Aturan umum: tanggal 15 bulan berikutnya.',
    },
    {
      id: 'lapor-20',
      label: 'Lapor SPT Masa PPh 21, 23, dan 26',
      date: nextMonthly(20, now),
      note: 'Aturan umum: tanggal 20 bulan berikutnya.',
    },
    {
      id: 'ppn-akhir-bulan',
      label: 'Setor dan lapor SPT Masa PPN',
      date: nextEndOfMonth(now),
      note: 'Aturan umum: akhir bulan berikutnya setelah masa pajak. Tanggal setor PPN perlu dicek ulang ke peraturan yang berlaku.',
    },
  ];

  return items
    .map((item) => ({
      ...item,
      daysLeft: Math.round((startOfDay(item.date).getTime() - today.getTime()) / 86_400_000),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
};
