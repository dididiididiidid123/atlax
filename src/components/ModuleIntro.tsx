import React from 'react';

interface ModuleHeroProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  what: string;
  steps: string[];
  // Warna modul tidak dipakai lagi: semua modul memakai satu warna aksen agar tampilannya tenang.
  grad?: string;
  soft?: string;
  index: number;
  total: number;
  onBack?: () => void;
}

// Pembuka setiap modul: nama modul, satu kalimat penjelasan, dan langkah yang perlu dikerjakan.
export const ModuleHero: React.FC<ModuleHeroProps> = ({ icon: Icon, title, what, steps, grad, index, total }) => (
  <section className="card">
    <div className="flex items-start gap-4">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${grad ?? "from-brand-600 to-brand-700"}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="t-note">Modul {index + 1} dari {total}</p>
        <h2 className="t-section mt-1">{title}</h2>
        <p className="t-body mt-2 max-w-3xl text-slate-700">{what}</p>
      </div>
    </div>

    <ol className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 text-sm font-bold text-brand-700">
            {i + 1}
          </span>
          <span className="t-label">{step}</span>
        </li>
      ))}
    </ol>
  </section>
);
