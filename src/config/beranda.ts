// Isi halaman beranda. Dibuat ringkas dan tidak mengulang menu.
// Ubah teks dan daftar di sini, tampilan beranda ikut berubah.
// Hanya tuliskan klaim yang benar-benar berlaku di aplikasi ini.

import type { ModeKey } from './modules';

export const BERANDA = {
  judul: 'Hitung pajak, tanpa bingung.',
  ringkas: 'Panduan langkah demi langkah untuk menghitung dan menyiapkan laporan pajak.',
  inti: ['Bahasa sehari-hari', 'Data tetap di perangkat', 'Hasil bisa dicetak'],
  ajakan: 'Mulai hitung pajak',
  ajakanModul: 'WIZARD' as ModeKey,

  // Cek cepat: dua pertanyaan singkat yang mengarahkan ke modul yang tepat
  cekCepat: {
    judul: 'Cek cepat',
    pertanyaan: 'Apakah Anda punya penghasilan dari kerja atau usaha tahun ini?',
    ya: {
      isi: 'Anda kemungkinan perlu lapor SPT Tahunan. Mulai dari Panduan SPT.',
      modul: 'WIZARD' as ModeKey,
      label: 'Buka Panduan SPT',
    },
    tidak: {
      isi: 'Jika memang tidak ada penghasilan, Anda mungkin tidak perlu lapor. Cek lagi di Panduan SPT bila ragu.',
      modul: 'WIZARD' as ModeKey,
      label: 'Cek di Panduan SPT',
    },
  },

  // Satu istilah setiap hari. Dipilih berdasarkan tanggal.
  istilah: [
    { kata: 'PTKP', arti: 'Penghasilan tidak kena pajak. Batas penghasilan setahun yang bebas pajak, sesuai status keluarga.' },
    { kata: 'NPWP', arti: 'Nomor Pokok Wajib Pajak. Identitas Anda untuk urusan pajak.' },
    { kata: 'Bukti potong', arti: 'Surat dari pemberi kerja atau pihak pemotong yang menunjukkan pajak yang sudah dipotong.' },
    { kata: 'SPT Tahunan', arti: 'Laporan penghasilan dan pajak Anda untuk satu tahun.' },
    { kata: 'PKP', arti: 'Pengusaha Kena Pajak, yaitu usaha yang wajib memungut PPN.' },
  ],

  tips: 'Simpan bukti potong dari kantor. Bukti ini dipakai saat lapor SPT Tahunan.',
};
