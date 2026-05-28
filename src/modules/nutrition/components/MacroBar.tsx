import { MACRO_COLOR } from '../constants';

type MacroKey = keyof typeof MACRO_COLOR;

interface Props {
  label: string;
  current: number;
  target: number;
  unit?: string;
  colorKey: MacroKey;
}

// Barra de progreso visual para un macro.
// Si superas el objetivo, la barra se llena y cambia a rojo para avisar.
export default function MacroBar({ label, current, target, unit = 'g', colorKey }: Props) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const over = current > target;
  const roundedCur = Math.round(current * 10) / 10;
  const roundedTarget = Math.round(target);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className={over ? 'text-red-400 font-semibold' : 'text-slate-400'}>
          <span className={over ? 'text-red-400' : 'text-slate-200'}>
            {roundedCur}
          </span>
          {' / '}{roundedTarget}{unit}
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${over ? 'bg-red-500' : MACRO_COLOR[colorKey]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
