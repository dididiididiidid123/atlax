import React, { useEffect, useState } from 'react';
import { Info, Check, UserRound, Languages, Bell, ShieldCheck } from 'lucide-react';
import { DisplaySettingsPanel } from './DisplaySettingsPanel';
import { loadProfil, saveProfil, NAMA_DEFAULT, PROFIL_EVENT } from '../utils/profil';
import { notify } from '../utils/toast';

// Modul Pengaturan: tampilan, profil sapaan, status akun, dan preferensi.
// Semua yang bisa diubah di sini benar-benar berfungsi. Yang belum tersedia ditulis apa adanya.
export const SettingsModule: React.FC = () => {
  const [nama, setNama] = useState(() => loadProfil().namaSapaan);

  useEffect(() => {
    const refresh = () => setNama(loadProfil().namaSapaan);
    window.addEventListener(PROFIL_EVENT, refresh);
    return () => window.removeEventListener(PROFIL_EVENT, refresh);
  }, []);

  const simpanNama = () => {
    const bersih = nama.trim().slice(0, 40);
    saveProfil({ namaSapaan: bersih });
    setNama(bersih);
    notify('ok', bersih ? `Sapaan diubah menjadi "${bersih}".` : `Sapaan kembali ke "${NAMA_DEFAULT}".`);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="t-kicker">Pengaturan</p>
        <h2 className="t-page mt-1">Atur ATLAX sesuai kebutuhan Anda</h2>
      </div>

      {/* Tampilan */}
      <section className="card space-y-6">
        <div>
          <p className="t-section">Tampilan</p>
          <p className="t-body mt-2">Ubah ukuran huruf dan warna. Pilihan langsung berlaku di seluruh halaman dan tetap tersimpan.</p>
        </div>
        <DisplaySettingsPanel />
      </section>

      {/* Profil */}
      <section className="card space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-900">
            <UserRound className="h-6 w-6" />
          </span>
          <div>
            <p className="t-section">Nama untuk sapaan</p>
            <p className="t-note mt-1">Dipakai di Beranda, misalnya "Hi, {nama.trim() || NAMA_DEFAULT}!". Kosongkan untuk memakai nama dari formulir Panduan SPT.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2">
            <span className="t-label">Nama panggilan</span>
            <input
              className="field w-full"
              value={nama}
              maxLength={40}
              placeholder="Contoh: Budi"
              onChange={(e) => setNama(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') simpanNama();
              }}
            />
          </label>
          <button type="button" onClick={simpanNama} className="btn-primary">
            <Check className="h-5 w-5" />
            Simpan nama
          </button>
        </div>
      </section>

      {/* Akun */}
      <section className="card space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-900">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="t-section">Akun</p>
            <p className="t-body mt-2 font-semibold text-slate-900">Anda menggunakan akun tamu.</p>
            <p className="t-note mt-1">Semua fitur tetap bisa dipakai tanpa akun. Data Anda tersimpan di perangkat ini.</p>
          </div>
        </div>
        <ul className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <li className="t-body flex gap-2"><Check className="mt-1 h-5 w-5 shrink-0 text-emerald-700" /> Dengan akun, data bisa dibuka lagi dari perangkat lain.</li>
          <li className="t-body flex gap-2"><Check className="mt-1 h-5 w-5 shrink-0 text-emerald-700" /> Data tamu bisa dipindahkan ke akun saat akun dibuat.</li>
        </ul>
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Info className="mt-1 h-5 w-5 shrink-0 text-amber-800" />
          <p className="t-note text-amber-950">
            Masuk dan buat akun belum tersedia di versi ini, karena memerlukan layanan akun yang belum dibangun.
            Sampai itu siap, gunakan ATLAX sebagai tamu. Tidak ada halaman login yang dipaksakan.
          </p>
        </div>
      </section>

      {/* Preferensi */}
      <section className="card space-y-5">
        <p className="t-section">Preferensi</p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Languages className="h-6 w-6 text-slate-700" />
            <p className="t-card mt-3">Bahasa</p>
            <p className="t-body mt-1">Bahasa Indonesia. Ini satu-satunya bahasa di versi ini.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Bell className="h-6 w-6 text-slate-700" />
            <p className="t-card mt-3">Pengingat tenggat</p>
            <p className="t-body mt-1">Tenggat terdekat tampil di Beranda dan di Jadwal bayar. Pengingat ke kalender bisa diunduh dari Jadwal bayar.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <ShieldCheck className="h-6 w-6 text-slate-700" />
            <p className="t-card mt-3">Privasi</p>
            <p className="t-body mt-1">Isian Anda disimpan di perangkat ini. Untuk menghapusnya, pakai "Mulai dari awal" di bagian atas.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
