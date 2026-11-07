// Kemajuan pelaporan di perangkat ini. Hanya membaca penyimpanan lokal, tidak mengubah apa pun.
// Setiap langkah dianggap selesai jika sudah ada datanya.

export interface ProgressItem {
  id: string;
  label: string;
  hint: string;
  done: boolean;
}

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const getYearProgress = (): ProgressItem[] => {
  const accounting = readJson<{ journals?: unknown[] }>('atlax_accounting_v1');
  const tax = readJson<{ bukti?: unknown[]; faktur?: unknown[]; billing?: unknown[] }>('atlax_pajak_v1');
  const kepatuhan = readJson<Record<string, { status?: string }>>('atlax_kepatuhan_v1');
  let hasDraft = false;
  try {
    hasDraft = !!localStorage.getItem('atlax_tax_draft_v1');
  } catch {
    hasDraft = false;
  }

  return [
    {
      id: 'hitung',
      label: 'Hitung pajak Anda',
      hint: 'Isi angka penghasilan, lalu lihat hasilnya.',
      done: hasDraft,
    },
    {
      id: 'catat',
      label: 'Catat transaksi usaha',
      hint: 'Catat uang masuk dan keluar di Pembukuan.',
      done: (accounting?.journals?.length ?? 0) > 0,
    },
    {
      id: 'bukti',
      label: 'Simpan bukti pajak',
      hint: 'Bukti potong, faktur, atau kode bayar.',
      done: (tax?.bukti?.length ?? 0) + (tax?.faktur?.length ?? 0) + (tax?.billing?.length ?? 0) > 0,
    },
    {
      id: 'jadwal',
      label: 'Catat pembayaran sesuai jadwal',
      hint: 'Tandai bulan yang sudah dibayar atau dilaporkan.',
      done: kepatuhan ? Object.values(kepatuhan).some((r) => r?.status === 'SUDAH') : false,
    },
  ];
};
