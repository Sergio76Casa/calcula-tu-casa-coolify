'use client';
import { useState, useEffect, useCallback } from 'react';

interface Props {
  price: number;
  onStay: () => void;
}

export default function ExitIntentModal({ price, onStay }: Props) {
  const [show, setShow] = useState(false);
  const [fired, setFired] = useState(false);

  const digitMask = price > 0
    ? price.toLocaleString('es-ES').replace(/\d/g, '●') + ' €'
    : '●●●.●●● €';

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 10 && !fired) {
      setShow(true);
      setFired(true);
    }
  }, [fired]);

  useEffect(() => {
    // Desktop: cursor saliendo por arriba
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [handleMouseLeave]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-white/20 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-extrabold text-white mb-2">¿Seguro que quieres salir?</h2>
        <p className="text-slate-400 text-sm mb-4">
          Tu valoración de <span className="text-white font-mono font-bold">{digitMask}</span> solo está disponible en esta sesión.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => { setShow(false); onStay(); }}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-bold rounded-xl transition-all hover:opacity-90"
          >
            🔓 Quedarme y ver mi precio
          </button>
          <button
            onClick={() => setShow(false)}
            className="w-full py-2 text-slate-500 hover:text-slate-400 text-sm transition-colors"
          >
            Salir sin ver mi valoración
          </button>
        </div>
      </div>
    </div>
  );
}
