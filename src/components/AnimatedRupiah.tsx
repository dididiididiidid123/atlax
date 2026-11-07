import React, { useEffect, useRef, useState } from 'react';
import { formatRupiah } from '../utils/taxCalculator';

// Menampilkan nominal Rupiah yang bergerak halus dari nilai lama ke nilai baru.
// Jika pengguna mengurangi animasi di sistemnya, angka langsung berubah tanpa gerakan.
export const AnimatedRupiah: React.FC<{ value: number; duration?: number }> = ({ value, duration = 600 }) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from === value) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{formatRupiah(display)}</>;
};
