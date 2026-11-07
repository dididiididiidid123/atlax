import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

// Layar sambutan saat aplikasi pertama dibuka. Pengguna menekan tombol Mulai untuk masuk ke halaman utama.
export const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex min-h-screen items-center justify-center overflow-hidden  p-4 sm:p-6">
    <div className="w-full max-w-xl space-y-6 text-center">
      <div className="space-y-4">
        <img src="/atlax-logo.svg" alt="Logo ATLAX" className="mx-auto h-24 w-24 drop-shadow-md sm:h-28 sm:w-28" />
        <div className="space-y-3">
          <h1 className="t-page">Selamat datang di ATLAX</h1>
          <p className="t-body">ATLAX membantu Anda menghitung pajak dan menyiapkan laporan, langkah demi langkah.</p>
        </div>
      </div>

      <div className="landing-card card space-y-6 p-6 text-left sm:p-8">
        <ul className="space-y-3">
          {[
            'Hitung pajak Anda dengan panduan yang jelas.',
            'Siapkan draf laporan pajak.',
            'Data Anda tersimpan di perangkat ini saja.',
          ].map((point) => (
            <li key={point} className="flex items-start gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-700 text-white"
              >
                <Check className="h-4 w-4" />
              </span>
              <span className="t-body">{point}</span>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onStart} className="btn-primary min-h-[4rem] w-full px-10 sm:w-auto sm:min-w-[16rem]">
          Mulai
          <ArrowRight className="h-5 w-5" />
        </button>

        <p className="t-note text-center">
          ATLAX adalah aplikasi mandiri, bukan aplikasi resmi Direktorat Jenderal Pajak. Periksa lagi hasil hitungan sebelum dipakai untuk lapor.
        </p>
      </div>
    </div>
  </div>
);
