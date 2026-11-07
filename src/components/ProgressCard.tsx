import React, { useMemo } from 'react';
import { Check, Flag } from 'lucide-react';
import { getYearProgress } from '../utils/progress';

// Kartu kemajuan di layar awal: menunjukkan berapa langkah pelaporan yang sudah dikerjakan.
// Tujuannya memberi rasa kemajuan dan alasan untuk kembali.
export const ProgressCard: React.FC = () => {
  const items = useMemo(() => getYearProgress(), []);
  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return (
    <section className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Flag className="h-6 w-6" />
          </span>
          <div>
            <p className="t-card">Perjalanan lapor pajak Anda</p>
            <p className="t-note">{doneCount} dari {items.length} langkah sudah dikerjakan</p>
          </div>
        </div>
        <span className="t-result text-brand-700">{percent}%</span>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-700 ease-out" style={{ width: `${percent}%` }} />
      </div>

      <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id} className={`flex items-start gap-3 rounded-2xl border p-3 ${item.done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.done ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {item.done ? <Check className="h-5 w-5" strokeWidth={3} /> : <span className="t-label">{items.indexOf(item) + 1}</span>}
            </span>
            <div className="min-w-0">
              <p className="t-label">{item.label}</p>
              <p className="t-note">{item.done ? 'Sudah dikerjakan' : item.hint}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
