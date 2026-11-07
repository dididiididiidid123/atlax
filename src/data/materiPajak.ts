// Materi edukasi pajak yang ditampilkan di tombol "Pelajari pajak".
// Untuk mengganti atau menambah materi, cukup ubah isi array ini.
// Setiap materi punya judul, satu kalimat ringkasan, dan daftar poin (opsional).
// Bahasa dibuat sederhana supaya mudah dipahami pengguna yang belum paham pajak.
// Ini ringkasan edukatif, bukan teks resmi. Cek peraturan terbaru sebelum dipakai untuk kepatuhan.

export interface MateriPajak {
  judul: string;
  ringkasan: string;
  poin?: string[];
  // Isi berbentuk daftar pasal atau istilah: judul kecil dan penjelasan
  daftar?: { judul: string; isi: string }[];
}

export const MATERI_PAJAK: MateriPajak[] = [
  {
    judul: 'Apa itu pajak?',
    ringkasan: 'Pajak adalah iuran wajib kepada negara. Uangnya dipakai untuk pembangunan dan layanan umum seperti jalan, sekolah, dan kesehatan.',
    poin: [
      'Pajak dipungut berdasarkan undang-undang, bukan kemauan pribadi.',
      'Anda tidak mendapat imbalan langsung seperti membeli barang, tetapi manfaatnya dirasakan bersama.',
      'Ada beberapa jenis pajak. Yang paling sering dijumpai warga adalah PPh (dari penghasilan) dan PPN (dari belanja).',
    ],
  },
  {
    judul: 'Siapa yang harus lapor?',
    ringkasan: 'Wajib pajak adalah orang atau badan yang punya penghasilan dan memenuhi syarat untuk ikut administrasi pajak.',
    poin: [
      'Daftar untuk memperoleh NPWP jika sudah memenuhi syarat.',
      'Hitung pajak yang terutang sesuai jenis dan masa pajaknya.',
      'Bayar pajak tepat waktu.',
      'Lapor SPT Tahunan dengan benar dan sebelum batas waktu.',
      'Simpan bukti, seperti bukti potong dan bukti setor, minimal sesuai ketentuan.',
    ],
  },
  {
    judul: 'Kapan harus bayar dan lapor?',
    ringkasan: 'Setiap jenis pajak punya batas waktu. Mengingat tanggal ini membantu Anda tidak terkena denda.',
    daftar: [
      { judul: 'SPT Tahunan pribadi', isi: 'Lapor paling lambat 31 Maret tahun berikutnya.' },
      { judul: 'SPT Tahunan badan usaha', isi: 'Lapor paling lambat 30 April tahun berikutnya.' },
      { judul: 'PPh yang dipotong (gaji, honor, jasa)', isi: 'Bayar tanggal 10 bulan berikutnya. Lapor SPT Masa tanggal 20.' },
      { judul: 'PPh yang disetor sendiri (angsuran)', isi: 'Bayar tanggal 15 bulan berikutnya.' },
      { judul: 'PPN', isi: 'Bayar dan lapor paling lambat akhir bulan berikutnya.' },
    ],
  },
  {
    judul: 'Kalau telat, kena apa?',
    ringkasan: 'Kalau telat lapor atau telat bayar, biasanya ada denda atau bunga. Besarnya tergantung jenis pajak.',
    daftar: [
      { judul: 'Telat lapor SPT Tahunan pribadi', isi: 'Denda Rp 100.000.' },
      { judul: 'Telat lapor SPT Tahunan badan usaha', isi: 'Denda Rp 1.000.000.' },
      { judul: 'Telat lapor SPT Masa PPh', isi: 'Denda Rp 100.000 untuk setiap masa pajak.' },
      { judul: 'Telat lapor SPT Masa PPN', isi: 'Denda Rp 500.000 untuk setiap masa pajak.' },
      { judul: 'Telat bayar', isi: 'Dikenai bunga per bulan, paling lama 24 bulan.' },
    ],
  },
  {
    judul: 'Tiga cara pajak dihitung',
    ringkasan: 'Pajak dihitung dan dibayar dengan tiga cara. Mengetahui caranya membantu Anda tahu siapa yang harus berbuat apa.',
    daftar: [
      { judul: 'Hitung sendiri (self assessment)', isi: 'Anda sendiri menghitung, membayar, dan melapor. Contoh: SPT Tahunan pribadi.' },
      { judul: 'Ditetapkan kantor pajak (official assessment)', isi: 'Kantor pajak menetapkan jumlahnya lewat surat ketetapan. Contoh: SKP jika ada kekurangan.' },
      { judul: 'Dipotong atau dipungut pihak lain (withholding)', isi: 'Pihak lain memotong pajak saat membayar Anda. Contoh: PPh 21 dari perusahaan tempat Anda bekerja.' },
    ],
  },
  {
    judul: 'Prinsip pajak yang baik (1)',
    ringkasan: 'Pajak yang baik punya beberapa prinsip. Berikut tiga yang paling mendasar.',
    daftar: [
      { judul: 'Legalitas', isi: 'Pajak hanya dipungut kalau ada undang-undangnya. Contoh: tarif PPh dan PPN diatur dalam UU HPP.' },
      { judul: 'Kepastian', isi: 'Aturan dan batas waktu harus jelas dan bisa diketahui. Contoh: batas SPT Tahunan pribadi 31 Maret.' },
      { judul: 'Keadilan', isi: 'Beban pajak menyesuaikan kemampuan membayar. Contoh: tarif PPh naik bertahap sesuai penghasilan.' },
    ],
  },
  {
    judul: 'Prinsip pajak yang baik (2)',
    ringkasan: 'Tiga prinsip lainnya, yang membuat pajak mudah dijalankan dan tidak merugikan kegiatan ekonomi.',
    daftar: [
      { judul: 'Kesederhanaan', isi: 'Administrasinya dibuat mudah dipahami. Contoh: PPh Final UMKM 0,5% dan lapor lewat sistem elektronik.' },
      { judul: 'Efisiensi', isi: 'Biaya memungut pajak harus lebih kecil dari pajak yang diterima. Contoh: pemotongan langsung oleh pemberi kerja.' },
      { judul: 'Netralitas', isi: 'Pajak sebaiknya tidak mengubah keputusan usaha tanpa alasan. Contoh: PPN memakai faktur pajak agar beban tidak menumpuk.' },
    ],
  },
  {
    judul: 'Pajak dari penghasilan luar negeri',
    ringkasan: 'Di mana Anda tinggal dan dari mana uang berasal menentukan apakah penghasilan kena pajak di Indonesia.',
    daftar: [
      { judul: 'Tinggal di Indonesia', isi: 'Penghasilan dari dalam dan luar negeri dikenai pajak di Indonesia. Pajak yang sudah dibayar di luar negeri bisa dikreditkan lewat PPh Pasal 24.' },
      { judul: 'Penghasilan dari Indonesia', isi: 'Dikenai pajak di Indonesia, termasuk untuk pihak yang tinggal di luar negeri. Contoh: jasa yang dibayar ke pihak luar negeri dipotong PPh Pasal 26.' },
      { judul: 'Kewarganegaraan', isi: 'Tidak dipakai sebagai dasar pajak penghasilan di Indonesia. Hanya untuk memahami perbedaan dengan negara lain.' },
    ],
  },
  {
    judul: 'Pasal penting UU KUP (1)',
    ringkasan: 'UU KUP adalah aturan umum tata cara pajak. Ini pasal yang paling sering ditanyakan.',
    daftar: [
      { judul: 'Pasal 1 · Istilah dasar', isi: 'Arti wajib pajak, NPWP, SPT, SKP, STP, dan SSP.' },
      { judul: 'Pasal 2 · NPWP', isi: 'Wajib pajak yang memenuhi syarat wajib memakai NPWP.' },
      { judul: 'Pasal 3 · Kewajiban SPT', isi: 'Setiap wajib pajak wajib menyampaikan SPT tepat waktu.' },
      { judul: 'Pasal 7 · Denda telat lapor', isi: 'Besarnya denda sesuai jenis SPT.' },
      { judul: 'Pasal 8 · Pembetulan', isi: 'SPT boleh dibetulkan. Jika pajak jadi bertambah, ada bunga.' },
      { judul: 'Pasal 9 · Bayar tepat waktu', isi: 'Telat bayar dikenai bunga per bulan sesuai aturan yang berlaku.' },
      { judul: 'Pasal 13 · Batas waktu penetapan', isi: 'Kantor pajak punya batas waktu menetapkan pajak, umumnya lima tahun.' },
    ],
  },
  {
    judul: 'Pasal penting UU KUP (2)',
    ringkasan: 'Pasal lanjutan tentang sengketa, restitusi, dan sanksi.',
    daftar: [
      { judul: 'Pasal 14 · Sanksi', isi: 'Bunga dan denda yang belum dibayar bisa ditagih lewat STP.' },
      { judul: 'Pasal 17B · Restitusi', isi: 'Kelebihan bayar pajak bisa diminta kembali setelah diperiksa.' },
      { judul: 'Pasal 19 · Bunga ketetapan', isi: 'Kekurangan pajak dalam SKP dikenai bunga per bulan.' },
      { judul: 'Pasal 25 · Keberatan', isi: 'Anda boleh mengajukan keberatan atas SKP dalam batas waktu tertentu.' },
      { judul: 'Pasal 27 · Banding', isi: 'Jika keberatan ditolak, bisa diajukan banding ke Pengadilan Pajak.' },
      { judul: 'Pasal 28 · Simpan dokumen', isi: 'Pembukuan dan bukti pendukung disimpan, umumnya sepuluh tahun.' },
      { judul: 'Pasal 29 · Pemeriksaan', isi: 'Kantor pajak bisa memeriksa pembukuan untuk menguji kebenaran SPT.' },
      { judul: 'Pasal 34 · Kerahasiaan', isi: 'Data pajak Anda dijaga kerahasiaannya oleh pejabat pajak.' },
      { judul: 'Pasal 38 sampai 44 · Pidana', isi: 'Tidak lapor, lapor isi palsu, atau tidak bayar kekurangan bisa kena sanksi pidana.' },
    ],
  },
  {
    judul: 'Istilah yang sering muncul',
    ringkasan: 'Daftar singkatan yang sering Anda temui di formulir dan surat pajak.',
    daftar: [
      { judul: 'NPWP', isi: 'Nomor Pokok Wajib Pajak. Identitas Anda untuk urusan pajak.' },
      { judul: 'NIK', isi: 'Nomor Induk Kependudukan dari KTP. Untuk orang pribadi, NIK bisa dipakai sebagai NPWP.' },
      { judul: 'SPT', isi: 'Surat Pemberitahuan. Laporan penghasilan dan pajak Anda.' },
      { judul: 'SSP', isi: 'Surat Setoran Pajak. Bukti bahwa pajak sudah disetor.' },
      { judul: 'SKP', isi: 'Surat Ketetapan Pajak. Ditetapkan kantor pajak jika ada kekurangan.' },
      { judul: 'STP', isi: 'Surat Tagihan Pajak. Untuk menagih kekurangan, bunga, atau denda.' },
      { judul: 'KUP', isi: 'Ketentuan Umum dan Tata Cara Perpajakan. Aturan dasar administrasi pajak.' },
    ],
  },
];
