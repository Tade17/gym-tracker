import type { SetType } from '../../../types';
import { SET_TYPE_META } from '../constants';

interface Props {
  type: SetType;
  size?: 'sm' | 'md';
}

// Badge visual con el tipo de serie y el RIR objetivo.
// El color y el RIR comunican de un vistazo qué tan intensa debería ser la serie.
export default function SetTypeBadge({ type, size = 'sm' }: Props) {
  const meta = SET_TYPE_META[type];
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded font-bold ${meta.color} ${px}`}>
      {meta.short}
      <span className="font-normal opacity-90">· {meta.rirTarget}</span>
    </span>
  );
}
