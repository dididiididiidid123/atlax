import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ProblemGuide, GuideTarget } from './ProblemGuide';

interface ProblemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (target: GuideTarget) => void;
}

// Pemandu masalah dibuka dari tombol di header, di samping Jadwal bayar.
// Dibuka sebagai panel di atas halaman, jadi tidak memakan tempat di beranda.
export const ProblemGuideModal: React.FC<ProblemGuideModalProps> = ({ isOpen, onClose, onNavigate }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Tanya pemandu">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <p className="t-section">Tanya pemandu</p>
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">
            <X className="h-5 w-5" />
            <span>Tutup</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <ProblemGuide
            onNavigate={(target) => {
              onClose();
              onNavigate(target);
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
