# ATLAX
## MAKE TAX REPORTING SIMPLER
### PRODUCT REQUIREMENT DOCUMENT (PRD)
**Dokumen kebutuhan produk aplikasi pelaporan pajak digital**

| Nama Produk | ATLAX |
| :--- | :--- |
| **Jenis Produk** | Aplikasi digital pelaporan dan pembayaran pajak |
| **Tagline** | Make Tax Reporting Simpler |

---

### 1. Product Overview
* **Nama Produk**: ATLAX
* **Tagline**: Make Tax Reporting Simpler.
* **Jenis Produk**: Aplikasi digital pelaporan dan pembayaran pajak.
* **Deskripsi Produk**: ATLAX merupakan aplikasi digital yang dirancang untuk membantu masyarakat dalam menghitung, memahami, dan melaporkan kewajiban perpajakan secara lebih mudah. Aplikasi ini menyediakan tampilan sederhana, panduan pengisian, penghitungan pajak otomatis, pengingat batas waktu pembayaran dan pelaporan, serta sistem penyimpanan data untuk mempermudah pengguna dalam memenuhi kewajiban perpajakannya.

---

### 2. Background (Latar Belakang)
Masih terdapat masyarakat yang mengalami kesulitan dalam melaporkan pajak. Kesulitan tersebut bukan hanya disebabkan oleh kurangnya pengetahuan tentang perpajakan, tetapi juga karena sistem pelaporan yang dianggap rumit, penggunaan istilah perpajakan yang sulit dipahami, dan kurangnya panduan saat melakukan pengisian.

Akibatnya, sebagian masyarakat merasa malas, bingung, atau menunda pelaporan pajak. Oleh karena itu, ATLAX dikembangkan sebagai solusi digital untuk membantu masyarakat memahami dan melakukan proses pelaporan pajak secara lebih sederhana, praktis, dan efisien.

---

### 3. Problem Statement (Identifikasi Masalah)
1. **Sistem pelaporan pajak terlalu rumit**:
   * Tampilan aplikasi kurang sederhana.
   * Bahasa dan istilah perpajakan sulit dipahami masyarakat awam.
   * Pengguna kesulitan memahami tahapan pelaporan.
2. **Penghitungan pajak harus dilakukan secara mandiri**:
   * Pengguna harus memahami rumus dan tarif pajak terlebih dahulu.
   * Tidak semua masyarakat memahami cara menghitung pajak.
   * Kurangnya alat bantu penghitungan dan petunjuk yang mudah dipahami.
3. **Kurangnya notifikasi dan pengingat**:
   * Pengguna sering lupa jadwal pembayaran dan pelaporan pajak.
   * Kurangnya pengingat dapat menyebabkan keterlambatan dalam memenuhi kewajiban perpajakan.
4. **Pengelompokan penghasilan kurang jelas**:
   * Pengguna kesulitan membedakan jenis atau sumber penghasilan.
   * Penghasilan yang berbeda dapat membingungkan pengguna ketika melakukan pengisian.
   * Dibutuhkan pengelompokan penghasilan yang lebih terstruktur.
5. **Gangguan server**:
   * Server yang mengalami gangguan dapat menghambat proses pelaporan.
   * Pengguna kesulitan menyelesaikan laporan ketika aplikasi mengalami error.
   * Gangguan sistem dapat menyebabkan pengguna kehilangan waktu dan harus mengulang proses pengisian.

---

### 4. Product Goals (Tujuan Produk)
* Mempermudah masyarakat dalam melakukan pelaporan pajak.
* Mengurangi kesalahan penghitungan pajak melalui fitur penghitungan otomatis.
* Memberikan panduan perpajakan dengan bahasa sederhana.
* Membantu pengguna mengingat batas waktu pembayaran dan pelaporan.
* Membuat proses pengisian data penghasilan lebih terstruktur.
* Meningkatkan kenyamanan dan kepercayaan pengguna terhadap sistem pelaporan pajak.

