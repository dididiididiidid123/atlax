import { notify } from '../utils/toast';
import React, { useState } from 'react';
import { AlertTriangle, Check, Database, Download, Upload } from 'lucide-react';

// Cadangan semua data ATLAX (pembukuan, administrasi pajak, pelaporan, audit) dalam satu berkas JSON.
const PREFIX = 'atlax';

const collectData = () => {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      data[key] = localStorage.getItem(key) ?? '';
    }
  }
  return data;
};

export const BackupPanel: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const show = (type: 'ok' | 'error', text: string) => {
    notify(type, text);
    setTimeout(() => setMessage(null), 5000);
  };

  const download = () => {
    const payload = { app: 'ATLAX', versi: 1, dibuatPada: new Date().toISOString(), data: collectData() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cadangan-atlax-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    show('ok', 'Berkas cadangan sudah diunduh. Simpan di tempat yang aman, misalnya Google Drive atau flashdisk.');
  };

  const restore = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed?.app !== 'ATLAX' || typeof parsed.data !== 'object') {
          return show('error', 'Berkas ini bukan cadangan ATLAX. Pilih berkas cadangan yang benar.');
        }
        if (!window.confirm('Pulihkan cadangan ini? Semua data di perangkat ini akan diganti dengan isi cadangan.')) return;
        Object.keys(collectData()).forEach((key) => localStorage.removeItem(key));
        Object.entries(parsed.data as Record<string, string>).forEach(([key, value]) => {
          if (key.startsWith(PREFIX)) localStorage.setItem(key, value);
        });
        window.location.reload();
      } catch {
        show('error', 'Berkas tidak bisa dibaca. Pastikan itu berkas cadangan ATLAX dalam format JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="card module-enter space-y-5">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl  text-sky-900"
        >
          <Database className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="t-section">Cadangan data</h3>
          <p className="mt-1 t-note">
            Cadangan adalah salinan semua data ATLAX dalam satu berkas. Simpan berkas ini supaya data Anda aman.
          </p>
          <details className="mt-3 t-note">
            <summary className="cursor-pointer py-1 t-label">Lihat penjelasan lengkap</summary>
            <div className="mt-2 space-y-2 rounded-2xl bg-sky-50 p-4 t-body">
              <p>Semua data ATLAX hanya disimpan di browser perangkat ini. Kalau browser dibersihkan, HP ganti, atau perangkat rusak, data bisa hilang.</p>
              <p>Dengan berkas cadangan, data bisa dikembalikan. Unduh cadangan secara berkala, misalnya sebulan sekali atau setiap habis mengisi laporan.</p>
              <p>Saat memulihkan, data yang ada di perangkat ini akan diganti dengan isi berkas cadangan.</p>
            </div>
          </details>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button type="button" onClick={download} className="btn-primary w-full">
          <Download className="h-5 w-5" /> Simpan cadangan
        </button>
        <label className="btn-secondary w-full cursor-pointer focus-within:ring-4 focus-within:ring-sky-200">
          <Upload className="h-5 w-5" /> Pulihkan dari berkas
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) restore(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {message && (
        <div key={`${message.type}-${message.text}`} className="module-enter">
          <div
            role="status"
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 t-body font-bold ${
              message.type === 'ok'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-rose-300 bg-rose-50 text-rose-900'
            }`}
          >
            {message.type === 'ok' ? (
              <Check className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}
    </section>
  );
};
