import { useEffect, useRef, useState } from 'react';
import { load, save } from '../lib/storage';

// Hook genérico: useLocalStorage<T>(clave, valorInicial).
// El <T> es un "parámetro de tipo" — funciona con cualquier tipo de dato.
// useLocalStorage<Exercise[]>('training:exercises', []) → autocompleta como Exercise[].
//
// Comportamiento:
// - Lee desde localStorage al montar (con fallback al valor inicial).
// - Cuando el estado cambia, escribe a localStorage automáticamente.
// - Devuelve [valor, setValor] igual que useState — interfaz familiar.
export function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => load(key, initial));

  // useRef para no rehacer save en el primer render (ya estaba en storage).
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    save(key, value);
  }, [key, value]);

  return [value, setValue];
}
