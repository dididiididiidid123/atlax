import React from 'react';
import { User, DollarSign, Calculator, FileCheck, Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const STEPS = [
  { id: 1, title: 'Data diri', subtitle: 'Nama dan NIK Anda', icon: User, minutes: 1 },
  { id: 2, title: 'Penghasilan', subtitle: 'Gaji atau omzet', icon: DollarSign, minutes: 2 },
  { id: 3, title: 'Hasil', subtitle: 'Pajak yang harus dibayar', icon: Calculator, minutes: 0 },
  { id: 4, title: 'Ringkasan', subtitle: 'Draf untuk lapor', icon: FileCheck, minutes: 1 },
];

// Perjalanan 4 langkah: garis penghubung, lingkaran yang terisi saat selesai, dan sisa waktu perkiraan.
// Langkah yang sudah dilewati bisa dibuka lagi. Langkah berikutnya belum bisa dibuka.
export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onSelectStep }) => {
  const progress = Math.min(100, Math.max(0, ((currentStep - 1) / (STEPS.length - 1)) * 100));
  const remaining = STEPS.filter((s) => s.id >= currentStep).reduce((sum, s) => sum + s.minutes, 0);

  return (
    <nav aria-label="Tahapan pengisian" className="w-full border-b border-sky-100 bg-white px-4 py-6 shadow-sm sm:px-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="t-label text-sky-900">Langkah {currentStep} dari {STEPS.length}</p>
          <p className="t-note">
            {remaining > 0 ? `Perkiraan sisa waktu sekitar ${remaining} menit` : 'Sudah sampai langkah terakhir'}
          </p>
        </div>

        <ol className="relative grid grid-cols-4 gap-2">
          {/* Garis perjalanan di belakang lingkaran */}
          <span aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-6 h-1.5 rounded-full bg-slate-200" />
          <span
            aria-hidden="true"
            className="absolute left-[12.5%] top-6 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progress * 0.75}%` }}
          />

          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const locked = step.id > currentStep;

            return (
              <li key={step.id} className="relative flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={locked}
                  className="group flex flex-col items-center gap-2 disabled:cursor-not-allowed"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-50 shadow-md transition-all duration-300 group-hover:scale-105 ${
                      isCurrent
                        ? 'bg-sky-700 text-white ring-4 ring-sky-200'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="h-6 w-6" strokeWidth={3} /> : <Icon className="h-6 w-6" />}
                  </span>
                  <span className={`space-y-0.5 ${isCurrent ? '' : 'hidden sm:block'}`}>
                    <span className={`t-label block font-extrabold leading-tight ${locked ? 'text-slate-500' : 'text-slate-900'}`}>
                      {step.title}
                    </span>
                    <span className="t-note hidden sm:block">{step.subtitle}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
