import React from 'react';
import { ArrowRight, History } from 'lucide-react';

interface SystemRecoveryBannerProps {
  isVisible: boolean;
  onRestore: () => void;
  onDismiss: () => void;
  lastUpdated: string;
}

// Pemberitahuan draf yang belum selesai. Dibuat ringkas: satu baris di layar lebar, supaya tidak memakan tempat.
export const SystemRecoveryBanner: React.FC<SystemRecoveryBannerProps> = ({
  isVisible,
  onRestore,
  onDismiss,
  lastUpdated,
}) => {
  if (!isVisible) return null;

  const formattedDate = lastUpdated ? new Date(lastUpdated).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }) : '';

  return (
    <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-950 sm:py-3">
      <div className="module-enter mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
            <History className="h-5 w-5" />
          </span>
          <p className="t-body min-w-0 text-amber-950">
            <span className="font-bold">Ada draf yang belum selesai</span>
            {formattedDate && <span className="t-note"> (tersimpan {formattedDate})</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onRestore} className="btn-primary btn-sm">
            Lanjutkan draf
            <ArrowRight className="h-5 w-5" />
          </button>
          <button type="button" onClick={onDismiss} className="btn-secondary btn-sm">
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  );
};
