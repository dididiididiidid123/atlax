// Administrasi pajak ATLAX: bukti potong (e-Bupot), faktur pajak, dan e-Billing.
// Semua dokumen di sini adalah catatan internal. Nomor resmi (nomor faktur dari DJP, kode billing, NTPN,
// dan nomor bukti potong resmi) hanya diisi manual setelah diterbitkan sistem DJP atau bank.

export const TAX_ADMIN_STORAGE_KEY = 'atlax_pajak_v1';

export type BuktiJenis = 'PPH_21' | 'PPH_23' | 'PPH_26' | 'UNIFIKASI';
export type FakturJenis = 'KELUARAN' | 'MASUKAN';
export type DocStatus = 'AKTIF' | 'DIBATALKAN' | 'DIGANTI';
export type BillingStatus = 'BELUM_DIBAYAR' | 'MENUNGGU_KONFIRMASI' | 'LUNAS';

export interface RiwayatItem {
  waktu: string;
  aktivitas: string;
}

export interface BuktiPotong {
  id: string;
  nomorInternal: string;
  tanggal: string;
  jenis: BuktiJenis;
  pemotongNama: string;
  pemotongNpwp: string;
  penerimaNama: string;
  penerimaId: string; // NPWP atau NIK
  objek: string;
  masa: string; // "1".."12" atau "Tahunan"
  tahun: number;
  bruto: number;
  dpp: number;
  tarif: number;
  pajakDipotong: number;
  status: DocStatus;
  riwayat: RiwayatItem[];
}

export interface Faktur {
  id: string;
  nomorInternal: string;
  nomorFaktur: string; // diisi manual dari nomor seri DJP
  tanggal: string;
  jenis: FakturJenis;
  penjualNama: string;
  penjualNpwp: string;
  pembeliNama: string;
  pembeliId: string;
  namaBarang: string;
  jumlah: number;
  hargaSatuan: number;
  dpp: number;
  tarifPpn: number;
  ppn: number;
  tarifPpnbm: number;
  ppnbm: number;
  total: number;
  status: DocStatus;
  gantiDariId?: string;
  riwayat: RiwayatItem[];
}

export interface Billing {
  id: string;
  nomorReferensi: string;
  jenisPajak: string;
  utangKode: string; // kode akun utang di pembukuan
  kap: string;
  kjs: string;
  masa: string;
  tahun: number;
  nominal: number;
  tanggalBuat: string;
  jatuhTempo: string;
  kodeBillingResmi: string; // diisi manual dari bank atau sistem DJP
  status: BillingStatus;
  buktiNama: string;
  jurnalDibuat: boolean;
  riwayat: RiwayatItem[];
}

export interface TaxAdminStore {
  bukti: BuktiPotong[];
  faktur: Faktur[];
  billing: Billing[];
}

export const emptyTaxAdminStore = (): TaxAdminStore => ({ bukti: [], faktur: [], billing: [] });

export const BUKTI_LABEL: Record<BuktiJenis, string> = {
  PPH_21: 'PPh Pasal 21',
  PPH_23: 'PPh Pasal 23',
  PPH_26: 'PPh Pasal 26',
  UNIFIKASI: 'PPh Unifikasi (Pasal 4(2), 15, 22, 23, 26)',
};

export const BILLING_JENIS: { label: string; utangKode: string }[] = [
  { label: 'PPh Pasal 21', utangKode: '2202' },
  { label: 'PPh Pasal 22', utangKode: '2203' },
  { label: 'PPh Pasal 23', utangKode: '2204' },
  { label: 'PPh Pasal 25', utangKode: '2205' },
  { label: 'PPh Pasal 26', utangKode: '2206' },
  { label: 'PPh Final Pasal 4(2)', utangKode: '2207' },
  { label: 'PPN', utangKode: '2208' },
  { label: 'PPnBM', utangKode: '2209' },
];

export const STATUS_LABEL: Record<BillingStatus, string> = {
  BELUM_DIBAYAR: 'Belum Dibayar',
  MENUNGGU_KONFIRMASI: 'Menunggu Konfirmasi',
  LUNAS: 'Lunas',
};

export const nowIso = () => new Date().toISOString();

export const nextNumber = (prefix: string, year: number, count: number) =>
  `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

// Identitas: NPWP 15 atau 16 digit, atau NIK 16 digit
export const isValidNpwpOrNik = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 15 || digits.length === 16;
};

export const isValidNpwp = isValidNpwpOrNik;

export const isValidNik = (value: string) => /^\d{16}$/.test(value.replace(/\D/g, ''));

export const isValidRate = (value: number) => value >= 0 && value <= 100;

// e-Bupot: DPP dihitung dari bruto (bila tidak diisi khusus), pajak = DPP x tarif
export const calcBukti = (bruto: number, tarif: number, dppOverride?: number) => {
  const dpp = Math.max(0, dppOverride && dppOverride > 0 ? dppOverride : bruto);
  const pajak = Math.round((dpp * Math.max(0, tarif)) / 100);
  return { dpp, pajak };
};

// Faktur: DPP = jumlah x harga satuan, PPN = DPP x tarif PPN, PPnBM = DPP x tarif PPnBM
export const calcFaktur = (jumlah: number, harga: number, tarifPpn: number, tarifPpnbm: number) => {
  const dpp = Math.round(Math.max(0, jumlah) * Math.max(0, harga));
  const ppn = Math.round((dpp * Math.max(0, tarifPpn)) / 100);
  const ppnbm = Math.round((dpp * Math.max(0, tarifPpnbm)) / 100);
  return { dpp, ppn, ppnbm, total: dpp + ppn + ppnbm };
};

export const sortByDate = <T extends { tanggal?: string; tanggalBuat?: string; id: string }>(list: T[]) =>
  [...list].sort((a, b) => {
    const da = a.tanggal ?? a.tanggalBuat ?? '';
    const db = b.tanggal ?? b.tanggalBuat ?? '';
    return da === db ? (a.id < b.id ? 1 : -1) : da < db ? 1 : -1;
  });
