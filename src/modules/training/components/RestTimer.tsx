import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Plus, Minus, X, Timer } from 'lucide-react';
import { TIMER_PRESETS } from '../constants';

function format(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface Props {
  isOpen: boolean;
  initialSeconds: number;
  onClose: () => void;
}

export default function RestTimer({ isOpen, initialSeconds, onClose }: Props) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setRemaining(initialSeconds);
    setRunning(true);
    firedRef.current = false;
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (!isOpen || !running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (!firedRef.current) {
            firedRef.current = true;
            try { navigator.vibrate?.([200, 100, 200]); } catch { /* noop */ }
            beep();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [isOpen, running]);

  if (!isOpen) return null;

  function addSeconds(delta: number) {
    setRemaining(r => Math.max(0, r + delta));
    if (delta > 0) firedRef.current = false;
  }

  const pct = Math.max(0, remaining / initialSeconds) * 100;

  return (
    <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl max-w-2xl mx-auto overflow-hidden">
        {/* Barra de progreso */}
        <div className="h-1 bg-slate-700">
          <div
            className={`h-1 transition-all duration-1000 ${remaining === 0 ? 'bg-green-400' : 'bg-cyan-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Timer size={14} />
              <span className="text-xs uppercase tracking-wide">Descanso</span>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Tiempo */}
          <div className={`text-center text-5xl font-mono font-bold tracking-tight ${
            remaining === 0 ? 'text-green-400' : 'text-cyan-300'
          }`}>
            {format(remaining)}
          </div>

          {/* Controles */}
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={() => addSeconds(-15)}
              className="bg-slate-700 hover:bg-slate-600 rounded-xl px-3 py-2 flex items-center gap-1 text-sm transition-colors"
            >
              <Minus size={14} /> 15s
            </button>
            <button
              onClick={() => setRunning(r => !r)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl px-5 py-2 flex items-center gap-1.5 transition-colors"
            >
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pausa' : 'Reanudar'}
            </button>
            <button
              onClick={() => addSeconds(15)}
              className="bg-slate-700 hover:bg-slate-600 rounded-xl px-3 py-2 flex items-center gap-1 text-sm transition-colors"
            >
              <Plus size={14} /> 15s
            </button>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            {TIMER_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setRemaining(p.seconds); firedRef.current = false; setRunning(true); }}
                className="text-xs bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300 transition-colors"
              >
                {p.label} · {format(p.seconds)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

let audioCtx: AudioContext | null = null;
function beep() {
  try {
    audioCtx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch { /* sin audio disponible */ }
}