---

### 5. Target Users (Target Pengguna)
* Wajib pajak orang pribadi.
* Karyawan yang memiliki kewajiban perpajakan.
* Pelaku UMKM.
* Masyarakat yang belum memahami prosedur pelaporan pajak.
* Wajib pajak yang membutuhkan bantuan dalam menghitung pajak.

---

### 6. Product Features (Fitur Produk)
| Fitur | Fungsi |
| :--- | :--- |
| **Simple Interface** | Menyediakan tampilan aplikasi yang sederhana dan mudah dipahami. |
| **Tax Guide** | Memberikan panduan setiap tahapan pengisian laporan pajak. |
| **Tax Calculator** | Membantu menghitung pajak secara otomatis berdasarkan data yang dimasukkan. |
| **Income Categorization** | Mengelompokkan penghasilan berdasarkan jenis dan sumbernya. |
| **Tax Reminder** | Memberikan pengingat jadwal pembayaran dan pelaporan pajak. |
| **Data Saving** | Menyimpan progres pengisian agar pengguna tidak perlu mengulang dari awal. |
| **Help Center** | Menyediakan penjelasan istilah dan pertanyaan umum perpajakan. |
| **System Recovery** | Membantu pengguna melanjutkan pengisian ketika terjadi gangguan sistem. |
| **Periode Masa & Tahunan** | Memisahkan kalkulasi masa pajak bulanan, perhitungan tahunan, dan rekap tahunan sesuai karakter tiap jenis pajak. |
| **Pra-Pelaporan** | Meminta identitas wajib pajak, menyiapkan ringkasan yang dapat disalin/dicetak, dan memandu pengguna menyelesaikan pelaporan pada Coretax DJP. |
| **PPN & PPnBM** | Menghitung PPN keluaran setelah kredit pajak masukan/kompensasi serta PPnBM berdasarkan DPP dan tarif yang sesuai klasifikasi barang. |

---

