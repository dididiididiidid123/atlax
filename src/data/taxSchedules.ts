import { REGULASI } from '../config/regulasi';
const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
export interface TaxScheduleItem {
  id: string;
  code: string;
  taxName: string;
  category: 'PPH_OP' | 'PPH_BADAN' | 'PPH_21' | 'PPH_23' | 'PPH_4_2' | 'PPH_22' | 'PPH_25_29' | 'PPN';
  categoryLabel: string;
  subject: string; // Siapa yang wajib setor/lapor
  paymentDeadline: string; // Batas Akhir Pembayaran
  paymentLegalBasis: string; // Dasar Hukum Pembayaran
  reportingDeadline: string; // Batas Akhir Pelaporan
  reportingLegalBasis: string; // Dasar Hukum Pelaporan
  lateFilingFee: number; // Nominal Denda Telat Lapor (Rp)
  lateFilingFeeText: string;
  latePaymentInterestRule: string; // Aturan Bunga Telat Bayar
  penaltyLegalBasis: string; // Dasar Hukum Denda
  notes: string;
}

export const ALL_TAX_SCHEDULES: TaxScheduleItem[] = [
  // 1. PPh Orang Pribadi (Tahunan & Bulanan)
  {
    id: 'pph-op-tahunan',
    code: 'SPT 1770 / 1770 S / 1770 SS',
    taxName: 'PPh Wajib Pajak Orang Pribadi (Tahunan)',
    category: 'PPH_OP',
    categoryLabel: 'PPh Orang Pribadi',
    subject: 'Wajib Pajak Orang Pribadi (Karyawan, Pekerja Bebas, UMKM)',
    paymentDeadline: '31 Maret tahun berikutnya (Sebelum SPT disampaikan)',
    paymentLegalBasis: 'Pasal 9 ayat (2) UU KUP',
    reportingDeadline: '31 Maret tahun berikutnya',
    reportingLegalBasis: 'Pasal 3 ayat (3) huruf b UU KUP',
    lateFilingFee: 100_000,
    lateFilingFeeText: `Denda ${rp(REGULASI.dendaLaporSptTahunanOp)} per SPT Tahunan`,
    latePaymentInterestRule: 'Bunga per bulan KMK (acuan BI + 5% / 12) maks 24 bulan',
    penaltyLegalBasis: 'Pasal 7 ayat (1) & Pasal 9 ayat (2a) UU KUP stdd UU HPP',
    notes: 'Jika tanggal 31 Maret jatuh pada hari libur, batas waktu dapat dimajukan atau disesuaikan dengan pengumuman resmi DJP.'
  },
  {
    id: 'pph-op-25',
    code: 'PPh Pasal 25 OP',
    taxName: 'Angsuran Bulanan PPh Pasal 25 Orang Pribadi',
    category: 'PPH_OP',
    categoryLabel: 'PPh Orang Pribadi',
    subject: 'Wajib Pajak Orang Pribadi yang menjalankan usaha / pekerjaan bebas',
    paymentDeadline: 'Tanggal 15 bulan berikutnya setelah masa pajak berakhir',
    paymentLegalBasis: 'Pasal 9 ayat (1) UU KUP & PMK 242/PMK.03/2014',
    reportingDeadline: 'Tidak wajib lapor SPT Masa (Cukup validasi NTPN pembayaran)',
    reportingLegalBasis: 'Peraturan Menteri Keuangan No. 9/PMK.03/2018',
    lateFilingFee: 0,
    lateFilingFeeText: 'Bebas denda lapor jika telah divalidasi NTPN',
    latePaymentInterestRule: 'Bunga per bulan KMK dari nominal angsuran yang terlambat disetor',
    penaltyLegalBasis: 'Pasal 9 ayat (2a) UU KUP',
    notes: 'Angsuran pajak dihitung berdasarkan SPT Tahunan tahun sebelumnya untuk meringankan beban pajak di akhir tahun.'
  },

  // 2. PPh Badan (Tahunan & Bulanan)
  {
    id: 'pph-badan-tahunan',
    code: 'SPT 1771',
    taxName: 'PPh Wajib Pajak Badan (Tahunan)',
    category: 'PPH_BADAN',
    categoryLabel: 'PPh Badan',
    subject: 'Perusahaan, PT, CV, Yayasan, Koperasi, BUMN, BUT',
    paymentDeadline: '30 April tahun berikutnya (Sebelum SPT disampaikan)',
    paymentLegalBasis: 'Pasal 9 ayat (2) UU KUP',
    reportingDeadline: '30 April tahun berikutnya',
    reportingLegalBasis: 'Pasal 3 ayat (3) huruf c UU KUP',
    lateFilingFee: 1_000_000,
    lateFilingFeeText: `Denda ${rp(REGULASI.dendaLaporSptTahunanBadan)} per SPT Tahunan`,
    latePaymentInterestRule: 'Bunga per bulan KMK (acuan BI + 5% / 12) maks 24 bulan',
    penaltyLegalBasis: 'Pasal 7 ayat (1) & Pasal 9 ayat (2a) UU KUP stdd UU HPP',
    notes: 'Wajib melampirkan laporan keuangan neraca dan rugi-laba, serta daftar nominatif biaya promosi/entertainment.'
  },
  {
    id: 'pph-badan-25',
    code: 'PPh Pasal 25 Badan',
    taxName: 'Angsuran Bulanan PPh Pasal 25 Badan',
    category: 'PPH_BADAN',
    categoryLabel: 'PPh Badan',
    subject: 'Seluruh Wajib Pajak Badan aktif',
    paymentDeadline: 'Tanggal 15 bulan berikutnya',
    paymentLegalBasis: 'Pasal 9 ayat (1) UU KUP & PMK 242/PMK.03/2014',
    reportingDeadline: 'Tidak wajib lapor SPT Masa terpisah (NTPN bank terintegrasi)',
    reportingLegalBasis: 'PMK 9/PMK.03/2018',
    lateFilingFee: 0,
    lateFilingFeeText: 'Bebas denda lapor jika telah divalidasi NTPN',
    latePaymentInterestRule: 'Bunga per bulan KMK dihitung dari tanggal jatuh tempo pembayaran',
    penaltyLegalBasis: 'Pasal 9 ayat (2a) UU KUP',
    notes: 'Jika ada kompensasi kerugian atau fasilitas penanaman modal, tarif angsuran disesuaikan.'
  },

  // 3. PPh Pasal 21 / 26 (Karyawan & Tenaga Ahli)
  {
    id: 'pph-21-bulanan',
    code: 'PPh Pasal 21 / 26',
    taxName: 'Pemotongan Pajak Penghasilan Karyawan & Honorarium',
    category: 'PPH_21',
    categoryLabel: 'PPh 21 / 26',
    subject: 'Pemberi Kerja, HRD Perusahaan, Bendahara Instansi',
    paymentDeadline: 'Tanggal 10 bulan berikutnya',
    paymentLegalBasis: 'Pasal 9 ayat (1) UU KUP & PMK 242/PMK.03/2014',
    reportingDeadline: 'Tanggal 20 bulan berikutnya (SPT Masa PPh 21)',
    reportingLegalBasis: 'Pasal 3 ayat (3) huruf a UU KUP',
    lateFilingFee: 100_000,
    lateFilingFeeText: `Denda ${rp(REGULASI.dendaLaporSptMasaPph)} per Masa Pajak`,
    latePaymentInterestRule: 'Bunga per bulan KMK dari total PPh 21 yang kurang dipotong/disetor',
    penaltyLegalBasis: 'Pasal 7 ayat (1) & Pasal 9 ayat (2a) UU KUP',
    notes: 'Mulai 2024 menggunakan metode TER (Tarif Efektif Rata-Rata PP 58/2023) untuk Masa Pajak Januari-November, dan diselaraskan pada Masa Desember.'
  },

  // 4. PPh Pasal 23 / 26 (Jasa, Sewa, Dividen, Royalti)
  {
    id: 'pph-23-bulanan',
    code: 'PPh Pasal 23 / 26',
    taxName: 'Pemotongan PPh atas Dividen, Bunga, Royalti, & Jasa',
    category: 'PPH_23',
    categoryLabel: 'PPh 23 / 26',
    subject: 'Badan Usaha atau Pemotong yang bertransaksi dengan pihak ketiga',
    paymentDeadline: 'Tanggal 10 bulan berikutnya',
    paymentLegalBasis: 'Pasal 9 ayat (1) UU KUP & PMK 242/PMK.03/2014',
    reportingDeadline: 'Tanggal 20 bulan berikutnya (Dilaporkan via SPT Masa Unifikasi)',
    reportingLegalBasis: 'PER-24/PJ/2021 & Pasal 3 ayat (3) UU KUP',
    lateFilingFee: 100_000,
    lateFilingFeeText: `Denda ${rp(REGULASI.dendaLaporSptMasaPph)} per Masa Pajak Unifikasi`,
    latePaymentInterestRule: 'Bunga per bulan KMK dari nilai pemotongan yang terlambat disetor',
    penaltyLegalBasis: 'Pasal 7 ayat (1) & Pasal 9 ayat (2a) UU KUP',
    notes: 'Tarif umum: 2% untuk jasa teknik, manajemen, konsultan; 15% untuk dividen, bunga, dan royalti. Wajib terbitkan bukti potong unifikasi elektronik (e-Bupot).'
  },

  // 5. PPh Pasal 4 ayat (2) (PPh Final & UMKM PP 55/2022)
  {
    id: 'pph-4-2-umkm',
    code: 'PPh Final PP 55/2022',
    taxName: 'PPh Final UMKM 0,5% (Peredaran Bruto)',
    category: 'PPH_4_2',
    categoryLabel: 'PPh Final 4(2)',
    subject: 'Pelaku Usaha Orang Pribadi & Badan dengan omzet < Rp 4,8 Miliar',
    paymentDeadline: 'Tanggal 15 bulan berikutnya',
    paymentLegalBasis: 'PP No. 55 Tahun 2022 & PMK 242/PMK.03/2014',
    reportingDeadline: 'Tidak wajib lapor SPT Masa bulanan (NTPN divalidasi sebagai lapor)',
    reportingLegalBasis: 'PMK 9/PMK.03/2018',
    lateFilingFee: 0,
    lateFilingFeeText: 'Bebas denda lapor bulanan',
    latePaymentInterestRule: 'Bunga per bulan KMK dari nilai pajak 0,5% yang belum disetor',
    penaltyLegalBasis: 'Pasal 9 ayat (2a) UU KUP',
    notes: 'Wajib Pajak Orang Pribadi menikmati omzet s.d. Rp 500 Juta per tahun BEBAS PAJAK. Pajak 0,5% hanya dihitung setelah omzet kumulatif melampaui Rp 500 Juta.'
  },
  {
    id: 'pph-4-2-sewa-konstruksi',
    code: 'PPh Pasal 4 ayat (2) Sewa & Konstruksi',
    taxName: 'PPh Final Sewa Tanah/Bangunan & Jasa Konstruksi',
    category: 'PPH_4_2',
    categoryLabel: 'PPh Final 4(2)',
    subject: 'Penyewa atau Pemilik Bangunan & Kontraktor',
    paymentDeadline: 'Tanggal 10 bulan berikutnya (Pemotong) atau tgl 15 (Setor Sendiri)',
    paymentLegalBasis: 'PMK 242/PMK.03/2014',
    reportingDeadline: 'Tanggal 20 bulan berikutnya (via SPT Masa Unifikasi)',
    reportingLegalBasis: 'PER-24/PJ/2021',
    lateFilingFee: 100_000,
    lateFilingFeeText: `Denda ${rp(REGULASI.dendaLaporSptMasaPph)} per Masa Pajak`,
    latePaymentInterestRule: 'Bunga per bulan KMK dari nominal PPh Final terutang',
    penaltyLegalBasis: 'Pasal 7 ayat (1) & Pasal 9 ayat (2a) UU KUP',
    notes: 'Tarif sewa tanah dan/atau bangunan sebesar 10% bersifat final. Konstruksi bervariasi 1,75% s.d. 4% tergantung kualifikasi usaha.'
  },

  // 6. PPh Pasal 22 (Impor, Ekspor Komoditas, & Pengadaan Pemerintah)
  {
    id: 'pph-22-instansi',
    code: 'PPh Pasal 22',
    taxName: 'Pemungutan PPh Pasal 22 (Impor & Pengadaan Barang)',
    category: 'PPH_22',
    categoryLabel: 'PPh 22',
    subject: 'Bank Devisa, Bea Cukai, Bendaharawan Pemerintah, Badan Usaha Tertentu',
    paymentDeadline: 'Hari yang sama saat pembayaran (Bendahara) / 1 hari kerja (Bea Cukai) / tgl 10 bulan berikutnya (Badan)',
    paymentLegalBasis: 'PMK 242/PMK.03/2014 & PMK 34/PMK.010/2017',
    reportingDeadline: 'Tanggal 20 bulan berikutnya (SPT Masa Unifikasi) atau 7 hari setelah pemungutan (Bendahara)',
    reportingLegalBasis: 'Pasal 3 ayat (3) UU KUP',
    lateFilingFee: 100_000,
    lateFilingFeeText: `Denda ${rp(REGULASI.dendaLaporSptMasaPph)} per Masa Pajak`,
    latePaymentInterestRule: 'Bunga per bulan KMK dari nilai PPh 22 yang terlambat disetor',
    penaltyLegalBasis: 'Pasal 7 ayat (1) & Pasal 9 ayat (2a) UU KUP',
    notes: 'Dipungut atas transaksi penjualan barang sangat mewah, BBM/Gas, serta pembelian barang oleh instansi pemerintah di atas Rp 2.000.000.'
  },

  // 7. PPh Pasal 29 (Pelunasan Pajak Kurang Bayar Tahunan)
  {
    id: 'pph-29-kurang-bayar',
    code: 'PPh Pasal 29',
    taxName: 'Pelunasan PPh Kurang Bayar Tahunan (Pasal 29)',
    category: 'PPH_25_29',
    categoryLabel: 'PPh 25 & 29',
    subject: 'Wajib Pajak Orang Pribadi & Badan yang status SPT-nya Kurang Bayar',
    paymentDeadline: 'Paling lambat sebelum SPT Tahunan disampaikan (31 Maret untuk OP, 30 April untuk Badan)',
    paymentLegalBasis: 'Pasal 9 ayat (2) UU KUP',
    reportingDeadline: 'Terintegrasi dalam pelaporan SPT Tahunan masing-masing',
    reportingLegalBasis: 'Pasal 3 ayat (3) UU KUP',
    lateFilingFee: 100_000,
    lateFilingFeeText: `Denda lapor: ${rp(REGULASI.dendaLaporSptTahunanOp)} (OP) atau ${rp(REGULASI.dendaLaporSptTahunanBadan)} (Badan)`,
    latePaymentInterestRule: 'Bunga per bulan KMK dihitung dari batas akhir pembayaran (31 Maret/30 April) sampai tanggal setor',
    penaltyLegalBasis: 'Pasal 9 ayat (2b) UU KUP',
    notes: 'Disetor menggunakan Kode Akun Pajak (KAP) 411125 (PPh OP) atau 411126 (PPh Badan) dengan Kode Jenis Setoran (KJS) 200 (Tahunan).'
  },

  // 8. PPN (Pajak Pertambahan Nilai) & PPnBM
  {
    id: 'ppn-masa',
    code: 'SPT Masa PPN 1111',
    taxName: 'PPN & PPnBM (Pajak Pertambahan Nilai)',
    category: 'PPN',
    categoryLabel: 'PPN & PPnBM',
    subject: 'Pengusaha Kena Pajak (PKP) perorangan maupun badan hukum',
    paymentDeadline: 'Paling lambat akhir bulan berikutnya sebelum SPT Masa PPN disampaikan',
    paymentLegalBasis: 'Pasal 15A ayat (2) UU KUP stdd UU HPP',
    reportingDeadline: 'Paling lambat akhir bulan berikutnya setelah berakhirnya masa pajak',
    reportingLegalBasis: 'Pasal 15A ayat (1) UU KUP',
    lateFilingFee: 500_000,
    lateFilingFeeText: `Denda ${rp(REGULASI.dendaLaporSptMasaPpn)} per Masa Pajak PPN`,
    latePaymentInterestRule: 'Bunga per bulan KMK dari nilai PPN Kurang Bayar',
    penaltyLegalBasis: 'Pasal 7 ayat (1) & Pasal 9 ayat (2a) UU KUP',
    notes: 'Tarif PPN umum saat ini adalah 11% (UU HPP). Pelaporan dilakukan secara elektronik melalui aplikasi e-Faktur Web Based DJP.'
  }
];
