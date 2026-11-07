# Panduan Publikasi & Hosting Publik ATLAX 🌐

## Dashboard akun, data terenkripsi, dan pengingat push

Build Vite hanya menyediakan satu halaman: aplikasi React di `/`. Halaman dashboard terpisah (`open-design-canvas.html`) sudah dihapus.

Dashboard memerlukan proyek Supabase sendiri; fitur akun, sinkronisasi jadwal/laporan/tarif, dan pengingat push tidak akan aktif sampai backend dikonfigurasi.

1. Buat proyek Supabase. Aktifkan **Anonymous Sign-Ins** untuk akun tamu dan aktifkan provider **Email**. Atur verifikasi email serta Site URL sesuai domain deployment.
2. Jalankan migrasi `supabase/migrations/20250101000000_secure_atlax_data.sql` melalui Supabase CLI atau SQL Editor.
3. Buat `public/supabase-config.js` dengan menyalin `public/supabase-config.example.js`; isi URL proyek, **anon/public key**, dan VAPID public key. File konfigurasi lokal ini diabaikan Git. URL dan anon key boleh ada di browser; jangan masukkan service-role key atau secret VAPID private.
4. Deploy Edge Functions:
   ```text
   supabase functions deploy secure-data
   supabase functions deploy tax-reminders
   ```
5. Hasilkan key enkripsi AES-256 dan secret cron secara lokal, lalu simpan sebagai secrets Supabase. Buat VAPID key pair untuk Web Push. Contoh perintah (gunakan PowerShell di Windows):
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   npx web-push generate-vapid-keys
   supabase secrets set ATLAX_DATA_ENCRYPTION_KEY="<hasil-base64>" ATLAX_CRON_SECRET="<secret-acak>" ATLAX_ALLOWED_ORIGINS="https://domain-anda" VAPID_PUBLIC_KEY="<vapid-public>" VAPID_PRIVATE_KEY="<vapid-private>" VAPID_SUBJECT="mailto:admin@domain-anda"
   ```
   Simpan secret dengan password manager; jangan commit atau kirimkan ke chat. Environment Supabase menyediakan `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` untuk Edge Functions.
6. Setelah fungsi ter-deploy, aktifkan ekstensi `pg_cron`, `pg_net`, dan Vault. Di Supabase SQL Editor buat Vault secrets (gunakan URL proyek dan nilai cron secret yang sama dengan konfigurasi fungsi):
   ```sql
   select vault.create_secret('https://YOUR_PROJECT_ID.supabase.co', 'atlax_project_url');
   select vault.create_secret('YOUR_ATLAX_CRON_SECRET', 'atlax_cron_secret');
   ```
   Lalu jalankan `supabase/schedule-reminders.sql`. Cron memeriksa jadwal sekali sehari saat website tertutup. Jangan simpan nilai rahasia yang sebenarnya ke dalam file SQL proyek.
7. Bangun ulang dengan `npm run build`, lalu deploy folder `dist`. Pastikan file lokal `public/supabase-config.js` tersedia sebelum build agar konfigurasi frontend ikut tersalin. HTTPS diperlukan untuk Web Push. Batasi `ATLAX_ALLOWED_ORIGINS` ke origin deployment yang benar.

Fungsi pengingat memakai tanggal jatuh tempo yang dimasukkan pengguna; sistem tidak memverifikasi atau mengimpor tenggat, libur, bunga, maupun denda resmi DJP. Sanksi yang ditampilkan tetap estimasi dan tidak menggantikan pemeriksaan Coretax. Uji akun, migrasi, notifikasi, rotasi key, dan kebijakan retensi sebelum memakai data pribadi produksi. Jangan mengganti `ATLAX_DATA_ENCRYPTION_KEY` sebelum prosedur dekripsi dan enkripsi ulang seluruh data yang tersimpan tersedia; akun tamu tidak dapat dipulihkan setelah kehilangan sesi/perangkat.

Agar aplikasi web ATLAX dapat diakses oleh **banyak orang di internet secara publik**, cepat, aman, dan tanpa biaya server mahal, ikuti salah satu opsi berikut:

---

### Opsi 1: Netlify Drop (Cara Paling Instan - Online dalam 30 Detik Tanpa Coding / Git)
Jika Anda ingin langsung membagikan link web ATLAX ke orang lain hari ini juga:
1. Buka browser dan kunjungi [app.netlify.com/drop](https://app.netlify.com/drop).
2. Tarik (*drag & drop*) folder `dist` yang ada di `c:\Users\SN5CD\Documents\atlax\dist` ke halaman web tersebut.
3. Netlify akan langsung memberikan URL publik aktif (misal: `https://atlax-tax.netlify.app`) lengkap dengan HTTPS gratis.

---

### Opsi 2: Vercel + GitHub (Rekomendasi Utama untuk Produksi & Pembaruan Otomatis)
Setiap kali Anda mengubah kode, web publik akan otomatis diperbarui (*Continuous Deployment*).

1. Buat repositori baru di [GitHub](https://github.com).
2. Unggah kode proyek ATLAX ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi aplikasi pajak ATLAX"
   git branch -M main
   git remote add origin https://github.com/USERNAME/atlax.git
   git push -u origin main
   ```
3. Buka [vercel.com](https://vercel.com) dan masuk dengan akun GitHub Anda.
4. Klik **"Add New Project"** dan pilih repositori `atlax`.
5. Vercel akan otomatis mendeteksi konfigurasi **Vite**:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
6. Klik **Deploy**. Dalam 1 menit, web Anda live di domain seperti `https://atlax.vercel.app`.

---

### Opsi 3: Cloudflare Pages (Kapasitas Skala Traffic Terbesar & Anti-DDoS)
Sangat cocok untuk musim pelaporan SPT (Januari - April) ketika banyak orang mengakses bersamaan:
1. Masuk ke [dash.cloudflare.com](https://dash.cloudflare.com).
2. Pilih menu **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Pilih repositori `atlax`.
4. Konfigurasi build:
   * **Framework preset**: `Vite`
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
5. Klik **Save and Deploy**. Bandwidth tidak terbatas (*unlimited free bandwidth*).

---

### Ingin Menggunakan Domain Sendiri (misal: `atlax.id` atau `atlax.com`)?
1. Beli domain di penyedia domain lokal (Niagahoster, Domainesia, Rumahweb) atau global (Cloudflare Registrar, Namecheap).
2. Masuk ke dashboard Vercel / Cloudflare Pages proyek Anda.
3. Masuk ke **Settings > Domains** dan masukkan nama domain Anda.
4. Arahkan CNAME/DNS record sesuai panduan yang tertera di dashboard.