### 7. Functional Requirements (Kebutuhan Fungsional)
1. Sistem dapat menerima data identitas dan penghasilan pengguna.
2. Sistem dapat menghitung pajak berdasarkan ketentuan yang berlaku.
3. Sistem dapat menampilkan hasil perhitungan kepada pengguna.
4. Sistem dapat memberikan panduan pengisian laporan.
5. Sistem dapat mengirimkan notifikasi terkait batas waktu pajak.
6. Sistem dapat mengelompokkan penghasilan sesuai kategorinya.
7. Sistem dapat menyimpan progres pengisian laporan.
8. Sistem dapat menampilkan informasi apabila terjadi kesalahan atau gangguan.
9. Sistem menyediakan pilihan masa pajak dan tahun pajak, serta menerapkan perhitungan sesuai karakter pelaporan masing-masing jenis pajak.
10. Sistem menghitung PPh 21 tahunan dari penghasilan neto, PTKP, PKP, dan tarif progresif Pasal 17 (bukan TER × 12), lalu menghitung rekonsiliasi Desember dari pajak tahunan dikurangi pemotongan Januari-November. Pemotongan aktual dapat dimasukkan per bulan; jika kosong, nilai bulan itu merupakan estimasi TER dan harus dikenali sebagai estimasi dalam rincian.
11. Sebelum kalkulasi ditampilkan, sistem mewajibkan NIK 16 digit dan nama wajib pajak; NPWP opsional, tetapi bila diisi formatnya divalidasi. Kalkulator untuk semua jenis PPh dan PPN tetap tersedia. Sistem menampilkan ringkasan pajak dan panduan untuk menyelesaikan pelaporan melalui kanal resmi.
12. Sistem memperhitungkan pembayaran/kredit yang sudah dilakukan agar hasil akhir dapat berupa kurang bayar, nihil, atau lebih bayar bila ketentuan pajaknya memungkinkan.
13. Sistem menyediakan kalkulasi PPnBM terpisah dari PPN dengan DPP dan tarif yang diisi berdasarkan klasifikasi barang.
14. Sistem memantau tenggat pembayaran dan pelaporan secara terpisah berdasarkan zona waktu akun WIB/WITA/WIT, menghitung hari keterlambatan, dan menampilkan status tepat waktu, mendekati tenggat, terlambat, atau belum diselesaikan.
15. Sistem menghubungkan nominal kalkulator dengan jadwal pajak, menyiapkan sanksi lapor sesuai jenis SPT, dan mengestimasi bunga bayar hanya jika tarif KMK bulanan dan masa berlakunya tersedia.
16. Sistem dashboard menyimpan jadwal, riwayat laporan, dan tarif bunga yang ditambahkan pengguna melalui Edge Function Supabase dengan enkripsi AES-GCM di server; data lama dari localStorage dimigrasikan dan dihapus hanya setelah penyimpanan terenkripsi berhasil.
17. Input nominal PPh 21 dan hasil perhitungan ditampilkan dalam format Rupiah; kolom nominal tetap dapat diedit. Jika nominal bruto belum dimasukkan, hasil berstatus "Belum dapat dihitung" alih-alih menampilkan Rp0.
18. Kalkulator PPh 15 memuat kategori usaha pelayaran/penerbangan dalam dan luar negeri serta kategori usaha tertentu lain. DPP, tarif, sifat pajak, tanggal transaksi, dan referensi hukum harus dimasukkan/diverifikasi pengguna; sistem tidak mengasumsikan tarif resmi.
19. Kalkulator estimasi PPh Final Pasal 4 ayat (2) memisahkan kategori objek, tanggal, bruto, DPP, tarif, pembayaran/pemotongan, dan referensi hukum. Tarif tidak ditetapkan otomatis tanpa verifikasi aturan transaksi.
20. Ringkasan laporan internal menggunakan angka hasil kalkulator, judul per jenis pajak, identitas, masa/tahun, rincian kalkulasi dalam tabel, data transaksi/dokumen pendukung, dan tenggat hasil saran bila dapat ditentukan. Status perhitungan, pembayaran, dan pelaporan ditampilkan terpisah. Pratinjau dapat dicetak ke kertas A4/PDF melalui dialog cetak browser; tabel dan kelompok perhitungan dijaga agar tidak terpotong, dengan halaman bertambah mengikuti isi. Maksimal 50 ringkasan terakhir disimpan terenkripsi pada akun dashboard, dapat dilihat dan dihapus.
21. Ringkasan PPh 22 membedakan transaksi impor dan pengadaan/pemungutan barang pemerintah, menyajikan kategori transaksi, DPP, tarif dasar/efektif, rumus, pajak, dan saldo sesuai hasil kalkulator.
22. Kalkulator dengan basis DPP menyediakan metode input DPP manual atau penghitungan dari nilai bruto. Metode "bruto = DPP" dipakai hanya jika pengguna memastikan bruto tersebut merupakan dasar pajak yang benar. Untuk nilai yang benar-benar sudah termasuk PPN dan tanpa DPP khusus, sistem dapat membagi bruto dengan (1 + tarif PPN yang dimasukkan pengguna). Mode impor PPh 22 tidak menyediakan pemisahan PPN generik karena DPP harus mengikuti nilai impor pada dokumen kepabeanan. DPP, rumus, tarif, dan pajak terutang ditampilkan di breakdown dan ringkasan cetak. Mode manual tidak menghitung ulang DPP, sehingga tidak terjadi penghitungan ganda.

