import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
  // Jika diisi, di bawah teks ada tombol ajakan
  actionLabel?: string;
  onAction?: () => void;
}

// Tampilan saat daftar masih kosong: ikon lembut, kalimat yang jelas, dan ajakan untuk mulai.
// Dipakai di dalam sel tabel maupun sebagai blok tersendiri.
export const EmptyState: React.FC<EmptyStateProps> = ({ text, icon: Icon = Inbox, actionLabel, onAction }) => (
  <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
    <span className="float-soft flex h-16 w-16 items-center justify-center rounded-3xl  text-brand-700 shadow-sm">
      <Icon className="h-8 w-8" />
    </span>
    <p className="t-body max-w-md text-slate-700">{text}</p>
    {actionLabel && onAction && (
      <button type="button" onClick={onAction} className="btn-soft btn-sm">{actionLabel}</button>
    )}
  </div>
);
