import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { TOAST_EVENT, ToastDetail } from '../utils/toast';

// Menampilkan pesan dari notify() di pojok bawah. Hilang sendiri setelah beberapa detik.
export const ToastHost: React.FC = () => {
  const [toast, setToast] = useState<ToastDetail | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      setToast(detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), detail.type === 'error' ? 6000 : 4000);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;
  const isError = toast.type === 'error';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 print:hidden">
      <div
        role="status"
        aria-live="polite"
        className={`module-enter pointer-events-auto flex max-w-xl items-center gap-3 rounded-2xl border-2 px-5 py-4 shadow-xl ${
          isError ? 'border-rose-300 bg-rose-50 text-rose-950' : 'border-emerald-300 bg-emerald-50 text-emerald-950'
        }`}
      >
        {isError ? <AlertTriangle className="h-6 w-6 shrink-0 text-rose-700" /> : <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />}
        <p className="t-body font-semibold">{toast.text}</p>
      </div>
    </div>
  );
};