### 7.1 Aturan Periode & Batas Produk
* **PPh 21**: kalkulasi masa bulanan dipisahkan dari perhitungan pajak tahunan. Pajak setahun dihitung progresif Pasal 17 atas PKP; TER hanya dipakai untuk estimasi pemotongan bulanan Januari-November. Pengguna dapat memasukkan pemotongan aktual berdasarkan bukti potong per bulan, yang menggantikan estimasi TER bulan tersebut. Desember adalah PPh tahunan dikurangi jumlah pemotongan Januari-November yang digunakan; nilai negatif ditampilkan sebagai kelebihan pemotongan untuk ditangani sesuai ketentuan. Nominal bruto bulanan dihitung dari angka Rupiah yang diformat untuk tampilan; pengguna dapat membiarkan bulan tanpa penghasilan kosong, tetapi setidaknya satu nominal bruto wajib diisi sebelum hasil ditampilkan.
* **PPh 24, PPh 28/28A, dan PPh 29**: merupakan perhitungan/kredit yang terintegrasi dengan kewajiban tahunan; bukan pelaporan masa mandiri bulanan.
* **PPh 25**: angsuran berjalan bersifat bulanan. Tampilan setahun hanya rekap angsuran.
* **PPh 22, PPh 23, PPh 26, dan PPN**: kalkulasi masa mengikuti periode transaksi/pemotongan. Tampilan tahunan adalah rekap angka setahun, bukan pengganti SPT Masa yang diwajibkan.
* PPN dan PPnBM ditampilkan sebagai komponen terpisah. Tarif serta perlakuan DPP wajib dicocokkan dengan klasifikasi objek dan ketentuan yang berlaku.
* Jadwal tenggat standar dihitung dari jenis dan masa pajak untuk jenis kewajiban yang memiliki aturan umum. Tenggat PPh 15/PPh Final 4(2), setor PPh 22, hari libur, perpanjangan, relaksasi, dan aturan yang berubah tidak ditebak; tanggal harus diverifikasi atau dimasukkan pengguna. Semua tanggal otomatis berstatus saran dan bukan konfirmasi tenggat resmi DJP.
* Sanksi keterlambatan bayar dan lapor dihitung terpisah. Denda lapor menggunakan acuan umum Pasal 7 UU KUP; bunga bayar memakai tarif KMK per masa berlaku yang diisi pengguna. Tanpa tarif KMK yang cocok, bunga tidak boleh dianggap nol atau diisi dengan angka tebakan.
* PPh 15 dan PPh Final Pasal 4 ayat (2) menghitung DPP × tarif yang dimasukkan pengguna sebagai estimasi aritmetika. ATLAX tidak mengklaim bahwa satu rumus/tarif mewakili semua kategori transaksi; kategori, sifat final, dasar, tenggat, dan sanksi harus diverifikasi terhadap peraturan yang berlaku.
* Kalkulator DPP bukan pengganti penentuan dasar pajak menurut kategori/aturan. Mode DPP manual mempertahankan nilai yang dimasukkan. Mode bruto dan pemisahan PPN hanya boleh dipilih bila sesuai dokumen dan aturan transaksi; DPP nilai lain, nilai impor, formula khusus, dan kategori yang dikecualikan harus dimasukkan sebagai DPP terverifikasi secara manual. Pemisahan bruto termasuk PPN memakai tarif PPN yang dipilih/dimasukkan, bukan tarif universal. PPh 21 pegawai, PPh 24, PPh 25, PPh 28/28A, dan PPh 29 memakai dasar neto/PKP/kredit/angsuran masing-masing, bukan satu DPP transaksi umum; sistem menjelaskan basis khusus tersebut.
* Ringkasan PDF ATLAX bukan formulir SPT resmi. "Cetak/Unduh PDF" membuka dialog cetak browser, yang dapat digunakan untuk menyimpan sebagai PDF; struktur resmi, lampiran, jumlah halaman, serta kewajiban tiap jenis SPT harus tetap diverifikasi di Coretax. Rincian kalkulator menggunakan tabel, tata letak cetak A4 yang lebih padat, dan pemisahan baris/kelompok agar tidak terpotong. Rekanan, tanggal transaksi, nomor bukti, dan keterangan pendukung dapat dimasukkan sebagai metadata tanpa mengubah pajak. Riwayat yang memuat identitas disimpan secara lokal pada browser/perangkat dan dapat dihapus pengguna.
* NIK/NPWP hanya divalidasi pola panjang dan digit di browser; ATLAX tidak memeriksa keberadaan atau kepemilikan identitas melalui Dukcapil/DJP. Ringkasan harus menandai keterbatasan verifikasi tersebut.
* Dashboard akun menggunakan Supabase Auth (akun anonim dan email), Edge Function penyimpanan terenkripsi AES-GCM, PostgreSQL tanpa akses langsung role klien, scheduler harian `pg_cron`/`pg_net`, serta Web Push. Pengingat 7, 3, dan 1 hari sebelum tenggat serta status terlambat dihitung dari tanggal yang dimasukkan pengguna, dengan zona waktu akun WIB/WITA/WIT. ATLAX belum mengambil kalender tenggat resmi DJP atau libur nasional secara otomatis; tenggat harus diverifikasi dan dimasukkan pengguna. Push tetap memerlukan HTTPS, VAPID, izin browser, serta konfigurasi Supabase.
* Jika tidak ada jadwal aktual, laporan menampilkan data aktual sebagai belum diisi dan memberi catatan verifikasi. Sistem tidak memperbarui tenggat dari kalender hari libur, perubahan regulasi, atau DJP; kalender .ics dapat diimpor ke aplikasi kalender sebagai alternatif.
* Riwayat yang telah tersimpan pada localStorage versi lama dimigrasikan ke backend terenkripsi setelah autentikasi berhasil. Draf pada aplikasi React utama masih menggunakan mekanisme browser lama dan tidak termasuk alur penyimpanan terenkripsi dashboard.
* ATLAX pada tahap ini tidak mengirim SPT, pembayaran, atau data identitas ke DJP. Ringkasan hanya bahan bantu untuk diinput dan diverifikasi pada Coretax DJP; BPE dan bukti pembayaran tetap diperoleh dari kanal resmi.

