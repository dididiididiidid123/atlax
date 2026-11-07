// SATU SUMBER angka regulasi untuk seluruh aplikasi.
// Ubah angka di sini saja. Semua layar, kalkulator, dan pengingat membaca dari file ini.
// Setiap angka sebaiknya dicek ulang ke peraturan terbaru sebelum dipakai untuk kepatuhan.

export const REGULASI = {
  // PPN
  tarifPpnPersen: 11, // persen, untuk ditampilkan
  tarifPpn: 0.11, // desimal, untuk dihitung

  // Bunga keterlambatan bayar (tarif per bulan, mengikuti KMK acuan)
  bungaPerBulan: 0.0093,
  maksBulanBunga: 24,

  // Denda keterlambatan lapor (rupiah)
  dendaLaporSptTahunanOp: 100_000,
  dendaLaporSptTahunanBadan: 1_000_000,
  dendaLaporSptMasaPph: 100_000,
  dendaLaporSptMasaPpn: 500_000,

  // UMKM (PP 55/2022)
  umkmBatasOmzetBebas: 500_000_000,
  umkmTarifFinal: 0.005,

  // Badan usaha
  tarifBadan: 0.22,
  batasOmzetPengusahaKecilBadan: 4_800_000_000,
} as const;
