# ATLAX - Make Tax Reporting Simpler 🇮🇩

> Aplikasi digital modern untuk mempermudah masyarakat dalam menghitung, memahami, dan melaporkan kewajiban perpajakan Indonesia secara praktis, transparan, dan bebas dari kebingungan istilah rumit.

---

## 📌 Ringkasan Produk (Product Overview)
* **Nama Produk**: ATLAX
* **Tagline**: *Make Tax Reporting Simpler*
* **Target Pengguna**: 
  * Wajib Pajak Orang Pribadi (Karyawan / Pegawai Swasta & Negeri)
  * Pelaku UMKM / Usaha Mandiri
  * Pekerja Bebas (*Freelancer* / Profesional)
  * Masyarakat umum yang awam terhadap sistem perpajakan

---

## 🚀 Fitur Utama (Core Features)

1. **Simple & Intuitive Interface**
   * Antarmuka bersih, responsif di mobile dan desktop, bebas jargon pajak yang membingungkan.
2. **Tax Guide (Panduan Bertahap)**
   * Panduan *step-by-step wizard* yang memandu pengguna mulai dari identitas, status PTKP, hingga pemilihan jenis penghasilan.
3. **Automated Tax Calculator**
   * **PPh 21 Pegawai / Karyawan**: Sesuai tarif efektif rata-rata (TER PP 58/2023) & tarif progresif Pasal 17 UU HPP.
   * **PPh Final UMKM**: Sesuai PP 55/2022 (Tarif 0,5% dengan fasilitas bebas pajak untuk omzet s.d. Rp 500 juta/tahun).
   * **Pekerja Bebas**: Simulasi perhitungan menggunakan Norma Penghitungan Penghasilan Neto (NPPN).
4. **Income Categorization (Pengelompokan Penghasilan)**
   * Pemisahan kategori yang jelas: Penghasilan Teratur (Gaji), Penghasilan Tidak Teratur (Bonus/THR), Usaha Sendiri, dan Penghasilan Final/Lainnya.
5. **Autosave & System Recovery**
   * Draf pengisian tersimpan otomatis di browser (`localStorage`) dan sinkronisasi server sehingga progres tidak hilang saat koneksi putus atau server goyah.
6. **Tax Reminder & Notification**
   * Pengingat batas waktu pelaporan SPT Tahunan (31 Maret untuk Orang Pribadi, 30 April untuk Badan) dan pembayaran pajak bulanan.
7. **Help Center & Kamus Pajak**
   * Glosarium istilah awam (PTKP, PKP, Bruto, Netto, TER, Bukti Potong 1721-A1/A2) disertai penjelasan sederhana.

---

## 🏗️ Arsitektur & Teknologi

* **Frontend**: Next.js / React (App Router), TypeScript, Tailwind CSS, Lucide Icons, shadcn/ui.
* **Form & Validation**: React Hook Form + Zod (validasi multi-step form & auto-save).
* **Database & Auth**: Supabase (PostgreSQL dengan Row-Level Security) / Local Storage Backup.
* **Hosting**: Vercel / Cloudflare Pages (High Availability, CDN Caching, Anti-DDoS).