---

### 8. Non-Functional Requirements (Kebutuhan Nonfungsional)
* **User Friendly**: Aplikasi mudah dipahami oleh pengguna awam.
* **Performance**: Aplikasi dapat diakses dengan cepat.
* **Reliability**: Sistem memiliki kestabilan yang baik dan meminimalkan gangguan server.
* **Security**: Data pribadi dan informasi perpajakan pengguna harus terlindungi.
* **Accessibility**: Aplikasi dapat digunakan melalui perangkat yang umum dimiliki masyarakat.
* **Accuracy**: Penghitungan pajak harus mengikuti ketentuan perpajakan yang berlaku.

---

### 9. Success Metrics (Indikator Keberhasilan)
* Berkurangnya kesalahan dalam pengisian laporan pajak.
* Meningkatnya jumlah pengguna yang berhasil menyelesaikan pelaporan.
* Berkurangnya keterlambatan pembayaran dan pelaporan.
* Berkurangnya keluhan pengguna mengenai kesulitan penggunaan aplikasi.
* Menurunnya jumlah laporan yang gagal akibat gangguan sistem.

---

### 10. Catatan Hukum & Regulasi
> ATLAX merupakan konsep aplikasi mandiri untuk kebutuhan perancangan produk (PRD), bukan aplikasi resmi Direktorat Jenderal Pajak (DJP) dan bukan pengganti sistem pelaporan resmi seperti Coretax DJP. Fitur penghitungan pajak disesuaikan dengan ketentuan perpajakan Indonesia yang berlaku (UU HPP, PP 58/2023, PP 55/2022).

> Perhitungan dalam prototipe merupakan alat bantu/estimasi, bukan penetapan pajak atau pelaporan resmi. Pengguna wajib memeriksa identitas, bukti potong, tarif, periode, dasar pengenaan, tenggat, dan ketentuan terbaru pada Coretax DJP atau berkonsultasi dengan petugas/tenaga pajak sebelum menyampaikan SPT.
