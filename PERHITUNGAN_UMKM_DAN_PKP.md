# Perhitungan UMKM dan Pembukuan PKP & Non-PKP

Dokumen ini menjelaskan cara aplikasi ATLAX menghitung PPh Final UMKM dan pembukuan PKP maupun non-PKP, beserta letak kodenya. Ini dokumen internal untuk pengembangan dan edukasi, bukan dokumen resmi DJP.

---

## 1. PPh Final UMKM

Kategori dipilih di menu **Kalkulator > Modul PPh 21 s.d. 29 & PPN > UMKM / Rekap Keuangan**.

| Kategori | Tarif | Batas dan jangka waktu | Cara hitung |
|---|---|---|---|
| Wajib pajak orang pribadi | 0,5% | Bebas pajak untuk omzet Rp 500 juta pertama. Permanen. | Dasar = omzet - Rp 500 juta. Pajak = 0,5% x dasar. |
| Orang pribadi dan PT perorangan | 0,5% | Mengikuti ketentuan yang berlaku. Permanen. | Dasar = seluruh omzet. Pajak = 0,5% x omzet. |
| Koperasi | 0,5% | Maksimal 4 tahun sejak terdaftar. | Dasar = seluruh omzet. Jika masa 4 tahun sudah lewat, pakai tarif umum badan. |
| CV, firma, PT umum, BUMDes | Tidak berhak | Tidak lagi berhak PPh Final UMKM. | Pajak = 22% x laba kotor (perkiraan). |

**Aturan umum untuk semua kategori**
- Omzet di atas Rp 4,8 miliar setahun: tarif 0,5% tidak berlaku, pajak ditampilkan nol dengan catatan.
- Biaya tidak mengurangi PPh Final UMKM.
- Laba kotor = omzet - biaya.

**Masa koperasi**
- Masa ke-n = tahun pajak - tahun terdaftar + 1.
- Berlaku jika masa ke-n ≤ 4.

**Letak kode**
- Hitungan: [src/utils/taxCalculationEngine.ts](src/utils/taxCalculationEngine.ts), di dalam `case 'UMKM'`.
- Form: [src/components/MultiTaxForm.tsx](src/components/MultiTaxForm.tsx), bagian `state.selectedReportingType === 'UMKM'`.
- Tipe data: [src/types/tax.ts](src/types/tax.ts), `UMKMRekapData`.

---

## 2. Pembukuan PKP dan non-PKP

Status PKP diatur di identitas kalkulator (Status PKP). Modul pembukuannya ada di menu **Pembukuan PKP & Non-PKP**.

### PKP (Pengusaha Kena Pajak)
- Tarif PPN 11%.
- **Penjualan**: PPN keluaran = DPP x 11%. Total transaksi = DPP + PPN.
- **Pembelian dengan faktur pajak**: PPN masukan = DPP x 11%. PPN ini bisa dikreditkan.
- **Pembelian tanpa faktur pajak**: PPN tidak bisa dikreditkan, jadi menjadi biaya.
- **PPN yang harus dibayar** = PPN keluaran - PPN masukan. Jika hasilnya negatif, itu lebih bayar yang bisa dikompensasi.

### Non-PKP
- Tidak memungut PPN, dan tidak membuat faktur pajak keluaran.
- **Penjualan**: total transaksi = DPP.
- **Pembelian**: biaya = DPP + PPN 11%. PPN pembelian ikut menjadi biaya.

### Jurnal yang dibuat (draf, perlu diposting di Pembukuan)
| Transaksi | Debit | Kredit |
|---|---|---|
| Penjualan PKP | 1201 Piutang usaha (DPP + PPN) | 4101 Pendapatan (DPP), 2201 PPN keluaran (PPN) |
| Pembelian PKP dengan faktur | 5101 Beban operasional (DPP), 1401 PPN masukan (PPN) | 2101 Utang usaha (DPP + PPN) |
| Pembelian PKP tanpa faktur | 5101 Beban operasional (DPP + PPN) | 2101 Utang usaha (DPP + PPN) |
| Penjualan non-PKP | 1201 Piutang usaha (DPP) | 4101 Pendapatan (DPP) |
| Pembelian non-PKP | 5101 Beban operasional (DPP + PPN) | 2101 Utang usaha (DPP + PPN) |

Satu transaksi hanya bisa punya satu draf jurnal, untuk mencegah pencatatan ganda.

**Letak kode**
- [src/components/PkpModule.tsx](src/components/PkpModule.tsx): fungsi `hitungTransaksi` (hitungan per transaksi) dan `buildLines` (baris jurnal).
- Data transaksi disimpan di localStorage dengan kunci `atlax_pkp_v1`.
- Draf jurnal disimpan di localStorage dengan kunci `atlax_accounting_v1`.

---

## 3. Yang perlu dicek sebelum dipakai untuk pelaporan

- **Dasar hukum**: PPh Final UMKM mengacu pada PP 55/2022. Cek teks pasal dan perubahannya yang terbaru.
- **Jangka waktu**: tabel yang dipakai menyebut orang pribadi berlaku permanen. Sumber lain yang pernah dicek menyebut 7 tahun. Dua sumber ini perlu dicocokkan.
- **Tarif PPh Badan 22%**: hitungan di aplikasi hanya perkiraan dari laba kotor. Penghasilan kena pajak final belum memperhitungkan koreksi fiskal.
- **Batas PKP**: batas omzet wajib PKP belum dimasukkan karena belum terverifikasi.
- **Tidak ada pengujian otomatis**: hitungan di dokumen ini belum dijalankan lewat pengujian otomatis.
