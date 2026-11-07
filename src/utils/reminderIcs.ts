// Membuat file kalender (.ics) berisi pengingat batas SPT Tahunan.
// Tanggal dihitung dari tanggal hari ini: batas berikutnya untuk OP (31 Maret) dan Badan (30 April).

const pad = (n: number) => String(n).padStart(2, '0');

const toIcsDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

const addDays = (d: Date, days: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

// month dimulai dari 0 (Januari)
const nextOccurrence = (month: number, day: number, from: Date) => {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let date = new Date(from.getFullYear(), month, day);
  if (date < today) date = new Date(from.getFullYear() + 1, month, day);
  return date;
};

const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

interface EventInput {
  uid: string;
  date: Date;
  summary: string;
  description: string;
  stamp: string;
}

const buildEvent = ({ uid, date, summary, description, stamp }: EventInput): string[] => {
  const alarms = [14, 3].flatMap((days) => [
    'BEGIN:VALARM',
    `TRIGGER:-P${days}D`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`${summary} (${days} hari lagi)`)}`,
    'END:VALARM',
  ]);

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${toIcsDate(date)}`,
    `DTEND;VALUE=DATE:${toIcsDate(addDays(date, 1))}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    ...alarms,
    'END:VEVENT',
  ];
};

export const buildTaxReminderIcs = (now: Date = new Date()): string => {
  // Format UTC tanpa tanda pemisah: 20261105T010203Z
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const opDate = nextOccurrence(2, 31, now);
  const badanDate = nextOccurrence(3, 30, now);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ATLAX//Pengingat Pajak//ID',
    'CALSCALE:GREGORIAN',
    ...buildEvent({
      uid: `atlax-spt-op-${opDate.getFullYear()}@atlax`,
      date: opDate,
      summary: 'Batas lapor SPT Tahunan Orang Pribadi',
      description:
        'Batas akhir pembayaran dan pelaporan SPT Tahunan Orang Pribadi (1770) untuk tahun pajak sebelumnya. Jika tanggal ini jatuh pada hari libur, cek pengumuman resmi DJP.',
      stamp,
    }),
    ...buildEvent({
      uid: `atlax-spt-badan-${badanDate.getFullYear()}@atlax`,
      date: badanDate,
      summary: 'Batas lapor SPT Tahunan Badan',
      description:
        'Batas akhir pembayaran dan pelaporan SPT Tahunan Badan (1771) untuk tahun pajak sebelumnya. Jika tanggal ini jatuh pada hari libur, cek pengumuman resmi DJP.',
      stamp,
    }),
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
};

export const downloadTaxReminderIcs = () => {
  const blob = new Blob([buildTaxReminderIcs()], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pengingat-pajak-atlax.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
