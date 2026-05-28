import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { WeightEntry, ProgressPhoto } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../lib/storage';

interface BodyData {
  weightEntries:    WeightEntry[];
  photos:           ProgressPhoto[];
  setWeightEntries: React.Dispatch<React.SetStateAction<WeightEntry[]>>;
  setPhotos:        React.Dispatch<React.SetStateAction<ProgressPhoto[]>>;
}

const Ctx = createContext<BodyData | null>(null);

export function BodyDataProvider({ children }: { children: ReactNode }) {
  const [weightEntries, setWeightEntries] = useLocalStorage<WeightEntry[]>(
    STORAGE_KEYS.weightEntries, [],
  );
  const [photos, setPhotos] = useLocalStorage<ProgressPhoto[]>(
    STORAGE_KEYS.photos, [],
  );

  const value = useMemo<BodyData>(
    () => ({ weightEntries, photos, setWeightEntries, setPhotos }),
    [weightEntries, photos, setWeightEntries, setPhotos],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBodyData(): BodyData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBodyData debe usarse dentro de <BodyDataProvider>');
  return v;
}
